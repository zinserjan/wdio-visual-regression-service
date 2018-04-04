import path from 'path';
import { assert } from 'chai';
import { stub, spy } from 'sinon';

import { config } from './wdio.config';
import * as compareStubs from '../helper/compareMethod';

const TYPE_ELEMENT = 'element';
const TYPE_DOCUMENT = 'document';
const TYPE_VIEWPORT = 'viewport';

function assertScreenshotContext(options, type, screenshotContext) {
  assert.isObject(screenshotContext);

  // check type
  assert.property(screenshotContext, 'type');
  assert.strictEqual(screenshotContext.type, type);

  // check browser
  const { browser } = screenshotContext;
  assertBrowser(browser);

  // check desiredCapabilities
  const { desiredCapabilities } = screenshotContext;
  assertDesiredCapabilities(desiredCapabilities);

  // check test
  const { test } = screenshotContext;
  assertTest(test);

  // check suite
  const { suite } = screenshotContext;
  assertTest(suite);

  // check meta
  const { meta } = screenshotContext;
  assertMeta(meta, type, options);

  // check options
  assert.property(screenshotContext, 'options');
  assert.deepEqual(screenshotContext.options, options);
}


function assertBrowser(browser) {
  assert.isObject(browser, 'browser must be an object');
  // test browser property
  assert.property(browser, 'name');
  assert.isString(browser.name);

  assert.property(browser, 'version');
  assert.isString(browser.version);

  assert.property(browser, 'userAgent');
  assert.isString(browser.userAgent);
}


function assertDesiredCapabilities(desiredCapabilities) {
  assert.isObject(desiredCapabilities, 'desiredCapabilities must be an object');
  assert.deepEqual(desiredCapabilities, config.capabilities[0]);
}

function assertTest(test) {
  assert.isObject(test, 'test must be an object');
  assert.property(test, 'title');
  assert.isString(test.title);

  assert.property(test, 'parent');
  assert.isString(test.parent);

  assert.property(test, 'file');
  assert.isString(test.file);
}


function assertMeta(meta, type, options) {
  assert.isObject(meta, 'meta must be an object');

  assert.property(meta, 'url');
  assert.isString(meta.url);

  if (type === TYPE_ELEMENT) {
    assert.property(meta, 'element');
    assert.isTrue(typeof meta.element === 'string' || Array.isArray(meta.element), 'element should be a string or array');
  }

  if (typeof options.exclude !== 'undefined') {
    assert.property(meta, 'exclude');
    assert.strictEqual(meta.exclude, options.exclude);
  }

  if (typeof options.hide !== 'undefined') {
    assert.property(meta, 'hide');
    assert.strictEqual(meta.hide, options.hide);
  }

  if (typeof options.remove !== 'undefined') {
    assert.property(meta, 'remove');
    assert.strictEqual(meta.remove, options.remove);
  }

  if (typeof options.viewports !== 'undefined') {
    assert.property(meta, 'viewport');
    assert.oneOf(meta.viewport, options.viewports);
  }

  if (typeof options.orientations !== 'undefined') {
    assert.property(meta, 'orientation');
    assert.oneOf(options.orientation, options.orientations);
  }
}


describe('VisualRegressionLauncher - custom compare method & hooks', function () {

  beforeEach(function () {
    const { before, beforeScreenshot, afterScreenshot, processScreenshot, after } = compareStubs;

    this.beforeStub = before;
    this.beforeScreenshotStub = beforeScreenshot;
    this.afterScreenshotStub = afterScreenshot;
    this.processScreenshotStub = processScreenshot;
    this.afterStub = after;

    this.beforeScreenshotStub.reset();
    this.beforeScreenshotStub.resetBehavior();
    this.afterScreenshotStub.reset();
    this.afterScreenshotStub.resetBehavior();
    this.processScreenshotStub.reset();
    this.processScreenshotStub.resetBehavior();

    this.expectedResult = {
      misMatchPercentage: 10.5,
      isWithinMisMatchTolerance: false,
      isSameDimensions: true,
      isExactSameImage: false
    };

  });

  it.skip('calls onPrepare hook', async function () {
    // untestable cause this will be executed before tests on launcher process :D
  });

  it('calls before hook', async function () {
    assert.isTrue(this.beforeStub.calledOnce, 'before hook should be called once');
    const beforeArgs = this.beforeStub.args[0];
    assert.lengthOf(beforeArgs, 1, 'before hook should receive 1 argument');
    const [context] = beforeArgs;
    assert.isObject(context, 'befores hook argument context should be an object');

    // test browser
    const { browser } = context;
    assertBrowser(browser);

    // test desiredCapabilities
    const { desiredCapabilities } = context;
    assertDesiredCapabilities(desiredCapabilities);

    // test specs
    const { specs } = context;
    assert.isArray(specs);
  });


  it('calls beforeScreenshot hook', async function () {
    assert.isTrue(this.beforeScreenshotStub.notCalled);

    const options = {};
    await browser.checkDocument();

    assert.isTrue(this.beforeScreenshotStub.calledBefore(this.afterScreenshotStub));

    // each hook should be called once for this command
    assert.isTrue(this.beforeScreenshotStub.calledOnce, 'beforeScreenshot hook should be called once');

    const beforeScreenshotArgs = this.beforeScreenshotStub.args[0];

    assert.lengthOf(beforeScreenshotArgs, 1);

    const [screenshotContext] = beforeScreenshotArgs;

    assertScreenshotContext(options, TYPE_DOCUMENT, screenshotContext);
  });


  it('calls afterScreenshot hook', async function () {
    assert.isTrue(this.afterScreenshotStub.notCalled);

    const options = {};
    const results = await browser.checkDocument();

    assert.isTrue(this.afterScreenshotStub.calledAfter(this.beforeScreenshotStub));

    // each hook should be called once for this command
    assert.isTrue(this.afterScreenshotStub.calledOnce, 'afterScreenshot hook should be called once');

    const afterScreenshotArgs = this.afterScreenshotStub.args[0];

    assert.lengthOf(afterScreenshotArgs, 2);

    const [screenshotContext, base64Screenshot] = afterScreenshotArgs;
    assertScreenshotContext(options, TYPE_DOCUMENT, screenshotContext);
    assert.isString(base64Screenshot, 'Screenshot should be a base64 string');
  });

  it('calls processScreenshot hook', async function () {
    assert.isTrue(this.processScreenshotStub.notCalled);

    const options = {};
    const results = await browser.checkDocument();

    assert.isTrue(this.processScreenshotStub.calledAfter(this.afterScreenshotStub));

    // each hook should be called once for this command
    assert.isTrue(this.processScreenshotStub.calledOnce, 'processScreenshot hook should be called once');

    const processScreenshotArgs = this.processScreenshotStub.args[0];

    assert.lengthOf(processScreenshotArgs, 2);

    const [screenshotContext, base64Screenshot] = processScreenshotArgs;
    assertScreenshotContext(options, TYPE_DOCUMENT, screenshotContext);
    assert.isString(base64Screenshot, 'Screenshot should be a base64 string');
  });

  it.skip('calls onComplete hook', function () {
    // untestable cause this will be executed after tests on launcher process :D
  });

  it('returns result from processScreenshot hook', async function () {
    const expectedResult = {
      misMatchPercentage: 10.05,
      isWithinMisMatchTolerance: false,
      isSameDimensions: true,
      isExactSameImage: true,
    };

    this.processScreenshotStub.returns(expectedResult);

    const options = {};
    const results = await browser.checkDocument();

    assert.isArray(results, 'results should be an array of results');
    assert.lengthOf(results, 1);

    const [result] = results;

    assert.strictEqual(result, expectedResult);
  });

  context('viewportChangePause', function () {

    beforeEach(function () {
      spy(browser, 'pause');
      spy(browser, 'setViewportSize');
    });

    afterEach(function () {
      browser.pause.restore();
      browser.setViewportSize.restore();
    });

    it('uses a custom delay passed in constructor options', async function () {
      await browser.checkViewport({
        viewports: [{ width: 500, height: 1000 }],
      });

      assert.isTrue(browser.pause.calledAfter(browser.setViewportSize), 'browser.pause should have been after setViewportSize');
      assert.isTrue(browser.pause.calledWith(250), 'browser.pause should have been called called with 250');
    });

    it('uses a custom delay passed in command options', async function () {
      await browser.checkViewport({
        viewports: [{ width: 500, height: 1000 }],
        viewportChangePause: 1500,
      });

      assert.isTrue(browser.pause.calledAfter(browser.setViewportSize), 'browser.pause should have been called after setViewportSize');
      assert.isTrue(browser.pause.calledWith(1500), 'browser.pause should have been called with 1500');
    });
  });

  context('viewports', function () {

    beforeEach(function () {
      spy(browser, 'setViewportSize');
    });

    afterEach(function () {
      browser.setViewportSize.restore();
    });

    it('uses viewport passed in constructor options', async function () {
      const expectedViewport = browser.options.visualRegression.viewports[0];
      await browser.checkViewport();

      const viewport = browser.setViewportSize.args[0][0];
      assert.deepEqual(viewport, expectedViewport, 'browser.setViewportSize should have been called with global value');
    });

    it('uses a custom viewport passed in command options', async function () {
      const expectedViewport = { width: 500, height: 600 };

      await browser.checkViewport({
        viewports: [expectedViewport],
      });

      const viewport = browser.setViewportSize.args[0][0];
      assert.deepEqual(viewport, expectedViewport, 'browser.setViewportSize should have been called with custom value');
    });
  });

  // it('calls after hook', async function () {
  //   // NOTE: can not test this, cause this will be executed after tests..
  //   assert.isTrue(this.afterStub.calledOnce, 'after hook should be called once');
  //   const afterArgs = this.afterStub.args[0];
  //   assert.lengthOf(afterArgs, 0, 'after hook shouldnt receive arguments');
  // });


});
