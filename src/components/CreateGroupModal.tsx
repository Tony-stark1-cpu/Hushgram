import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface CreateGroupModalProps {
  currentUserId: Id<"users">;
  onClose: () => void;
}

export function CreateGroupModal({ currentUserId, onClose }: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createGroup = useMutation(api.groups.createGroup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (isPrivate && !password.trim()) {
      toast.error("Please enter a password for private group");
      return;
    }

    setIsLoading(true);
    try {
      await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
        password: isPrivate ? password.trim() : undefined,
        createdBy: currentUserId,
      });
      
      toast.success("Group created successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to create group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-discord-secondary rounded-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Create Group</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-discord-text mb-2">
                Group Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter group name..."
                className="w-full px-3 py-2 bg-discord-dark border border-discord-border rounded text-white placeholder-discord-text focus:border-discord-accent focus:outline-none"
                maxLength={50}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-discord-text mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your group..."
                className="w-full px-3 py-2 bg-discord-dark border border-discord-border rounded text-white placeholder-discord-text focus:border-discord-accent focus:outline-none resize-none"
                rows={3}
                maxLength={200}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 text-discord-accent bg-discord-dark border-discord-border rounded focus:ring-discord-accent"
                disabled={isLoading}
              />
              <label htmlFor="isPrivate" className="text-sm text-discord-text">
                Make this group private
              </label>
            </div>

            {isPrivate && (
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter group password..."
                  className="w-full px-3 py-2 bg-discord-dark border border-discord-border rounded text-white placeholder-discord-text focus:border-discord-accent focus:outline-none"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !name.trim() || (isPrivate && !password.trim())}
                className="flex-1 py-2 px-4 bg-discord-accent hover:bg-discord-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                {isLoading ? "Creating..." : "Create Group"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
