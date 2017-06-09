export default function (element) {
  let position = element.style.position;
  let excludeStaticParent = position === 'absolute';
  let parent = element.parentElement;

  while (parent) {
    if (excludeStaticParent && parent.style.position === 'static') {
      parent = parent.parentElement;
      continue;
    }

    let { overflow, overflowX, overflowY } = parent.style;
    if (/(auto|scroll)/.test(overflow + overflowX + overflowY)) {
      break;
    }
    parent = parent.parentElement;
  }

  if (parent == null) {
    parent = document.scrollingElement;
  }

  return position === 'fixed' || parent;
}
