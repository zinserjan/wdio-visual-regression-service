import logger from '@wdio/logger';

import scrollbars from '../scripts/scrollbars';
import modifyElements from '../scripts/modifyElements';

const log = logger('wdio-visual-regression-service:afterScreenshot');

export default async function afterScreenshot(browser, options) {
  // show elements
  if (Array.isArray(options.hide) && options.hide.length) {
    log.info('show the following elements again: %s', options.hide.join(', '));
    await browser.execute(modifyElements, options.hide, 'opacity', '');
  }

  // add elements again
  if (Array.isArray(options.remove) && options.remove.length) {
    log.info('add the following elements again: %s', options.remove.join(', '));
    await browser.execute(modifyElements, options.remove, 'display', '');
  }

  // show scrollbars
  log.info('show scrollbars again');
  await browser.execute(scrollbars, true);
}
