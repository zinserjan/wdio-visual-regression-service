import path from 'path';
import { assert } from 'chai';
import { stub } from 'sinon';
import fs from 'fs-extra';
import nock from 'nock';
import BaseCompare from '../../../src/methods/BaseCompare';
import { Spectre } from '../../../src/compare';
import { createTestMethodInstance } from '../../helper/compareMethod';


const dirFixture = path.join(__dirname, '../../fixture/');


async function readAsBase64(file) {
  // read binary data
  const content = await fs.readFile(file);
  // convert binary data to base64 encoded string
  return new Buffer(content).toString('base64');
}

describe.only('Spectre', function () {
  beforeEach(function () {
    nock.disableNetConnect();

    this.url = 'http://localhost:3000';
    this.project = 'test-project';
    this.suite = 'test-suite';
    this.spectreOptions = {
      testName: 'MyTest',
      browser: 'Chrome',
      size: '100px'
    };
    this.spectreOptionsHelper = stub().returns(this.spectreOptions);
  });

  afterEach(function () {
    nock.enableNetConnect();
    nock.cleanAll();
  });

  it('creates a instance of BaseCompare', async function () {
    const instance = new Spectre({
      spectreOptions: this.spectreOptionsHelper,
      url: this.url,
      project: this.project,
      suite: this.suite
    });
    assert.instanceOf(instance, BaseCompare, 'Spectre should extend BaseCompare');
  });

  it('creates test run and uploads screenshots', async function () {
    const base64Screenshot1 = await readAsBase64(path.join(dirFixture, 'image/100x100.png'));
    const base64Screenshot2 = await readAsBase64(path.join(dirFixture, 'image/100x100-rotated.png'));
    let requestBody = null;

    const instance = createTestMethodInstance(Spectre, {
      spectreOptions: this.spectreOptionsHelper,
      url: this.url,
      project: this.project,
      suite: this.suite
    });

    nock(this.url)
      .post('/runs', function (body) {
        requestBody = body;
        return true;
      })
      .once()
      .reply(200, {
        id: 112,
        suite_id: 44,
        created_at: '2018-03-22T15:43:11.720Z',
        updated_at: '2018-03-22T15:43:11.720Z',
        sequential_id: 1,
        url: `/projects/${this.project}/suites/${this.suite}/runs/1`
      });

    await instance.before();

    assert.isNotNull(requestBody, "Request should be finished!");
    assert.include(requestBody, 'name="project"');
    assert.include(requestBody, this.project);
    assert.include(requestBody, 'name="suite"');
    assert.include(requestBody, this.suite);

    nock(this.url)
      .post('/tests')
      .once()
      .reply(200, {
        id: 1128,
        name: this.spectreOptions.testName,
        browser: this.spectreOptions.browser,
        size: this.spectreOptions.size,
        run_id: 111,
        diff: 0,
        created_at: '2018-03-22T15:34:15.036Z',
        updated_at: '2018-03-22T15:34:15.206Z',
        screenshot_uid: '2018/03/22/6qiv4yz8n9_1128_test.png',
        screenshot_baseline_uid: '2018/03/22/9c4qcvtiyf_1128_baseline.png',
        screenshot_diff_uid: '2018/03/22/34jop3ovj7_1128_diff.png',
        key: 'test-project-test-suite-mytest-chrome-100px',
        pass: true,
        source_url: '',
        fuzz_level: '30%',
        highlight_colour: 'ff00ff',
        crop_area: '',
        url: `/projects/${this.project}/suites/${this.suite}/runs/2#test_1128`
      });

    const context = {};

    const resultIdentitical = await instance.afterScreenshot(context, base64Screenshot1);

    assert.strictEqual(this.spectreOptionsHelper.callCount, 1, 'spectreOptions getter should be called once');
    assert.isTrue(this.spectreOptionsHelper.calledWithExactly(context), 'spectreOptions getter should receive context as arg');

    assert.deepEqual(resultIdentitical, {
      misMatchPercentage: 0,
      isWithinMisMatchTolerance: true,
      isSameDimensions: null,
      isExactSameImage: true
    }, 'Result should be reported');

    nock(this.url)
      .post('/tests')
      .once()
      .reply(200, {
        id: 1131,
        name: this.spectreOptions.testName,
        browser: this.spectreOptions.browser,
        size: this.spectreOptions.size,
        run_id: 112,
        diff: 4.56,
        created_at: "2018-03-22T15:43:12.792Z",
        updated_at: "2018-03-22T15:43:12.996Z",
        screenshot_uid: "2018/03/22/396hsmk5pv_1131_test.png",
        screenshot_baseline_uid: "2018/03/22/81gnw0lg50_1131_baseline.png",
        screenshot_diff_uid: "2018/03/22/17alxnmrin_1131_diff.png",
        key: "test-project-test-suite-mytest-chrome-100px",
        pass: false,
        source_url: "",
        fuzz_level: "30%",
        highlight_colour: "ff00ff",
        crop_area: "",
        url: `/projects/${this.project}/suites/${this.suite}/runs/1#test_1131`
      });

    const resultDifferent = await instance.afterScreenshot(context, base64Screenshot2);

    assert.strictEqual(this.spectreOptionsHelper.callCount, 2, 'spectreOptions getter should be called once');
    assert.isTrue(this.spectreOptionsHelper.calledWithExactly(context), 'spectreOptions getter should receive context as arg');

    assert.deepEqual(resultDifferent, {
      misMatchPercentage: 4.56,
      isWithinMisMatchTolerance: false,
      isSameDimensions: null,
      isExactSameImage: false,
    }, 'Result should be reported');
  });
});
