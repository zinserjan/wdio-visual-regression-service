import path from 'path';
import { assert } from 'chai';
import { stub } from 'sinon';
import fs from 'fs-promise';

import compareImages from '../../helper/compareImages';

import BaseCompare from '../../../src/methods/BaseCompare';
import LocalCompare from '../../../src/methods/LocalCompare';

const dirTmp = path.join(process.cwd(), '.tmp');
const dirFixture = path.join(__dirname, '../../fixture/');


async function readAsBase64(file) {
  // read binary data
  const content = await fs.readFile(file);
  // convert binary data to base64 encoded string
  return new Buffer(content).toString('base64');
}



describe('LocalCompare', function () {

  it('creates a instance of BaseCompare', async function () {
    const localCompare = new LocalCompare();
    assert.instanceOf(localCompare, BaseCompare, 'LocalCompare should extend BaseCompare');
  });

  context('afterScreenshot', function () {
    beforeEach(async function() {
      await fs.remove(dirTmp);

      this.screenshotFile = path.join(dirTmp, 'screenshot.png');
      this.referencFile = path.join(dirTmp, 'reference.png');
      this.diffFile = path.join(dirTmp, 'diff.png');

      this.getScreenshotFile = stub().returns(this.screenshotFile);
      this.getReferenceFile = stub().returns(this.referencFile);
      this.getDiffFile = stub().returns(this.diffFile);

      this.localCompare = new LocalCompare({
        screenshotName: this.getScreenshotFile,
        referenceName: this.getReferenceFile,
        diffName: this.getDiffFile,
      });

      this.resultIdentical = {
        misMatchPercentage: 0,
        isWithinMisMatchTolerance: true,
        isSameDimensions: true,
        isExactSameImage: true
      };
    });

    after(async function () {
      await fs.remove(dirTmp);
    });

    it('creates the captured screenshot', async function () {
      const context = {};
      const base64Screenshot = await readAsBase64(path.join(dirFixture, 'image/100x100.png'));

      await this.localCompare.afterScreenshot(context, base64Screenshot);

      // check screenshot getter
      assert.strictEqual(this.getScreenshotFile.callCount, 1, 'Screenshot getter should be called once');
      assert.isTrue(this.getScreenshotFile.calledWithExactly(context), 'Screenshot getter should receive context as arg');

      // check if screenshot was created
      const existsScreenshot = await fs.exists(this.screenshotFile);
      assert.isTrue(existsScreenshot, 'Captured screenshot should exist');
    });

    it('creates a reference file for the first run', async function () {
      const context = {};
      const base64Screenshot = await readAsBase64(path.join(dirFixture, 'image/100x100.png'));

      const results = await this.localCompare.afterScreenshot(context, base64Screenshot);

      // check reference getter
      assert.strictEqual(this.getReferenceFile.callCount, 1, 'Reference getter should be called once');
      assert.isTrue(this.getReferenceFile.calledWithExactly(context), 'Reference getter should receive context as arg');

      // check image results
      assert.deepEqual(results, this.resultIdentical, 'Result should be reported');

      // check if reference image was created
      const existsReference = await fs.exists(this.referencFile);
      assert.isTrue(existsReference, 'Reference screenshot should exist');

    });

    it('updates the reference image when changes are in tolerance', async function () {
      const context = {};
      const base64Screenshot = await readAsBase64(path.join(dirFixture, 'image/100x100.png'));

      // 1st run -> create reference
      const resultFirst = await this.localCompare.afterScreenshot(context, base64Screenshot);

      // check reference getter
      assert.strictEqual(this.getReferenceFile.callCount, 1, 'Reference getter should be called once');
      assert.isTrue(this.getReferenceFile.calledWithExactly(context), 'Reference getter should receive context as arg');

      // check image results
      assert.deepEqual(resultFirst, this.resultIdentical, 'Result should be reported');

      // check if reference was created
      const existsReference = await fs.exists(this.screenshotFile);
      assert.isTrue(existsReference, 'Captured screenshot should exist');

      // check last modified
      const statsFirst = await fs.stat(this.referencFile);
      assert.isAbove(statsFirst.mtime.getTime(), 0);

      // 2nd run --> update reference image
      const resultSecond = await this.localCompare.afterScreenshot(context, base64Screenshot);

      // check reference getter
      assert.strictEqual(this.getReferenceFile.callCount, 2, 'Reference getter should be called once');
      assert.isTrue(this.getReferenceFile.alwaysCalledWithExactly(context), 'Reference getter should receive context as arg');

      // check if image is reported as same
      assert.deepEqual(resultSecond, this.resultIdentical, 'Result should be reported');

      // check if reference was updated
      const statsSecond = await fs.stat(this.referencFile);
      assert.isAbove(statsSecond.mtime.getTime(), statsFirst.mtime.getTime(), 'File should be modified');
    });

    it('creates a diff image when changes are not in tolerance', async function () {
      const context = {};
      const base64ScreenshotReference = await readAsBase64(path.join(dirFixture, 'image/100x100.png'));
      const base64ScreenshotNew = await readAsBase64(path.join(dirFixture, 'image/100x100-rotated.png'));

      // 1st run -> create reference
      const resultFirst = await this.localCompare.afterScreenshot(context, base64ScreenshotReference);

      // check reference getter
      assert.strictEqual(this.getReferenceFile.callCount, 1, 'Reference getter should be called once');
      assert.isTrue(this.getReferenceFile.calledWithExactly(context), 'Reference getter should receive context as arg');

      // check image results
      assert.deepEqual(resultFirst, this.resultIdentical, 'Result should be reported');

      // check if reference was created
      const existsReference = await fs.exists(this.screenshotFile);
      assert.isTrue(existsReference, 'Captured screenshot should exist');

      // check last modified
      const statsFirst = await fs.stat(this.referencFile);
      assert.isAbove(statsFirst.mtime.getTime(), 0);

      // 2nd run --> create diff image
      const resultSecond = await this.localCompare.afterScreenshot(context, base64ScreenshotNew);

      // check diff getter
      assert.strictEqual(this.getDiffFile.callCount, 1, 'Diff getter should be called once');
      assert.isTrue(this.getDiffFile.calledWithExactly(context), 'Diff getter should receive context as arg');

      // check diff results
      assert.isAbove(resultSecond.misMatchPercentage, resultFirst.misMatchPercentage, 'Images should diff');
      assert.isFalse(resultSecond.isExactSameImage, 'Images should diff');
      assert.isFalse(resultSecond.isWithinMisMatchTolerance, 'Images should be marked as diff');
      assert.isTrue(resultSecond.isSameDimensions, 'Image dimensioms should be the same');

      // check if reference is still the same
      const statsSecond = await fs.stat(this.referencFile);
      assert.strictEqual(statsSecond.mtime.getTime(), statsFirst.mtime.getTime(), 'Reference file should be the same');

      // check if diff image was created
      const existsDiff = await fs.exists(this.diffFile);
      assert.isTrue(existsReference, 'Diff screenshot should exists');

      // check if diff is correct
      await compareImages(this.diffFile, path.join(dirFixture, 'image/100x100-diff.png'))
    });


  });


});
