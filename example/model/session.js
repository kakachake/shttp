const sessionKey = "interceptor_js";

async function getSession(database, ctx, name) {
  const key = ctx.cookies[sessionKey];
  if (key) {
    const now = Date.now();
    console.log(key, name, now);
    const session = await database.get(
      "SELECT * FROM session WHERE key = ? and name = ? and expires > ?",
      key,
      name,
      now
    );
    if (session) {
      return JSON.parse(session.value);
    }
  }
  return null;
}

async function setSession(database, ctx, name, value) {
  try {
    const key = ctx.cookies[sessionKey];
    if (key) {
      let result = await database.get(
        "SELECT id FROM session WHERE key = ? AND name = ?",
        key,
        name
      );
      if (!result) {
        result = await database.run(
          "INSERT INTO session (key, name, value, created, expires) VALUES (?, ?, ?, ?, ?)",
          key,
          name,
          JSON.stringify(value),
          Date.now(),
          Date.now() + 86400000
        );
      } else {
        result = await database.run(
          "UPDATE session SET value = ?,created = ?,  expires = ? WHERE id = ?",
          JSON.stringify(value),
          Date.now(),
          Date.now() + 86400000,
          key
        );
      }
      return {
        error: 0,
        result,
      };
    }
    throw new Error("invalid cookie");
  } catch (e) {
    console.log(e);
    return {
      error: 1,
      message: e.message,
    };
  }
}

module.exports = {
  getSession,
  setSession,
  sessionKey,
};
