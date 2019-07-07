import path from 'path';
import { assert } from 'chai';
import { stub } from 'sinon';
import fs from 'fs-extra';

import BaseCompare from '../../../src/methods/BaseCompare';
import SaveScreenshot from '../../../src/methods/SaveScreenshot';

const dirTmp = path.join(process.cwd(), '.tmp');
const dirFixture = path.join(__dirname, '../../fixture/');

async function readAsBase64(file) {
  // read binary data
  const content = await fs.readFile(file);
  // convert binary data to base64 encoded string
  return new Buffer(content).toString('base64');
}

function pause(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

describe('SaveScreenshot', function() {
  beforeEach(async function() {
    await fs.remove(dirTmp);
  });

  after(async function() {
    await fs.remove(dirTmp);
  });

  it('creates a instance of BaseCompare', async function() {
    const saveScreenshot = new SaveScreenshot();
    assert.instanceOf(saveScreenshot, BaseCompare, 'SaveScreenshot should extend BaseCompare');
  });

  context('processScreenshot', function() {
    beforeEach(async function() {
      this.referencFile = path.join(dirTmp, 'reference.png');
      this.getReferenceFile = stub().returns(this.referencFile);

      this.saveScreenshot = new SaveScreenshot({
        screenshotName: this.getReferenceFile
      });

      this.resultIdentical = {
        misMatchPercentage: 0,
        isWithinMisMatchTolerance: true,
        isSameDimensions: true,
        isExactSameImage: true
      };
    });

    it('creates a reference file for the first run', async function() {
      const context = {};
      const base64Screenshot = await readAsBase64(path.join(dirFixture, 'image/100x100.png'));

      const results = await this.saveScreenshot.processScreenshot(context, base64Screenshot);

      // check reference getter
      assert.strictEqual(this.getReferenceFile.callCount, 1, 'Reference getter should be called once');
      assert.isTrue(this.getReferenceFile.calledWithExactly(context), 'Reference getter should receive context as arg');

      // check image results
      assert.deepEqual(results, this.resultIdentical, 'Result should be reported');

      // check if reference image was created
      const existsReference = await fs.exists(this.referencFile);
      assert.isTrue(existsReference, 'Reference screenshot should exist');
    });

    it('updates the reference image when changes are in tolerance', async function() {
      const context = {};
      const base64Screenshot = await readAsBase64(path.join(dirFixture, 'image/100x100.png'));

      // 1st run -> create reference
      const resultFirst = await this.saveScreenshot.processScreenshot(context, base64Screenshot);

      // check reference getter
      assert.strictEqual(this.getReferenceFile.callCount, 1, 'Reference getter should be called once');
      assert.isTrue(this.getReferenceFile.calledWithExactly(context), 'Reference getter should receive context as arg');

      // check image results
      assert.deepEqual(resultFirst, this.resultIdentical, 'Result should be reported');

      // check if reference was created
      const existsReference = await fs.exists(this.referencFile);
      assert.isTrue(existsReference, 'Captured screenshot should exist');

      // check last modified
      const statsFirst = await fs.stat(this.referencFile);
      assert.isAbove(statsFirst.mtime.getTime(), 0);

      // wait to get a different last modified time
      await pause(1000);

      // 2nd run --> update reference image
      const resultSecond = await this.saveScreenshot.processScreenshot(context, base64Screenshot);

      // check reference getter
      assert.strictEqual(this.getReferenceFile.callCount, 2, 'Reference getter should be called once');
      assert.isTrue(
        this.getReferenceFile.alwaysCalledWithExactly(context),
        'Reference getter should receive context as arg'
      );

      // check if image is reported as same
      assert.deepEqual(resultSecond, this.resultIdentical, 'Result should be reported');

      // check if reference was updated
      const statsSecond = await fs.stat(this.referencFile);
      assert.isAbove(statsSecond.mtime.getTime(), statsFirst.mtime.getTime(), 'File should be modified');
    });

    it('updates the reference image when changes are not in tolerance', async function() {
      const context = {};
      const base64ScreenshotReference = await readAsBase64(path.join(dirFixture, 'image/100x100.png'));
      const base64ScreenshotNew = await readAsBase64(path.join(dirFixture, 'image/100x100-rotated.png'));

      // 1st run -> create reference
      const resultFirst = await this.saveScreenshot.processScreenshot(context, base64ScreenshotReference);

      // check reference getter
      assert.strictEqual(this.getReferenceFile.callCount, 1, 'Reference getter should be called once');
      assert.isTrue(this.getReferenceFile.calledWithExactly(context), 'Reference getter should receive context as arg');

      // check image results
      assert.deepEqual(resultFirst, this.resultIdentical, 'Result should be reported');

      // check if reference was created
      const existsReference = await fs.exists(this.referencFile);
      assert.isTrue(existsReference, 'Captured screenshot should exist');

      // check last modified
      const statsFirst = await fs.stat(this.referencFile);
      assert.isAbove(statsFirst.mtime.getTime(), 0);

      // wait to get a different last modified time
      await pause(1000);

      // 2nd run --> update refernece with diff image
      const resultSecond = await this.saveScreenshot.processScreenshot(context, base64ScreenshotNew);

      // check reference getter
      assert.strictEqual(this.getReferenceFile.callCount, 2, 'Reference getter should be called once');
      assert.isTrue(
        this.getReferenceFile.alwaysCalledWithExactly(context),
        'Reference getter should receive context as arg'
      );

      // check if image is reported as same (we don't care about the results here, as we are just overwriting all reference screenshots)
      assert.deepEqual(resultSecond, this.resultIdentical, 'Result should be reported');

      // check if reference was updated
      const statsSecond = await fs.stat(this.referencFile);
      assert.isAbove(statsSecond.mtime.getTime(), statsFirst.mtime.getTime(), 'File should be modified');
    });
  });
});
