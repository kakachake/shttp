const url = require("url");
const path = require("path");

/**
 *
 * @param {*} rule 路径规划
 * @param {*} pathname 路径名
 */
function check(rule, pathname) {
  /**
   * 解析规则，比如：test/:course/:lecture
   * paraMatched = ['/test/:course/:lecture', ':course', ':lecture']
   */
  // 匹配动态path
  const paramMatched = rule.match(/:[^/]+/g);

  const ruleExp = new RegExp(`^${rule.replace(/:[^/]+/g, "([^/]+)")}$`);
  // 解析真正的路径
  // ruleMatched = ['/test/123/abs', '123', 'abs']
  const ruleMatched = pathname.match(ruleExp);

  // 将规则和路径拼接为对象
  // ret = {course: 123, lecture: abc}
  if (ruleMatched) {
    const ret = {};
    if (paramMatched) {
      for (let i = 0; i < paramMatched.length; i++) {
        ret[paramMatched[i].slice(1)] = ruleMatched[i + 1];
      }
    }
    return ret;
  }
  return null;
}

/**
 *
 * @param {*} method GET/POST/PUT/DELETE
 * @param {*} rule 路径规则，比如：test/:course/:lecture
 * @param {*} aspect 拦截函数
 * @returns
 */
function route(method, rule, aspect) {
  return async (ctx, next) => {
    const req = ctx.req;
    if (!ctx.url) ctx.url = url.parse(`http://${req.headers.host}${req.url}`);
    rule = rule.split(path.sep).join("/");
    const checked = check(rule, ctx.url.pathname);
    // console.log(rule);
    // console.log(ctx.url.pathname);
    // console.log(req.method);
    // console.log(method);
    // console.log(checked);
    if (!ctx.route && (method === "*" || req.method === method) && !!checked) {
      ctx.route = checked;
      await aspect(ctx, next);
    } else {
      await next();
    }
  };
}

class Router {
  routers = [];
  constructor(base = "") {
    this.baseURL = base;
  }
  routes() {
    return async (ctx, next) => {
      await this.routers.reduceRight(
        (a, b) => {
          return async () => {
            await b(ctx, a);
          };
        },
        async () => await next()
      )();
    };
  }
  get(rule, aspect) {
    this.routers.push(route("GET", path.join(this.baseURL, rule), aspect));
  }

  post(rule, aspect) {
    this.routers.push(route("POST", path.join(this.baseURL, rule), aspect));
  }

  put(rule, aspect) {
    this.routers.push(route("PUT", path.join(this.baseURL, rule), aspect));
  }

  delete(rule, aspect) {
    this.routers.push(route("DELETE", path.join(this.baseURL, rule), aspect));
  }

  all(rule, aspect) {
    this.routers.push(route("*", path.join(this.baseURL, rule), aspect));
  }
}

module.exports = Router;
