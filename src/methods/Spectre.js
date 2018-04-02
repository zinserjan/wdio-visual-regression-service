import fs from 'fs-extra';
import path from 'path';
import BaseCompare from './BaseCompare';
import debug from 'debug';
import _ from 'lodash';

import SpectreClient from "nodeclient-spectre";

const log = debug('wdio-visual-regression-service:Spectre');

const pathToRunIDJson = path.join(__dirname, './run_id.json');

export default class Spectre extends BaseCompare {

  constructor(options = {}) {
    super();
    this.getSpectreUploadOptions = options.spectreOptions;
    this.fuzzLevel = _.get(options, 'fuzzLevel', 30);
    this.spectreURL = options.url;
    this.project = options.project;
    this.suite = options.suite;
    this.spectreClient = new SpectreClient(this.spectreURL);
  }

  async onPrepare() {
    const creationOptions = `Api-Url: ${this.spectreURL}, Project: ${this.project}, Suite: ${this.suite}`;
    log(`${creationOptions} - Creating testrun`);
    const result = await this.spectreClient.createTestrun(this.project, this.suite);
    log(`${creationOptions} - Testrun created - Run-Id: #${result.id}`);
    try{
      await fs.writeJson(pathToRunIDJson, result);
      log(`${creationOptions} - Saved Run-Id #${result.id} to ${pathToRunIDJson}`);
    }
    catch (e){
      throw new Error(`Unable to write file to ${pathToRunIDJson}`);
    }
  }

  async afterScreenshot(context, base64Screenshot) {
    const spectreUploadOptions = this.getSpectreUploadOptions(context);
    const testrunID = (await fs.readJson(pathToRunIDJson, 'utf8')).id;
    const fuzzLevel = `${_.get(context, 'options.fuzzLevel', this.fuzzLevel)}%`;

    const uploadName = `Test: ${spectreUploadOptions.testName}, Browser: ${spectreUploadOptions.browser}, Size: ${spectreUploadOptions.size}, Run-Id:  #${testrunID}`;
    log(`${uploadName} - Starting upload`);

    const result = await this.spectreClient.submitScreenshot(spectreUploadOptions.testName, spectreUploadOptions.browser, spectreUploadOptions.size, base64Screenshot, testrunID, '', context.meta.url, fuzzLevel);
    log(`${uploadName} - Upload successful`);

    if (result.pass) {
      log(`${uploadName} - Image is within tolerance or the same`);
      return this.createResultReport(result.diff, result.pass, true);
    } else {
      log(`${uploadName} - Image is different! ${result.diff}%`);
      return this.createResultReport(result.diff, result.pass, true);
    }
  }
}
