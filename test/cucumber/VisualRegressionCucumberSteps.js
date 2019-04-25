import {defineSupportCode} from 'cucumber';

defineSupportCode(({Given, When, Then}) => {
Then(/^I perform visual regression test on view ports$/, function () {
browser.checkViewport();
});
Then(/^I perform visual regression test on the element "([^"]*)"$/, function (selector) {
browser.checkElement(selector);
});
Then(/^I perform visual regression test on the document$/, function () {
browser.checkDocument();
});


});
