import { useState } from "react";
import { useQuery, useMutation } from "convex/react"; // Import useMutation
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { UserList } from "./UserList";
import { GroupList } from "./GroupList";
import { ActiveChats } from "./ActiveChats";
import { CreateGroupModal } from "./CreateGroupModal";
import { UserProfileDropdown } from "./UserProfileDropdown";

interface SidebarProps {
  currentUserId: Id<"users">;
  selectedChat: {
    type: "private" | "group";
    id: string;
    name: string;
    otherUserId?: Id<"users">;
    groupId?: Id<"groups">;
  } | null;
  setSelectedChat: (chat: any) => void;
}

export function Sidebar({ currentUserId, selectedChat, setSelectedChat }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<"chats" | "users" | "groups">("chats");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser, 
    currentUserId ? { sessionId: localStorage.getItem("chat-session-id") || "" } : "skip"
  );
  
  // Get the logout mutation hook
  const logoutUser = useMutation(api.users.logoutUser);

  const activeChats = useQuery(api.messages.getActiveChats, 
    currentUserId ? { userId: currentUserId } : "skip"
  );

  const totalUnreadCount = activeChats?.reduce((total, chat) => total + (chat.unreadCount || 0), 0) || 0;

  const tabs = [
    { id: "chats", label: "Chats", icon: "💬", unreadCount: totalUnreadCount },
    { id: "users", label: "Users", icon: "👥" },
    { id: "groups", label: "Groups", icon: "🏢" },
  ];

  // Update the handleLogout function to be async and call the mutation
  const handleLogout = async () => {
    if (!currentUserId) return;
    
    try {
      // Call the backend mutation to delete all user data
      await logoutUser({ userId: currentUserId });
    } catch (error) {
      console.error("Failed to logout and delete user data:", error);
    } finally {
      // Always clear session and reload, even if the backend call fails
      localStorage.removeItem("chat-session-id");
      window.location.reload();
    }
  };

  return (
    <div className="w-full md:w-80 bg-discord-secondary/80 backdrop-blur-md border-r border-discord-border flex flex-col shadow-xl h-full">
      {/* Header */}
      <div className="p-4 border-b border-discord-border/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Hushgram
          </h1>
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2 glass-effect px-3 py-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-white font-medium">{currentUser?.username}</span>
              <svg className={`w-4 h-4 text-white transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showUserDropdown && (
              <UserProfileDropdown
                user={currentUser}
                onLogout={handleLogout}
                onClose={() => setShowUserDropdown(false)}
              />
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-discord-dark/50 rounded-xl p-1 backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-glow transform scale-105"
                  : "text-discord-text hover:text-white hover:bg-discord-hover/50"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === "chats" && totalUnreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-discord-danger text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "chats" && (
          <ActiveChats
            currentUserId={currentUserId}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
          />
        )}
        {activeTab === "users" && (
          <UserList
            currentUserId={currentUserId}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
          />
        )}
        {activeTab === "groups" && (
          <GroupList
            currentUserId={currentUserId}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            onCreateGroup={() => setShowCreateGroup(true)}
          />
        )}
      </div>

      {showCreateGroup && (
        <CreateGroupModal
          currentUserId={currentUserId}
          onClose={() => setShowCreateGroup(false)}
        />
      )}
    </div>
  );
}