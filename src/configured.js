import path from 'path';
import LocalCompare from './methods/LocalCompare';

export default new LocalCompare({
  referencePath: path.join(process.cwd(), 'screenshots/reference'),
  screenshotPath: path.join(process.cwd(), 'screenshots/taken'),
  diffPath: path.join(process.cwd(), 'screenshots/diff'),
});
