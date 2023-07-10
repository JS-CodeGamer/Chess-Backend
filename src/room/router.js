const express = require("express");
const jwt = require("jsonwebtoken");

const Room = require("./model");

const router = express.Router();

router.get("/create", async (req, res) => {
  const room = new Room({ user: req.user });
  return res.json({ room_id: room.id });
});

router.get("/:id/destroy", async (req, res) => {
  if (!req.query.id)
    return res.status(400).json({ error: "room id is required" });

  const room = new Room({ id: req.query.id, user: req.user });

  try {
    await room.destroy();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(200);
});

module.exports = router;
