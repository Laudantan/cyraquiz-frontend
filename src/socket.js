import { io } from "socket.io-client";

export const socket = io("https://cyraquiz.onrender.com", {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

socket.on("connect", () => console.log("SOCKET CONNECT ✅", socket.id));
socket.on("connect_error", (err) =>
  console.log("SOCKET CONNECT_ERROR ❌", err.message)
);
socket.on("disconnect", (reason) =>
  console.log("SOCKET DISCONNECT ❌", reason)
);
