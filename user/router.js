const express = require("express");
const user = require("./user");

const router = express.Router();

router.post("/register", async (req, res) => {
  const required = ["username", "password", "confirm_password"];
  for (let param in required)
    if (!req.body.get(param, false))
      return res.status(400).send({ error: `${param} is required` });

  const username = req.body.get("username");
  const password = req.body.get("password");
  const confirm_password = req.body.get("confirm_password");

  if (password != confirm_password)
    return res.status(400).send({ error: `password fields do not match` });

  user.createOrUpdate(username, { password });
  return res.send({ info: "registered" });
});

router.post("/signin", async (req, res) => {
  const required = ["username", "password"];
  for (let param in required)
    if (!req.body.get(param, false))
      return res.status(400).send({ error: `${param} is required` });

  const username = req.body.get("username");
  const password = req.body.get("password");

  const user = user.authenticate(username, password);
  return res.send();
});
