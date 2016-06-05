export async function mapWidths(browser, widths = [], iteratee) {
  const results = [];

  if (!widths.length) {
    const { width } = await browser.windowHandleSize();
    const result = await iteratee(width);
    results.push(result);
  } else {
    for (let width of widths) {
      await browser.windowHandleSize({width, height: 1000});
      const result = await iteratee(width);
      results.push(result);
    }
  }

  return results;
}

export async function mapOrientations(browser, orientations = [], iteratee) {
  const results = [];

  if (!orientations.length) {
    const orientation = await browser.getOrientation();
    const result = await iteratee(orientation);
    results.push(result);
  } else {
    for (let orientation of orientations) {
      await browser.setOrientation(orientation);
      const result = await iteratee(orientation);
      results.push(result);
    }
  }

  return results;
}
