import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // Video call events - we'll import the store functions dynamically to avoid circular dependency
    socket.on("incoming-call", (data) => {
      console.log("Received incoming call:", data);
      import("./useVideoCallStore.js").then((module) => {
        module.useVideoCallStore.getState().setIncomingCall(data);
      });
    });

    socket.on("call-answered", (data) => {
      console.log("Call answered:", data);
      import("./useVideoCallStore.js").then((module) => {
        module.useVideoCallStore.getState().handleCallAnswered(data);
      });
    });

    socket.on("call-rejected", () => {
      console.log("Call rejected");
      import("./useVideoCallStore.js").then((module) => {
        module.useVideoCallStore.getState().handleCallRejected();
      });
    });

    socket.on("call-ended", () => {
      console.log("Call ended");
      import("./useVideoCallStore.js").then((module) => {
        module.useVideoCallStore.getState().handleCallEnded();
      });
    });

    socket.on("call-failed", (data) => {
      console.log("Call failed:", data);
      import("./useVideoCallStore.js").then((module) => {
        module.useVideoCallStore.getState().handleCallFailed(data);
      });
    });

    socket.on("ice-candidate", (data) => {
      console.log("Received ICE candidate:", data);
      import("./useVideoCallStore.js").then((module) => {
        module.useVideoCallStore.getState().handleIceCandidate(data);
      });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
