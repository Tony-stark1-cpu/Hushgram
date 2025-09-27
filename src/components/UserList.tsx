import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface UserListProps {
  currentUserId: Id<"users">;
  selectedChat: any;
  setSelectedChat: (chat: any) => void;
}

export function UserList({ currentUserId, selectedChat, setSelectedChat }: UserListProps) {
  const onlineUsers = useQuery(api.users.getOnlineUsers);

  const otherUsers = onlineUsers?.filter(user => user._id !== currentUserId) || [];

  if (otherUsers.length === 0) {
    return (
      <div className="p-4 text-center text-discord-text">
        <p>No other users online</p>
        <p className="text-sm mt-1">Be the first to start chatting!</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      <div className="p-3 text-xs font-semibold text-discord-text uppercase tracking-wide">
        Online Users ({otherUsers.length})
      </div>
      {otherUsers.map((user) => {
        const chatId = `private_${currentUserId < user._id ? currentUserId : user._id}_${currentUserId < user._id ? user._id : currentUserId}`;
        const isSelected = selectedChat?.id === chatId;
        
        const isOnline = user.isOnline && (Date.now() - user.lastSeen) < 60000;

        return (
          <div
            key={user._id}
            onClick={() => {
              setSelectedChat({
                type: "private",
                id: chatId,
                name: user.username,
                otherUserId: user._id,
                isOnline: isOnline, // Changed
              });
            }}
            className={`p-3 border-b border-discord-border cursor-pointer hover:bg-discord-hover transition-colors ${
              isSelected ? "bg-discord-selected" : ""
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                  {user.username[0]?.toUpperCase()}
                </div>
                <div className={`status-indicator ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}>
                  {isOnline && <div className="pulse-ring"></div>}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{user.username}</h3>
                <div className={`text-sm flex items-center space-x-1 ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                  {!isOnline && (
                    <span className="text-xs text-discord-text">
                      • Last seen {Math.floor((Date.now() - user.lastSeen) / 60000)}m ago
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}