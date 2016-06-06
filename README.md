# wdio-visual-regression-service [![Build Status][build-badge]][build]

> Visual regression testing with WebdriverIO.


## Installation

wdio-visual-regression-service uses [wdio-screenshot](https://github.com/zinserjan/wdio-screenshot) for capturing screenhots.

As [wdio-screenshot](https://github.com/zinserjan/wdio-screenshot) depends on [GraphicsMagick](http://www.graphicsmagick.org/) you have to install GraphicsMagick before you can use this. For installation instructions please read the [installation section](https://github.com/zinserjan/wdio-screenshot#installation) of wdio-screenshot.


After these dependencies are installed you can install wdio-screenshot via NPM as usual:

```sh
$ npm install wdio-visual-regression-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](http://webdriver.io/guide/getstarted/install.html)


## Configuration
Setup wdio-visual-regression-service by adding `visual-regression` to the service section of your WebdriverIO config and define your desired comparison strategy in `visualRegression`.

```js
// wdio.conf.js

var path = require('path');
var VisualRegressionCompare = require('wdio-visual-regression-service/compare');

function getScreenshotName(basePath) {
  return function(context) {
    var type = context.type;
    var testName = context.test.title;
    var browserVersion = parseInt(context.browser.version, 10);
    var browserName = context.browser.name;

    return path.join(basePath, `${testName}_${type}_${browserName}_v${browserVersion}.png`);
  };
}

exports.config = {
  // ...
  services: [
    'visual-regression',
  ],
  visualRegression: {
    compare: new VisualRegressionCompare.LocalCompare({
      referenceName: getScreenshotName(path.join(process.cwd(), 'screenshots/reference')),
      screenshotName: getScreenshotName(path.join(process.cwd(), 'screenshots/screen')),
      diffName: getScreenshotName(path.join(process.cwd(), 'screenshots/diff')),
    }),
  },
  // ...
};
```


## Usage
wdio-visual-regression-service enhances an WebdriverIO instance with the following commands:
* `browser.checkViewport([{options}]);`
* `browser.checkDocument([{options}]);`
* `browser.checkElement(elementSelector, [{options}]);`


All of these provide options that will help you to capture screenshots in different dimensions or to exclude unrelevant parts (e.g. content). The following options are
available:


* **exclude** `String[]|Object[]` (**not yet implemented**)<br>
  exclude frequently changing parts of your screenshot, you can either pass all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html)
  that queries one or multiple elements or you can define x and y values which stretch a rectangle or polygon

* **hide** `String[]`<br>
  hides all elements queried by all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html) (via `visibility: hidden`)

* **remove** `String[]`<br>
  removes all elements queried by all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html) (via `display: none`)

* **widths** `Number[]`  ( default: *[current-width]* ) (**desktop only**)<br>
   all screenshots will be taken in different screen widths (e.g. for responsive design tests)

* **orientations** `String[] {landscape, portrait}`  ( default: *[current-orientation]* ) (**mobile only**)<br>
    all screenshots will be taken in different screen orientations (e.g. for responsive design tests)


### License

MIT


[build-badge]: https://travis-ci.org/zinserjan/wdio-visual-regression-service.svg?branch=master
[build]: https://travis-ci.org/zinserjan/wdio-visual-regression-service
