async function handleSockConnection(ws, request) {
  ws.on("open", async () => {
    ws.send({ info: "connected" });
  });

  ws.on("close", async () => {
    ws.send({ info: "closing connection" });
  });

  ws.on("message", async (message) => {
    if (message.session_id) {
      ws.session = await session.get(message.session_id);
    }

    if (!ws.session) ws.send({ error: "session not found" });

    if (message.chat_message) {
      wss.clients.forEach((client) => {
        if (client.session.room_id === ws.session.room_id)
          client.send({ chat_message: message.chat_message });
      });
    }

    if (sesion_info.is_player) {
      if (message.move) {
        wss.clients.forEach((client) => {
          if (client.session.room_id === ws.session.room_id)
            client.send({
              move: message.move,
              played_by: session_info.id,
            });
        });
      }
      ws.send({ error: "invalid action" });
    } else {
      ws.send({ error: "spectators can only send chat messages" });
    }
  });
}

module.exports = handleSockConnection;
