const uuid = require("uuid");

const db = require("./databases/redis");

async function create() {
  const id = uuid.v4();
  await db.hSet(`session:${id}`, { created_at: Date.now() });

  return id;
}

async function get(id) {
  return await db.hGetAll(`session:${id}`);
}

module.exports = { create, get };
