const Router = require("../src/Router");
const { getCoronavirusKeyIndex, getCoronavirusByDate } = require("./mock");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const { getList, addTask, updateTask } = require("./model/todolist");
const mime = require("mime");
const zlib = require("zlib");
const { register, login, logout } = require("./model/user");
const { getSession } = require("./model/session");

const router = new Router();
const users = {};

router.post("/register", async ({ params, req, res, database }, next) => {
  const { username, password } = params;
  const result = await register(database, {
    username,
    password,
  });
  // res.body = JSON.stringify(result);
  res.statusCode = 302;
  if (result.error === 0) {
    res.setHeader("Location", "/login");
  } else {
    res.setHeader("Location", "/login.html");
  }
  await next();
});

router.post("/login", async (ctx, next) => {
  const { params, req, res, database } = ctx;

  const { username, password } = params;
  console.log(username, password);
  const result = await login(database, ctx, {
    username,
    password,
  });
  console.log(result.data);
  res.statusCode = 302;
  if (result.error === 0) {
    res.setHeader("Location", "/");
  } else {
    res.setHeader("Location", "/login.html");
  }
  await next();
});

router.post("/logout", async (ctx, next) => {
  const res = await logout(ctx);
  ctx.res.body = JSON.stringify(res);
  await next();
});

router.get("/home", async ({ req, cookies, res }, next) => {
  res.setHeader("Content-Type", "text/html;charset=utf-8");
  let id = cookies.interceptor_js;
  if (id) {
    users[id] = users[id] || 1;
    users[id]++;
    res.body = `<h1>你好，欢迎第${users[id]}次访问本站</h1>`;
  } else {
    id = Math.random().toString(36).slice(2);
    users[id] = 1;
    res.body = "<h1>你好，新用户</h1>";
  }
  res.setHeader("Set-Cookie", `interceptor_js=${id}; Max-Age=86400`);
  await next();
});

router.get("/list", async (ctx, next) => {
  const { database, route, res } = ctx;
  const userInfo = await getSession(database, ctx, "userInfo");
  console.log(userInfo);
  if (userInfo) {
    res.setHeader("Content-Type", "application/json");
    const result = await getList(database, userInfo);
    res.body = result;
    await next();
  } else {
    res.body = {
      error: 1,
    };
    return;
  }
});

router.post("/add", async (ctx, next) => {
  const { database, params, res } = ctx;
  res.setHeader("Content-Type", "application/json");
  res.body = params;
  const userInfo = await getSession(database, ctx, "userInfo");
  const result = await addTask(database, {
    ...params,
    userId: userInfo.id,
  });
  res.body = result;
  await next();
});

router.post("/update", async (ctx, next) => {
  const { params, res, database } = ctx;
  res.setHeader("Content-Type", "application/json");
  const userInfo = await getSession(database, ctx, "userInfo");
  const result = await updateTask(database, {
    ...params,
    userId: userInfo.id,
  });
  console.log(result);
  res.body = result;
  next();
});

router.get("/coronavirus/index", async ({ params, route, res }, next) => {
  const index = getCoronavirusKeyIndex();
  const tpl = fs.readFileSync(
    path.resolve(__dirname, "./view/coronavirus_index.html"),
    "utf-8"
  );

  const template = handlebars.compile(tpl);
  const html = template({ data: index });
  res.setHeader("Content-Type", "text/html");
  res.body = html;
  await next();
});

router.get("/coronavirus/:date", async ({ params, route, res }, next) => {
  const data = getCoronavirusByDate(route.date);
  if (params.type === "json") {
    res.setHeader("Content-Type", "application/json");
    res.body = data;
  } else {
    res.setHeader("Content-Type", "text/html");
    const tpl = fs.readFileSync(
      path.resolve(__dirname, "./view/coronavirus_date.html"),
      "utf-8"
    );
    const template = handlebars.compile(tpl);
    const html = template({ data });
    res.body = html;
  }
  await next();
});

router.all(".*", async ({ req, res }, next) => {
  let filePath = path.resolve(__dirname, path.join("www", req.url));
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    if (fs.existsSync(filePath)) {
      const ext = path.parse(filePath);
      const mimeType = mime.getType(ext.ext);
      const responseHeaders = {
        "Content-Type": mimeType,
        "cache-control": "max-age=3600",
        "last-modified": stats.mtime.toUTCString(),
      };
      const compress = /^(text|application)\//.test(mimeType);
      if (compress) {
        const acceptEncoding = req.headers["accept-encoding"];
        acceptEncoding.split(/\s*,\s*/).some((encoding) => {
          switch (encoding) {
            case "gzip":
              responseHeaders["content-encoding"] = "gzip";
              return true;
            case "deflate":
              responseHeaders["content-encoding"] = "deflate";
              return true;
            case "br":
              responseHeaders["content-encoding"] = "br";
              return true;
            default:
              return false;
          }
        });
      }
      const compressionEncoding = responseHeaders["content-encoding"];
      const timeStamp = req.headers["if-modified-since"] || 0;
      let status = 200;
      if (timeStamp && Number(timeStamp) === stats.mtime.toUTCString()) {
        status = 304;
      }
      res.writeHead(status, responseHeaders);
      if (status === 200) {
        const fileStream = fs.createReadStream(filePath);
        if (compress && compressionEncoding) {
          let stream;
          switch (compressionEncoding) {
            case "gzip":
              stream = fileStream.pipe(zlib.createGzip());
              break;
            case "deflate":
              stream = fileStream.pipe(zlib.createDeflate());
              break;
            case "br":
              stream = fileStream.pipe(zlib.createBrotliCompress());
              break;
          }
          res.body = stream;
        } else {
          res.body = fileStream;
        }
      }
    }
  } else {
    res.setHeader("Content-Type", "text/html");
    res.body = "<h1>Not Found</h1>";
    res.statusCode = 404;
  }
});

module.exports = router;
