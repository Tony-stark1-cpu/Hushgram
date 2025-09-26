import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new group
export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
    password: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      description: args.description,
      isPrivate: args.isPrivate,
      password: args.password,
      createdBy: args.createdBy,
      memberCount: 1,
    });

    // Add creator as first member
    await ctx.db.insert("groupMembers", {
      groupId,
      userId: args.createdBy,
      joinedAt: Date.now(),
    });

    return groupId;
  },
});

// Get all public groups
export const getPublicGroups = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("groups")
      .withIndex("by_private", (q) => q.eq("isPrivate", false))
      .collect();
  },
});

// Get user's groups
export const getUserGroups = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const groups = [];
    for (const membership of memberships) {
      const group = await ctx.db.get(membership.groupId);
      if (group) {
        groups.push(group);
      }
    }

    return groups;
  },
});

// Join a group
export const joinGroup = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => 
        q.eq("groupId", args.groupId).eq("userId", args.userId)
      )
      .first();

    if (existingMembership) {
      return; // Already a member
    }

    // Check password for private groups
    if (group.isPrivate && group.password !== args.password) {
      throw new Error("Invalid password");
    }

    // Add member
    await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      userId: args.userId,
      joinedAt: Date.now(),
    });

    // Update member count
    await ctx.db.patch(args.groupId, {
      memberCount: group.memberCount + 1,
    });
  },
});

// Leave a group
export const leaveGroup = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => 
        q.eq("groupId", args.groupId).eq("userId", args.userId)
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);

      // Update member count
      const group = await ctx.db.get(args.groupId);
      if (group) {
        await ctx.db.patch(args.groupId, {
          memberCount: Math.max(0, group.memberCount - 1),
        });
      }
    }
  },
});
