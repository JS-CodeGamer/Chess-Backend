const uuid = require("uuid");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const db = require("../../databases/redis");

class User {
  constructor({ username = null, ...data }) {
    this._username = username;
    this._data = { ...data };
  }

  async exists() {
    return await db.keys(`user:${this.username}*`);
  }

  get username() {
    return this._username;
  }

  get data() {
    return this._data;
  }

  set data(data) {
    this._data = data;
  }

  get created_at() {
    return db.get(`user:${this.username}:created_at`);
  }

  get role() {
    return db.get(`user:${this.username}:role`);
  }

  get rooms() {
    return db.sMembers(`user:${this.username}:rooms`) || [];
  }

  async join(room_id) {
    db.sAdd(`user:${this.username}:rooms`, room_id);
  }

  get salt() {
    return db.get(`user:${this.username}:salt`);
  }

  get hash() {
    return db.get(`user:${this.username}:hash`);
  }

  async create() {
    if (this.username in process.env.RESERVED_USERNAMES.split(",")) {
      throw new Error(`username ${this.username} is reserved`);
    } else if (await this.exists()) {
      throw new Error(`username ${this.username} already exists`);
    }

    const salt = crypto.randomBytes(16).toString("hex");

    await db
      .multi()
      .sAdd(`users`, this.username)
      .set(`user:${this.username}:created_at`, Date.now())
      .set(`user:${this.username}:role`, this._data.role || "user")
      .set(`user:${this.username}:salt`, salt)
      .set(
        `user:${this.username}:hash`,
        crypto
          .pbkdf2Sync(this._data.password, salt, 1000, 64, `sha512`)
          .toString(`hex`)
      )
      .exec();

    this._data = {};
  }

  async createToken() {
    const hash = crypto
      .pbkdf2Sync(this._data.password, await this.salt, 1000, 64, `sha512`)
      .toString(`hex`);

    if (hash !== (await this.hash)) throw new Error(`invalid credentials`);

    return jwt.sign({ username: this.username }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });
  }

  async authenticate() {
    let decoded;
    try {
      decoded = jwt.verify(this._data.token, process.env.JWT_SECRET);
    } catch (err) {
      decoded = undefined;
    }
    this._data = {};

    let data = { username: null, role: "anonymous" };
    if (decoded) {
      data = {
        username: decoded.username,
      };
    }
    return new User(data);
  }

  async update() {
    if (this._data.role && this._data.by && this._data.by.role !== "admin")
      throw new Error(`only admins can change roles`);

    const fieldsNotAllowed = ["username", "created_at"];
    for (const field of fieldsNotAllowed) {
      delete this._data[field];
    }

    if (!(await this.exists)) {
      throw new Error(`username ${this.username} does not exist`);
    }

    if (this._data.password) {
      this._data.salt = crypto.randomBytes(16).toString("hex");
      await db
        .multi()
        .set(`user:${this.username}:salt`, salt)
        .set(
          `user:${this.username}:hash`,
          crypto
            .pbkdf2Sync(
              this._data.password,
              this._data.salt,
              1000,
              64,
              `sha512`
            )
            .toString(`hex`)
        )
        .exec();
    }

    if (this._data.rooms) {
      await db.sAdd(`user:${username}:rooms`, this._data.rooms);
    }
  }

  async destroy({ username }) {
    (await db.keys(`user:${username}*`)).forEach(
      async (key) => await db.del(key)
    );
  }
}

module.exports = User;
