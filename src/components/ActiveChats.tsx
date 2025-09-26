import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ActiveChatsProps {
  currentUserId: Id<"users">;
  selectedChat: any;
  setSelectedChat: (chat: any) => void;
}

export function ActiveChats({ currentUserId, selectedChat, setSelectedChat }: ActiveChatsProps) {
  const activeChats = useQuery(api.messages.getActiveChats, { userId: currentUserId });

  if (!activeChats || activeChats.length === 0) {
    return (
      <div className="p-4 text-center text-discord-text">
        <p>No active chats</p>
        <p className="text-sm mt-1">Start a conversation!</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {activeChats.map((chat) => {
        const isSelected = selectedChat?.id === chat.chatId;
        const displayName = chat.chatType === "private" 
          ? ("otherUser" in chat ? chat.otherUser?.username || "Unknown User" : "Unknown User")
          : ("group" in chat ? chat.group?.name || "Unknown Group" : "Unknown Group");

        const isOnline = chat.chatType === "private" 
          ? ("otherUser" in chat ? chat.otherUser?.isOnline && (Date.now() - (chat.otherUser?.lastSeen || 0)) < 60000 : false)
          : true;

        return (
          <div
            key={chat._id}
            onClick={() => {
              setSelectedChat({
                type: chat.chatType,
                id: chat.chatId,
                name: displayName,
                otherUserId: chat.otherUserId,
                groupId: chat.groupId,
                isOnline: isOnline, // Changed
              });
            }}
            className={`relative p-3 border-b border-discord-border cursor-pointer hover:bg-discord-hover transition-colors ${
              isSelected ? "bg-discord-selected" : ""
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shadow-lg ${
                  chat.chatType === "private" 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500" 
                    : "bg-gradient-to-r from-green-500 to-blue-500"
                }`}>
                  {chat.chatType === "private" ? displayName[0]?.toUpperCase() : "#"}
                </div>
                
                {chat.chatType === "private" && (
                  <div className={`status-indicator ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}>
                    {isOnline && <div className="pulse-ring"></div>}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white truncate">{displayName}</h3>
                  <div className="flex items-center space-x-2">
                    {chat.unreadCount > 0 && (
                      <div className="unread-badge">
                        {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                      </div>
                    )}
                    <span className="text-xs text-discord-text">
                      {new Date(chat.lastMessageTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-discord-text flex items-center space-x-2">
                  <span>{chat.chatType === "private" ? "Private chat" : "Group chat"}</span>
                  {chat.chatType === "private" && (
                    <>
                      <span>•</span>
                      <span className={isOnline ? "text-green-400" : "text-gray-400"}>
                        {isOnline ? "Online" : "Offline"}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}