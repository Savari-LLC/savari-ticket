import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

async function requireOperatorRole(ctx: any) {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) throw new Error("Not authenticated");

  const membership = await ctx.db
    .query("members")
    .withIndex("by_user", (q: any) => q.eq("userId", user._id))
    .first();

  if (!membership || membership.role !== "operator") {
    throw new Error("Only operators can perform this action");
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
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireOperatorRole(ctx);

    if (membership.operatorId !== args.operatorId) {
      throw new Error("Cannot create route for a different operator");
    }

    return ctx.db.insert("routes", {
      operatorId: args.operatorId,
      name: args.name,
      description: args.description,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: { operatorId: v.id("operators") },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.operatorId);

    return ctx.db
      .query("routes")
      .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
      .collect();
  },
});

export const listActive = query({
  args: { operatorId: v.id("operators") },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.operatorId);

    const routes = await ctx.db
      .query("routes")
      .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
      .collect();

    return routes.filter((r) => r.isActive);
  },
});

export const get = query({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    if (!route) return null;

    await requireMembership(ctx, route.operatorId);
    return route;
  },
});

export const update = mutation({
  args: {
    routeId: v.id("routes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireOperatorRole(ctx);

    const route = await ctx.db.get(args.routeId);
    if (!route) throw new Error("Route not found");

    if (route.operatorId !== membership.operatorId) {
      throw new Error("Cannot update route for a different operator");
    }

    const { routeId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(args.routeId, filteredUpdates);
  },
});

export const remove = mutation({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args) => {
    const { membership } = await requireOperatorRole(ctx);

    const route = await ctx.db.get(args.routeId);
    if (!route) throw new Error("Route not found");

    if (route.operatorId !== membership.operatorId) {
      throw new Error("Cannot delete route for a different operator");
    }

    await ctx.db.delete(args.routeId);
  },
});
