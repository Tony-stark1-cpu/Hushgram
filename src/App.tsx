import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { UsernameModal } from "./components/UsernameModal";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { MobileView } from "./components/MobileView";
import { useSessionId } from "./hooks/useSessionId";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  const sessionId = useSessionId();
  const [username, setUsername] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<Id<"users"> | null>(null);
  const [selectedChat, setSelectedChat] = useState<{
    type: "private" | "group";
    id: string;
    name: string;
    otherUserId?: Id<"users">;
    groupId?: Id<"groups">;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatList, setShowChatList] = useState(true);

  const createUser = useMutation(api.users.createUser);
  const currentUser = useQuery(api.users.getCurrentUser, 
    sessionId ? { sessionId } : "skip"
  );
  const updateOnlineStatus = useMutation(api.users.updateOnlineStatus);
  const cleanupTypingIndicators = useMutation(api.messages.cleanupTypingIndicators);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Set current user ID when user data is available
  useEffect(() => {
    if (currentUser) {
      setCurrentUserId(currentUser._id);
      setUsername(currentUser.username);
    }
  }, [currentUser]);

  // Handle username submission
  const handleUsernameSubmit = async (newUsername: string) => {
    if (!sessionId) return;
    
    try {
      const userId = await createUser({ username: newUsername, sessionId });
      setCurrentUserId(userId);
      setUsername(newUsername);
    } catch (error) {
      throw error;
    }
  };

  // Update online status periodically and cleanup
  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(() => {
      updateOnlineStatus({ userId: currentUserId, isOnline: true });
      cleanupTypingIndicators();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [currentUserId, updateOnlineStatus, cleanupTypingIndicators]);

  // Handle beforeunload and visibility change to mark user offline
  useEffect(() => {
    if (!currentUserId) return;

    const handleBeforeUnload = () => {
      updateOnlineStatus({ userId: currentUserId, isOnline: false });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateOnlineStatus({ userId: currentUserId, isOnline: false });
      } else {
        updateOnlineStatus({ userId: currentUserId, isOnline: true });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUserId, updateOnlineStatus]);

  if (!sessionId || !currentUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-discord-dark via-discord-secondary to-discord-dark flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
        <UsernameModal onSubmit={handleUsernameSubmit} />
        <Toaster 
          theme="dark" 
          position="top-center"
          toastOptions={{
            style: {
              background: '#36393f',
              color: '#ffffff',
              border: '1px solid #40444b',
            },
          }}
        />
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        <MobileView
          currentUserId={currentUserId}
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
          showChatList={showChatList}
          setShowChatList={setShowChatList}
        />
        <Toaster 
          theme="dark" 
          position="top-center"
          toastOptions={{
            style: {
              background: '#36393f',
              color: '#ffffff',
              border: '1px solid #40444b',
            },
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-discord-dark via-discord-secondary to-discord-dark text-white flex">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 pointer-events-none"></div>
      <Sidebar
        currentUserId={currentUserId}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
      />
      <ChatArea
        currentUserId={currentUserId}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
      />
      <Toaster 
        theme="dark" 
        position="top-center"
        toastOptions={{
          style: {
            background: '#36393f',
            color: '#ffffff',
            border: '1px solid #40444b',
          },
        }}
      />
    </div>
  );
}
