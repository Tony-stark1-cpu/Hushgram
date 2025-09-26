import { useState } from "react";
import { toast } from "sonner";

interface UsernameModalProps {
  onSubmit: (username: string) => Promise<void>;
}

export function UsernameModal({ onSubmit }: UsernameModalProps) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    if (username.length < 2 || username.length > 20) {
      toast.error("Username must be between 2 and 20 characters");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(username.trim());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10">
      <div className="glass-effect rounded-2xl p-8 w-full max-w-md mx-4 shadow-glow-lg fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow animate-pulse-slow">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            Welcome to Hushgram
          </h1>
          <p className="text-discord-text text-lg">Choose a temporary username to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username..."
              className="w-full px-6 py-4 bg-discord-dark/50 border-2 border-discord-border rounded-xl text-white placeholder-discord-text focus:border-purple-500 focus:outline-none focus:shadow-glow transition-all duration-300"
              maxLength={20}
              disabled={isLoading}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-discord-text">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
              isLoading || !username.trim()
                ? "bg-discord-border text-discord-text cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-glow hover:shadow-glow-lg hover:scale-105"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Joining...</span>
              </div>
            ) : (
              "Join Chat 🚀"
            )}
          </button>
        </form>

        <div className="mt-8 space-y-2 text-sm text-discord-text text-center">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>No registration required</span>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Username is temporary (session only)</span>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Private chats disappear when you leave</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
