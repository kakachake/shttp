async function getCookie(ctx, next) {
  const { req } = ctx;
  const cookieStr = decodeURIComponent(req.headers.cookie || "");
  const cookies = cookieStr.split(/\s*;\s*/);
  ctx.cookies = {};
  cookies.forEach((cookie) => {
    const [key, value] = cookie.split(/\s*=\s*/);
    ctx.cookies[key] = value;
  });
  await next();
}

async function setCookie({ cookies, req, res }, next) {
  let id = cookies.interceptor_js;
  if (!id) {
    id = Math.random().toString(36).slice(2);
  }
  res.setHeader(
    "Set-Cookie",
    `interceptor_js=${id}; Path=/; Max-Age=${7 * 86400}`
  ); // 设置cookie的有效时长一周
  await next();
}

module.exports = {
  getCookie,
  setCookie,
};
