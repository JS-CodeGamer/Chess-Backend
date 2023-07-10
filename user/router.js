const express = require("express");

const model = require("./model");

const router = express.Router();

router.post("/register", async (req, res) => {
  const required = ["username", "password", "confirm_password"];
  for (let param of required)
    if (!(req.body[param] || false))
      return res.status(400).json({ error: `${param} is required` });

  const username = req.body["username"];
  const password = req.body["password"];
  const confirm_password = req.body["confirm_password"];

  if (typeof password !== "string")
    return res.status(400).json({ error: `password fields must be string` });
  if (password !== confirm_password)
    return res.status(400).json({ error: `password fields do not match` });

  try {
    await new model({ username, password }).create();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  return res.json({ info: "registered" });
});

router.post("/signin", async (req, res) => {
  const required = ["username", "password"];
  for (let param of required)
    if (!(req.body[param] || false))
      return res.status(400).json({ error: `${param} is required` });

  const username = req.body["username"];
  const password = req.body["password"];

  let token;
  try {
    token = await new model({ username, password }).createToken();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  return res.json({ token });
});

router.use(async (req, res, next) => {
  req.user = await new model({
    token: req.headers.authorization && req.headers.authorization.split(" ")[1],
  }).authenticate();
  next();
});

router.get("/me", async (req, res) => {
  return res.json(req.user);
});

module.exports = router;
