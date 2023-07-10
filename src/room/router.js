const express = require("express");
const jwt = require("jsonwebtoken");

const Room = require("./model");

const router = express.Router();

router.get("/create", async (req, res) => {
  try {
    new Room({ user: req.user }).create();
    return res.status(200).json({ succes: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get("/:id/destroy", async (req, res) => {
  if (!req.params.id)
    return res.status(400).json({ error: "room id is required" });

  const room = new Room({ id: req.params.id, user: req.user });

  try {
    await room.destroy();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(200).json({ success: true });
});

module.exports = router;
