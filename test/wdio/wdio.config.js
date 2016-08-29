require("babel-register");

var path = require('path');

var compareMethod = require('../helper/compareMethod');

exports.config = {
  specs: [
    path.join(__dirname, '*.test.js')
  ],
  capabilities: [{
    browserName: 'phantom'
  }],
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
    require('../../src')
  ],
  visualRegression: {
    compare: compareMethod,
    viewportChangePause: 250,
    widths: [600],
  }
}
