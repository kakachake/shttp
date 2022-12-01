const url = require("url");
const querystring = require("querystring");

module.exports = async function (ctx, next) {
  const { req } = ctx;
  const { query } = url.parse(`http://${req.headers.host}${req.url}`);
  ctx.params = querystring.parse(query);
  // eslint-disable-next-line no-debugger
  debugger;
  if (req.method === "POST") {
    const headers = req.headers;

    const body = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk.toString();
      });
      req.on("end", () => {
        resolve(data);
      });
    });
    ctx.params = ctx.params ?? {};
    if (headers["content-type"] === "application/json") {
      ctx.params = Object.assign(ctx.params, JSON.parse(body));
    } else if (
      headers["content-type"] === "application/x-www-form-urlencoded"
    ) {
      ctx.params = Object.assign(ctx.params, querystring.parse(body));
    }
  }

  await next();
};
