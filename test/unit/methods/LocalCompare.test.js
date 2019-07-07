import path from 'path';
import { assert } from 'chai';
import { stub } from 'sinon';
import fs from 'fs-extra';

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

describe('LocalCompare', function() {
  beforeEach(async function() {
    await fs.remove(dirTmp);
  });

  after(async function() {
    await fs.remove(dirTmp);
  });

  it('creates a instance of BaseCompare', async function() {
    const localCompare = new LocalCompare();
    assert.instanceOf(localCompare, BaseCompare, 'LocalCompare should extend BaseCompare');
  });

  context('processScreenshot', function() {
    beforeEach(async function() {
      this.screenshotFile = path.join(dirTmp, 'screenshot.png');
      this.referencFile = path.join(dirTmp, 'reference.png');
      this.diffFile = path.join(dirTmp, 'diff.png');

      this.getScreenshotFile = stub().returns(this.screenshotFile);
      this.getReferenceFile = stub().returns(this.referencFile);
      this.getDiffFile = stub().returns(this.diffFile);

      this.localCompare = new LocalCompare({
        screenshotName: this.getScreenshotFile,
        referenceName: this.getReferenceFile,
        diffName: this.getDiffFile
      });

      this.resultIdentical = {
        misMatchPercentage: 0,
        isWithinMisMatchTolerance: true,
        isSameDimensions: true,
        isExactSameImage: true
      };
    });

    it('creates the captured screenshot', async function() {
      const context = {};
      const base64Screenshot = await readAsBase64(path.join(dirFixture, 'image/100x100.png'));

      await this.localCompare.processScreenshot(context, base64Screenshot);

      // check screenshot getter
      assert.strictEqual(this.getScreenshotFile.callCount, 1, 'Screenshot getter should be called once');
      assert.isTrue(
        this.getScreenshotFile.calledWithExactly(context),
        'Screenshot getter should receive context as arg'
      );

      // check if screenshot was created
      const existsScreenshot = await fs.exists(this.screenshotFile);
      assert.isTrue(existsScreenshot, 'Captured screenshot should exist');
    });

    it('creates a reference file for the first run', async function() {
      const context = {};
      const base64Screenshot = await readAsBase64(path.join(dirFixture, 'image/100x100.png'));

      const results = await this.localCompare.processScreenshot(context, base64Screenshot);

      // check reference getter
      assert.strictEqual(this.getReferenceFile.callCount, 1, 'Reference getter should be called once');
      assert.isTrue(this.getReferenceFile.calledWithExactly(context), 'Reference getter should receive context as arg');

      // check image results
      assert.deepEqual(results, this.resultIdentical, 'Result should be reported');

      // check if reference image was created
      const existsReference = await fs.exists(this.referencFile);
      assert.isTrue(existsReference, 'Reference screenshot should exist');
    });

    it('does not update the reference image when changes are in tolerance', async function() {
      const context = {};
      const base64Screenshot = await readAsBase64(path.join(dirFixture, 'image/100x100.png'));

      // 1st run -> create reference
      const resultFirst = await this.localCompare.processScreenshot(context, base64Screenshot);

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

      // 2nd run --> go against reference image
      const resultSecond = await this.localCompare.processScreenshot(context, base64Screenshot);

      // check reference getter
      assert.strictEqual(this.getReferenceFile.callCount, 2, 'Reference getter should be called once');
      assert.isTrue(
        this.getReferenceFile.alwaysCalledWithExactly(context),
        'Reference getter should receive context as arg'
      );

      // check if image is reported as same
      assert.deepEqual(resultSecond, this.resultIdentical, 'Result should be reported');

      // check that reference was not updated
      const statsSecond = await fs.stat(this.referencFile);
      assert.strictEqual(statsSecond.mtime.getTime(), statsFirst.mtime.getTime(), 'File should not be modified');
    });

    it('creates a diff image when changes are not in tolerance', async function() {
      const context = {};
      const base64ScreenshotReference = await readAsBase64(path.join(dirFixture, 'image/100x100.png'));
      const base64ScreenshotNew = await readAsBase64(path.join(dirFixture, 'image/100x100-rotated.png'));

      // 1st run -> create reference
      const resultFirst = await this.localCompare.processScreenshot(context, base64ScreenshotReference);

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
      const resultSecond = await this.localCompare.processScreenshot(context, base64ScreenshotNew);

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
      assert.isTrue(existsDiff, 'Diff screenshot should exists');

      // check if diff is correct
      await compareImages(this.diffFile, path.join(dirFixture, 'image/100x100-diff.png'));
    });

    it('deletes existing diff image when image is in tolerance now', async function() {
      const base64ScreenshotReference = await readAsBase64(path.join(dirFixture, 'image/100x100.png'));
      const base64ScreenshotNew = await readAsBase64(path.join(dirFixture, 'image/100x100-rotated.png'));

      // 1st run -> create reference
      await this.localCompare.processScreenshot({}, base64ScreenshotReference);

      // 2nd run --> create diff image
      await this.localCompare.processScreenshot({}, base64ScreenshotNew);

      // check if diff image was created
      let existsDiff = await fs.exists(this.diffFile);
      assert.isTrue(existsDiff, 'Diff screenshot should exist');

      // 3rd run --> delete existing diff
      const context = {
        options: {
          misMatchTolerance: 100
        }
      };
      await this.localCompare.processScreenshot(context, base64ScreenshotNew);

      // check if diff image was deleted
      existsDiff = await fs.exists(this.diffFile);
      assert.isFalse(existsDiff, 'Diff screenshot should no longer exist');
    });
  });

  context('misMatchTolerance', function() {
    before(async function() {
      this.screenshotBase = await readAsBase64(path.join(dirFixture, 'misMatchTolerance/base.png'));

      this.screenshotToleranceDefaultWithin = await readAsBase64(
        path.join(dirFixture, 'misMatchTolerance/default-within.png')
      );
      this.screenshotToleranceDefaultOutside = await readAsBase64(
        path.join(dirFixture, 'misMatchTolerance/default-outside.png')
      );

      this.screenshotToleranceCustomWithin = await readAsBase64(
        path.join(dirFixture, 'misMatchTolerance/custom-within.png')
      );
      this.screenshotToleranceCustomOutside = await readAsBase64(
        path.join(dirFixture, 'misMatchTolerance/custom-outside.png')
      );
    });

    beforeEach(async function() {
      this.screenshotFile = path.join(dirTmp, 'screenshot.png');
      this.referencFile = path.join(dirTmp, 'reference.png');
      this.diffFile = path.join(dirTmp, 'diff.png');

      this.getScreenshotFile = stub().returns(this.screenshotFile);
      this.getReferenceFile = stub().returns(this.referencFile);
      this.getDiffFile = stub().returns(this.diffFile);
    });

    context('uses default misMatchTolerance', function() {
      beforeEach(async function() {
        this.misMatchTolerance = 0.01;
        this.context = {};

        this.localCompare = new LocalCompare({
          screenshotName: this.getScreenshotFile,
          referenceName: this.getReferenceFile,
          diffName: this.getDiffFile
        });

        // 1st run -> create reference
        const resultFirst = await this.localCompare.processScreenshot({}, this.screenshotBase);

        // check if reference was created
        const existsReference = await fs.exists(this.screenshotFile);
        assert.isTrue(existsReference, 'Captured screenshot should exist');
      });

      it('reports equal when in tolerance', async function() {
        // compare screenshots
        const result = await this.localCompare.processScreenshot(this.context, this.screenshotToleranceDefaultWithin);

        // check diff results
        assert.isAtMost(result.misMatchPercentage, this.misMatchTolerance, 'Images should diff');
        assert.isFalse(result.isExactSameImage, 'Images should diff');
        assert.isTrue(result.isWithinMisMatchTolerance, 'Diff should be in tolerance');

        // check if diff image was not created
        const existsDiff = await fs.exists(this.diffFile);
        assert.isFalse(existsDiff, 'Diff screenshot should not exist');
      });

      it('reports diff when NOT in tolerance', async function() {
        // compare screenshots
        const result = await this.localCompare.processScreenshot(this.context, this.screenshotToleranceDefaultOutside);

        // check diff results
        assert.isAbove(result.misMatchPercentage, this.misMatchTolerance, 'Images should diff');
        assert.isFalse(result.isExactSameImage, 'Images should diff');
        assert.isFalse(result.isWithinMisMatchTolerance, 'Images should be marked as diff');

        // check if diff image was created
        const existsDiff = await fs.exists(this.diffFile);
        assert.isTrue(existsDiff, 'Diff screenshot should exist');
      });
    });

    context('uses custom misMatchTolerance passed in constructor option', function() {
      beforeEach(async function() {
        this.misMatchTolerance = 0.25;
        this.context = {};

        this.localCompare = new LocalCompare({
          screenshotName: this.getScreenshotFile,
          referenceName: this.getReferenceFile,
          diffName: this.getDiffFile,
          misMatchTolerance: this.misMatchTolerance
        });

        // 1st run -> create reference
        const resultFirst = await this.localCompare.processScreenshot({}, this.screenshotBase);

        // check if reference was created
        const existsReference = await fs.exists(this.screenshotFile);
        assert.isTrue(existsReference, 'Captured screenshot should exist');
      });

      it('reports equal when in tolerance', async function() {
        // compare screenshots
        const result = await this.localCompare.processScreenshot(this.context, this.screenshotToleranceCustomWithin);

        // check diff results
        assert.isAtMost(result.misMatchPercentage, this.misMatchTolerance, 'Images should diff');
        assert.isFalse(result.isExactSameImage, 'Images should diff');
        assert.isTrue(result.isWithinMisMatchTolerance, 'Diff should be in tolerance');

        // check if diff image was not created
        const existsDiff = await fs.exists(this.diffFile);
        assert.isFalse(existsDiff, 'Diff screenshot should not exist');
      });

      it('reports diff when NOT in tolerance', async function() {
        // compare screenshots
        const result = await this.localCompare.processScreenshot(this.context, this.screenshotToleranceCustomOutside);

        // check diff results
        assert.isAbove(result.misMatchPercentage, this.misMatchTolerance, 'Images should diff');
        assert.isFalse(result.isExactSameImage, 'Images should diff');
        assert.isFalse(result.isWithinMisMatchTolerance, 'Images should be marked as diff');

        // check if diff image was created
        const existsDiff = await fs.exists(this.diffFile);
        assert.isTrue(existsDiff, 'Diff screenshot should exist');
      });
    });

    context('uses custom misMatchTolerance passed in command options', function() {
      beforeEach(async function() {
        this.misMatchTolerance = 0.25;
        this.context = {
          options: {
            misMatchTolerance: this.misMatchTolerance
          }
        };

        this.localCompare = new LocalCompare({
          screenshotName: this.getScreenshotFile,
          referenceName: this.getReferenceFile,
          diffName: this.getDiffFile
        });

        // 1st run -> create reference
        const resultFirst = await this.localCompare.processScreenshot({}, this.screenshotBase);

        // check if reference was created
        const existsReference = await fs.exists(this.screenshotFile);
        assert.isTrue(existsReference, 'Captured screenshot should exist');
      });

      it('reports equal when in tolerance', async function() {
        // compare screenshots
        const result = await this.localCompare.processScreenshot(this.context, this.screenshotToleranceCustomWithin);

        // check diff results
        assert.isAtMost(result.misMatchPercentage, this.misMatchTolerance, 'Images should diff');
        assert.isFalse(result.isExactSameImage, 'Images should diff');
        assert.isTrue(result.isWithinMisMatchTolerance, 'Diff should be in tolerance');

        // check if diff image was not created
        const existsDiff = await fs.exists(this.diffFile);
        assert.isFalse(existsDiff, 'Diff screenshot should not exist');
      });

      it('reports diff when NOT in tolerance', async function() {
        // compare screenshots
        const result = await this.localCompare.processScreenshot(this.context, this.screenshotToleranceCustomOutside);

        // check diff results
        assert.isAbove(result.misMatchPercentage, this.misMatchTolerance, 'Images should diff');
        assert.isFalse(result.isExactSameImage, 'Images should diff');
        assert.isFalse(result.isWithinMisMatchTolerance, 'Images should be marked as diff');

        // check if diff image was created
        const existsDiff = await fs.exists(this.diffFile);
        assert.isTrue(existsDiff, 'Diff screenshot should exist');
      });
    });
  });

  context('ignoreComparison', function() {
    before(async function() {
      this.screenshotRed = await readAsBase64(path.join(dirFixture, 'ignoreComparison/100x100-red.png'));
      this.screenshotRed2 = await readAsBase64(path.join(dirFixture, 'ignoreComparison/100x100-red2.png'));
    });

    beforeEach(async function() {
      this.screenshotFile = path.join(dirTmp, 'screenshot.png');
      this.referencFile = path.join(dirTmp, 'reference.png');
      this.diffFile = path.join(dirTmp, 'diff.png');

      this.getScreenshotFile = stub().returns(this.screenshotFile);
      this.getReferenceFile = stub().returns(this.referencFile);
      this.getDiffFile = stub().returns(this.diffFile);
    });

    context('uses default ignoreComparison', function() {
      beforeEach(async function() {
        this.context = {};

        this.localCompare = new LocalCompare({
          screenshotName: this.getScreenshotFile,
          referenceName: this.getReferenceFile,
          diffName: this.getDiffFile
        });

        // 1st run -> create reference
        const resultFirst = await this.localCompare.processScreenshot({}, this.screenshotRed);

        // check if reference was created
        const existsReference = await fs.exists(this.screenshotFile);
        assert.isTrue(existsReference, 'Captured screenshot should exist');
      });

      it('reports diff when colors differs', async function() {
        // compare screenshots
        const result = await this.localCompare.processScreenshot(this.context, this.screenshotRed2);

        // check diff results
        assert.isAbove(result.misMatchPercentage, 0, 'Images should diff');
        assert.isFalse(result.isExactSameImage, 'Images should diff');
        assert.isFalse(result.isWithinMisMatchTolerance, 'Diff should not be in tolerance');

        // check if diff image was created
        const existsDiff = await fs.exists(this.diffFile);
        assert.isTrue(existsDiff, 'Diff screenshot should exist');
      });
    });

    context('uses custom ignoreComparison passed in constructor option', function() {
      beforeEach(async function() {
        this.ignoreComparison = 'colors';
        this.context = {};

        this.localCompare = new LocalCompare({
          screenshotName: this.getScreenshotFile,
          referenceName: this.getReferenceFile,
          diffName: this.getDiffFile,
          ignoreComparison: this.ignoreComparison
        });

        // 1st run -> create reference
        const resultFirst = await this.localCompare.processScreenshot({}, this.screenshotRed);

        // check if reference was created
        const existsReference = await fs.exists(this.screenshotFile);
        assert.isTrue(existsReference, 'Captured screenshot should exist');
      });

      it('reports equal with ignoreComparison=colors when colors differs', async function() {
        // compare screenshots
        const result = await this.localCompare.processScreenshot(this.context, this.screenshotRed2);
        // check diff results
        assert.isTrue(result.isExactSameImage, 'Images should not diff');
        assert.isTrue(result.isWithinMisMatchTolerance, 'Diff should be in tolerance');

        // check if diff image was not created
        const existsDiff = await fs.exists(this.diffFile);
        assert.isFalse(existsDiff, 'Diff screenshot should not exist');
      });
    });

    context('uses custom ignoreComparison passed in command options', function() {
      beforeEach(async function() {
        this.ignoreComparison = 'colors';
        this.context = {
          options: {
            ignoreComparison: this.ignoreComparison
          }
        };

        this.localCompare = new LocalCompare({
          screenshotName: this.getScreenshotFile,
          referenceName: this.getReferenceFile,
          diffName: this.getDiffFile
        });

        // 1st run -> create reference
        const resultFirst = await this.localCompare.processScreenshot({}, this.screenshotRed);

        // check if reference was created
        const existsReference = await fs.exists(this.screenshotFile);
        assert.isTrue(existsReference, 'Captured screenshot should exist');
      });

      it('reports equal with ignoreComparison=colors when colors differs', async function() {
        // compare screenshots
        const result = await this.localCompare.processScreenshot(this.context, this.screenshotRed2);

        // check diff results
        assert.isTrue(result.isExactSameImage, 'Images should not diff');
        assert.isTrue(result.isWithinMisMatchTolerance, 'Diff should be in tolerance');

        // check if diff image was not created
        const existsDiff = await fs.exists(this.diffFile);
        assert.isFalse(existsDiff, 'Diff screenshot should not exist');
      });
    });
  });
});
