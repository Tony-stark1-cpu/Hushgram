import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api"; // Corrected import
import { Id } from "./_generated/dataModel";

// This is the new, reusable function that deletes a user and ALL their data.
export const _deleteUserAndData = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { userId } = args;

    // 1. Find and delete all messages sent by the user (private AND group)
    const messagesToDelete = await ctx.db
      .query("messages")
      .withIndex("by_sender", (q) => q.eq("senderId", userId))
      .collect();
      
    await Promise.all(messagesToDelete.map((message) => ctx.db.delete(message._id)));

    // 2. Find and delete all group memberships for the user
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Decrease member count for each group the user was in
    await Promise.all(
      memberships.map(async (membership) => {
        const group = await ctx.db.get(membership.groupId);
        if (group) {
          await ctx.db.patch(group._id, {
            memberCount: Math.max(0, group.memberCount - 1),
          });
        }
        await ctx.db.delete(membership._id);
      })
    );

    // 3. Delete the user's active chats and typing indicators
    const activeChats = await ctx.db
      .query("activeChats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    await Promise.all(activeChats.map((chat) => ctx.db.delete(chat._id)));
    
    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    await Promise.all(typingIndicators.map((indicator) => ctx.db.delete(indicator._id)));

    // 4. Finally, delete the user document itself
    await ctx.db.delete(userId);
  },
});


// UPDATED: This now simply calls the internal cleanup function.
export const logoutUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.users._deleteUserAndData, {
      userId: args.userId,
    });
  },
});


// UPDATED: This also calls the internal cleanup function for each offline user.
export const cleanupOfflineUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - 300000; // 5 minutes ago
    
    const offlineUsers = await ctx.db
      .query("users")
      .filter((q) => q.lt(q.field("lastSeen"), cutoffTime))
      .collect();

    // For each offline user, schedule a full data cleanup
    await Promise.all(
      offlineUsers.map((user) =>
        ctx.scheduler.runAfter(0, internal.users._deleteUserAndData, {
          userId: user._id,
        })
      )
    );
  },
});


// --- YOUR OTHER FUNCTIONS (UNCHANGED) ---

// Create a new user
export const createUser = mutation({
  args: {
    username: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if username is already taken by an online user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .filter((q) => q.eq(q.field("isOnline"), true))
      .first();

    if (existingUser) {
      throw new Error("Username is already taken by an online user");
    }

    // Check if user already exists with this session
    const existingSession = await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existingSession) {
      // Update existing user
      await ctx.db.patch(existingSession._id, {
        username: args.username,
        isOnline: true,
        lastSeen: Date.now(),
      });
      return existingSession._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      username: args.username,
      sessionId: args.sessionId,
      isOnline: true,
      lastSeen: Date.now(),
    });

    return userId;
  },
});

// Get current user by session ID
export const getCurrentUser = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    return user;
  },
});

// Get all online users --- OPTIMIZED QUERY ---
export const getOnlineUsers = query({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - 60000; // 1 minute ago
    
    const users = await ctx.db
      .query("users")
      .withIndex("by_online", (q) => q.eq("isOnline", true))
      .filter((q) => q.gt(q.field("lastSeen"), cutoffTime))
      .collect();

    // Map the full user objects to smaller objects with only the data needed by the UI
    return users.map((user) => ({
      _id: user._id,
      username: user.username,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    }));
  },
});

// Update user online status
export const updateOnlineStatus = mutation({
  args: {
    userId: v.id("users"),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isOnline: args.isOnline,
      lastSeen: Date.now(),
    });
  },
});