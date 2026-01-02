import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { authComponent } from "./auth";
import { nanoid } from "nanoid";

async function requireBusinessRole(ctx: any) {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) throw new Error("Not authenticated");

  const membership = await ctx.db
    .query("members")
    .withIndex("by_user", (q: any) => q.eq("userId", user._id))
    .first();

  if (!membership || membership.role !== "business") {
    throw new Error("Only businesses can perform this action");
  }

  return { user, membership };
}

async function requireMembership(ctx: any, operatorId: any) {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) throw new Error("Not authenticated");

  const membership = await ctx.db
    .query("members")
    .withIndex("by_operator_user", (q: any) =>
      q.eq("operatorId", operatorId).eq("userId", user._id)
    )
    .first();

  if (!membership) throw new Error("Not a member of this operator");

  return { user, membership };
}

export const create = mutation({
  args: {
    operatorId: v.id("operators"),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, membership } = await requireBusinessRole(ctx);

    if (membership.operatorId !== args.operatorId) {
      throw new Error("Cannot add passenger to a different operator");
    }

    const operator = await ctx.db.get(args.operatorId);
    if (!operator) throw new Error("Operator not found");

    const qrCode = `SAVARI-${nanoid(12)}`;

    const passengerId = await ctx.db.insert("passengers", {
      operatorId: args.operatorId,
      businessId: user._id,
      name: args.name,
      email: args.email,
      qrCode,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, api.emails.sendTicketEmail, {
      email: args.email,
      passengerName: args.name,
      operatorName: operator.name,
      qrCodeValue: qrCode,
    });

    return passengerId;
  },
});

export const list = query({
  args: {
    operatorId: v.id("operators"),
    paginationOpts: v.object({
      cursor: v.union(v.string(), v.null()),
      numItems: v.number(),
    }),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireMembership(ctx, args.operatorId);
    const { cursor, numItems } = args.paginationOpts;

    let query;
    if (membership.role === "business") {
      const user = await authComponent.getAuthUser(ctx);
      query = ctx.db
        .query("passengers")
        .withIndex("by_business", (q) =>
          q.eq("operatorId", args.operatorId).eq("businessId", user!._id)
        );
    } else {
      query = ctx.db
        .query("passengers")
        .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId));
    }

    const results = await query.paginate({ cursor, numItems });

    // Filter out archived unless requested
    const filteredPage = args.includeArchived
      ? results.page
      : results.page.filter((p) => !p.archivedAt);

    return {
      ...results,
      page: filteredPage,
    };
  },
});

export const get = query({
  args: { passengerId: v.id("passengers") },
  handler: async (ctx, args) => {
    const passenger = await ctx.db.get(args.passengerId);
    if (!passenger) return null;

    await requireMembership(ctx, passenger.operatorId);
    return passenger;
  },
});

export const getByQrCode = query({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("passengers")
      .withIndex("by_qr", (q) => q.eq("qrCode", args.qrCode))
      .first();
  },
});

export const update = mutation({
  args: {
    passengerId: v.id("passengers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, membership } = await requireBusinessRole(ctx);

    const passenger = await ctx.db.get(args.passengerId);
    if (!passenger) throw new Error("Passenger not found");

    if (passenger.businessId !== user._id) {
      throw new Error("Cannot update another business's passenger");
    }

    const { passengerId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(args.passengerId, filteredUpdates);
  },
});

export const archive = mutation({
  args: { passengerId: v.id("passengers") },
  handler: async (ctx, args) => {
    const { user } = await requireBusinessRole(ctx);

    const passenger = await ctx.db.get(args.passengerId);
    if (!passenger) throw new Error("Passenger not found");

    if (passenger.businessId !== user._id) {
      throw new Error("Cannot archive another business's passenger");
    }

    await ctx.db.patch(args.passengerId, { archivedAt: Date.now() });
  },
});

export const resendTicketEmail = mutation({
  args: { passengerId: v.id("passengers") },
  handler: async (ctx, args) => {
    const { user } = await requireBusinessRole(ctx);

    const passenger = await ctx.db.get(args.passengerId);
    if (!passenger) throw new Error("Passenger not found");

    if (passenger.businessId !== user._id) {
      throw new Error("Cannot resend email for another business's passenger");
    }

    const operator = await ctx.db.get(passenger.operatorId);
    if (!operator) throw new Error("Operator not found");

    await ctx.scheduler.runAfter(0, api.emails.sendTicketEmail, {
      email: passenger.email,
      passengerName: passenger.name,
      operatorName: operator.name,
      qrCodeValue: passenger.qrCode,
    });
  },
});
