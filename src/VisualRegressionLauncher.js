import _ from 'lodash';
import { parse as parsePlatform } from 'platform';
import { makeElementScreenshot, makeDocumentScreenshot, makeViewportScreenshot } from 'wdio-screenshot';

import getUserAgent from './scripts/getUserAgent';
import { mapWidths, mapOrientations } from './modules/mapViewports';

import configuredMethod from './configured';

export default class VisualRegressionLauncher {


  /**
   * Gets executed before test execution begins. At this point you can access
   * all global variables, such as `browser`.
   * It is the perfect place to define custom commands.
   * @param  {object} capabilities desiredCapabilities
   * @param  {[type]} specs        [description]
   * @return {Promise}
   */
  async before(capabilities, specs) {
    this.method = configuredMethod;
    const userAgent = (await browser.execute(getUserAgent)).value;
    const { name, version, ua } = parsePlatform(userAgent);

    this.context = {
      browser: {
        name,
        version,
        userAgent: ua
      },
      desiredCapabilities: capabilities,
      specs: specs
    };

    browser.addCommand('checkElement', this.wrapCommand(browser, 'element', makeElementScreenshot));
    browser.addCommand('checkDocument', this.wrapCommand(browser, 'document', makeDocumentScreenshot));
    browser.addCommand('checkViewport', this.wrapCommand(browser, 'viewport', makeViewportScreenshot));

    await this.runHook('before', this.context);
  }

  /**
   * Function to be executed before a test (in Mocha/Jasmine) or a
   * step (in Cucumber) starts.
   * @param  {[type]} test [description]
   * @return {Promise}
   */
  async beforeTest(test) {
    this.currentTest = test;
  }

  /**
   * Gets executed after all tests are done. You still have access to all global
   * variables from the test.
   * @param  {object} capabilities desiredCapabilities
   * @param  {[type]} specs        [description]
   * @return {Promise}
   */
  async after(capabilities, specs) {
    await this.runHook('after');
  }

  async runHook(hookName, ...args) {
    if (typeof this.method[hookName] === 'function') {
      return await this.method[hookName](...args)
    }
  }

  wrapCommand(browser, type, command) {
    const baseContext = {
      type,
      browser: this.context.browser,
      desiredCapabilities: this.context.desiredCapabilities,
    };

    const runHook = this.runHook.bind(this);

    const getTest = () => {
      return _.pick(this.currentTest, ['title', 'parent', 'file']);
    };

    const resolutionKeySingle = browser.isMobile ? 'orientation' : 'width';
    const resolutionKeyPlural = browser.isMobile ? 'orientations' : 'widths';
    const resolutionMap = browser.isMobile ? mapOrientations : mapWidths;

    return async function async(testName, ...args) {
      const url = await browser.getUrl();

      const elementSelector = type === 'element' ? args[0] : undefined;
      const options = _.isPlainObject(args[args.length - 1]) ? args[args.length - 1] : {};

      const {
        exclude,
        hide,
        remove,
        widths,
        orientations
      } = options;

      const resolutions = options[resolutionKeyPlural];

      const results = await resolutionMap(browser, resolutions, async function(resolution) {
        const meta = _.pickBy({
          url,
          element: elementSelector,
          exclude,
          hide,
          remove,
          [resolutionKeySingle]: resolution
        }, _.identity);

        const screenshotContext = {
          ...baseContext,
          test: getTest(),
          meta,
          options
        };

        const screenshotContextCleaned = _.pickBy(screenshotContext, _.identity);

        await runHook('beforeScreenshot', screenshotContextCleaned);

        const base64Screenshot = await command(browser, ...args);

        return await runHook('afterScreenshot', screenshotContextCleaned, base64Screenshot);
      });

      return results;

    }
  }

}
