import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { JoinGroupModal } from "./JoinGroupModal";
import { useState } from "react";

interface GroupListProps {
  currentUserId: Id<"users">;
  selectedChat: any;
  setSelectedChat: (chat: any) => void;
  onCreateGroup: () => void;
}

export function GroupList({ currentUserId, selectedChat, setSelectedChat, onCreateGroup }: GroupListProps) {
  const publicGroups = useQuery(api.groups.getPublicGroups);
  const userGroups = useQuery(api.groups.getUserGroups, { userId: currentUserId });
  const [showJoinModal, setShowJoinModal] = useState<Id<"groups"> | null>(null);

  const userGroupIds = new Set(userGroups?.map(g => g._id) || []);
  const availableGroups = publicGroups?.filter(g => !userGroupIds.has(g._id)) || [];

  return (
    <div className="overflow-y-auto">
      {/* Create Group Button */}
      <div className="p-3 border-b border-discord-border">
        <button
          onClick={onCreateGroup}
          className="w-full py-2 px-3 bg-discord-accent hover:bg-discord-accent-hover text-white rounded-md transition-colors text-sm font-medium"
        >
          + Create Group
        </button>
      </div>

      {/* User's Groups */}
      {userGroups && userGroups.length > 0 && (
        <div>
          <div className="p-3 text-xs font-semibold text-discord-text uppercase tracking-wide">
            My Groups ({userGroups.length})
          </div>
          {userGroups.map((group) => {
            const chatId = `group_${group._id}`;
            const isSelected = selectedChat?.id === chatId;

            return (
              <div
                key={group._id}
                onClick={() => {
                  setSelectedChat({
                    type: "group",
                    id: chatId,
                    name: group.name,
                    groupId: group._id,
                  });
                }}
                className={`p-3 border-b border-discord-border cursor-pointer hover:bg-discord-hover transition-colors ${
                  isSelected ? "bg-discord-selected" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                    #
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{group.name}</h3>
                    <p className="text-sm text-discord-text">
                      {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                      {group.isPrivate && " • Private"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Available Public Groups */}
      {availableGroups.length > 0 && (
        <div>
          <div className="p-3 text-xs font-semibold text-discord-text uppercase tracking-wide">
            Public Groups ({availableGroups.length})
          </div>
          {availableGroups.map((group) => (
            <div
              key={group._id}
              onClick={() => setShowJoinModal(group._id)}
              className="p-3 border-b border-discord-border cursor-pointer hover:bg-discord-hover transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                  #
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{group.name}</h3>
                  <p className="text-sm text-discord-text">
                    {group.memberCount} member{group.memberCount !== 1 ? 's' : ''} • Click to join
                  </p>
                  {group.description && (
                    <p className="text-xs text-discord-text truncate mt-1">{group.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {availableGroups.length === 0 && (!userGroups || userGroups.length === 0) && (
        <div className="p-4 text-center text-discord-text">
          <p>No groups available</p>
          <p className="text-sm mt-1">Create the first group!</p>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <JoinGroupModal
          group={publicGroups?.find(g => g._id === showJoinModal)!}
          currentUserId={currentUserId}
          onClose={() => setShowJoinModal(null)}
          onJoined={() => {
            // Refresh the groups list after joining
            setShowJoinModal(null);
          }}
        />
      )}
    </div>
  );
}
