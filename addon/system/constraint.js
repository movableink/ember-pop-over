import Ember from "ember";

var keys = Ember.keys;
var compare = Ember.compare;
var mixin = Ember.mixin;

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

var slideHorizontally = function (guidelines, boundary, target, popup, pointer) {
  var edges = {
    'left-edge':  Math.min(target.width / 2 - (pointer.width * 1.5), 0),
    'center':    (target.width / 2 - popup.width / 2),
    'right-edge': target.width - popup.width
  };
  var range = guidelines.map(function (guideline) {
    return edges[guideline] || [-1, -1];
  });

  var left = target.x + range[0];
  var right = left + popup.width;

  range = range.sort(function (a, b) {
    return compare(a, b);
  });
  var minX = target.x + range[0];
  var maxX = target.x + range[1];

  var padding = pointer.width;

  // Adjust the popup so it remains in view
  if (left < boundary.left + padding) {
    left = boundary.left + padding;
  } else if (right > boundary.right - padding) {
    left = boundary.right - popup.width - padding;
  }

  var valid = left >= minX && left <= maxX;
  left = Math.max(Math.min(left, maxX), minX);

  popup.setX(left);

  var dX = target.left - left;
  var oneThird = (edges['left-edge'] - edges['right-edge']) / 3;
  var pointerClassName;

  if (dX < oneThird) {
    pointer.setX(dX + Math.min(pointer.width, target.width / 2 - pointer.width * 1.5));
    pointerClassName = 'left-edge';
  } else if (dX < oneThird * 2) {
    pointer.setX(dX + target.width / 2 - pointer.width / 2);
    pointerClassName = 'center';
  } else {
    pointer.setX(dX + target.width - pointer.width * 1.5);
    pointerClassName = 'right-edge';
  }

  return {
    valid: valid,
    pointer: pointerClassName
  };
};

var slideVertically = function (guidelines, boundary, target, popup, pointer) {
  var edges = {
    'top-edge':    Math.min(target.height / 2 - (pointer.height * 1.5), 0),
    'center':      (target.height / 2 - popup.height / 2),
    'bottom-edge': target.height - popup.height
  };
  var range = guidelines.map(function (guideline) {
    return edges[guideline];
  });

  var top = target.y + range[0];
  var bottom = top + popup.height;

  range = range.sort(function (a, b) {
    return compare(a, b);
  });
  var minY = target.y + range[0];
  var maxY = target.y + range[1];

  var padding = pointer.height;

  // Adjust the popup so it remains in view
  if (top < boundary.top + padding) {
    top = boundary.top + padding;
  } else if (bottom > boundary.bottom - padding) {
    top = boundary.bottom - popup.height - padding;
  }

  var valid = top >= minY && top <= maxY;
  top = Math.max(Math.min(top, maxY), minY + padding);

  popup.setY(top);

  var dY = target.top - top;
  var oneThird = (edges['top-edge'] - edges['bottom-edge']) / 3;
  var pointerClassName;

  if (dY < oneThird) {
    pointer.setY(dY + pointer.height + Math.min(target.height / 2 - (pointer.height * 1.5), 0));
    pointerClassName = 'top-edge';
  } else if (dY < oneThird * 2) {
    pointer.setY(dY + target.height / 2 - pointer.height / 2);
    pointerClassName = 'center';
  } else {
    pointer.setY(dY - Math.min(target.height + (pointer.height * 1.5), 0));
    pointerClassName = 'bottom-edge';
  }

  return {
    valid: valid,
    pointer: pointerClassName
  };
};

var Constraint = function (object) {
  keys(object).forEach(function (key) {
    this[key] = object[key];
  }, this);
};

Constraint.prototype.solveFor = function (boundingRect, targetRect, popupRect, pointerRect) {
  var orientation = this.orientation;
  var result = {
    orientation: orientation,
    valid: true
  };

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
      mixin(result, slideHorizontally(this.guideline, boundingRect, targetRect, popupRect, pointerRect));
      break;
    case 'left':
    case 'right':
      mixin(result, slideVertically(this.guideline, boundingRect, targetRect, popupRect, pointerRect));
      break;
    }

  } else if (this.behavior === 'snap') {
    result.pointer = this.guideline;
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

  result.valid = result.valid && boundingRect.contains(popupRect);
  return result;
};

export default Constraint;
