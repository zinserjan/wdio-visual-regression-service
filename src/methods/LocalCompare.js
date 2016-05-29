import path from 'path';
import _ from 'lodash';
import fs from 'fs-promise';
import resemble from 'node-resemble-js';
import BaseCompare from './BaseCompare';

function getScreenshotName(context) {
  const {
    type,
    test,
    browser,
  } = context;

  const testName = test.title;
  const browserVersion = parseInt(/\d+/.exec(browser.version)[0]);
  const browserName = browser.name;

  return `${testName}_${type}_${browserName}_v${browserVersion}.png`;
}

export default class LocalCompare extends BaseCompare {

  constructor(options = {}) {
    super();
    this.screenshotPath = _.get(options, 'screenshotPath', path.join(process.cwd(), 'screenshots/taken'));
    this.referencePath = _.get(options, 'referencePath', path.join(process.cwd(), 'screenshots/reference'));
    this.diffPath = _.get(options, 'diffPath', path.join(process.cwd(), 'screenshots/diff'));
    this.getScreenshotName = _.get(options, 'screenshotName', getScreenshotName);
  }

  async before(context) {
    const {
      name,
      version
    } = context.browser;
    console.log(`Starting tests with browser ${name} ${version}`);

    await fs.ensureDir(this.screenshotPath);
    await fs.ensureDir(this.referencePath);
    await fs.ensureDir(this.diffPath);

  }

  async afterScreenshot(context, base64Screenshot) {
    console.log('afterScreenshot', context);
    const screenshotName = this.getScreenshotName(context);

    const screenshotPath = path.join(this.screenshotPath, screenshotName);
    const referencePath = path.join(this.referencePath, screenshotName);
    const diffPath = path.join(this.diffPath, screenshotName);

    await fs.outputFile(screenshotPath, base64Screenshot, 'base64');

    const referenceExists = await fs.exists(referencePath);

    if (referenceExists) {
      console.log('reference exists, compare it with the taken now');
      const captured = new Buffer(base64Screenshot, 'base64');

      const compareData = await this.compareImages(referencePath, captured);

      const { isSameDimensions } = compareData;
      const misMatchPercentage = Number(compareData.misMatchPercentage);

      if (misMatchPercentage > 0.01) {
        console.log(`Image is different! ${misMatchPercentage}%`);
        const png = compareData.getDiffImage().pack();
        await this.writeDiff(png, diffPath);

        return this.createResultReport(misMatchPercentage, false, isSameDimensions);
      } else {
        console.log(`Image is within tolerance or the same. Updating base image`);
        await fs.outputFile(referencePath, base64Screenshot, 'base64');

        return this.createResultReport(misMatchPercentage, true, isSameDimensions);
      }

    } else {
      console.log('first run - create reference file');
      await fs.outputFile(referencePath, base64Screenshot, 'base64');
      return this.createResultReport(0, true, true);
    }
  }

  /**
   * Compares two images with resemble
   * @param  {[type]} reference  [description]
   * @param  {[type]} screenshot [description]
   * @return {[type]}            [description]
   */
  async compareImages(reference, screenshot, ignore = '') {
    return await new Promise((resolve) => {
      const image = resemble(reference).compareTo(screenshot);

      switch(ignore) {
        case 'colors':
          image.ignoreColors();
          break;
        case 'antialiasing':
          image.ignoreAntialiasing();
          break;
      }

      image.onComplete((data) => {
        resolve(data);
      });
    });
  }


  /**
   * Writes provided diff png by resemble to file
   * @param  {[type]} png [description]
   * @return {[type]}     [description]
   */
  async writeDiff(png, filepath) {
    await new Promise((resolve, reject) => {
      const chunks = [];
      png.on('data', function(chunk) {
        chunks.push(chunk);
      });
      png.on('end', () => {
        const buffer = Buffer.concat(chunks);

        Promise
        .resolve()
        .then(() => fs.outputFile(filepath, buffer.toString('base64'), 'base64'))
        .then(() => resolve())
        .catch(reject);
      });
      png.on('error', (err) => reject(err));
    });
  }


}
