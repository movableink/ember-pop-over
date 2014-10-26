import Ember from "ember";

var keys = Ember.keys;

var orientAbove = function (target, popup, pointer) {
  popup.setY(target.top - pointer.height - popup.height);
  pointer.setY(popup.height); 
};

var orientBelow = function (target, popup, pointer) {
  popup.setY(target.bottom + pointer.height);
  pointer.setY(pointer.height * -1);
};

var orientLeft = function (target, popup, pointer) {
  popup.setX(target.left - pointer.width - popup.width);
  pointer.setX(popup.width);
};

var orientRight = function (target, popup, pointer) {
  popup.setX(target.right + pointer.width);
  pointer.setX(pointer.width * -1);
};

var horizontallyCenter = function (target, popup, pointer) {
  popup.setX(target.left + target.width / 2 - popup.width / 2);
  pointer.setX(popup.width / 2 - pointer.width / 2);
};

var verticallyCenter = function (target, popup, pointer) {
  popup.setY(target.top + target.height / 2 - popup.height / 2);
  pointer.setY(popup.height / 2 - pointer.height / 2);
};

var snapLeft = function (target, popup, pointer) {
  var offsetLeft = Math.min(target.width / 2 - (pointer.width * 1.5), 0);
  popup.setX(target.left + offsetLeft);
  pointer.setX(pointer.width);
};

var snapRight = function (target, popup, pointer) {
  var offsetRight = Math.min(target.width / 2 - (pointer.width * 1.5), 0);
  popup.setX(target.right - offsetRight - popup.width);
  pointer.setX(popup.width - pointer.width * 2);  
};

var snapAbove = function (target, popup, pointer) {
  var offsetTop = Math.min(target.height / 2 - (pointer.height * 1.5), 0);
  popup.setY(target.top + offsetTop);
  pointer.setY(pointer.height);  
};

var snapBelow = function (target, popup, pointer) {
  var offsetBottom = Math.min(target.height / 2 - (pointer.height * 1.5), 0);
  popup.setY(target.bottom - offsetBottom - popup.height);
  pointer.setY(popup.height - pointer.height * 2);  
};

var slideHorizontally = function (boundary, target, popup, pointer) {
  var range = this.guideline.map(function (guideline) {
    switch (guideline) {
    case 'left-edge':
      return target.x + Math.min(target.width / 2 - (pointer.width * 1.5), 0);
    case 'center':
      return target.x + (target.width / 2 - popup.width / 2);
    case 'right-edge':
      return target.x + target.width - popup.width;
    }
    return [-1, -1];
  });

  var minX = range[0];
  var maxX = range[1];

  var left = minX;
  var right = left + popup.width;

  var padding = pointer.width;

  // Adjust the popup so it remains in view
  if (left < boundary.left + padding) {
    left = boundary.left + padding;
  } else if (right > boundary.right - padding) {
    left = boundary.right - popup.width - padding;
  }

  // Not a solution
  if (left > maxX) {
    return false;
  }

  var dX = target.left - left;
  var center = target.width / 2 - popup.width / 2;
  var oneThird = (target.width / 3 - popup.width / 3) / 2;

  popup.setX(left);

  if (Math.abs(dX) < Math.abs(center - oneThird)) {
    pointer.setX(dX + Math.min(pointer.width, target.width / 2 - pointer.width / 2));
    return 'left-edge';
  } else if (Math.abs(dX) < Math.abs(center + oneThird)) {
    pointer.setX(dX + target.width / 2 - pointer.width / 2);
    return 'center';
  } else {
    pointer.setX(dX + target.width - pointer.width * 3 / 2);
    return 'right-edge';
  }
};

var slideVertically = function (boundary, target, popup, pointer) {
  var range = this.guideline.map(function (guideline) {
    switch (guideline) {
    case 'top-edge':
      return target.y + Math.min(target.height / 2 - (pointer.height * 1.5), 0);
    case 'center':
      return target.y + (target.height / 2 - popup.height / 2);
    case 'bottom-edge':
      return target.y + target.height - popup.height;
    }
    return [-1, -1];
  });

  var minY = range[0];
  var maxY = range[1];

  var top = minY;
  var bottom = top + popup.height;

  var padding = pointer.height;

  // Adjust the popup so it remains in view
  if (top < boundary.top + padding) {
    top = boundary.top + padding;
  } else if (bottom > boundary.bottom - padding) {
    top = boundary.bottom - popup.height - padding;
  }

  // Not a solution
  if (top > maxY) {
    return false;
  }

  var dY = target.top - top;
  var center = target.height / 2 - popup.height / 2;
  var oneThird = (target.height / 3 - popup.height / 3) / 2;

  popup.setX(top);

  if (Math.abs(dY) < Math.abs(center - oneThird)) {
    pointer.setX(dY + Math.min(pointer.height, target.height / 2 - pointer.height / 2));
    return 'top-edge';
  } else if (Math.abs(dY) < Math.abs(center + oneThird)) {
    pointer.setX(dY + target.height / 2 - pointer.height / 2);
    return 'center';
  } else {
    pointer.setX(dY + target.height - pointer.height * 3 / 2);
    return 'bottom-edge';
  }
};

var Constraint = function (object) {
  keys(object).forEach(function (key) {
    this[key] = object[key];
  }, this);
};

Constraint.prototype.solveFor = function (boundingRect, targetRect, popupRect, pointerRect) {
  var orientation = this.orientation;
  var pointer;

  // Orient the pane
  switch (orientation) {
  case 'above': orientAbove(targetRect, popupRect, pointerRect); break;
  case 'below': orientBelow(targetRect, popupRect, pointerRect); break;
  case 'left':  orientLeft(targetRect, popupRect, pointerRect);  break;
  case 'right': orientRight(targetRect, popupRect, pointerRect); break;
  }

  // The pane should slide in the direction specified by the flow
  if (this.behavior === 'slide') {
    switch (orientation) {
    case 'above':
    case 'below':
      pointer = slideHorizontally(boundingRect, targetRect, popupRect, pointerRect);
      break;
    case 'left':
    case 'right':
      pointer = slideVertically(boundingRect, targetRect, popupRect, pointerRect);
      break;
    }

  } else if (this.behavior === 'snap') {
    pointer = this.guideline;

    switch (this.guideline) {
    case 'center':
      switch (this.orientation) {
      case 'above':
      case 'below': horizontallyCenter(targetRect, popupRect, pointerRect); break;
      case 'left':
      case 'right': verticallyCenter(targetRect, popupRect, pointerRect); break;
      }
      break;
    case 'top-edge':    snapAbove(targetRect, popupRect, pointerRect); break;
    case 'bottom-edge': snapBelow(targetRect, popupRect, pointerRect); break;
    case 'right-edge':  snapRight(targetRect, popupRect, pointerRect); break;
    case 'left-edge':   snapLeft(targetRect, popupRect, pointerRect);  break;
    }
  }

  return {
    orientation: orientation,
    pointer: pointer
  };
};

export default Constraint;
