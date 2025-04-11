const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const env = require("./src/config/env");
const socketHandler = require("./src/socket/socketEvents");
const displayMediaController = require("./src/controllers/displayMediaController"); 

const PORT = env.server.port;

// Create HTTP Server
const server = http.createServer(app);

// Initialize WebSockets
const io = new Server(server, {
  cors: { origin: env.client.url, credentials: true },
});

// Pass WebSocket instance to event handler
socketHandler(io);

// Pass `io` to controllers that need real-time updates
displayMediaController.setSocketIo(io);

module.exports = { server, io };

// Start the Server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}, accessible via LAN`);
});
