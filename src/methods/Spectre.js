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
    this.misMatchTolerance = `${_.get(options, 'misMatchTolerance', 30)}%`;
    this.spectreURL = options.url;
    this.project = options.project;
    this.suite = options.suite;
    this.spectreClient = new SpectreClient(this.spectreURL);
  }

  async before(context){
    const creationOptions = `spectreURL: ${this.spectreURL}, project: ${this.project}, suite: ${this.suite}`;
    log(`${creationOptions} - creating testrun`);
    const result = await this.spectreClient.createTestrun(this.project, this.suite);
    log(`${creationOptions} - testrun created - run_id: #${result.id}`);
    try{
      await fs.writeJson(pathToRunIDJson, result);
      log(`Saved run_id #${result.id} to ${pathToRunIDJson}`);
    }
    catch (e){
      throw new Error(`Unable to write file to ${pathToRunIDJson}`);
    }
  }

  async afterScreenshot(context, base64Screenshot) {
    const spectreUploadOptions = this.getSpectreUploadOptions(context);
    const misMatchTolerance = this.misMatchTolerance;
    const testrunID = (await fs.readJson(pathToRunIDJson, 'utf8')).id;

    const uploadName = `spectreTestname : ${spectreUploadOptions.testName}, browser: ${spectreUploadOptions.browser}, size: ${spectreUploadOptions.size}, run_id:  #${testrunID}`;
    log(`${uploadName} - starting upload`);

    const result = await this.spectreClient.submitScreenshot(spectreUploadOptions.testName, spectreUploadOptions.browser, spectreUploadOptions.size, base64Screenshot, testrunID, '', '', misMatchTolerance);
    log(`${uploadName} - upload successful`);

    if (result.pass) {
      log(`${uploadName} - Image is within tolerance or the same`);
      return this.createResultReport(result.diff, result.pass, true);
    } else {
      log(`${uploadName} - Image is different! ${result.diff}%`);
      return this.createResultReport(result.diff, result.pass, true);
    }
  }
}
