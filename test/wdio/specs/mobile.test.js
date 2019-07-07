import path from 'path';
import { assert } from 'chai';

import generateUUID from '../../../src/utils/generateUUID';
import getScreenDimensions from '../../../src/scripts/getScreenDimensions';
import compareImages from '../../helper/compareImages';

const tmpDir = path.join(process.cwd(), '.tmp');

const fixtureDir = path.join(process.cwd(), 'test/fixture');
const screenshotDir = path.join(fixtureDir, '/web/screenshots');

function getBrowserSpecificFile(prefix) {
  const { deviceName, deviceOrientation, platformName } = browser.desiredCapabilities;

  // all os versions should produce the same screenshots
  return `${prefix}_${platformName}_${deviceName}_${deviceOrientation}.png`;
}

function getBrowserSpecificFixtureFile(prefix) {
  return path.join(screenshotDir, getBrowserSpecificFile(prefix));
}

function getBrowserSpecificTestFile(prefix) {
  return path.join(tmpDir, getBrowserSpecificFile(`${generateUUID()}_${prefix}`));
}

const scaleError =
  'Websites with scaling are not supported yet. Adjust your viewport settings in your meta tag to disable scaling.';

describe('integration tests for mobile browsers', function() {
  context('static sites - static.html (throws unsupported)', function() {
    beforeEach(async function() {
      await browser.url('static.html');
      await browser.pause(3000);
    });

    it('saveDocumentScreenshot', async function() {
      const prefix = 'static_document';
      const screenFile = getBrowserSpecificTestFile(prefix);

      try {
        await browser.saveDocumentScreenshot(screenFile);
        assert.isTrue(false, 'should not reach this code!');
      } catch (e) {
        assert.strictEqual(e.message, scaleError);
      }
    });

    it('saveElementScreenshot', async function() {
      const prefix = 'static_element_footer';
      const screenFile = getBrowserSpecificTestFile(prefix);

      try {
        await browser.saveElementScreenshot(screenFile, '.footer');
        assert.isTrue(false, 'should not reach this code!');
      } catch (e) {
        assert.strictEqual(e.message, scaleError);
      }
    });

    it('saveViewportScreenshot', async function() {
      const prefix = 'static_viewport';
      const screenFile = getBrowserSpecificTestFile(prefix);

      try {
        await browser.saveViewportScreenshot(screenFile);
        assert.isTrue(false, 'should not reach this code!');
      } catch (e) {
        assert.strictEqual(e.message, scaleError);
      }
    });
  });

  context('responsive sites - responsive.html', function() {
    beforeEach(async function() {
      await browser.url('responsive.html');
      await browser.pause(3000);
    });

    it('saveDocumentScreenshot', async function() {
      const prefix = 'responsive_document';
      const fixtureFile = getBrowserSpecificFixtureFile(prefix);
      const screenFile = getBrowserSpecificTestFile(prefix);

      await browser.saveDocumentScreenshot(screenFile);

      await compareImages(screenFile, fixtureFile);
    });

    it('saveElementScreenshot', async function() {
      const prefix = 'responsive_element_footer';
      const fixtureFile = getBrowserSpecificFixtureFile(prefix);
      const screenFile = getBrowserSpecificTestFile(prefix);

      await browser.saveElementScreenshot(screenFile, '.footer');

      await compareImages(screenFile, fixtureFile);
    });

    it('saveViewportScreenshot', async function() {
      const prefix = 'responsive_viewport';
      const fixtureFile = getBrowserSpecificFixtureFile(prefix);
      const screenFile = getBrowserSpecificTestFile(prefix);

      await browser.saveViewportScreenshot(screenFile);

      await compareImages(screenFile, fixtureFile);
    });
  });

  context('responsive sites with min-width - responsive-min-width.html', function() {
    beforeEach(async function() {
      await browser.url('responsive-min-width.html');
      await browser.pause(3000);
    });

    it('saveDocumentScreenshot', async function() {
      const prefix = 'responsive_min_width_document';
      const fixtureFile = getBrowserSpecificFixtureFile(prefix);
      const screenFile = getBrowserSpecificTestFile(prefix);

      await browser.saveDocumentScreenshot(screenFile);

      await compareImages(screenFile, fixtureFile);
    });

    it('saveElementScreenshot', async function() {
      const prefix = 'responsive_min_width_element_footer';
      const fixtureFile = getBrowserSpecificFixtureFile(prefix);
      const screenFile = getBrowserSpecificTestFile(prefix);

      await browser.saveElementScreenshot(screenFile, '.footer');

      await compareImages(screenFile, fixtureFile);
    });

    it('saveViewportScreenshot', async function() {
      const prefix = 'responsive_min_width_viewport';
      const fixtureFile = getBrowserSpecificFixtureFile(prefix);
      const screenFile = getBrowserSpecificTestFile(prefix);

      await browser.saveViewportScreenshot(screenFile);

      await compareImages(screenFile, fixtureFile);
    });
  });

  context('dynamic size issues - size-dynamic.html', function() {
    beforeEach(async function() {
      await browser.url('size-dynamic.html');
      await browser.pause(3000);
    });

    it('saveDocumentScreenshot', async function() {
      const prefix = 'dynamic_size_document';
      const fixtureFile = getBrowserSpecificFixtureFile(prefix);
      const screenFile = getBrowserSpecificTestFile(prefix);

      await browser.saveDocumentScreenshot(screenFile);

      await compareImages(screenFile, fixtureFile);
    });

    it('saveElementScreenshot', async function() {
      const prefix = 'dynamic_size_element_dynamic_box';
      const fixtureFile = getBrowserSpecificFixtureFile(prefix);
      const screenFile = getBrowserSpecificTestFile(prefix);

      await browser.saveElementScreenshot(screenFile, '#dynamic-box');

      await compareImages(screenFile, fixtureFile);
    });

    it('saveViewportScreenshot', async function() {
      const prefix = 'dynamic_size_viewport';
      const fixtureFile = getBrowserSpecificFixtureFile(prefix);
      const screenFile = getBrowserSpecificTestFile(prefix);

      await browser.saveViewportScreenshot(screenFile);

      await compareImages(screenFile, fixtureFile);
    });
  });

  context('overlay - overlay.html', function() {
    beforeEach(async function() {
      await browser.url('overlay.html');
      await browser.pause(3000);
    });

    it('saveDocumentScreenshot', async function() {
      const prefix = 'overlay_document';
      const fixtureFile = getBrowserSpecificFixtureFile(prefix);
      const screenFile = getBrowserSpecificTestFile(prefix);

      await browser.saveDocumentScreenshot(screenFile);

      await compareImages(screenFile, fixtureFile);
    });

    it('saveElementScreenshot', async function() {
      const prefix = 'overlay_element_overlay_content';
      const fixtureFile = getBrowserSpecificFixtureFile(prefix);
      const screenFile = getBrowserSpecificTestFile(prefix);

      await browser.saveElementScreenshot(screenFile, '#overlay-content');

      await compareImages(screenFile, fixtureFile);
    });

    it('saveViewportScreenshot', async function() {
      const prefix = 'overlay_viewport';
      const fixtureFile = getBrowserSpecificFixtureFile(prefix);
      const screenFile = getBrowserSpecificTestFile(prefix);

      await browser.saveViewportScreenshot(screenFile);

      await compareImages(screenFile, fixtureFile);
    });
  });

  // context('fullpage modal - fullpage-modal.html', function () {
  //   beforeEach(async function () {
  //     await browser.url('fullpage-modal.html');
  //     await browser.pause(3000);
  //   });
  //
  //   it('saveDocumentScreenshot', async function () {
  //     const prefix = 'fullpage_modal_document';
  //     const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //     const screenFile = getBrowserSpecificTestFile(prefix);
  //
  //     await browser.saveDocumentScreenshot(screenFile);
  //
  //     await compareImages(screenFile, fixtureFile);
  //   });
  //
  //   it('saveViewportScreenshot', async function () {
  //     const prefix = 'fullpage_modal_viewport';
  //     const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //     const screenFile = getBrowserSpecificTestFile(prefix);
  //
  //     await browser.saveViewportScreenshot(screenFile);
  //
  //     await compareImages(screenFile, fixtureFile);
  //   });
  //
  // });

  // context('element modifier - element-modifier.html', function () {
  //   beforeEach(async function () {
  //     await browser.url('overlay.html');
  //     await browser.pause(3000);
  //   });
  //
  //   context('hide', function() {
  //     const options = {
  //       hide: ['.group', '.orange']
  //     };
  //
  //     it('saveDocumentScreenshot', async function () {
  //       const prefix = 'element_modifier_hide_document';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       const screenFile = getBrowserSpecificTestFile(prefix);
  //
  //       await browser.saveDocumentScreenshot(screenFile, options);
  //
  //       await compareImages(screenFile, fixtureFile);
  //     });
  //
  //     it('saveViewportScreenshot', async function () {
  //       const prefix = 'element_modifier_hide_viewport';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       const screenFile = getBrowserSpecificTestFile(prefix);
  //
  //       await browser.saveViewportScreenshot(screenFile);
  //
  //       await compareImages(screenFile, fixtureFile);
  //     });
  //
  //     it('saveElementScreenshot', async function () {
  //       const prefix = 'element_modifier_hide_element';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       const screenFile = getBrowserSpecificTestFile(prefix);
  //
  //       await browser.saveElementScreenshot(screenPath, '.wrapper', options);
  //
  //       await compareImages(screenFile, fixtureFile);
  //     });
  //   });
  //
  //   context('remove', function() {
  //     const options = {
  //       remove: ['.group', '.orange']
  //     };
  //
  //     it('saveDocumentScreenshot', async function () {
  //       const prefix = 'element_modifier_remove_document';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       const screenFile = getBrowserSpecificTestFile(prefix);
  //
  //       await browser.saveDocumentScreenshot(screenFile, options);
  //
  //       await compareImages(screenFile, fixtureFile);
  //     });
  //
  //     it('saveViewportScreenshot', async function () {
  //       const prefix = 'element_modifier_remove_viewport';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       const screenFile = getBrowserSpecificTestFile(prefix);
  //
  //       await browser.saveViewportScreenshot(screenFile);
  //
  //       await compareImages(screenFile, fixtureFile);
  //     });
  //
  //     it('saveElementScreenshot', async function () {
  //       const prefix = 'element_modifier_remove_element';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       const screenFile = getBrowserSpecificTestFile(prefix);
  //
  //       await browser.saveElementScreenshot(screenPath, '.wrapper', options);
  //
  //       await compareImages(screenFile, fixtureFile);
  //     });
  //   });
  //
  // });
  //

  // context('take screenshots', function () {
  //   // context('static sites - static.html', function () {
  //   //   beforeEach(async function () {
  //   //     await browser.url('static.html');
  //   //     await browser.pause(3000);
  //   //   });
  //   //
  //   //   it('saveDocumentScreenshot', async function () {
  //   //     const prefix = 'static_document';
  //   //     const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //   //     await browser.saveDocumentScreenshot(fixtureFile);
  //   //   });
  //   //
  //   //   it('saveElementScreenshot', async function () {
  //   //     const prefix = 'static_element_footer';
  //   //     const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //   //     await browser.saveElementScreenshot(fixtureFile, '.footer');
  //   //   });
  //   //
  //   //   it('saveViewportScreenshot', async function () {
  //   //     const prefix = 'static_viewport';
  //   //     const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //   //     await browser.saveViewportScreenshot(fixtureFile);
  //   //   });
  //   // });
  //
  //   context('responsive sites - responsive.html', function () {
  //     beforeEach(async function () {
  //       await browser.url('responsive.html');
  //       await browser.pause(3000);
  //     });
  //
  //     it('saveDocumentScreenshot', async function () {
  //       const prefix = 'responsive_document';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       await browser.saveDocumentScreenshot(fixtureFile);
  //     });
  //
  //     it('saveElementScreenshot', async function () {
  //       const prefix = 'responsive_element_footer';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       await browser.saveElementScreenshot(fixtureFile, '.footer');
  //     });
  //
  //     it('saveViewportScreenshot', async function () {
  //       const prefix = 'responsive_viewport';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       await browser.saveViewportScreenshot(fixtureFile);
  //     });
  //   });
  //
  //   context('responsive sites with min-width - responsive-min-width.html', function () {
  //     beforeEach(async function () {
  //       await browser.url('responsive-min-width.html');
  //       await browser.pause(3000);
  //     });
  //
  //     it('saveDocumentScreenshot', async function () {
  //       const prefix = 'responsive_min_width_document';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //
  //       const screenFile = getBrowserSpecificTestFile(prefix);
  //       await browser.saveDocumentScreenshot(fixtureFile);
  //     });
  //
  //     it('saveElementScreenshot', async function () {
  //       const prefix = 'responsive_min_width_element_footer';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       await browser.saveElementScreenshot(fixtureFile, '.footer');
  //     });
  //
  //     it('saveViewportScreenshot', async function () {
  //       const prefix = 'responsive_min_width_viewport';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       await browser.saveViewportScreenshot(fixtureFile);
  //     });
  //   });
  //
  //   context('overlay - overlay.html', function () {
  //     beforeEach(async function () {
  //       await browser.url('overlay.html');
  //       await browser.pause(3000);
  //     });
  //
  //     it('saveDocumentScreenshot', async function () {
  //       const prefix = 'overlay_document';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       await browser.saveDocumentScreenshot(fixtureFile);
  //     });
  //
  //     it('saveElementScreenshot', async function () {
  //       const prefix = 'overlay_element_overlay_content';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       await browser.saveElementScreenshot(fixtureFile, '#overlay-content');
  //     });
  //
  //     it('saveViewportScreenshot', async function () {
  //       const prefix = 'overlay_viewport';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       await browser.saveViewportScreenshot(fixtureFile);
  //     });
  //
  //   });
  //
  //   context('dynamic size issues - size-dynamic.html', function () {
  //     beforeEach(async function () {
  //       await browser.url('size-dynamic.html');
  //       await browser.pause(3000);
  //     });
  //
  //     it('saveDocumentScreenshot', async function () {
  //       const prefix = 'dynamic_size_document';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       await browser.saveDocumentScreenshot(fixtureFile);
  //     });
  //
  //     it('saveElementScreenshot', async function () {
  //       const prefix = 'dynamic_size_element_dynamic_box';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       await browser.saveElementScreenshot(fixtureFile, '#dynamic-box');
  //     });
  //
  //     it('saveViewportScreenshot', async function () {
  //       const prefix = 'dynamic_size_viewport';
  //       const fixtureFile = getBrowserSpecificFixtureFile(prefix);
  //       await browser.saveViewportScreenshot(fixtureFile);
  //     });
  //
  //   });
  // });
});
