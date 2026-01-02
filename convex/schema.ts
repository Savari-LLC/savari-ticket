import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Operators (Tenants) - owns the system instance
  operators: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.string(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"]),

  // Organization members - links users to operators with roles
  members: defineTable({
    operatorId: v.id("operators"),
    userId: v.string(),
    role: v.union(
      v.literal("operator"),
      v.literal("driver"),
      v.literal("business")
    ),
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
  })
    .index("by_operator", ["operatorId"])
    .index("by_user", ["userId"])
    .index("by_operator_user", ["operatorId", "userId"]),

  // Routes - managed by operators
  routes: defineTable({
    operatorId: v.id("operators"),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_operator", ["operatorId"]),

  // Passengers - added by businesses
  passengers: defineTable({
    operatorId: v.id("operators"),
    businessId: v.string(),
    name: v.string(),
    email: v.string(),
    qrCode: v.string(),
    createdAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_operator", ["operatorId"])
    .index("by_business", ["operatorId", "businessId"])
    .index("by_qr", ["qrCode"]),

  // Trip Sessions - when a driver starts a route
  tripSessions: defineTable({
    operatorId: v.id("operators"),
    routeId: v.id("routes"),
    driverId: v.string(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("completed")),
  })
    .index("by_operator", ["operatorId"])
    .index("by_route", ["routeId"])
    .index("by_driver", ["operatorId", "driverId"])
    .index("by_driver_status", ["driverId", "status"]),

  // Scans - passenger scans during trips
  scans: defineTable({
    operatorId: v.id("operators"),
    tripSessionId: v.id("tripSessions"),
    passengerId: v.id("passengers"),
    scannedAt: v.number(),
    scannedBy: v.string(),
  })
    .index("by_trip", ["tripSessionId"])
    .index("by_passenger", ["passengerId"])
    .index("by_operator_date", ["operatorId", "scannedAt"]),

  // Invites - for inviting members
  invites: defineTable({
    operatorId: v.id("operators"),
    email: v.string(),
    role: v.union(v.literal("driver"), v.literal("business")),
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_operator", ["operatorId"]),
});
