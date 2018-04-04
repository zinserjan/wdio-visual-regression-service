import BaseCompare from './BaseCompare';
import debug from 'debug';
import _ from 'lodash';

import SpectreClient from "nodeclient-spectre";

const log = debug('wdio-visual-regression-service:Spectre');
const runtimeConfigName = 'spectre-run';

export default class Spectre extends BaseCompare {

  constructor(options = {}) {
    super();
    this.fuzzLevel = _.get(options, 'fuzzLevel', 30);
    this.spectreURL = options.url;
    this.project = options.project;
    this.suite = options.suite;
    this.test = options.test;
    this.browser = options.browser;
    this.size = options.size;
    this.spectreClient = new SpectreClient(this.spectreURL);
  }

  async onPrepare() {
    const creationOptions = `Api-Url: ${this.spectreURL}, Project: ${this.project}, Suite: ${this.suite}`;
    log(`${creationOptions} - Creating testrun`);
    const result = await this.spectreClient.createTestrun(this.project, this.suite);
    log(`${creationOptions} - Testrun created - Run-Id: #${result.id}`);
    this.saveRuntimeConfig(runtimeConfigName, result);
  }

  async processScreenshot(context, base64Screenshot) {
    const runDetails = await this.getRuntimeConfig(runtimeConfigName);
    const testrunID = runDetails.id;
    const test = this.test(context);
    const browser = this.browser(context);
    const size = this.size(context);
    const fuzzLevel = `${_.get(context, 'options.fuzzLevel', this.fuzzLevel)}%`;
    const url = _.get(context, 'meta.url', undefined);

    const uploadName = `Run-Id: #${testrunID}, Test: ${test}, Url: ${url}, Browser: ${browser}, Size: ${size}, Fuzz-Level: ${fuzzLevel}`;
    log(`${uploadName} - Starting upload`);

    const result = await this.spectreClient.submitScreenshot(test, browser, size, base64Screenshot, testrunID, '', url, fuzzLevel);
    log(`${uploadName} - Upload successful`);

    if (result.pass) {
      log(`${uploadName} - Image is within tolerance or the same`);
      return this.createResultReport(result.diff, result.pass, true);
    } else {
      log(`${uploadName} - Image is different! ${result.diff}%`);
      return this.createResultReport(result.diff, result.pass, true);
    }
  }

  async onComplete() {
    await this.cleanUpRuntimeConfigs();
  }
}
