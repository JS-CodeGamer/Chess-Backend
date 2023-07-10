class AccessControlToRoom {
  constructor({ user, room_id, server }) {
    this.room = new Room({ user, id: room_id });
    this.server = server;
    this.creator_client = this.server.clients.filter(
      (client) => client.room.is_creator && client.room.id === this.room.id
    )[0];
  }

  // request : { sender, subject, description }
  async request(request) {
    creator_client.send({ request });
  }

  async respondToRequest(response, subject) {
    this.server.clients
      .filter(async (client) => (await client.room.user.id) === subject)[0]
      .send({ response });
  }

  async createListenerForRequests() {
    this.creator_client.on("message", async (message) => {
      if (message.request) {
        this.respondToRequest(message.request, message.request.sender);
      }
    });
  }
}
module.exports = {
  AccessControlToRoom,
};
