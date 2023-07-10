const uuid = require("uuid");

const db = require("../databases/redis");

class Room {
  constructor({ user, server, id = null }) {
    this.user = user;
    this.server = server;
    this._id = id || uuid.v4();
  }

  async create() {
    await db
      .multi()
      .set(`room:${this._id}`, true)
      .set(`room:${this._id}:creator`, await this.user.username)
      .set(`room:${this._id}:created_at`, Date.now())
      .sAdd(`room:${this._id}:participants`, await this.user.username)
      .sAdd(`room:${this._id}:players`, await this.user.username)
      .exec();
  }

  async join(role) {
    if (role === "player")
      if (db.sCard(`room:${this._id}:players`) === 1)
        await db.sAdd(`room:${this._id}:players`, await this.user.username);
      else throw Error("room is full, please join as a spectator");
    await db.sAdd(`room:${this._id}:participants`, await this.user.username);
  }

  async leave() {
    await db.sRem(`room:${this._id}:participants`, await this.user.username);
    await db.sRem(`room:${this._id}:players`, await this.user.username);
  }

  get id() {
    return this._id;
  }

  get exists() {
    return db.exists(`room:${this._id}`).then((exists) => exists === 1);
  }

  get participants() {
    return db
      .sMembers(`room:${this._id}:participants`)
      .then((participants) =>
        participants.map((participant) => ({ username: participant }))
      );
  }

  get players() {
    return db
      .sMembers(`room:${this._id}:participants`)
      .then((players) => players.map((player) => ({ username: player })));
  }

  get creator() {
    return db.get(`room:${this._id}:creator`).then((creator) => ({
      username: creator,
    }));
  }

  get created_at() {
    return db.get(`room:${this._id}:created_at`).then((created_at) => ({
      created_at: created_at,
    }));
  }

  async destroy() {
    if (this.creator() === (await this.user.username)) {
      await db
        .multi()
        .del(`room:${this._id}`)
        .del(`room:${this._id}:participants`)
        .del(`room:${this._id}:players`)
        .del(`room:${this._id}:creator`)
        .del(`room:${this._id}:created_at`)
        .exec();
    }
  }
}

module.exports = Room;
