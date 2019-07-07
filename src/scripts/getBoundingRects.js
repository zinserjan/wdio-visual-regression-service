export default function getBoundingRect(selector) {
  const elements = document.querySelectorAll(selector);

  return Array.prototype.map.call(elements, (elem) => {
    const boundingRect = elem.getBoundingClientRect();
    return {
      top: boundingRect.top,
      right: boundingRect.right,
      bottom: boundingRect.bottom,
      left: boundingRect.left,
    };
  })
}
