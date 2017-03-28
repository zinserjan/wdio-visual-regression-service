export async function mapViewports(browser, delay, viewports = [], iteratee) {
  const results = [];

  if (!viewports.length) {
    const viewport = await browser.getViewportSize();
    const result = await iteratee(viewport);
    results.push(result);
  } else {
    for (let viewport of viewports) {
      await browser.setViewportSize(viewport);
      await browser.pause(delay);
      const result = await iteratee(viewport);
      results.push(result);
    }
  }

  return results;
}

export async function mapOrientations(browser, delay, orientations = [], iteratee) {
  const results = [];

  if (!orientations.length) {
    const orientation = await browser.getOrientation();
    const result = await iteratee(orientation);
    results.push(result);
  } else {
    for (let orientation of orientations) {
      await browser.setOrientation(orientation);
      await browser.pause(delay);
      const result = await iteratee(orientation);
      results.push(result);
    }
  }

  return results;
}
