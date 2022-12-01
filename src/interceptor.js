class Interceptor {
  constructor() {
    this.aspects = [];
  }

  use(/* async */ functor) {
    // 注册拦截切面
    this.aspects.push((...args) => Promise.resolve(functor(...args)));
    return this;
  }

  // 执行注册的拦截切面
  async run(context) {
    const aspects = this.aspects;
    // 将注册的拦截切面包装成一个洋葱模型
    const proc = aspects.reduceRight(
      function (a, b) {
        // eslint-disable-line
        return async () => {
          await b(context, a);
        };
      },
      () => Promise.resolve()
    );
    try {
      await proc();
    } catch (err) {
      console.error(err);
    }

    return context;
  }
}

module.exports = Interceptor;
