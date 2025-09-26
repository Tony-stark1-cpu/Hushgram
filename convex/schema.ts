import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Temporary users (session-based)
  users: defineTable({
    username: v.string(),
    sessionId: v.string(),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_username", ["username"])
    .index("by_online", ["isOnline"]),

  // Groups (persistent)
  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
    password: v.optional(v.string()),
    createdBy: v.id("users"),
    memberCount: v.number(),
  })
    .index("by_private", ["isPrivate"])
    .index("by_created_by", ["createdBy"]),

  // Group memberships
  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_user", ["groupId", "userId"]),

  // Messages (persistent for groups, temporary for private chats)
  messages: defineTable({
    content: v.string(),
    senderId: v.id("users"),
    recipientId: v.optional(v.id("users")), // For private messages
    groupId: v.optional(v.id("groups")), // For group messages
    isPrivate: v.boolean(),
    timestamp: v.number(),
    status: v.optional(v.union(v.literal("sent"), v.literal("delivered"), v.literal("seen"))),
  })
    .index("by_private_chat", ["senderId", "recipientId"])
    .index("by_group", ["groupId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_status", ["status"]),

  // Typing indicators
  typingIndicators: defineTable({
    userId: v.id("users"),
    chatId: v.string(), // Can be groupId or "private_userId1_userId2"
    isTyping: v.boolean(),
    lastUpdate: v.number(),
  })
    .index("by_chat", ["chatId"])
    .index("by_user_chat", ["userId", "chatId"])
    .index("by_last_update", ["lastUpdate"]),

  // Active chats (for recent chats functionality)
  activeChats: defineTable({
    userId: v.id("users"),
    chatId: v.string(),
    chatType: v.union(v.literal("private"), v.literal("group")),
    lastMessageTime: v.number(),
    otherUserId: v.optional(v.id("users")),
    groupId: v.optional(v.id("groups")),
  })
    .index("by_user", ["userId"])
    .index("by_user_time", ["userId", "lastMessageTime"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
