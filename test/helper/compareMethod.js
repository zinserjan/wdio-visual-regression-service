import { assert } from 'chai';
import { stub } from 'sinon';

export const before = stub();
export const beforeScreenshot = stub();
export const afterScreenshot = stub();
export const after = stub();

/**
 * Creates a wrapper around the compare method to simulate webdriverio's parent/child execution
 * - before & after hooks are only executed on parent process
 * - beforeScreenshot & afterScreenshot are only executed on child processes
 */
export function createTestMethodInstance(Clazz, ...options) {
  const launcher = new Clazz(...options);
  const worker = new Clazz(...options);

  return {
    before: (...args) => launcher.before(...args),
    beforeScreenshot: (...args) => worker.beforeScreenshot(...args),
    afterScreenshot: (...args) => worker.afterScreenshot(...args),
    after: (...options) => launcher.before(...options)
  }
}
