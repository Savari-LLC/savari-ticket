import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

async function requireDriverRole(ctx: any) {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) throw new Error("Not authenticated");

  const membership = await ctx.db
    .query("members")
    .withIndex("by_user", (q: any) => q.eq("userId", user._id))
    .first();

  if (!membership || membership.role !== "driver") {
    throw new Error("Only drivers can perform this action");
  }

  return { user, membership };
}

export const startTrip = mutation({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args) => {
    const { user, membership } = await requireDriverRole(ctx);

    const route = await ctx.db.get(args.routeId);
    if (!route) throw new Error("Route not found");

    if (route.operatorId !== membership.operatorId) {
      throw new Error("Cannot start trip for a different operator's route");
    }

    // Check if driver has an active trip
    const activeTrip = await ctx.db
      .query("tripSessions")
      .withIndex("by_driver_status", (q) =>
        q.eq("driverId", user._id).eq("status", "active")
      )
      .first();

    if (activeTrip) {
      throw new Error("You already have an active trip. End it first.");
    }

    return ctx.db.insert("tripSessions", {
      operatorId: membership.operatorId,
      routeId: args.routeId,
      driverId: user._id,
      startedAt: Date.now(),
      status: "active",
    });
  },
});

export const endTrip = mutation({
  args: { tripSessionId: v.id("tripSessions") },
  handler: async (ctx, args) => {
    const { user } = await requireDriverRole(ctx);

    const trip = await ctx.db.get(args.tripSessionId);
    if (!trip) throw new Error("Trip not found");

    if (trip.driverId !== user._id) {
      throw new Error("Cannot end another driver's trip");
    }

    if (trip.status !== "active") {
      throw new Error("Trip is not active");
    }

    await ctx.db.patch(args.tripSessionId, {
      status: "completed",
      endedAt: Date.now(),
    });
  },
});

export const getActiveTrip = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      return null;
    }
    if (!user) return null;

    const trip = await ctx.db
      .query("tripSessions")
      .withIndex("by_driver_status", (q) =>
        q.eq("driverId", user._id).eq("status", "active")
      )
      .first();

    if (!trip) return null;

    const route = await ctx.db.get(trip.routeId);
    const scans = await ctx.db
      .query("scans")
      .withIndex("by_trip", (q) => q.eq("tripSessionId", trip._id))
      .collect();

    // Get passenger details for each scan
    const scansWithPassengers = await Promise.all(
      scans.map(async (scan) => {
        const passenger = await ctx.db.get(scan.passengerId);
        return { ...scan, passenger };
      })
    );

    return { trip, route, scans: scansWithPassengers };
  },
});

export const scanPassenger = mutation({
  args: {
    tripSessionId: v.id("tripSessions"),
    qrCode: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, membership } = await requireDriverRole(ctx);

    const trip = await ctx.db.get(args.tripSessionId);
    if (!trip) throw new Error("Trip not found");

    if (trip.driverId !== user._id) {
      throw new Error("Cannot scan for another driver's trip");
    }

    if (trip.status !== "active") {
      throw new Error("Trip is not active");
    }

    // Find passenger by QR code
    const passenger = await ctx.db
      .query("passengers")
      .withIndex("by_qr", (q) => q.eq("qrCode", args.qrCode))
      .first();

    if (!passenger) {
      throw new Error("Invalid QR code");
    }

    if (passenger.operatorId !== membership.operatorId) {
      throw new Error("Passenger belongs to a different operator");
    }

    // Check for duplicate scan
    const existingScan = await ctx.db
      .query("scans")
      .withIndex("by_trip", (q) => q.eq("tripSessionId", args.tripSessionId))
      .filter((q) => q.eq(q.field("passengerId"), passenger._id))
      .first();

    if (existingScan) {
      // Return status instead of throwing - passenger already scanned
      return { passenger, status: "already_scanned" as const };
    }

    await ctx.db.insert("scans", {
      operatorId: membership.operatorId,
      tripSessionId: args.tripSessionId,
      passengerId: passenger._id,
      scannedAt: Date.now(),
      scannedBy: user._id,
    });

    return { passenger, status: "success" as const };
  },
});

export const getDriverHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      return [];
    }
    if (!user) return [];

    const membership = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!membership) return [];

    const trips = await ctx.db
      .query("tripSessions")
      .withIndex("by_driver", (q) =>
        q.eq("operatorId", membership.operatorId).eq("driverId", user._id)
      )
      .order("desc")
      .take(args.limit || 50);

    return Promise.all(
      trips.map(async (trip) => {
        const route = await ctx.db.get(trip.routeId);
        const scans = await ctx.db
          .query("scans")
          .withIndex("by_trip", (q) => q.eq("tripSessionId", trip._id))
          .collect();
        return { trip, route, scanCount: scans.length };
      })
    );
  },
});

export const getTripDetails = query({
  args: { tripSessionId: v.id("tripSessions") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const trip = await ctx.db.get(args.tripSessionId);
    if (!trip) return null;

    const membership = await ctx.db
      .query("members")
      .withIndex("by_operator_user", (q) =>
        q.eq("operatorId", trip.operatorId).eq("userId", user._id)
      )
      .first();

    if (!membership) throw new Error("Not authorized");

    const route = await ctx.db.get(trip.routeId);
    const scans = await ctx.db
      .query("scans")
      .withIndex("by_trip", (q) => q.eq("tripSessionId", trip._id))
      .collect();

    const scansWithPassengers = await Promise.all(
      scans.map(async (scan) => {
        const passenger = await ctx.db.get(scan.passengerId);
        return { ...scan, passenger };
      })
    );

    return { trip, route, scans: scansWithPassengers };
  },
});
