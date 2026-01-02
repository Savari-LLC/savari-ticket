import { v } from "convex/values";
import { query } from "./_generated/server";
import { authComponent } from "./auth";

async function requireOperatorRole(ctx: any) {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) throw new Error("Not authenticated");

  const membership = await ctx.db
    .query("members")
    .withIndex("by_user", (q: any) => q.eq("userId", user._id))
    .first();

  if (!membership || membership.role !== "operator") {
    throw new Error("Only operators can view reports");
  }

  return { user, membership };
}

export const getRouteStats = query({
  args: { 
    operatorId: v.id("operators"),
    dateStart: v.optional(v.number()),
    dateEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireOperatorRole(ctx);

    if (membership.operatorId !== args.operatorId) {
      throw new Error("Cannot view reports for a different operator");
    }

    const routes = await ctx.db
      .query("routes")
      .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
      .collect();

    return Promise.all(
      routes.map(async (route) => {
        let trips = await ctx.db
          .query("tripSessions")
          .withIndex("by_route", (q) => q.eq("routeId", route._id))
          .collect();

        // Filter by date if provided
        if (args.dateStart || args.dateEnd) {
          trips = trips.filter((trip) => {
            if (args.dateStart && trip.startedAt < args.dateStart) return false;
            if (args.dateEnd && trip.startedAt > args.dateEnd) return false;
            return true;
          });
        }

        const allScans = await Promise.all(
          trips.map((trip) =>
            ctx.db
              .query("scans")
              .withIndex("by_trip", (q) => q.eq("tripSessionId", trip._id))
              .collect()
          )
        );

        return {
          route,
          tripCount: trips.length,
          totalPassengers: allScans.flat().length,
          activeTrips: trips.filter((t) => t.status === "active").length,
        };
      })
    );
  },
});

// Get passengers scanned for a specific route on a date range
export const getRoutePassengers = query({
  args: {
    routeId: v.id("routes"),
    dateStart: v.optional(v.number()),
    dateEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    if (!route) throw new Error("Route not found");

    const { membership } = await requireOperatorRole(ctx);
    if (membership.operatorId !== route.operatorId) {
      throw new Error("Cannot view this route");
    }

    let trips = await ctx.db
      .query("tripSessions")
      .withIndex("by_route", (q) => q.eq("routeId", args.routeId))
      .collect();

    // Filter by date if provided
    if (args.dateStart || args.dateEnd) {
      trips = trips.filter((trip) => {
        if (args.dateStart && trip.startedAt < args.dateStart) return false;
        if (args.dateEnd && trip.startedAt > args.dateEnd) return false;
        return true;
      });
    }

    const allScans = await Promise.all(
      trips.map((trip) =>
        ctx.db
          .query("scans")
          .withIndex("by_trip", (q) => q.eq("tripSessionId", trip._id))
          .collect()
      )
    );

    const scans = allScans.flat();

    // Get unique passengers with their scan details
    const passengerMap = new Map<string, { passenger: any; scans: any[] }>();
    
    for (const scan of scans) {
      const passenger = await ctx.db.get(scan.passengerId);
      if (!passenger) continue;

      const key = passenger._id;
      if (passengerMap.has(key)) {
        passengerMap.get(key)!.scans.push(scan);
      } else {
        passengerMap.set(key, { passenger, scans: [scan] });
      }
    }

    return Array.from(passengerMap.values()).map(({ passenger, scans }) => ({
      passenger,
      scanCount: scans.length,
      lastScan: Math.max(...scans.map((s) => s.scannedAt)),
    }));
  },
});

export const getDashboardStats = query({
  args: { operatorId: v.id("operators") },
  handler: async (ctx, args) => {
    const { membership } = await requireOperatorRole(ctx);

    if (membership.operatorId !== args.operatorId) {
      throw new Error("Cannot view reports for a different operator");
    }

    const [routes, members, passengers, trips] = await Promise.all([
      ctx.db
        .query("routes")
        .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
        .collect(),
      ctx.db
        .query("members")
        .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
        .collect(),
      ctx.db
        .query("passengers")
        .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
        .collect(),
      ctx.db
        .query("tripSessions")
        .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
        .collect(),
    ]);

    const activeTrips = trips.filter((t) => t.status === "active");
    const drivers = members.filter((m) => m.role === "driver");
    const businesses = members.filter((m) => m.role === "business");

    // Get total scans
    const allScans = await Promise.all(
      trips.map((trip) =>
        ctx.db
          .query("scans")
          .withIndex("by_trip", (q) => q.eq("tripSessionId", trip._id))
          .collect()
      )
    );

    return {
      routeCount: routes.length,
      activeRouteCount: routes.filter((r) => r.isActive).length,
      driverCount: drivers.length,
      businessCount: businesses.length,
      passengerCount: passengers.length,
      tripCount: trips.length,
      activeTripCount: activeTrips.length,
      totalScans: allScans.flat().length,
    };
  },
});

export const getRecentTrips = query({
  args: { 
    operatorId: v.id("operators"), 
    limit: v.optional(v.number()),
    dateStart: v.optional(v.number()),
    dateEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireOperatorRole(ctx);

    if (membership.operatorId !== args.operatorId) {
      throw new Error("Cannot view reports for a different operator");
    }

    let trips = await ctx.db
      .query("tripSessions")
      .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
      .order("desc")
      .collect();

    // Filter by date if provided
    if (args.dateStart || args.dateEnd) {
      trips = trips.filter((trip) => {
        if (args.dateStart && trip.startedAt < args.dateStart) return false;
        if (args.dateEnd && trip.startedAt > args.dateEnd) return false;
        return true;
      });
    }

    // Apply limit after filtering
    if (args.limit) {
      trips = trips.slice(0, args.limit);
    }

    return Promise.all(
      trips.map(async (trip) => {
        const [route, driver, scans] = await Promise.all([
          ctx.db.get(trip.routeId),
          ctx.db
            .query("members")
            .withIndex("by_operator_user", (q) =>
              q.eq("operatorId", args.operatorId).eq("userId", trip.driverId)
            )
            .first(),
          ctx.db
            .query("scans")
            .withIndex("by_trip", (q) => q.eq("tripSessionId", trip._id))
            .collect(),
        ]);

        return {
          trip,
          route,
          driver,
          scanCount: scans.length,
        };
      })
    );
  },
});

export const getPassengerStats = query({
  args: { operatorId: v.id("operators") },
  handler: async (ctx, args) => {
    const { membership } = await requireOperatorRole(ctx);

    if (membership.operatorId !== args.operatorId) {
      throw new Error("Cannot view reports for a different operator");
    }

    const passengers = await ctx.db
      .query("passengers")
      .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
      .collect();

    return Promise.all(
      passengers.map(async (passenger) => {
        const scans = await ctx.db
          .query("scans")
          .withIndex("by_passenger", (q) => q.eq("passengerId", passenger._id))
          .collect();

        // Get business info
        const business = await ctx.db
          .query("members")
          .withIndex("by_operator_user", (q) =>
            q.eq("operatorId", args.operatorId).eq("userId", passenger.businessId)
          )
          .first();

        return {
          passenger,
          business,
          tripCount: scans.length,
          lastScan: scans.length > 0 ? Math.max(...scans.map((s) => s.scannedAt)) : null,
        };
      })
    );
  },
});
