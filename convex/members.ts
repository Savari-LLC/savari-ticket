import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { authComponent } from "./auth";
import { nanoid } from "nanoid";

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

export const list = query({
  args: { operatorId: v.id("operators") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Verify user belongs to this operator
    const membership = await ctx.db
      .query("members")
      .withIndex("by_operator_user", (q) =>
        q.eq("operatorId", args.operatorId).eq("userId", user._id)
      )
      .first();

    if (!membership) throw new Error("Not a member of this operator");

    return ctx.db
      .query("members")
      .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
      .collect();
  },
});

export const createInvite = mutation({
  args: {
    operatorId: v.id("operators"),
    email: v.string(),
    role: v.union(v.literal("driver"), v.literal("business")),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireOperatorRole(ctx);

    if (membership.operatorId !== args.operatorId) {
      throw new Error("Cannot invite to a different operator");
    }

    const operator = await ctx.db.get(args.operatorId);
    if (!operator) throw new Error("Operator not found");

    const token = nanoid(32);
    const inviteId = await ctx.db.insert("invites", {
      operatorId: args.operatorId,
      email: args.email,
      role: args.role,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await ctx.scheduler.runAfter(0, api.emails.sendInviteEmail, {
      email: args.email,
      operatorName: operator.name,
      role: args.role,
      token,
    });

    return { inviteId, token };
  },
});

export const getInviteByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) return null;
    if (invite.usedAt) return null;
    if (invite.expiresAt < Date.now()) return null;

    const operator = await ctx.db.get(invite.operatorId);
    return { invite, operator };
  },
});

export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) throw new Error("Invalid invite");
    if (invite.usedAt) throw new Error("Invite already used");
    if (invite.expiresAt < Date.now()) throw new Error("Invite expired");

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingMembership) {
      throw new Error("You are already a member of an operator");
    }

    // Create membership
    await ctx.db.insert("members", {
      operatorId: invite.operatorId,
      userId: user._id,
      role: invite.role,
      email: user.email,
      name: user.name || user.email,
      createdAt: Date.now(),
    });

    // Mark invite as used
    await ctx.db.patch(invite._id, { usedAt: Date.now() });

    return invite.operatorId;
  },
});

export const listInvites = query({
  args: { operatorId: v.id("operators") },
  handler: async (ctx, args) => {
    const { membership } = await requireOperatorRole(ctx);

    if (membership.operatorId !== args.operatorId) {
      throw new Error("Cannot view invites for a different operator");
    }

    return ctx.db
      .query("invites")
      .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
      .collect();
  },
});

export const removeMember = mutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, args) => {
    const { membership } = await requireOperatorRole(ctx);

    const targetMember = await ctx.db.get(args.memberId);
    if (!targetMember) throw new Error("Member not found");

    if (targetMember.operatorId !== membership.operatorId) {
      throw new Error("Cannot remove member from a different operator");
    }

    if (targetMember.role === "operator") {
      throw new Error("Cannot remove the operator");
    }

    await ctx.db.delete(args.memberId);
  },
});

export const deleteInvite = mutation({
  args: { inviteId: v.id("invites") },
  handler: async (ctx, args) => {
    const { membership } = await requireOperatorRole(ctx);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");

    if (invite.operatorId !== membership.operatorId) {
      throw new Error("Cannot delete invite from a different operator");
    }

    await ctx.db.delete(args.inviteId);
  },
});
