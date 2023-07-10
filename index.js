require("dotenv").config();

const express = require("express");
const ws = require("ws");
const http = require("http");
const url = require("url");

const db = require("./databases/redis");
const websocket = require("./websocket");
const user = require("./user");
const room = require("./room");

const app = express();
const server = http.createServer(app);
const wss = new ws.Server({ noServer: true });

const port = process.env.PORT || 3000;

app.use(express.json());

app.use(user.router);
app.use("/room", room.router);

// assume url of form /:room_id
wss.on("connection", websocket.handleConnection);

db.connect().then(() => {
  server.listen(port, () => console.log(`Server running on port ${port}`));
});

server.on("upgrade", (request, socket, head) => {
  request.url = new URL(request.url, `http://${request.headers.host}`);
  try {
    request.user = user.model.authenticate(
      request.url.searchParams.get("token")
    );
  } catch (err) {
    console.log(err.message);
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (client) => {
    wss.emit("connection", client, request, socket);
  });
});
