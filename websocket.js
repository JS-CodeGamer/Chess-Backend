const jwt = require("jsonwebtoken");
const ws = require("ws");

const room = require("./room");

async function handleConnection(client, req, server) {
  client.room = new room.model({
    user: req.user,
    id: req.url.searchParams.get("room_id"),
  });

  try {
    await room.join(req.url.searchParams.get("role"));
  } catch (err) {
    client.on("open", () => {
      client.send({ error: err.message });
      client.close();
    });
  }

  client.is_player = (await client.room.players).includes(req.user.username);
  client.is_creator = (await client.room.creator) === req.user.username;

  client.on("open", async () => {
    client.send({ info: "connected" });
    await client.room.join(server);
  });

  client.on("close", async () => {
    client.send({ info: "closing connection" });
    await room.model.leave(client.room, req.user);
  });

  client.on("message", async (message) => {
    if (message.chat) {
      server.clients.forEach((client) => {
        client.send({ chat: message.chat });
      });
    } else if (message.move && client.is_player) {
      server.clients.forEach((client) => {
        client.send({
          move: message.move,
          played_by: req.user.username,
        });
      });
    } else {
      client.send({ error: "invalid action" });
    }
  });
}

module.exports = { handleConnection };
