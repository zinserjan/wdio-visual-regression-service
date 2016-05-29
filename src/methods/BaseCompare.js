export default class BaseCompare {

  /**
   * Gets executed before the tests starts.
   */
  async before(context) {
    return Promise.resolve();
  }

  /**
   * Gets executed immediately before the screenshot is taken.
   */
  async beforeScreenshot(context) {
    return Promise.resolve();
  }

  /**
   * Gets executed after the screenshot is taken.
   * You can do here your image comparison magic.
   */
  async afterScreenshot(context, base64Screenshot) {
    return Promise.resolve();
  }

  /**
   * Gets executed after all tests are done. You still have access to all global
   * variables from the test.
   */
  async after() {
    return Promise.resolve();
  }


  createResultReport(misMatchPercentage, isWithinMisMatchTolerance, isSameDimensions) {
    return {
      misMatchPercentage,
      isWithinMisMatchTolerance,
      isSameDimensions,
      isExactSameImage: misMatchPercentage === 0
    };
  }

}
