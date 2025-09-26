import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

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

// Get all online users
export const getOnlineUsers = query({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - 60000; // 1 minute ago
    
    const users = await ctx.db
      .query("users")
      .withIndex("by_online", (q) => q.eq("isOnline", true))
      .filter((q) => q.gt(q.field("lastSeen"), cutoffTime))
      .collect();

    return users;
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

// Logout user - clean up all user data
export const logoutUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Clean up user's active chats
    const activeChats = await ctx.db
      .query("activeChats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const chat of activeChats) {
      await ctx.db.delete(chat._id);
    }
    
    // Clean up user's typing indicators
    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    for (const indicator of typingIndicators) {
      await ctx.db.delete(indicator._id);
    }
    
    // Clean up user's private messages (keep group messages)
    const privateMessages = await ctx.db
      .query("messages")
      .filter((q) => 
        q.and(
          q.eq(q.field("isPrivate"), true),
          q.or(
            q.eq(q.field("senderId"), args.userId),
            q.eq(q.field("recipientId"), args.userId)
          )
        )
      )
      .collect();
    
    for (const message of privateMessages) {
      await ctx.db.delete(message._id);
    }
    
    // Remove user from all groups
    const groupMemberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const membership of groupMemberships) {
      await ctx.db.delete(membership._id);
      
      // Update group member count
      const group = await ctx.db.get(membership.groupId);
      if (group) {
        await ctx.db.patch(membership.groupId, {
          memberCount: Math.max(0, group.memberCount - 1),
        });
      }
    }
    
    // Finally, delete the user
    await ctx.db.delete(args.userId);
  },
});

// Clean up offline users (remove users who have been offline for too long)
export const cleanupOfflineUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - 300000; // 5 minutes ago
    
    const offlineUsers = await ctx.db
      .query("users")
      .filter((q) => 
        q.or(
          q.eq(q.field("isOnline"), false),
          q.lt(q.field("lastSeen"), cutoffTime)
        )
      )
      .collect();

    for (const user of offlineUsers) {
      // Clean up user's data
      await ctx.db.delete(user._id);
      
      // Clean up user's active chats
      const activeChats = await ctx.db
        .query("activeChats")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      
      for (const chat of activeChats) {
        await ctx.db.delete(chat._id);
      }
      
      // Clean up user's typing indicators
      const typingIndicators = await ctx.db
        .query("typingIndicators")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();
      
      for (const indicator of typingIndicators) {
        await ctx.db.delete(indicator._id);
      }
      
      // Clean up user's private messages (keep group messages)
      const privateMessages = await ctx.db
        .query("messages")
        .filter((q) => 
          q.and(
            q.eq(q.field("isPrivate"), true),
            q.or(
              q.eq(q.field("senderId"), user._id),
              q.eq(q.field("recipientId"), user._id)
            )
          )
        )
        .collect();
      
      for (const message of privateMessages) {
        await ctx.db.delete(message._id);
      }
    }
  },
});
