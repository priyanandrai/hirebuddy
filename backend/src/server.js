import dotenv from "dotenv";
dotenv.config();
import http from "http";
import app from "./app.js";
import { initializeSocket } from "./config/socket.config.js";
import searchRoutes from './routes/search.routes.js';
import { createIndices } from './services/es.client.js';

const PORT = process.env.PORT || 8080;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket ready on ws://localhost:${PORT}`);
  try {
    // await createIndices();
    console.log('Elasticsearch indices checked/created');
  } catch (e) {
    console.warn('Failed to create/check ES indices on startup', e.message || e);
  }
});
