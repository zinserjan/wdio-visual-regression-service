import _ from 'lodash';
import { parse as parsePlatform } from 'platform';
import { makeElementScreenshot, makeDocumentScreenshot, makeViewportScreenshot } from 'wdio-screenshot';

import getUserAgent from './scripts/getUserAgent';
import { mapWidths, mapOrientations } from './modules/mapViewports';


export default class VisualRegressionLauncher {

  async onPrepare(config) {
    this.validateConfig(config);
  }

  /**
   * Gets executed before test execution begins. At this point you can access
   * all global variables, such as `browser`.
   * It is the perfect place to define custom commands.
   * @param  {object} capabilities desiredCapabilities
   * @param  {[type]} specs        [description]
   * @return {Promise}
   */
  async before(capabilities, specs) {
    this.validateConfig(browser.options);

    this.compare = browser.options.visualRegression.compare;
    this.viewportChangePause = _.get(browser.options, 'visualRegression.viewportChangePause', 100);
    this.widths = _.get(browser.options, 'visualRegression.widths');
    this.orientations = _.get(browser.options, 'visualRegression.orientations');
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
    if (typeof this.compare[hookName] === 'function') {
      return await this.compare[hookName](...args)
    }
  }

  validateConfig(config) {
    if(!_.isPlainObject(config.visualRegression) || !_.has(config.visualRegression, 'compare')) {
      throw new Error('Please provide a visualRegression configuration with a compare method in your wdio-conf.js!');
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

    const viewportChangePauseDefault = this.viewportChangePause;
    const resolutionDefault = browser.isMobile ? this.orientations : this.widths;

    return async function async(...args) {
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

      const resolutions = _.get(options, resolutionKeyPlural, resolutionDefault);
      const viewportChangePause = _.get(options, 'viewportChangePause', viewportChangePauseDefault);

      const results = await resolutionMap(browser, viewportChangePause, resolutions, async function(resolution) {
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
