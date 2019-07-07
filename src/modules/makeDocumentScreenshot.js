import makeAreaScreenshot from './makeAreaScreenshot';
import beforeScreenshot from './beforeScreenshot';
import afterScreenshot from './afterScreenshot';

import getScreenDimensions from '../scripts/getScreenDimensions';
import ScreenDimension from '../utils/ScreenDimension';
import logger from '@wdio/logger';

const log = logger('wdio-visual-regression-service:makeDocumentScreenshot');

export default async function makeDocumentScreenshot(browser, options = {}) {
  log.info('start document screenshot');

  // hide scrollbars, scroll to start, hide & remove elements, wait for render
  await beforeScreenshot(browser, options);

  // get screen dimisions to determine document height & width
  const screenDimensions = await browser.execute(getScreenDimensions);
  log.info('-----------SCREEN DIMENSIONS-------------------', screenDimensions);
  const screenDimension = new ScreenDimension(screenDimensions, browser);

  // make screenshot of area
  const base64Image = await makeAreaScreenshot(
    browser,
    0,
    0,
    screenDimension.getDocumentWidth(),
    screenDimension.getDocumentHeight()
  );

  // show scrollbars, show & add elements
  await afterScreenshot(browser, options);

  log.info('end document screenshot');

  return base64Image;
}
