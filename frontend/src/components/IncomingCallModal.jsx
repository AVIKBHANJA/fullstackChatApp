import { Phone, PhoneOff } from "lucide-react";
import { useVideoCallStore } from "../store/useVideoCallStore";

const IncomingCallModal = () => {
  const { incomingCall, answerCall, rejectCall } = useVideoCallStore();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 max-w-sm w-full mx-4 text-center">
        <div className="mb-4">
          <div className="avatar mb-4">
            <div className="w-20 h-20 rounded-full">
              <img
                src={incomingCall.callerInfo.profilePic || "/avatar.png"}
                alt={incomingCall.callerInfo.fullName}
              />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {incomingCall.callerInfo.fullName}
          </h3>
          <p className="text-base-content/70">Incoming video call...</p>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={answerCall}
            className="btn btn-success btn-circle btn-lg"
          >
            <Phone size={24} />
          </button>
          <button
            onClick={rejectCall}
            className="btn btn-error btn-circle btn-lg"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
