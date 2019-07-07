import logger from '@wdio/logger';

import scroll from '../scripts/scroll';
import scrollbars from '../scripts/scrollbars';
import modifyElements from '../scripts/modifyElements';
import triggerResize from '../scripts/triggerResize';

const log = logger('wdio-visual-regression-service:beforeScreenshot');

export default async function beforeScreenshot(browser, options) {
  // hide scrollbars
  log.info('hide scrollbars');
  await browser.execute(scrollbars, false);

  log.info('trigger resize event to allow js components to resize properly');
  await browser.execute(triggerResize);

  // hide elements
  if (Array.isArray(options.hide) && options.hide.length) {
    log.info('hide the following elements: %s', options.hide.join(', '));
    await browser.execute(modifyElements, options.hide, 'opacity', '0');
  }

  // remove elements
  if (Array.isArray(options.remove) && options.remove.length) {
    log.info('remove the following elements: %s', options.remove.join(', '));
    await browser.execute(modifyElements, options.remove, 'display', 'none');
  }

  // scroll back to start
  const x = 0;
  const y = 0;
  log.info('scroll back to start x: %s, y: %s', x, y);
  await browser.execute(scroll, x, y);

  // wait a bit for browser render
  const pause = 200;
  log.info('wait %s ms for browser render', pause);
  await browser.pause(pause);
}
