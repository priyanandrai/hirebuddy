import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import { initializeSocket } from "./config/socket.config.js";

dotenv.config();

const PORT = process.env.PORT || 8080;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket ready on ws://localhost:${PORT}`);
});
