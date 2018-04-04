import fs from 'fs-extra';
import path from 'path';
import debug from 'debug';

const log = debug('wdio-visual-regression-service:BaseCompare');
const runtimeConfigPath = __dirname;

export default class BaseCompare {

  constructor() {
    this.configs = new Map();
  }

  /**
   * Gets executed once before all workers get launched.
   */
  async onPrepare() {
    return Promise.resolve();
  }

  /**
   * Gets executed before the tests starts.
   */
  async before(context) {
    return Promise.resolve();
  }

  /**
   * Gets executed immediately before the screenshot is taken.
   */
  async beforeScreenshot(context) {
    return Promise.resolve();
  }

  /**
   * Gets executed after the screenshot is taken.
   */
  async afterScreenshot(context, base64Screenshot) {
    return Promise.resolve();
  }

  /**
   * You can do here your image comparison magic.
   */
  async processScreenshot(context, base64Screenshot) {
    return Promise.resolve();
  }

  /**
   * Gets executed after all tests are done. You still have access to all global
   * variables from the test.
   */
  async after() {
    return Promise.resolve();
  }

  /**
   * Gets executed after all workers got shut down and the process is about to exit.
   */
  async onComplete() {
    return Promise.resolve();
  }

  /**
   * Prepare runtime config for worker process
   */
  async saveRuntimeConfig(name, config) {
    const file = this.getRuntimeConfigFileName(name);
    log(`Save runtime config ${name} to file ${file}`);
    await fs.writeJson(file, config, {
      spaces: 2
    });
    this.configs.set(name, config);
  }

   /**
   * Read prepared runtime config from launcher process
   */
  async getRuntimeConfig(name) {
    // try to read from cache first
    if (this.configs.has(name)) {
      log(`Read runtime config ${name} from cache`);
      return this.configs.get(name);
    }
    // otherwise read from fs
    const file = this.getRuntimeConfigFileName(name);
    log(`Read runtime config ${name} from file ${file}`);
    const config = await fs.readJson(file);
    // and cache the result
    this.configs.set(name, config);
    return config;
  }

   /**
   * Remove runtime config
   */
  async removeRuntimeConfig(name) {
    // delete from fs
    const file = this.getRuntimeConfigFileName(name);
    log(`Remove runtime config ${name} file ${file}`);
    await fs.remove(file);
    // delete from cache
    this.configs.delete(name);
  }

  /**
   * Removes all created runtime configs
   */
  async cleanUpRuntimeConfigs() {
    // clean up all saved config files
    const names = [...this.configs.keys()];
    await Promise.all(names.map((n) => this.removeRuntimeConfig(n)));
  }

  /**
   * Builds a non-conflicting file name for this webdriverio run
   */
  getRuntimeConfigFileName(name) {
    // launcher and runner gets the same arguments, so let's use them to build a hash to determine different calls
    const hash = require("crypto").createHash('md5').update(process.argv.slice(2).join("")).digest('hex').substring(0, 4);
    // try to use process id to generate a unique file name for each webdriverio instance
    const runner = global.browser != null;
    const pid = !process.hasOwnProperty("ppid") ? null : (runner ? process.ppid : process.pid);
    // generate file name suffix
    const suffix = [hash, pid].filter(Boolean).join("-");
    return path.join(runtimeConfigPath, `${name}-${suffix}.json`);
  }

  createResultReport(misMatchPercentage, isWithinMisMatchTolerance, isSameDimensions) {
    return {
      misMatchPercentage,
      isWithinMisMatchTolerance,
      isSameDimensions,
      isExactSameImage: misMatchPercentage === 0
    };
  }

}
