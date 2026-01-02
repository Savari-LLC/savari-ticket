import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Check if slug is already taken
    const existing = await ctx.db
      .query("operators")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) throw new Error("Slug already taken");

    // Check if user already owns an operator
    const ownedOperator = await ctx.db
      .query("operators")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .first();
    if (ownedOperator) throw new Error("You already own an operator");

    const operatorId = await ctx.db.insert("operators", {
      name: args.name,
      slug: args.slug,
      ownerId: user._id,
      createdAt: Date.now(),
    });

    // Add the creator as an operator member
    await ctx.db.insert("members", {
      operatorId,
      userId: user._id,
      role: "operator",
      email: user.email,
      name: user.name || user.email,
      createdAt: Date.now(),
    });

    return operatorId;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("operators")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      return null;
    }
    if (!user) return null;

    // Get user's membership
    const membership = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!membership) return null;

    const operator = await ctx.db.get(membership.operatorId);
    return operator ? { ...operator, role: membership.role } : null;
  },
});

export const getMyMembership = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      return null;
    }
    if (!user) return null;

    console.log("getMyMembership - userId:", user._id);
    
    const membership = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    console.log("getMyMembership - found:", membership ? "yes" : "no");

    if (!membership) return null;

    const operator = await ctx.db.get(membership.operatorId);
    return {
      membership,
      operator,
      user,
    };
  },
});
