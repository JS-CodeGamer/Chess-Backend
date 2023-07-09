import fs from "fs";
import knex from "knex";

export {
  default as findUserByCredentials,
  generateUsername,
} from "./findUserByCredentials";

const knexInstance = knex({
  client: "pg",
  connection: {
    min: 0,
    max: 1,
    ssl: (process.env.PGSSLMODE || "disable") !== "disable" && {
      rejectUnauthorized: false,
      cert: fs.readFileSync(process.env.PGSSLCERT, "utf8"),
      key: fs.readFileSync(process.env.PGSSLKEY, "utf8"),
      ca: fs.readFileSync(process.env.PGSSLROOTCERT, "utf8"),
    },
  },
});

export default knexInstance;
