const crypto = require("crypto");
const { setSession, getSession } = require("./session");
const salt = "kaka";
const sessionName = "userInfo";
const sessionKey = "interceptor_js";

function sha256(str) {
  return crypto
    .createHash("sha256")
    .update(str + salt)
    .digest()
    .toString("hex");
}

async function register(database, { username, password }) {
  password = sha256(password);
  const result = await database.run(
    "insert into user (name, password) values (?, ?)",
    [username, password]
  );
  return result;
}

async function login(database, ctx, { username, password }) {
  const userInfo = await database.get("select * from user where name = ?", [
    username,
  ]);
  if (!userInfo) {
    return {
      error: 1,
      data: "用户不存在",
    };
  } else if (userInfo.password !== sha256(password)) {
    return {
      error: 1,
      data: "密码错误",
    };
  } else {
    console.log("设置session", username);
    setSession(database, ctx, sessionName, {
      username,
      id: userInfo.id,
    });
    return {
      error: 0,
      data: "登录成功",
    };
  }
}

async function logout(ctx) {
  const result = await ctx.database.run(
    "delete from Session where key = ?",
    ctx.cookies[sessionKey]
  );
  console.log(result);
  if (result) {
    return {
      error: 0,
      data: "退出成功",
    };
  } else {
    return {
      error: 1,
      data: "退出失败",
    };
  }
}

async function checkLogin(ctx) {
  const userInfo = await getSession(ctx.database, ctx, sessionName);
  if (!userInfo) {
    return null;
  } else {
    return userInfo;
  }
}

module.exports = {
  register,
  login,
  checkLogin,
  logout,
};
