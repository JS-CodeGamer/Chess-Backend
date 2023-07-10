const uuid = require("uuid");

const db = require("../../databases/redis");

class Room {
  constructor({ user, server, id = null }) {
    this.user = user;
    this.server = server;
    this._id = id || user.username;
  }

  async create() {
    await db
      .multi()
      .set(`room:${this._id}`, 1)
      .set(`room:${this._id}:created_at`, Date.now())
      .sAdd(`room:${this._id}:participants`, this.user.username)
      .sAdd(`room:${this._id}:players`, this.user.username)
      .exec();
  }

  async join(role) {
    if ((await this.participants).includes(this.user.username)) return;

    if (role === "player") {
      if ((await db.sCard(`room:${this._id}:players`)) === 1) {
        await db.sAdd(`room:${this._id}:players`, this.user.username);
      } else throw Error("room is full, please join as a spectator");
    }
    await db.sAdd(`room:${this._id}:participants`, this.user.username);

    await this.user.join(this._id);
  }

  async leave() {
    if (this._id === this.user.username) await this.destroy();
    else {
      await db.sRem(`room:${this._id}:participants`, this.user.username);
      await db.sRem(`room:${this._id}:players`, this.user.username);
    }
  }

  get id() {
    return this._id;
  }

  get exists() {
    return db.exists(`room:${this._id}`);
  }

  get participants() {
    return db.sMembers(`room:${this._id}:participants`);
  }

  get players() {
    return db.sMembers(`room:${this._id}:players`);
  }

  get created_at() {
    return db.get(`room:${this._id}:created_at`).then((created_at) => ({
      created_at: created_at,
    }));
  }

  async leave() {
    if (this._id === this.user.username) {
      await this.destroy();
      return;
    }
    await db.sRem(`room:${this._id}:participants`, this.user.username);
    if ((await this.players).includes(this.user.username))
      await db.sRem(`room:${this._id}:players`, this.user.username);
  }

  async destroy() {
    if (!(await this.exists)) throw new Error("Room does not exist");
    if (this.id !== this.user.username)
      throw new Error("You are not the creator of this room");
    await db
      .multi()
      .del(`room:${this._id}`)
      .del(`room:${this._id}:participants`)
      .del(`room:${this._id}:players`)
      .del(`room:${this._id}:created_at`)
      .exec();
  }
}

module.exports = Room;
