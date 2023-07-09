const uuid = require("uuid");

const db = require("./databases/redis");

async function create({ participants = [] }) {
  const id = uuid.v4();
  await db.hSet(`room:${room_id}`, { created_at: Date.now(), participants });

  return room_id;
}

async function getParticipants(id) {
  return await db.hGet(`room:${id}`, "participants");
}

async function get(id) {
  return await db.hGetAll(`room:${id}`);
}

module.exports = { create, get, getParticipants };
