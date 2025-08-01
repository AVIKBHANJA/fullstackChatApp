import { X, Video } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useVideoCallStore } from "../store/useVideoCallStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { startCall, isInCall } = useVideoCallStore();

  const handleVideoCall = () => {
    if (!isInCall && onlineUsers.includes(selectedUser._id)) {
      startCall(selectedUser);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Video call button */}
          <button
            onClick={handleVideoCall}
            disabled={!onlineUsers.includes(selectedUser._id) || isInCall}
            className="btn btn-ghost btn-circle disabled:opacity-50"
            title={
              !onlineUsers.includes(selectedUser._id)
                ? "User is offline"
                : isInCall
                ? "Already in a call"
                : "Start video call"
            }
          >
            <Video size={20} />
          </button>

          {/* Close button */}
          <button onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
