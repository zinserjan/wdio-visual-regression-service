export default function modifyElements(elements, style, value) {
  function setProperty(element) {
    try {
      element.style.setProperty(style, value, 'important');
    } catch (error) {
      element.setAttribute('style', element.style.cssText + style + ':' + value + '!important;');
    }
  }

  function isElement(o) {
    return o instanceof HTMLElement && o !== null && o.nodeType === 1;
  }

  for (var i = 0; i < elements.length; ++i) {
    if (!isElement(elements[i])) {
      for (var j = 0; j < elements[i].length; ++j) {
        setProperty(elements[i][j]);
      }
    } else {
      setProperty(elements[i]);
    }
  }
}
