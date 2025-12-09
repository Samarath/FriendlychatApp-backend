const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const mainRoutes = require("./src/routes/mainRoutes");
const socketHandlers = require("./src/socketHandlers");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy header for accurate IP retrieval (Crucial for Vercel/proxies)
app.set("trust proxy", true);

//Middlewware
app.use(cors());
app.use(express.json());

// Creating HTTP Server from Express App
const server = http.createServer(app);

//attaching socket.io to the server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

socketHandlers(io);

// Routes
// All main routes will be handled here ( /register, /users)
app.use("/", mainRoutes);

//Start the server
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
  console.log(`Socket.IO listening on port ${PORT}`);
});
