export async function mapViewports(browser, delay, viewports = [], iterateeScreenshot, iterateeProcess) {
  const results = [];

  if (!viewports.length) {
    const viewport = await browser.getViewportSize();
    const params = await iterateeScreenshot(viewport);
    results.push(iterateeProcess(...params));
  } else {
    for (let viewport of viewports) {
      await browser.setViewportSize(viewport);
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
