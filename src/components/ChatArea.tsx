import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

interface ChatAreaProps {
  currentUserId: Id<"users">;
  selectedChat: {
    type: "private" | "group";
    id: string;
    name: string;
    otherUserId?: Id<"users">;
    groupId?: Id<"groups">;
  } | null;
  setSelectedChat: (chat: any) => void;
  isMobile?: boolean;
  keyboardHeight?: number;
}

export function ChatArea({ 
  currentUserId, 
  selectedChat, 
  setSelectedChat, 
  isMobile = false,
  keyboardHeight = 0
}: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendMessage = useMutation(api.messages.sendMessage);
  const updateTypingIndicator = useMutation(api.messages.updateTypingIndicator);
  const markMessagesSeen = useMutation(api.messages.markMessagesSeen);

  // Get other user info for private chats to check online status
  const otherUser = useQuery(
    api.users.getCurrentUser,
    selectedChat?.type === "private" && selectedChat.otherUserId
      ? { sessionId: `user_${selectedChat.otherUserId}` }
      : "skip"
  );

  // Get messages based on chat type
  const privateMessages = useQuery(
    api.messages.getPrivateMessages,
    selectedChat?.type === "private" && selectedChat.otherUserId
      ? { userId1: currentUserId, userId2: selectedChat.otherUserId }
      : "skip"
  );

  const groupMessages = useQuery(
    api.messages.getGroupMessages,
    selectedChat?.type === "group" && selectedChat.groupId
      ? { groupId: selectedChat.groupId }
      : "skip"
  );

  const messages = selectedChat?.type === "private" ? privateMessages : groupMessages;

  // Mark messages as seen when chat is opened
  useEffect(() => {
    if (selectedChat && messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId !== currentUserId) {
        markMessagesSeen({
          chatId: selectedChat.id,
          userId: currentUserId,
        });
      }
    }
  }, [selectedChat, messages, currentUserId, markMessagesSeen]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!selectedChat) return;

    if (!isTyping) {
      setIsTyping(true);
      updateTypingIndicator({
        userId: currentUserId,
        chatId: selectedChat.id,
        isTyping: true,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingIndicator({
        userId: currentUserId,
        chatId: selectedChat.id,
        isTyping: false,
      });
    }, 2000);
  };

  // Handle message send
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    try {
      await sendMessage({
        content: message.trim(),
        senderId: currentUserId,
        recipientId: selectedChat.otherUserId,
        groupId: selectedChat.groupId,
      });

      setMessage("");
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        updateTypingIndicator({
          userId: currentUserId,
          chatId: selectedChat.id,
          isTyping: false,
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Cleanup typing indicator on unmount or chat change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && selectedChat) {
        updateTypingIndicator({
          userId: currentUserId,
          chatId: selectedChat.id,
          isTyping: false,
        });
      }
    };
  }, [selectedChat?.id]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-discord-dark via-discord-secondary to-discord-dark">
        <div className="text-center text-discord-text fade-in">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-glow-lg animate-pulse-slow">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Welcome to Hushgram
          </h2>
          <p className="text-lg mb-2">Select a user or group to start chatting</p>
          <p className="text-sm opacity-70">Connect, chat, and make new friends! ✨</p>
        </div>
      </div>
    );
  }

  // Check if other user is online (for private chats)
  const isOtherUserOnline = selectedChat.type === "private" 
    ? otherUser?.isOnline && (Date.now() - (otherUser?.lastSeen || 0)) < 60000
    : true;

  const containerStyle = isMobile && keyboardHeight > 0 
    ? { height: `calc(100vh - ${keyboardHeight}px)` }
    : {};

  return (
    <div 
      className={`flex-1 flex flex-col bg-discord-dark relative ${isMobile ? 'mobile-chat-area' : 'h-screen'}`}
      style={containerStyle}
    >
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-discord-warning text-discord-dark px-4 py-2 text-center text-sm font-medium">
          You're offline. Messages will be sent when you reconnect.
        </div>
      )}

      {/* Chat Header - Hide on mobile as it's handled in MobileView */}
      {!isMobile && (
        <div className="h-16 bg-discord-secondary/80 backdrop-blur-md border-b border-discord-border flex items-center justify-between px-4 shadow-lg flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-lg ${
                selectedChat.type === "private" 
                  ? "bg-gradient-to-r from-purple-500 to-pink-500" 
                  : "bg-gradient-to-r from-green-500 to-blue-500"
              }`}>
                {selectedChat.type === "private" ? selectedChat.name[0]?.toUpperCase() : "#"}
              </div>
              {selectedChat.type === "private" && isOtherUserOnline && (
                <div className="status-indicator bg-green-500">
                  <div className="pulse-ring"></div>
                </div>
              )}
              {selectedChat.type === "private" && !isOtherUserOnline && (
                <div className="status-indicator bg-gray-500"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-white text-lg">{selectedChat.name}</h2>
              <p className="text-sm text-discord-text flex items-center space-x-2">
                <span>{selectedChat.type === "private" ? "Private chat" : "Group chat"}</span>
                {selectedChat.type === "private" && (
                  <>
                    <span>•</span>
                    <span className={isOtherUserOnline ? "text-green-400" : "text-gray-400"}>
                      {isOtherUserOnline ? "Online" : "Offline"}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Close button */}
            <button
              onClick={() => setSelectedChat(null)}
              className="p-2 text-discord-text hover:text-white hover:bg-discord-danger/20 hover:text-discord-danger rounded-full transition-all duration-200 hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className={isMobile ? "mobile-messages-container" : "flex-1"} style={isMobile ? { paddingBottom: keyboardHeight > 0 ? '140px' : '100px' } : {}}>
        <MessageList
          messages={messages || []}
          currentUserId={currentUserId}
          chatId={selectedChat.id}
        />
      </div>

      {/* Message Input */}
      <div className={isMobile ? "mobile-input-container" : "flex-shrink-0"}>
        <MessageInput
          message={message}
          setMessage={setMessage}
          onSend={handleSendMessage}
          onTyping={handleTyping}
          placeholder={`Message ${selectedChat.name}...`}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}
