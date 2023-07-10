const uuid = require("uuid");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const db = require("../databases/redis");

class User {
  constructor({ username = null, ...data }) {
    this.username = username;
    this.data = { ...data };
  }

  async create() {
    if (username in process.env.RESERVED_USERNAMES.split(",")) {
      throw new Error(`username ${username} is reserved`);
    } else if (await db.exists(`user:${username}`)) {
      throw new Error(`username ${username} already exists`);
    }

    salt = crypto.randomBytes(16).toString("hex");

    await db
      .multi()
      .set(`user:${username}`, true)
      .set(`user:${username}:created_at`, Date.now())
      .set(`user:${username}:role`, this.data.role || "user")
      .sAdd(`user:${username}:rooms`, this.data.rooms || [])
      .set(`user:${username}:salt`, salt)
      .set(
        `user:${username}:hash`,
        crypto
          .pbkdf2Sync(this.data.password, this.data.salt, 1000, 64, `sha512`)
          .toString(`hex`)
      )
      .exec();

    this.data = {};
  }

  async createToken() {
    const hash = crypto
      .pbkdf2Sync(this.data.password, await this.salt, 1000, 64, `sha512`)
      .toString(`hex`);

    if (hash !== this.hash) throw new Error(`invalid credentials`);

    return jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });
  }

  async authenticate() {
    let decoded;
    try {
      decoded = jwt.verify(this.data.token, process.env.JWT_SECRET);
    } catch (err) {
      decoded = undefined;
    }
    this.data = {};

    let data = { username: null, role: "anonymous" };
    if (decoded) {
      data = {
        username: decoded.username,
      };
    }
    return new User(data);
  }

  async update() {
    if (this.data.role && this.data.by && this.data.by.role !== "admin")
      throw new Error(`only admins can change roles`);

    const fieldsNotAllowed = ["username", "created_at"];
    for (const field of fieldsNotAllowed) {
      delete this.data[field];
    }

    if (!(await this.exists)) {
      throw new Error(`username ${username} does not exist`);
    }

    if (this.data.password) {
      this.data.salt = crypto.randomBytes(16).toString("hex");
      await db
        .multi()
        .set(`user:${username}:salt`, salt)
        .set(
          `user:${username}:hash`,
          crypto
            .pbkdf2Sync(this.data.password, this.data.salt, 1000, 64, `sha512`)
            .toString(`hex`)
        )
        .exec();
    }

    if (this.data.rooms) {
      await db.sAdd(`user:${username}:rooms`, this.data.rooms);
    }
  }

  async destroy({ username }) {
    (await db.keys(`user:${username}*`)).forEach(
      async (key) => await db.del(key)
    );
  }
}

module.exports = User;
