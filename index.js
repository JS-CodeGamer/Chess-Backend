require("dotenv").config();
const express = require("express");
const ws = require("ws");
const http = require("http");
const db = require("./databases/redis");
const handleSockConnection = require("./websocket");

const app = express();
const server = http.createServer(app);
const wss = new ws.Server({ noServer: true });

const port = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  next();
});

wss.on("connection", handleSockConnection);

db.connect().then(() => {
  server.listen(port, () => console.log(`Server running on port ${port}`));
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit("connection", socket, request);
  });
});
