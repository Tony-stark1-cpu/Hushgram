import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface Message {
  _id: Id<"messages">;
  content: string;
  senderId: Id<"users">;
  timestamp: number;
  status?: "sent" | "delivered" | "seen";
  sender?: {
    _id: Id<"users">;
    username: string;
    sessionId: string;
    isOnline: boolean;
    lastSeen: number;
    _creationTime: number;
  } | null;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: Id<"users">;
  chatId: string;
}

export function MessageList({ messages, currentUserId, chatId }: MessageListProps) {
  const typingIndicators = useQuery(api.messages.getTypingIndicators, { chatId });

  const formatTime = (timestamp: number) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return messageTime.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "sent":
        return (
          <svg className="w-3 h-3 text-discord-text" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case "delivered":
        return (
          <div className="flex space-x-0.5">
            <svg className="w-3 h-3 text-discord-text" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg className="w-3 h-3 text-discord-text -ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case "seen":
        return (
          <div className="flex space-x-0.5">
            <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg className="w-3 h-3 text-blue-400 -ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const typingUsers = typingIndicators?.filter(indicator => 
    indicator.userId !== currentUserId
  ) || [];

  return (
    <div className="p-4 space-y-4 bg-gradient-to-b from-discord-dark to-discord-secondary">
      {messages.length === 0 ? (
        <div className="text-center text-discord-text py-16 fade-in">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
          <p className="text-sm">Start the conversation and break the ice! 🚀</p>
        </div>
      ) : (
        messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;
          const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].senderId !== message.senderId);
          
          return (
            <div
              key={message._id}
              className={`flex items-end space-x-2 ${isOwnMessage ? "justify-end" : "justify-start"} slide-up`}
            >
              {!isOwnMessage && (
                <div className="w-8 h-8 flex-shrink-0">
                  {showAvatar && (
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                      {message.sender?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
              )}
              
              <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[70%] sm:max-w-xs lg:max-w-md`}>
                {!isOwnMessage && showAvatar && (
                  <div className="text-xs text-discord-text mb-1 px-2">
                    {message.sender?.username || "Unknown User"}
                  </div>
                )}
                
                <div className={`message-bubble ${isOwnMessage ? "own bg-discord-accent text-white" : "other bg-discord-secondary text-white"} shadow-lg`}>
                  <div className="break-words">{message.content}</div>
                  
                  <div className={`message-status mt-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    <span className="text-xs opacity-70">
                      {formatTime(message.timestamp)}
                    </span>
                    {isOwnMessage && (
                      <div className="ml-1">
                        {getStatusIcon(message.status || "sent")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div className="flex items-end space-x-2 justify-start slide-up">
          <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {typingUsers[0].user?.username?.[0]?.toUpperCase() || "?"}
          </div>
          
          <div className="bg-discord-secondary text-discord-text px-4 py-3 rounded-2xl shadow-lg glass-effect">
            <div className="flex items-center space-x-2">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
              <span className="text-xs">
                {typingUsers.length === 1 
                  ? `${typingUsers[0].user?.username} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}