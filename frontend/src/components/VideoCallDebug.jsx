import { useVideoCallStore } from "../store/useVideoCallStore";

const VideoCallDebug = () => {
  const { currentCall, localStream, remoteStream, peerConnection, isInCall } =
    useVideoCallStore();

  if (!isInCall) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm overflow-y-auto max-h-96">
      <h4 className="font-bold mb-2">Video Call Debug Info</h4>
      <div className="space-y-1">
        <p>Call Status: {currentCall?.status || "No call"}</p>
        <p>Call Type: {currentCall?.type || "Unknown"}</p>
        <p>Call ID: {currentCall?.callId || "No ID"}</p>
        <p>Local Stream: {localStream ? "✅ Active" : "❌ None"}</p>
        <p>Remote Stream: {remoteStream ? "✅ Active" : "❌ None"}</p>
        <p>Peer Connection: {peerConnection ? "✅ Created" : "❌ None"}</p>
        {peerConnection && (
          <>
            <p>Connection State: {peerConnection.connectionState}</p>
            <p>ICE State: {peerConnection.iceConnectionState}</p>
            <p>Signaling State: {peerConnection.signalingState}</p>
            <p>
              Local Description:{" "}
              {peerConnection.localDescription ? "✅ Set" : "❌ None"}
            </p>
            <p>
              Remote Description:{" "}
              {peerConnection.remoteDescription ? "✅ Set" : "❌ None"}
            </p>
          </>
        )}
        {localStream && (
          <div>
            <p>
              Local Tracks: Video({localStream.getVideoTracks().length}) Audio(
              {localStream.getAudioTracks().length})
            </p>
            {localStream.getVideoTracks().map((track, index) => (
              <p key={index}>
                Video {index}: {track.enabled ? "Enabled" : "Disabled"}
              </p>
            ))}
            {localStream.getAudioTracks().map((track, index) => (
              <p key={index}>
                Audio {index}: {track.enabled ? "Enabled" : "Disabled"}
              </p>
            ))}
          </div>
        )}
        {remoteStream && (
          <div>
            <p>
              Remote Tracks: Video({remoteStream.getVideoTracks().length})
              Audio({remoteStream.getAudioTracks().length})
            </p>
            {remoteStream.getVideoTracks().map((track, index) => (
              <p key={index}>
                Remote Video {index}: {track.enabled ? "Enabled" : "Disabled"}
              </p>
            ))}
            {remoteStream.getAudioTracks().map((track, index) => (
              <p key={index}>
                Remote Audio {index}: {track.enabled ? "Enabled" : "Disabled"}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallDebug;
