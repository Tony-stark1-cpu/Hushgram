import { Id } from "../../convex/_generated/dataModel";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";

interface MobileViewProps {
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
  showChatList: boolean;
  setShowChatList: (show: boolean) => void;
}

export function MobileView({ 
  currentUserId, 
  selectedChat, 
  setSelectedChat, 
  showChatList, 
  setShowChatList 
}: MobileViewProps) {

  if (showChatList) {
    return (
      <div className="mobile-chat-container bg-gradient-to-br from-discord-dark via-discord-secondary to-discord-dark text-white">
        <div className="w-full h-full">
          <Sidebar
            currentUserId={currentUserId}
            selectedChat={selectedChat}
            setSelectedChat={(chat) => {
              setSelectedChat(chat);
              setShowChatList(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Mobile chat header with back button */}
      {selectedChat && (
        <div className="sticky top-0 z-10 bg-discord-secondary/90 backdrop-blur-md border-b border-discord-border flex-shrink-0">
          <div className="flex items-center p-4">
            <button
              onClick={() => setShowChatList(true)}
              className="mr-3 p-2 text-discord-text hover:text-white hover:bg-discord-hover rounded-full transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-3 flex-1">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-lg ${
                  selectedChat.type === "private" 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500" 
                    : "bg-gradient-to-r from-green-500 to-blue-500"
                }`}>
                  {selectedChat.type === "private" ? selectedChat.name[0]?.toUpperCase() : "#"}
                </div>
                {/* Status indicator dot has been removed */}
              </div>
              <div>
                <h2 className="font-semibold text-white">{selectedChat.name}</h2>
                {/* "Online/Offline" text has been removed */}
                <p className="text-sm text-discord-text">
                  {selectedChat.type === "private" 
                    ? "Private chat" 
                    : "Group chat"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 min-h-0">
        <ChatArea
          currentUserId={currentUserId}
          selectedChat={selectedChat}
          setSelectedChat={(chat) => {
            setSelectedChat(chat);
            if (!chat) {
              setShowChatList(true);
            }
          }}
          isMobile={true}
        />
      </div>

      {!selectedChat && (
        <button
          onClick={() => setShowChatList(true)}
          className="floating-action-btn"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
}