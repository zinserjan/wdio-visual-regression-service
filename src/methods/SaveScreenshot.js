import fs from 'fs-extra';
import BaseCompare from './BaseCompare';
import debug from 'debug';

const log = debug('wdio-visual-regression-service:SaveScreenshot');

export default class SaveScreenshot extends BaseCompare {

  constructor(options = {}) {
    super();
    this.getScreenshotFile = options.screenshotName;
  }

  async processScreenshot(context, base64Screenshot) {
    const screenshotPath = this.getScreenshotFile(context);

    log(`create screenshot file at ${screenshotPath}`);
    await fs.outputFile(screenshotPath, base64Screenshot, 'base64');
    return this.createResultReport(0, true, true);
  }

}
