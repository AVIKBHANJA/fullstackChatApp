import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useVideoCallStore = create((set, get) => ({
  // Call states
  isInCall: false,
  incomingCall: null,
  currentCall: null,
  localStream: null,
  remoteStream: null,
  peerConnection: null,

  // UI states
  isVideoEnabled: true,
  isAudioEnabled: true,
  isCallModalOpen: false,

  // Initialize peer connection
  initializePeerConnection: () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const { currentCall } = get();
        if (currentCall && currentCall.callId) {
          const socket = useAuthStore.getState().socket;
          console.log("Sending ICE candidate:", event.candidate);
          socket.emit("ice-candidate", {
            callId: currentCall.callId,
            candidate: event.candidate,
          });
        }
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote stream:", event.streams[0]);
      const [remoteStream] = event.streams;
      set({ remoteStream });
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state changed:", pc.connectionState);
      if (pc.connectionState === "failed") {
        toast.error("Call connection failed");
        get().endCall();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state changed:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        toast.error("Network connection failed");
        get().endCall();
      }
    };

    set({ peerConnection: pc });
    return pc;
  },

  // Start video call
  startCall: async (targetUser) => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      set({ localStream, isCallModalOpen: true });

      const pc = get().initializePeerConnection();

      // Add local stream tracks to peer connection
      localStream.getTracks().forEach((track) => {
        console.log("Adding local track:", track.kind);
        pc.addTrack(track, localStream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const socket = useAuthStore.getState().socket;
      const { authUser } = useAuthStore.getState();

      console.log("Sending call offer to:", targetUser.fullName);

      socket.emit("call-user", {
        targetUserId: targetUser._id,
        callerInfo: {
          _id: authUser._id,
          fullName: authUser.fullName,
          profilePic: authUser.profilePic,
        },
        offer,
      });

      set({
        currentCall: {
          targetUser,
          type: "outgoing",
          status: "calling",
          callId: null, // Will be set when call is answered
        },
        isInCall: true,
      });
    } catch (error) {
      console.error("Error starting call:", error);
      toast.error(
        "Failed to start call. Please check your camera and microphone permissions."
      );
    }
  },

  // Answer incoming call
  answerCall: async () => {
    try {
      const { incomingCall } = get();
      if (!incomingCall) return;

      console.log("Answering call from:", incomingCall.callerInfo.fullName);

      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      set({ localStream, isCallModalOpen: true });

      const pc = get().initializePeerConnection();

      // Add local stream tracks to peer connection
      localStream.getTracks().forEach((track) => {
        console.log("Adding local track:", track.kind);
        pc.addTrack(track, localStream);
      });

      // Set remote description first
      await pc.setRemoteDescription(incomingCall.offer);

      // Create and set local description
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = useAuthStore.getState().socket;
      socket.emit("answer-call", {
        callId: incomingCall.callId,
        answer,
      });

      set({
        currentCall: {
          targetUser: incomingCall.callerInfo,
          type: "incoming",
          status: "connected",
          callId: incomingCall.callId,
        },
        incomingCall: null,
        isInCall: true,
      });
    } catch (error) {
      console.error("Error answering call:", error);
      toast.error(
        "Failed to answer call. Please check your camera and microphone permissions."
      );
    }
  },

  // Reject incoming call
  rejectCall: () => {
    const { incomingCall } = get();
    if (!incomingCall) return;

    const socket = useAuthStore.getState().socket;
    socket.emit("reject-call", { callId: incomingCall.callId });
    set({ incomingCall: null });
  },

  // End call
  endCall: () => {
    const { currentCall, localStream, peerConnection } = get();

    console.log("Ending call");

    if (currentCall && currentCall.callId) {
      const socket = useAuthStore.getState().socket;
      socket.emit("end-call", { callId: currentCall.callId });
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
        console.log("Stopped local track:", track.kind);
      });
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      console.log("Closed peer connection");
    }

    set({
      isInCall: false,
      currentCall: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isCallModalOpen: false,
      isVideoEnabled: true,
      isAudioEnabled: true,
    });
  },

  // Toggle video
  toggleVideo: () => {
    const { localStream, isVideoEnabled } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        set({ isVideoEnabled: !isVideoEnabled });
      }
    }
  },

  // Toggle audio
  toggleAudio: () => {
    const { localStream, isAudioEnabled } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        set({ isAudioEnabled: !isAudioEnabled });
      }
    }
  },

  // Handle incoming call
  setIncomingCall: (callData) => {
    set({ incomingCall: callData });
  },

  // Handle call answered
  handleCallAnswered: async (data) => {
    const { peerConnection, currentCall } = get();
    if (peerConnection && currentCall) {
      try {
        console.log("Call answered, setting remote description");
        await peerConnection.setRemoteDescription(data.answer);

        set({
          currentCall: {
            ...currentCall,
            status: "connected",
            callId: data.callId,
          },
        });
      } catch (error) {
        console.error("Error handling call answered:", error);
        toast.error("Failed to establish call connection");
      }
    }
  },

  // Handle ICE candidate
  handleIceCandidate: async (data) => {
    const { peerConnection } = get();
    if (peerConnection && peerConnection.remoteDescription) {
      try {
        console.log("Adding ICE candidate");
        await peerConnection.addIceCandidate(data.candidate);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    } else {
      console.log("Received ICE candidate but peer connection not ready");
    }
  },

  // Handle call ended
  handleCallEnded: () => {
    get().endCall();
    toast.info("Call ended");
  },

  // Handle call rejected
  handleCallRejected: () => {
    get().endCall();
    toast.info("Call was rejected");
  },

  // Handle call failed
  handleCallFailed: (data) => {
    get().endCall();
    toast.error(data.message || "Call failed");
  },
}));
