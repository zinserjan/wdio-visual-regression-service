import debug from 'debug';
import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import open from 'opn';
import LocalCompare from './LocalCompare';

const log = debug('wdio-visual-regression-service:BackstopJS');

export default class BackstopJS extends LocalCompare {

  constructor(options = {}) {
    super();
    this.getScreenshotFile = options.screenshotName;
    this.getReferencefile = options.referenceName;
    this.getDiffFile = options.diffName;
    this.misMatchTolerance = _.get(options, 'misMatchTolerance', 0.01);

    this.htmlReport = _.get(options, 'htmlReport', 'html_report');
    this.useReport = _.get(options, 'openReport', true);
    this.testSuiteName = _.get(options, 'suite', 'BackstopJS');

    super.compareImages.bind(this);
    super.processScreenshot.bind(this);
    super.writeDiff.bind(this);

    // saves all screenshot results for writing in the report
    this.results = [];
  }

  createTestLabel(cucumberStep) {
    return `${cucumberStep.keyword} ${cucumberStep.text}`;
  }

  reportScreenshot(screenshotTestResult, context) {
    const pair = this.createTestPair(screenshotTestResult, context)
    this.results.push(pair);
    return this.results;
  }

  /**
   * Creates a BackstopJS test result pair
   * @param {Object} result
   * @param {Object} context
   */
  createTestPair(screenshotTestResult, context) {
    return {
      pair: {
        reference: this.getReferencefile(context),
        test: this.getScreenshotFile(context),
        diffImage: this.getDiffFile(context),
        selector: _.get(context, 'options.selector', ''),
        fileName: path.basename(this.getScreenshotFile(context)),
        label: _.has(context, 'step') ? this.createTestLabel(context.step) : '',
        misMatchThreshold: this.misMatchTolerance,
        expect: 0,
        viewportLabel: _.get(context, 'meta.resolution', '')
      },
      status: screenshotTestResult.isWithinMisMatchTolerance ? 'pass' : 'fail'
    };
  }
  async after() {
    const browserReporter = {};
    browserReporter.testSuite = this.testSuiteName;
    browserReporter.tests = this.results;
    const reportDir = path.resolve(this.htmlReport);

    console.log('Writing browser report');

    const backstopAssets = 'node_modules/backstop-reporter/dist';

    // copy BackstopJS report assets
    fs.copy(backstopAssets, reportDir);
    console.log('Resources copied');

    const normalizedReporter = this.setReporterPaths(browserReporter, reportDir);
    this.writeBrowserReport(normalizedReporter, reportDir);

    if (this.useReport) {
      return this.openReport();
    }
  }

  /**
   * Sets the file paths as relative in the browserReporter
   * @param {Object} browserReporter
   * @param {String} reportDir the path to write the browser report to
   */
  setReporterPaths(browserReporter, reportDir) {
    browserReporter.tests.map(({ pair }) => {
      pair.reference = path.relative(reportDir, path.resolve(pair.reference));
      pair.test = path.relative(reportDir, path.resolve(pair.test));

      if (pair.diffImage) {
        pair.diffImage = path.relative(reportDir, path.resolve(pair.diffImage));
      }
    });

    return browserReporter;
  }

  /**
   * Writes the browser report as a JSON file
   * @param {Object} browserReporter
   * @param {String} reportDir the path to write the browser report to
   */
  async writeBrowserReport(browserReporter, reportDir) {
    const jsonp = `report(${JSON.stringify(browserReporter, null, 2)});`;
    const compareConfigFileName = path.join(reportDir, 'config.js');

    try {
      await fs.writeFile(path.resolve(compareConfigFileName), jsonp);
      console.log(`Copied configuration to: ${path.resolve(compareConfigFileName)}`);
    } catch (err) {
      console.error('Failed configuration copy');
      throw err;
    }
    return;
  }

  /**
   * Open the BackstopJS report in a browser
   */
  async openReport() {
    const compareReportURL = path.join(this.htmlReport, 'index.html');
    console.log(`Opening ${compareReportURL}`)
    return await open(compareReportURL, { wait: false });
  }
}
