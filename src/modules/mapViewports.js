const getViewportSize = async function() {
  const res = await browser.execute(function() {
    return {
      screenWidth: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
      screenHeight: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    };
  });
  return {
    width: res.screenWidth,
    height: res.screenHeight
  };
};

export async function mapViewports(browser, delay, viewports = [], iterateeScreenshot, iterateeProcess) {
  const results = [];

  if (!viewports.length) {
    const viewport = await getViewportSize();
    const params = await iterateeScreenshot(viewport);
    results.push(iterateeProcess(...params));
  } else {
    for (let viewport of viewports) {
      await browser.setWindowSize(viewport.width, viewport.height);
      await browser.pause(delay);
      const params = await iterateeScreenshot(viewport);
      results.push(iterateeProcess(...params));
    }
  }

  return Promise.all(results);
}

export async function mapOrientations(browser, delay, orientations = [], iterateeScreenshot, iterateeProcess) {
  const results = [];

  if (!orientations.length) {
    const orientation = await browser.getOrientation();
    const params = await iterateeScreenshot(orientation);
    results.push(iterateeProcess(...params));
  } else {
    for (let orientation of orientations) {
      await browser.setOrientation(orientation);
      await browser.pause(delay);
      const params = await iterateeScreenshot(orientation);
      results.push(iterateeProcess(...params));
    }
  }

  return Promise.all(results);
}
