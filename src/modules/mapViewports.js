export async function mapWidths(browser, delay, widths = [], iteratee) {
  const results = [];

  if (!widths.length) {
    const {width} = await browser.getViewportSize();
    const result = await iteratee(width);
    results.push(result);
  } else {
    for (let width of widths) {
      await browser.setViewportSize({width, height: 1000});
      await browser.pause(delay);
      const result = await iteratee(width);
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
