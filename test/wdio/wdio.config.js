require("babel-register");

var path = require('path');

var compareMethod = require('../helper/compareMethod');

exports.config = {
  specs: [
    path.join(__dirname, '*.test.js')
  ],
  capabilities: [
    {
      browserName: 'phantomjs',
      'phantomjs.binary.path': require('phantomjs').path,
    }
  ],
  sync: false,
  logLevel: 'silent',
  coloredLogs: true,

  baseUrl: 'http://webdriver.io',

  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,

  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
    compilers: [
      'js:babel-register'
    ],
  },
  services: [
    'selenium-standalone',
    require('../../src')
  ],
  visualRegression: {
    compare: compareMethod,
    viewportChangePause: 250,
    viewports: [{ width: 600, height: 1000 }],
  },
  // Options for selenium-standalone
  // Path where all logs from the Selenium server should be stored.
  seleniumLogs: './logs/',
}
