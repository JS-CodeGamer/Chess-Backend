const room = require("./room");

async function handleConnection(client, req, server) {
  client.room = new room.model({
    user: req.user,
    id: req.url.searchParams.get("room_id"),
  });

  try {
    await room.join(req.url.searchParams.get("role") || "spectator");
  } catch (err) {
    client.on("open", () => {
      client.send(JSON.stringify({ error: err.message }));
      client.close();
    });
  }

  client.is_player = (await client.room.players).includes(req.user.username);
  client.is_creator = (await client.room.creator) === req.user.username;

  client.on("open", async () => {
    client.send(JSON.stringify({ info: "connected" }));
    await client.room.join(server);
  });

  client.on("close", async () => {
    client.send(JSON.stringify({ info: "closing connection" }));
    await room.model.leave(client.room, req.user);
  });

  client.on("message", async (message) => {
    message = JSON.parse(message.toString());

    if (message.chat) {
      server.clients.forEach((c) => {
        if (c.room.id === client.room.id)
          c.send(JSON.stringify({ chat: message.chat }));
      });
    } else if (message.move && client.is_player) {
      server.clients.forEach((c) => {
        if (c.room.id === client.room.id)
          c.send(
            JSON.stringify({
              move: message.move,
              played_by: req.user.username,
            })
          );
      });
    } else {
      client.send(JSON.stringify({ error: "invalid action" }));
    }
  });
}

module.exports = { handleConnection };
