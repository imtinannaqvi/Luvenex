

import { io } from "socket.io-client";

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNDM5OTc3NjAxOTExMWNhYjkzYTYyYSIsInJvbGUiOiJpbmZsdWVuY2VyIiwiaWF0IjoxNzgyOTA0NTQ0LCJleHAiOjE3ODI5MDU0NDR9.J4Sa6hDz5IF86YbUP0sq_ifSHt95dEieGdSDBdTZbuU";
const CONVO_ID = "6a44e96af2adeecae4b38045";

const socket = io("http://localhost:5000", {
  auth: { token: TOKEN },
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);

  // join the conversation room
  socket.emit("join_conversation", CONVO_ID);
  console.log("➡️  Joined conversation:", CONVO_ID);

  // send a test message after joining
  socket.emit(
    "send_message",
    { conversationId: CONVO_ID, body: "Hello from the Node test script!" },
    (response) => {
      console.log("✔️  Server ack:", response);
    }
  );
});

socket.on("new_message", (msg) => {
  console.log("📩 New message received:", msg);
});

socket.on("connect_error", (err) => {
  console.log("❌ Connection error:", err.message);
});

socket.on("disconnect", () => {
  console.log("🔌 Disconnected");
});