import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from "lucide-react";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useAuthStore } from "../store/useAuthStore";

const VideoCallModal = () => {
  const {
    isCallModalOpen,
    currentCall,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    endCall,
  } = useVideoCallStore();

  const { authUser } = useAuthStore();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log("Local stream set:", localStream);
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log("Remote stream set:", remoteStream);
    }
  }, [remoteStream]);

  if (!isCallModalOpen || !currentCall) return null;

  const isConnected = currentCall.status === "connected";

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 text-white">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-8 h-8 rounded-full">
              <img
                src={currentCall.targetUser.profilePic || "/avatar.png"}
                alt={currentCall.targetUser.fullName}
              />
            </div>
          </div>
          <div>
            <h3 className="font-medium">{currentCall.targetUser.fullName}</h3>
            <p className="text-sm text-white/70">
              {isConnected ? "Connected" : "Calling..."}
            </p>
          </div>
        </div>
        <button
          onClick={endCall}
          className="btn btn-ghost btn-circle text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Remote Video Placeholder */}
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <div className="avatar mb-4">
                <div className="w-32 h-32 rounded-full">
                  <img
                    src={currentCall.targetUser.profilePic || "/avatar.png"}
                    alt={currentCall.targetUser.fullName}
                  />
                </div>
              </div>
              <p className="text-lg">{currentCall.targetUser.fullName}</p>
              <p className="text-white/70">
                {isConnected ? "Camera is off" : "Connecting..."}
              </p>
              {!isConnected && (
                <div className="mt-4">
                  <div className="animate-pulse flex justify-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Local Video */}
        <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
          {isVideoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="avatar">
                <div className="w-12 h-12 rounded-full">
                  <img
                    src={authUser.profilePic || "/avatar.png"}
                    alt={authUser.fullName}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="p-6 bg-black/20">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleAudio}
            className={`btn btn-circle btn-lg ${
              isAudioEnabled ? "btn-ghost text-white" : "btn-error"
            }`}
          >
            {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
          </button>

          <button onClick={endCall} className="btn btn-error btn-circle btn-lg">
            <PhoneOff size={24} />
          </button>

          <button
            onClick={toggleVideo}
            className={`btn btn-circle btn-lg ${
              isVideoEnabled ? "btn-ghost text-white" : "btn-error"
            }`}
          >
            {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
