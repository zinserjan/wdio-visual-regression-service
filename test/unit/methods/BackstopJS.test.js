import { assert } from 'chai';
import sinon, { mock, spy, stub } from 'sinon';
import LocalCompare from '../../../src/methods/LocalCompare';
import BackstopJS from '../../../src/methods/BackstopJS';
import path from 'path';
import fs from 'fs-extra';

describe('BackstopJS', function () {
  let instance;
  let passingTest;
  let failingTest;
  let browserReporter;
  let reportDir;

  beforeEach(async function () {
    instance = new BackstopJS({
      referenceName: () => 'reference/some-test.png',
      screenshotName: () => 'screenshot/some-test.png',
      diffName: () => `diff/some-test.png`,
      misMatchTolerance: 0.05,
      testSuiteName: 'suite'
    });

    passingTest = {
      misMatchPercentage: 0,
      isWithinMisMatchTolerance: true,
      isSameDimensions: true,
      isExactSameImage: true
    }

    failingTest = {
      misMatchPercentage: 0,
      isWithinMisMatchTolerance: false,
      isSameDimensions: false,
      isExactSameImage: false
    }

    context = {
      step: {
        keyword: 'keyword',
        text: 'text'
      },
      options: {
        selector: 'selector'
      }
    };

    const testReports = [
      {
        pair:
        {
          expect: 0,
          fileName: 'reference.png',
          label: 'keyword text',
          misMatchThreshold: 0.05,
          reference: 'reference/some-test.png',
          selector: 'selector',
          test: 'screenshot/some-test.png',
          viewportLabel: ''
        },
        status: 'pass'
      },
      {
        pair:
        {
          diffImage: 'diff/some-test.png',
          expect: 0,
          fileName: 'some-test.png',
          label: 'keyword text',
          misMatchThreshold: 0.05,
          reference: 'reference/some-test.png',
          selector: 'selector',
          test: 'screenshot/some-test.png',
          viewportLabel: ''
        },
        status: 'fail'
      }
    ];

    browserReporter = {
      testSuite: 'test suite',
      tests: testReports
    }

    reportDir = './html_report';
  });

  it('creates an instance of LocalCompare', async function () {
    const instance = new BackstopJS();
    assert.instanceOf(instance, LocalCompare, 'BackstopJS should extend BaseCompare');
  });

  context('reportScreenshot', function () {

    it('adds new test pairs to the results', async function () {
      const [resultIdentical] = instance.reportScreenshot(passingTest, context);

      assert.deepEqual(resultIdentical, {
        pair:
        {
          diffImage: 'diff/some-test.png',
          expect: 0,
          fileName: 'some-test.png',
          label: 'keyword text',
          misMatchThreshold: 0.05,
          reference: 'reference/some-test.png',
          selector: 'selector',
          test: 'screenshot/some-test.png',
          viewportLabel: ''
        },
        status: 'pass'
      }, 'adds the expected test pair to results');

      instance.reportScreenshot(passingTest, context);

      assert.lengthOf(instance.results, 2, 'adds the expected number of pairs to resutls');
    });
  });

  context('createTestPair', function () {
    it('creates a test pair using defaults', async function () {
      const resultDefault = instance.createTestPair({}, {});

      assert.deepEqual(resultDefault, {
        pair:
        {
          diffImage: 'diff/some-test.png',
          expect: 0,
          fileName: 'some-test.png',
          label: '',
          misMatchThreshold: 0.05,
          reference: 'reference/some-test.png',
          selector: '',
          test: 'screenshot/some-test.png',
          viewportLabel: ''
        },
        status: 'fail'
      })
    });

    it('creates the selector from the context', async function () {
      context.options.selector = 'custom selector';

      const result = instance.createTestPair(passingTest, context);

      assert.equal(result.pair.selector, 'custom selector');
    });

    it('creates the label from the context', async function () {
      context.step = {
        keyword: 'step keyword',
        text: 'step text',
      }

      const result = instance.createTestPair(passingTest, context);

      assert.equal(result.pair.label, 'step keyword step text');
    });

    it('passes when within tolerance', async function () {
      const resultPassing = instance.createTestPair(passingTest, context);

      assert.equal(resultPassing.status, 'pass');
    });

    it('fails when not within tolerance', async function () {
      const resultFailing = instance.createTestPair(failingTest, context);

      assert.equal(resultFailing.status, 'fail');
    });
  });

  context('after', function () {
    beforeEach(async function() {
      instance.testSuiteName = browserReporter.testSuite;
      instance.results = browserReporter.tests;
    });

    it('should copy assets for the reporter', async function () {
      const copy = stub(fs, 'copy');

      instance.after();

      assert.equal(copy.callCount, 1, 'copies files one time');
      const backstopAssetFolder = copy.args[0][0]
      assert.equal(backstopAssetFolder, 'node_modules/backstop-reporter/dist', 'copies the BackstopJS repoter assets');
    });

    it('should create the report', async function () {
      const setReporterPaths = stub(instance, 'setReporterPaths');
      const writeBrowserReport = stub(instance, 'writeBrowserReport');
      const openReport = stub(instance, 'openReport');

      instance.after();

      assert.equal(setReporterPaths.callCount, 1, 'calls setReporterPaths');
      assert.equal(writeBrowserReport.callCount, 1, 'calls writeBrowserReportj');
      assert.equal(openReport.callCount, 1, 'calls openReport');
    });

    it('should not open the report when useReport is false', async function () {
      instance.useReport = false;
      const openReport = stub(instance, 'openReport');

      instance.after();

      assert.equal(openReport.callCount, 0, 'skips calling openReport when useReport is false');
    })
  });

  context('setReporterPaths', function () {
    it('should add paths to the report', async function () {
      const relative = spy(path, 'relative');
      const browserReport = instance.setReporterPaths(browserReporter, reportDir);

      const {
        reference,
        test,
        diffImage
      } = browserReport.tests[1].pair;

      assert.equal(reference, '../reference/some-test.png', 'sets the path for the reference screenshot');
      assert.equal(test, '../screenshot/some-test.png', 'sets the path for the screenshot');
      assert.equal(diffImage, '../diff/some-test.png', 'sets the path for the relative screenshot');
      assert.equal(relative.callCount, 5, 'called for each test');
      relative.restore();
    });

    it('should not add diff image if there is no diff image', async function () {
      const relative = spy(path, 'relative');
      const browserReport = instance.setReporterPaths(browserReporter, reportDir);
      const { diffImage } = browserReport.tests[0].pair;

      assert.isUndefined(diffImage, 'sets nothing when diff image not present')
      relative.restore();
    });
  });

  context('writeBrowserReport', function () {
    let sandbox = null;

    beforeEach(async function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(async function () {
      sandbox.restore();
    });

    it('should convert the browser report to JSON', async function () {
      const writeFile = sandbox.stub(fs, 'writeFile');
      instance.writeBrowserReport({}, reportDir);

      assert.equal(writeFile.firstCall.args[1], 'report({});', 'writes the browser report data');
    });

    it('should write to the config file location', async function () {
      const outFileRe = /\/html_report\/config.js/;
      const writeFile = sandbox.stub(fs, 'writeFile');

      instance.writeBrowserReport({}, reportDir);

      assert.equal(writeFile.callCount, 1, 'writes the file one time');
      assert.isTrue(outFileRe.test(writeFile.firstCall.args[0]), 'writes to the config location');
    });
  });

  context('openReport', function () {
    it('should open the report file', async function () {
      const join = spy(path, 'join');
      instance.openReport()

      assert.deepEqual(join.args[0], ['html_report', 'index.html'], 'builds correct report url');
    });
  });
});
