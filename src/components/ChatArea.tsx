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
    isOnline?: boolean;
  } | null;
  setSelectedChat: (chat: any) => void;
  isMobile?: boolean;
}

export function ChatArea({ 
  currentUserId, 
  selectedChat, 
  setSelectedChat, 
  isMobile = false,
}: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const sendMessage = useMutation(api.messages.sendMessage);
  const updateTypingIndicator = useMutation(api.messages.updateTypingIndicator);
  const markMessagesSeen = useMutation(api.messages.markMessagesSeen);

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
  
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

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
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingIndicator({
        userId: currentUserId,
        chatId: selectedChat.id,
        isTyping: false,
      });
    }, 2000);
  };

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
  
  return (
    <div className="h-full flex flex-col bg-discord-dark relative">
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
              {/* The status dot indicators that were here have been DELETED */}
            </div>
            <div>
              <h2 className="font-semibold text-white text-lg">{selectedChat.name}</h2>
              <p className="text-sm text-discord-text flex items-center space-x-2">
                <span>{selectedChat.type === "private" ? "Private chat" : "Group chat"}</span>
                {/* The "Online/Offline" text that was here has been DELETED */}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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

      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        <MessageList
          messages={messages || []}
          currentUserId={currentUserId}
          chatId={selectedChat.id}
        />
      </div>

      <MessageInput
        message={message}
        setMessage={setMessage}
        onSend={handleSendMessage}
        onTyping={handleTyping}
        placeholder={`Message ${selectedChat.name}...`}
        isMobile={isMobile}
      />
    </div>
  );
}