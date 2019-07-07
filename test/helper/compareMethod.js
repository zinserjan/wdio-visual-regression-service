import { assert } from 'chai';
import { stub } from 'sinon';

export const before = stub();
export const beforeScreenshot = stub();
export const afterScreenshot = stub();
export const processScreenshot = stub();
export const after = stub();

/**
 * Creates a wrapper around the compare method to simulate webdriverio's parent/child execution
 * - onPrepare & onComplete hooks are only executed on launcher process
 * - before, beforeScreenshot, afterScreenshot & after are only executed on worker processes
 */
export function createTestMethodInstance(Clazz, ...options) {
  const launcher = new Clazz(...options);
  const worker = new Clazz(...options);

  return {
    onPrepare: () => launcher.onPrepare(),
    before: (...args) => worker.before(...args),
    beforeScreenshot: (...args) => worker.beforeScreenshot(...args),
    afterScreenshot: (...args) => worker.afterScreenshot(...args),
    processScreenshot: (...args) => worker.processScreenshot(...args),
    after: (...args) => worker.after(...args),
    onComplete: () => launcher.onComplete()
  };
}
