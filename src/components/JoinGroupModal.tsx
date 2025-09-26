import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface JoinGroupModalProps {
  group: {
    _id: Id<"groups">;
    name: string;
    description?: string;
    isPrivate: boolean;
    memberCount: number;
  };
  currentUserId: Id<"users">;
  onClose: () => void;
  onJoined: () => void;
}

export function JoinGroupModal({ group, currentUserId, onClose, onJoined }: JoinGroupModalProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const joinGroup = useMutation(api.groups.joinGroup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only require password if group is private
    if (group.isPrivate && !password.trim()) {
      toast.error("Please enter the group password");
      return;
    }

    setIsLoading(true);
    try {
      await joinGroup({
        groupId: group._id,
        userId: currentUserId,
        password: group.isPrivate ? password.trim() : undefined,
      });
      
      toast.success(`Joined ${group.name}!`);
      onJoined();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-effect rounded-2xl p-6 w-full max-w-md shadow-glow-lg fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Join Group</h2>
          <button
            onClick={onClose}
            className="p-2 text-discord-text hover:text-white hover:bg-discord-hover rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              #
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{group.name}</h3>
              <p className="text-sm text-discord-text">
                {group.memberCount} member{group.memberCount !== 1 ? 's' : ''} • {group.isPrivate ? 'Private' : 'Public'}
              </p>
            </div>
          </div>
          
          {group.description && (
            <p className="text-discord-text text-sm bg-discord-dark/50 p-3 rounded-lg">
              {group.description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {group.isPrivate && (
            <div>
              <label className="block text-sm font-medium text-discord-text mb-2">
                Group Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter group password..."
                className="w-full px-4 py-3 bg-discord-dark border border-discord-border rounded-lg text-white placeholder-discord-text focus:border-discord-accent focus:outline-none"
                disabled={isLoading}
                required
              />
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-discord-border text-discord-text rounded-lg hover:bg-discord-hover transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Joining..." : "Join Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
