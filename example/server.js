const Server = require("../src/http-server.js");
const router = require("./routers");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const dbFile = path.resolve(__dirname, "../database/db.db");
let db = null;

const app = new Server();

app.use(async (ctx, next) => {
  if (!db) {
    db = await open({
      filename: dbFile,
      driver: sqlite3.cached.Database,
    });
  }
  ctx.database = db;
  await next();
});

app.use(router.routes());

app.listen({
  port: 3000,
  host: "0.0.0.0",
});
