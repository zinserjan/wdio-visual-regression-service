import fs from 'fs-extra';
import resemble from 'node-resemble-js';
import BaseCompare from './BaseCompare';
import debug from 'debug';
import _ from 'lodash';

const log = debug('wdio-visual-regression-service:LocalCompare');

export default class LocalCompare extends BaseCompare {

  constructor(options = {}) {
    super();
    this.getScreenshotFile = options.screenshotName;
    this.getReferencefile = options.referenceName;
    this.getDiffFile = options.diffName;
    this.misMatchTolerance = _.get(options, 'misMatchTolerance', 0.01);
    this.ignoreComparison = _.get(options, 'ignoreComparison', 'nothing');
  }

  async processScreenshot(context, base64Screenshot) {
    const screenshotPath = this.getScreenshotFile(context);
    const referencePath = this.getReferencefile(context);

    await fs.outputFile(screenshotPath, base64Screenshot, 'base64');

    const referenceExists = await fs.exists(referencePath);

    if (referenceExists) {
      log('reference exists, compare it with the taken now');
      const captured = new Buffer(base64Screenshot, 'base64');
      const ignoreComparison = _.get(context, 'options.ignoreComparison', this.ignoreComparison);

      const compareData = await this.compareImages(referencePath, captured, ignoreComparison);

      const { isSameDimensions } = compareData;
      const misMatchPercentage = Number(compareData.misMatchPercentage);
      const misMatchTolerance = _.get(context, 'options.misMatchTolerance', this.misMatchTolerance);

      const diffPath = this.getDiffFile(context);

      if (misMatchPercentage > misMatchTolerance) {
        log(`Image is different! ${misMatchPercentage}%`);
        const png = compareData.getDiffImage().pack();
        await this.writeDiff(png, diffPath);

        return this.createResultReport(misMatchPercentage, false, isSameDimensions);
      } else {
        log(`Image is within tolerance or the same`);
        await fs.remove(diffPath);

        return this.createResultReport(misMatchPercentage, true, isSameDimensions);
      }

    } else {
      log('first run - create reference file');
      await fs.outputFile(referencePath, base64Screenshot, 'base64');
      return this.createResultReport(0, true, true);
    }
  }

  /**
   * Compares two images with resemble
   * @param  {Buffer|string} reference path to reference file or buffer
   * @param  {Buffer|string} screenshot path to file or buffer to compare with reference
   * @return {{misMatchPercentage: Number, isSameDimensions:Boolean, getImageDataUrl: function}}
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
   * Writes provided diff by resemble as png
   * @param  {Stream} png node-png file Stream.
   * @return {Promise}
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
