require("dotenv").config();

const express = require("express");
const ws = require("ws");
const http = require("http");
const url = require("url");

const db = require("../databases/redis");
const websocket = require("./websocket");
const user = require("./user");
const room = require("./room");

const app = express();
const server = http.createServer(app);
const wsServer = new ws.Server({ noServer: true });

const port = process.env.PORT || 3000;

app.use(express.json());

app.use(user.router);
app.use("/room", room.router);

// assume url of form /:room_id
wsServer.on("connection", websocket.handleConnection);

db.connect().then(() => {
  server.listen(port, () => console.log(`Server running on port ${port}`));
});

server.on("upgrade", (request, socket, head) => {
  request.url = new URL(request.url, `http://${request.headers.host}`);
  try {
    request.user = new user.model({
      token: request.url.searchParams.get("token"),
    }).authenticate();
  } catch (err) {
    console.log(err.message);
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }
  wsServer.handleUpgrade(request, socket, head, (client, request) => {
    wsServer.emit("connection", client, request, wsServer);
  });
});
