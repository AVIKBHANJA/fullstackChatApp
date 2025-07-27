import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://fullstack-chat-app-alpha-three.vercel.app",
    ],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}
// store active video calls
const activeCalls = {}; // {callId: {caller: socketId, callee: socketId, status: 'ringing'|'connected'}}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Video call events
  socket.on("call-user", ({ targetUserId, callerInfo, offer }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      const callId = `${userId}-${targetUserId}-${Date.now()}`;
      activeCalls[callId] = {
        caller: socket.id,
        callee: targetSocketId,
        status: "ringing",
      };

      io.to(targetSocketId).emit("incoming-call", {
        callId,
        callerInfo,
        offer,
      });
    } else {
      socket.emit("call-failed", { message: "User is not online" });
    }
  });

  socket.on("answer-call", ({ callId, answer }) => {
    const call = activeCalls[callId];
    if (call && call.callee === socket.id) {
      call.status = "connected";
      io.to(call.caller).emit("call-answered", { callId, answer });
    }
  });

  socket.on("reject-call", ({ callId }) => {
    const call = activeCalls[callId];
    if (call) {
      io.to(call.caller).emit("call-rejected", { callId });
      delete activeCalls[callId];
    }
  });

  socket.on("end-call", ({ callId }) => {
    const call = activeCalls[callId];
    if (call) {
      // Notify both parties that the call has ended
      io.to(call.caller).emit("call-ended", { callId });
      io.to(call.callee).emit("call-ended", { callId });
      delete activeCalls[callId];
    }
  });

  socket.on("ice-candidate", ({ callId, candidate }) => {
    const call = activeCalls[callId];
    if (call) {
      const targetSocket =
        socket.id === call.caller ? call.callee : call.caller;
      io.to(targetSocket).emit("ice-candidate", { callId, candidate });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);

    // End any active calls for this user
    Object.keys(activeCalls).forEach((callId) => {
      const call = activeCalls[callId];
      if (call.caller === socket.id || call.callee === socket.id) {
        const otherSocket =
          call.caller === socket.id ? call.callee : call.caller;
        io.to(otherSocket).emit("call-ended", {
          callId,
          reason: "User disconnected",
        });
        delete activeCalls[callId];
      }
    });

    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
