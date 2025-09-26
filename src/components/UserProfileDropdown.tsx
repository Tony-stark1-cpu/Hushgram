import { Id } from "../../convex/_generated/dataModel";

interface UserProfileDropdownProps {
  user: {
    _id: Id<"users">;
    username: string;
    isOnline: boolean;
    lastSeen: number;
  } | null | undefined;
  onLogout: () => void;
  onClose: () => void;
}

export function UserProfileDropdown({ user, onLogout, onClose }: UserProfileDropdownProps) {
  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-2 w-64 bg-discord-secondary border border-discord-border rounded-lg shadow-xl z-50 overflow-hidden fade-in">
        {/* User Info */}
        <div className="p-4 border-b border-discord-border bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {user?.username?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="status-indicator bg-green-500">
                <div className="pulse-ring"></div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{user?.username || "Unknown"}</h3>
              {/* This is the corrected line */}
              <div className="text-sm text-green-400 flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="p-3 border-b border-discord-border">
          <div className="text-xs text-discord-text space-y-1">
            <div className="flex items-center justify-between">
              <span>Session ID:</span>
              <span className="font-mono text-xs bg-discord-dark px-2 py-1 rounded">
                {localStorage.getItem("chat-session-id")?.slice(-8) || "Unknown"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <span className="text-green-400">Temporary User</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-left text-discord-danger hover:bg-discord-danger/10 rounded-md transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <div>
              <div className="font-medium">Logout</div>
              <div className="text-xs text-discord-text">End session and clear data</div>
            </div>
          </button>
        </div>

        {/* Warning */}
        <div className="p-3 bg-discord-warning/10 border-t border-discord-border">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-discord-warning mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-xs text-discord-text">
              <div className="font-medium text-discord-warning mb-1">Warning</div>
              <div>Logging out will permanently delete all your chats and data. This action cannot be undone.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}