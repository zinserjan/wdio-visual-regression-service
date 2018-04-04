import _ from 'lodash';
import { parse as parsePlatform } from 'platform';
import { makeElementScreenshot, makeDocumentScreenshot, makeViewportScreenshot } from 'wdio-screenshot';

import getUserAgent from './scripts/getUserAgent';
import { mapViewports, mapOrientations } from './modules/mapViewports';


export default class VisualRegressionLauncher {

  constructor() {
    this.currentSuite = null;
    this.currentTest = null;
    this.currentFeature = null;
    this.currentScenario = null;
    this.currentStep = null;
  }

  /**
   * Gets executed once before all workers get launched.
   * @param {Object} config wdio configuration object
   * @param {Array.<Object>} capabilities list of capabilities details
   */
  async onPrepare(config) {
    this.validateConfig(config);
    this.compare = config.visualRegression.compare;
    await this.runHook('onPrepare');
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
    this.viewports = _.get(browser.options, 'visualRegression.viewports');
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
   * Hook that gets executed before the suite starts
   * @param {Object} suite suite details
   */
  beforeSuite (suite) {
    this.currentSuite = suite;
  }

  /**
   * Hook that gets executed after the suite has ended
   * @param {Object} suite suite details
   */
  afterSuite(suite) {
    this.currentSuite = null;
  }

  /**
   * Function to be executed before a test (in Mocha/Jasmine) or a step (in Cucumber) starts.
   * @param {Object} test test details
   */
  beforeTest(test) {
    this.currentTest = test;
  }

  /**
   * Function to be executed after a test (in Mocha/Jasmine) or a step (in Cucumber) ends.
   * @param {Object} test test details
   */
  afterTest(test) {
    this.currentTest = null;
  }

  /**
   * Function to be executed before a feature starts in Cucumber.
   * @param  {Object} feature feature details
   */
  beforeFeature(feature) {
    this.currentFeature = feature;
  }

  /**
   * Function to be executed after a feature ends in Cucumber.
   * @param  {Object} feature feature details
   */
  afterFeature(feature) {
    this.currentFeature = null;
  }

  /**
   * Function to be executed before a scenario starts in Cucumber.
   * @param  {Object} scenario scenario details
   */
  beforeScenario(scenario) {
    this.currentScenario = scenario;
  }

  /**
   * Function to be executed after a scenario ends in Cucumber.
   * @param  {Object} scenario scenario details
   */
  afterScenario(scenario) {
    this.currentScenario = null;
  }

  /**
   * Function to be executed before a step starts in Cucumber.
   * @param  {Object} step step details
   */
  beforeStep(step) {
    this.currentStep = step;
  }

  /**
   * Function to be executed after a step ends in Cucumber.
   * @param  {Object} stepResult stepResult details
   */
  afterStep(stepResult) {
    this.currentStep = null;
  }


  /**
   * Gets executed after all tests are done. You still have access to all global
   * variables from the test.
   * @param  {object} capabilities desiredCapabilities
   * @param  {[type]} specs        [description]
   * @return {Promise}
   */
  async after(capabilities, specs) {
    await this.runHook('after', capabilities, specs);
  }

  /**
   * Gets executed after all workers got shut down and the process is about to exit.
   * @param {Object} exitCode 0 - success, 1 - fail
   * @param {Object} config wdio configuration object
   * @param {Array.<Object>} capabilities list of capabilities details
   */
  async onComplete(exitCode, config, capabilities) {
    await this.runHook('onComplete');
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

    const getTestDetails = () => this.getTestDetails();

    const resolutionKeySingle = browser.isMobile ? 'orientation' : 'viewport';
    const resolutionKeyPlural = browser.isMobile ? 'orientations' : 'viewports';
    const resolutionMap = browser.isMobile ? mapOrientations : mapViewports;

    const viewportChangePauseDefault = this.viewportChangePause;
    const resolutionDefault = browser.isMobile ? this.orientations : this.viewports;

    return async function async(...args) {
      const url = await browser.getUrl();

      const elementSelector = type === 'element' ? args[0] : undefined;
      const options = _.isPlainObject(args[args.length - 1]) ? args[args.length - 1] : {};

      const {
        exclude,
        hide,
        remove,
      } = options;

      const resolutions = _.get(options, resolutionKeyPlural, resolutionDefault);
      const viewportChangePause = _.get(options, 'viewportChangePause', viewportChangePauseDefault);

      const results = await resolutionMap(
        browser,
        viewportChangePause,
        resolutions,
        async function takeScreenshot(resolution) {
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
            ...getTestDetails(),
            meta,
            options
          };

          const screenshotContextCleaned = _.pickBy(screenshotContext, _.identity);

          await runHook('beforeScreenshot', screenshotContextCleaned);

          const base64Screenshot = await command(browser, ...args);

          await runHook('afterScreenshot', screenshotContextCleaned, base64Screenshot);

          // pass the following params to next iteratee function
          return [screenshotContextCleaned, base64Screenshot];
        },
        async function processScreenshot(screenshotContextCleaned, base64Screenshot) {
          return await runHook('processScreenshot', screenshotContextCleaned, base64Screenshot);
        }
      );
      return results;

    }
  }

  getTestDetails() {
    return _.pickBy({
     // mocha
     suite: this.currentSuite,
     test: this.currentTest,
     // cucumber
     feature: this.currentFeature,
     scenario: this.currentScenario,
     step: this.currentStep,
    }, _.identity);
  }
}
