import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Send a message
export const sendMessage = mutation({
  args: {
    content: v.string(),
    senderId: v.id("users"),
    recipientId: v.optional(v.id("users")),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const isPrivate = !!args.recipientId;
    
    const messageId = await ctx.db.insert("messages", {
      content: args.content,
      senderId: args.senderId,
      recipientId: args.recipientId,
      groupId: args.groupId,
      isPrivate,
      timestamp: Date.now(),
      status: "sent",
    });

    // Update active chats
    const chatId = isPrivate 
      ? `private_${args.senderId < args.recipientId! ? args.senderId : args.recipientId!}_${args.senderId < args.recipientId! ? args.recipientId! : args.senderId}`
      : `group_${args.groupId}`;

    // Update sender's active chat
    const senderActiveChat = await ctx.db
      .query("activeChats")
      .withIndex("by_user", (q) => q.eq("userId", args.senderId))
      .filter((q) => q.eq(q.field("chatId"), chatId))
      .first();

    if (senderActiveChat) {
      await ctx.db.patch(senderActiveChat._id, {
        lastMessageTime: Date.now(),
      });
    } else {
      await ctx.db.insert("activeChats", {
        userId: args.senderId,
        chatId,
        chatType: isPrivate ? "private" : "group",
        lastMessageTime: Date.now(),
        otherUserId: args.recipientId,
        groupId: args.groupId,
      });
    }

    // Update recipient's active chat (for private messages)
    if (isPrivate && args.recipientId) {
      const recipientActiveChat = await ctx.db
        .query("activeChats")
        .withIndex("by_user", (q) => q.eq("userId", args.recipientId!))
        .filter((q) => q.eq(q.field("chatId"), chatId))
        .first();

      if (recipientActiveChat) {
        await ctx.db.patch(recipientActiveChat._id, {
          lastMessageTime: Date.now(),
        });
      } else {
        await ctx.db.insert("activeChats", {
          userId: args.recipientId,
          chatId,
          chatType: "private",
          lastMessageTime: Date.now(),
          otherUserId: args.senderId,
        });
      }

      // Schedule message status update using scheduler
      await ctx.scheduler.runAfter(1000, internal.messages.updateMessageStatus, {
        messageId,
        status: "delivered",
      });
    }

    return messageId;
  },
});

// Update message status (called by scheduler)
export const updateMessageStatus = internalMutation({
  args: {
    messageId: v.id("messages"),
    status: v.union(v.literal("sent"), v.literal("delivered"), v.literal("seen")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { status: args.status });
  },
});

// Mark messages as seen
export const markMessagesSeen = mutation({
  args: {
    chatId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all unseen messages in this chat
    const messages = await ctx.db
      .query("messages")
      .filter((q) => {
        if (args.chatId.startsWith("private_")) {
          const [, userId1, userId2] = args.chatId.split("_");
          return q.and(
            q.eq(q.field("isPrivate"), true),
            q.or(
              q.and(
                q.eq(q.field("senderId"), userId1 as any),
                q.eq(q.field("recipientId"), userId2 as any)
              ),
              q.and(
                q.eq(q.field("senderId"), userId2 as any),
                q.eq(q.field("recipientId"), userId1 as any)
              )
            ),
            q.neq(q.field("senderId"), args.userId),
            q.neq(q.field("status"), "seen")
          );
        } else {
          const groupId = args.chatId.replace("group_", "");
          return q.and(
            q.eq(q.field("groupId"), groupId as any),
            q.neq(q.field("senderId"), args.userId),
            q.neq(q.field("status"), "seen")
          );
        }
      })
      .collect();

    // Mark all messages as seen
    for (const message of messages) {
      await ctx.db.patch(message._id, { status: "seen" });
    }
  },
});

// Get unread message count for a chat
export const getUnreadCount = query({
  args: {
    chatId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .filter((q) => {
        if (args.chatId.startsWith("private_")) {
          const [, userId1, userId2] = args.chatId.split("_");
          return q.and(
            q.eq(q.field("isPrivate"), true),
            q.or(
              q.and(
                q.eq(q.field("senderId"), userId1 as any),
                q.eq(q.field("recipientId"), userId2 as any)
              ),
              q.and(
                q.eq(q.field("senderId"), userId2 as any),
                q.eq(q.field("recipientId"), userId1 as any)
              )
            ),
            q.neq(q.field("senderId"), args.userId),
            q.neq(q.field("status"), "seen")
          );
        } else {
          const groupId = args.chatId.replace("group_", "");
          return q.and(
            q.eq(q.field("groupId"), groupId as any),
            q.neq(q.field("senderId"), args.userId),
            q.neq(q.field("status"), "seen")
          );
        }
      })
      .collect();

    return messages.length;
  },
});

// Get messages for a private chat
export const getPrivateMessages = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .filter((q) => 
        q.and(
          q.eq(q.field("isPrivate"), true),
          q.or(
            q.and(
              q.eq(q.field("senderId"), args.userId1),
              q.eq(q.field("recipientId"), args.userId2)
            ),
            q.and(
              q.eq(q.field("senderId"), args.userId2),
              q.eq(q.field("recipientId"), args.userId1)
            )
          )
        )
      )
      .order("asc")
      .collect();

    // Populate sender info
    const messagesWithSender = [];
    for (const message of messages) {
      const sender = await ctx.db.get(message.senderId);
      messagesWithSender.push({
        ...message,
        sender,
      });
    }

    return messagesWithSender;
  },
});

// Get messages for a group
export const getGroupMessages = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("asc")
      .collect();

    // Populate sender info
    const messagesWithSender = [];
    for (const message of messages) {
      const sender = await ctx.db.get(message.senderId);
      messagesWithSender.push({
        ...message,
        sender,
      });
    }

    return messagesWithSender;
  },
});

// Get user's active chats with unread counts
export const getActiveChats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const activeChats = await ctx.db
      .query("activeChats")
      .withIndex("by_user_time", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const chatsWithInfo = [];
    for (const chat of activeChats) {
      // Get unread count
      const unreadMessages = await ctx.db
        .query("messages")
        .filter((q) => {
          if (chat.chatType === "private" && chat.otherUserId) {
            return q.and(
              q.eq(q.field("isPrivate"), true),
              q.or(
                q.and(
                  q.eq(q.field("senderId"), args.userId),
                  q.eq(q.field("recipientId"), chat.otherUserId)
                ),
                q.and(
                  q.eq(q.field("senderId"), chat.otherUserId),
                  q.eq(q.field("recipientId"), args.userId)
                )
              ),
              q.neq(q.field("senderId"), args.userId),
              q.neq(q.field("status"), "seen")
            );
          } else if (chat.chatType === "group" && chat.groupId) {
            return q.and(
              q.eq(q.field("groupId"), chat.groupId),
              q.neq(q.field("senderId"), args.userId),
              q.neq(q.field("status"), "seen")
            );
          }
          return q.eq(q.field("_id"), "invalid" as any); // Return no results
        })
        .collect();

      const unreadCount = unreadMessages.length;

      if (chat.chatType === "private" && chat.otherUserId) {
        const otherUser = await ctx.db.get(chat.otherUserId);
        if (otherUser) {
          chatsWithInfo.push({
            ...chat,
            otherUser,
            unreadCount,
          });
        }
      } else if (chat.chatType === "group" && chat.groupId) {
        const group = await ctx.db.get(chat.groupId);
        if (group) {
          chatsWithInfo.push({
            ...chat,
            group,
            unreadCount,
          });
        }
      }
    }

    return chatsWithInfo;
  },
});

// Update typing indicator
export const updateTypingIndicator = mutation({
  args: {
    userId: v.id("users"),
    chatId: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_chat", (q) => 
        q.eq("userId", args.userId).eq("chatId", args.chatId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        lastUpdate: Date.now(),
      });
    } else {
      await ctx.db.insert("typingIndicators", {
        userId: args.userId,
        chatId: args.chatId,
        isTyping: args.isTyping,
        lastUpdate: Date.now(),
      });
    }
  },
});

// Get typing indicators for a chat
export const getTypingIndicators = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - 5000; // 5 seconds ago
    
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isTyping"), true),
          q.gt(q.field("lastUpdate"), cutoffTime)
        )
      )
      .collect();

    const indicatorsWithUser = [];
    for (const indicator of indicators) {
      const user = await ctx.db.get(indicator.userId);
      if (user) {
        indicatorsWithUser.push({
          ...indicator,
          user,
        });
      }
    }

    return indicatorsWithUser;
  },
});

// Clean up old typing indicators
export const cleanupTypingIndicators = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - 10000; // 10 seconds ago
    
    const oldIndicators = await ctx.db
      .query("typingIndicators")
      .filter((q) => q.lt(q.field("lastUpdate"), cutoffTime))
      .collect();

    for (const indicator of oldIndicators) {
      await ctx.db.delete(indicator._id);
    }
  },
});
