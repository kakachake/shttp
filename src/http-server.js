const http = require("http");

const Interceptor = require("./interceptor.js");
const { getCookie, setCookie } = require("./aspect/cookie.js");
const param = require("./aspect/param.js");

module.exports = class Server {
  constructor() {
    const interceptor = new Interceptor();

    interceptor.use(param).use(getCookie).use(setCookie);

    this.server = http.createServer(async (req, res) => {
      await interceptor.run({ req, res });
      if (!res.writableFinished) {
        let body = res.body ?? "200 OK";
        if (body.pipe) {
          body.pipe(res);
        } else {
          if (
            (typeof body !== "string" &&
              res.getHeader("Content-Type") === "application/json") ||
            typeof body === "object"
          ) {
            body = JSON.stringify(body);
          }
          res.end(body);
        }
      }
    });

    this.server.on("clientError", (err, socket) => {
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    });

    this.interceptor = interceptor;
  }

  listen(opts, cb = () => {}) {
    if (typeof opts === "number") opts = { port: opts };
    opts.host = opts.host || "0.0.0.0";
    opts.port = opts.port || 3000;
    console.log(
      `Server is running at http://${opts.host}:${opts.port} (Press CTRL+C to quit)`
    );
    this.server.listen(opts, () => cb(this.server));
  }

  use(aspect) {
    return this.interceptor.use(aspect);
  }
};
