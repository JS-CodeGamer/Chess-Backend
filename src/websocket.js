const room = require("./room");

async function handleConnection(client, req, server) {
  client.room = new room.model({
    user: req.user,
    id: req.url.searchParams.get("room_id"),
  });

  client.send(JSON.stringify({ info: "connected" }));
  try {
    await client.room.join(req.url.searchParams.get("role") || "spectator");
  } catch (err) {
    client.send(JSON.stringify({ error: err.message }));
    client.close();
  }

  client.on("close", async () => {
    client.send(JSON.stringify({ info: "closing connection" }));
    await client.room.leave();
  });

  client.on("message", async (message) => {
    message = JSON.parse(message.toString());

    if (message.chat) {
      server.clients.forEach((c) => {
        if (c.room.id === client.room.id)
          c.send(JSON.stringify({ chat: message.chat }));
      });
    } else if (
      message.move &&
      (await client.room.players).includes(req.user.username)
    ) {
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
