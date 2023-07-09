const uuid = require("uuid");
const crypto = require("crypto");

const db = require("../databases/redis");

async function createOrUpdate(
  username,
  { password = null, update = false, data = {} }
) {
  if (!update) {
    data.created_at = Date.now();
  }
  if (password) {
    data.salt = crypto.randomBytes(16).toString("hex");
    data.hash = crypto
      .pbkdf2Sync(password, this.salt, 1000, 64, `sha512`)
      .toString(`hex`);
  }
  data.updated_at = Date.now();

  await db.hSet(`user:${username}`, data);
}

async function get(username, password) {
  const user = await db.hGetAll(`user:${username}`);
  var hash = crypto
    .pbkdf2Sync(password, user.salt, 1000, 64, `sha512`)
    .toString(`hex`);
  if (hash == user.hash) return user;
  else return null;
}

async function createToken(user, password) {
  const user = await db.hGetAll(`user:${username}`);
  var hash = crypto
    .pbkdf2Sync(password, user.salt, 1000, 64, `sha512`)
    .toString(`hex`);
  if (hash == user.hash) return user;
  else return null;
}

module.exports = { createOrUpdate, get };
