const JSDOMEnvironmentModule = require('jest-environment-jsdom');
const JSDOMEnvironment = JSDOMEnvironmentModule.default || JSDOMEnvironmentModule.TestEnvironment || JSDOMEnvironmentModule;

module.exports = class JSDOMEnvironmentGlobal extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context);
    this.global.jsdom = this.dom;
  }
  async teardown() {
    this.global.jsdom = null;
    return super.teardown();
  }
};
