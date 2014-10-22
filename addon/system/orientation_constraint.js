import Ember from "ember";

var mixin = Ember.mixin;

var OrientationConstraint = Ember.Object.extend({

  orientation: null,

  behavior: 'slide',

  guideline: null,

  condition: null,

  solveFor: function (boundingRect, popupRect, targetRect, pointerRect) {
    var orientation = this.orientation;
    var pointer;
    var padding;

    // Orient the pane
    switch (orientation) {
    case 'above':
      popupRect.setY(targetRect.top - pointerRect.height - popupRect.height);
      pointerRect.setY( popupRect.height);
      break;
    case 'below':
      popupRect.setY(targetRect.bottom + pointerRect.height);
      pointerRect.setY(pointerRect.height * -1);
      break;
    case 'left':
      popupRect.setX(targetRect.left - pointerRect.width - popupRect.width);
      pointerRect.setX(popupRect.width);
      break;
    case 'right':
      popupRect.setX(targetRect.right + pointerRect.width);
      pointerRect.setX(pointerRect.width * -1);
      break;
    }

    // The pane should slide in the direction specified by the flow
    if (this.behavior === 'slide') {
      switch (orientation) {
      case 'above':
      case 'below':
        // Divide the target box into thirds and use those
        // boundaries to determine where the pointer should
        // be located.
        // +--------------------------------------+
        // |            |            |            |
        // +--------------------------------------+
        var horizontal = {
          firstThird:  (targetRect.width / 2 - popupRect.width / 2) -
                       (targetRect.width / 3 - popupRect.width / 3) / 2,
          secondThird: (targetRect.width / 2 - popupRect.width / 2) +
                       (targetRect.width / 3 - popupRect.width / 3) / 2
        };
        var leftEdge;

        switch (this.guideline[0]) {
        case 'left-edge':
          leftEdge = Math.min(targetRect.width / 2  - (pointerRect.width * 1.5), 0);
          break;
        case 'center':
          leftEdge = targetRect.width / 2 - popupRect.width / 2;
          break;
        case 'right-edge':
          leftEdge = targetRect.width - popupRect.width;
          break;
        }


        var leftSideX  = targetRect.left + leftEdge;
        var rightSideX = leftSideX + popupRect.width;
        padding = pointerRect.width;

        // Adjust the popup so it remains in view
        if (leftSideX < boundingRect.left + padding) {
          leftEdge = boundingRect.left + padding;
        } else if (rightSideX > boundingRect.right - padding) {
          leftEdge = boundingRect.right - popupRect.width - padding;
        } else {
          leftEdge = leftSideX;
        }

        var deltaX = targetRect.left - leftEdge;

        // Solve for the pointers
        if (Math.abs(deltaX) < Math.abs(horizontal.firstThird)) {
          pointer = 'left-edge';
          pointerRect.setX(deltaX + Math.min(pointerRect.width, targetRect.width / 2 - pointerRect.width / 2));
        } else if (Math.abs(deltaX) < Math.abs(horizontal.secondThird)) {
          pointer = 'center';
          pointerRect.setX(deltaX + targetRect.width / 2 - pointerRect.width / 2);
        } else {
          pointer = 'right-edge';
          pointerRect.setX(deltaX + targetRect.width - pointerRect.width * 3 / 2);
        }
        popupRect.setX(leftEdge);
        break;
      case 'left':
      case 'right':
        var vertical = {
          firstThird:  (targetRect.height / 2 - popupRect.height / 2) -
                       (targetRect.height / 3 - popupRect.height / 3) / 2,
          secondThird: (targetRect.height / 2 - popupRect.height / 2) +
                       (targetRect.height / 3 - popupRect.height / 3) / 2
        };
        var topEdge;

        switch (this.guideline[0]) {
        case 'top-edge':
          topEdge = Math.min(targetRect.height / 2  - pointerRect.height * 1.5, 0);
          break;
        case 'center':
          topEdge = targetRect.height / 2 - popupRect.height / 2;
          break;
        case 'bottom-edge':
          topEdge = targetRect.height - popupRect.height;
          break;
        }

        var topSideY    = targetRect.top + topEdge;
        var bottomSideY = topSideY + popupRect.height;
        padding = pointerRect.height;

        // Adjust the popup so it remains in view
        if (topSideY < boundingRect.top + padding) {
          topEdge = boundingRect.top + padding;
        } else if (bottomSideY > boundingRect.bottom - padding) {
          topEdge = boundingRect.bottom - popupRect.height - padding;
        } else {
          topEdge = topSideY;
        }

        var deltaY = targetRect.top - topEdge;

        // Solve for the pointers
        if (Math.abs(deltaY) < Math.abs(vertical.firstThird)) {
          pointer = 'top-edge';
          pointerRect.setY(deltaY + Math.min(pointerRect.height, targetRect.height / 2 - pointerRect.height / 2));
        } else if (Math.abs(deltaY) < Math.abs(vertical.secondThird)) {
          pointer = 'center';
          pointerRect.setY(deltaY + targetRect.height / 2 - pointerRect.height / 2);
        } else {
          pointer = 'bottom-edge';
          pointerRect.setY(deltaY + targetRect.height - pointerRect.height * 3 / 2);
        }
        popupRect.setY(topEdge);
      }

    } else if (this.behavior === 'snap') {
      pointer = this.guideline;

      switch (this.guideline) {

      // Center the menu and pointer to the target view
      case 'center':
        switch (this.orientation) {
        case 'above':
        case 'below':
          popupRect.setX(targetRect.left + targetRect.width / 2 - popupRect.width / 2);
          pointerRect.setX(popupRect.width / 2 - pointerRect.width / 2);
          break;
        case 'left':
        case 'right':
          popupRect.setY(targetRect.top + targetRect.height / 2 - popupRect.height / 2);
          pointerRect.setY(popupRect.height / 2 - pointerRect.height / 2);
        }
        break;

      // Align to edges
      // If the pointer is skewed towards the far end of the target view,
      // the popup is adjusted so the cursor is centered on the view
      case 'top-edge':
        var offsetTop = Math.min(targetRect.height / 2 - (pointerRect.height * 1.5), 0);
        popupRect.setY(targetRect.top + offsetTop);
        pointerRect.setY(pointerRect.height);
        break;

      case 'bottom-edge':
        var offsetBottom = Math.min(targetRect.height / 2 - (pointerRect.height * 1.5), 0);
        popupRect.setY(targetRect.bottom - offsetBottom - popupRect.height);
        pointerRect.setY(popupRect.height - pointerRect.height * 2);
        break;

      case 'right-edge':
        var offsetRight = Math.min(targetRect.width / 2 - (pointerRect.width * 1.5), 0);
        popupRect.setX(targetRect.right - offsetRight - popupRect.width);
        pointerRect.setX(popupRect.width - pointerRect.width * 2);
        break;

      case 'left-edge':
        var offsetLeft = Math.min(targetRect.width / 2 - (pointerRect.width * 1.5), 0);
        popupRect.setX(targetRect.left + offsetLeft);
        pointerRect.setX(pointerRect.width);
        break;
      }
    }

    return {
      orientation: orientation,
      pointer: pointer
    };
  },

  staticBoundary: function (boundingBox, clientBox, targetBox, pointerBox) {
    var topEdge,
        rightEdge,
        bottomEdge,
        leftEdge;

    switch (this.orientation) {
    case 'above':
      topEdge    = targetBox.y - clientBox.height                    - pointerBox.height;
      bottomEdge = topEdge + clientBox.height;
      break;
    case 'below':
      bottomEdge = targetBox.y + targetBox.height + clientBox.height + pointerBox.height;
      topEdge    = bottomEdge - clientBox.height;
      break;
    case 'left':
      leftEdge   = targetBox.x - clientBox.width                     - pointerBox.width;
      rightEdge  = leftEdge + clientBox.width;
      break;
    case 'right':
      rightEdge  = targetBox.x + targetBox.width  + clientBox.width  + pointerBox.width;
      leftEdge   = rightEdge - clientBox.width;
      break;
    }

    return {
      top:    topEdge,
      right:  rightEdge,
      bottom: bottomEdge,
      left:   leftEdge
    };
  },

  guidelineBoundary: function (guideline, boundingBox, clientBox, targetBox, pointerBox) {
    var edges = {};

    switch (this.orientation) {
    case 'above':
    case 'below':
      switch (guideline) {
      case 'left-edge':
        edges.left  = targetBox.x + Math.min(targetBox.width / 2 - (pointerBox.width * 1.5), 0);
        break;
      case 'center':
        edges.left  = targetBox.x + targetBox.width / 2 - clientBox.width / 2;
        break;
      case 'right-edge':
        edges.left  = targetBox.x + Math.min(targetBox.width / 2 - (pointerBox.width * 1.5), 0) + targetBox.width - clientBox.width;
        break;
      }
      edges.right   = edges.left + clientBox.width;
      break;
    case 'left':
    case 'right':
      switch (guideline) {
      case 'top-edge':
        edges.top  = targetBox.y + Math.min(targetBox.height / 2 - (pointerBox.height + pointerBox.height / 2), 0);
        break;
      case 'center':
        edges.top  = targetBox.y + targetBox.height / 2 + pointerBox.height / 2 - clientBox.height / 2;
        break;
      case 'bottom-edge':
        edges.top  = targetBox.y + Math.min(targetBox.height / 2 - (pointerBox.height + pointerBox.height / 2), 0) + targetBox.height - clientBox.height;
        break;
      }
      edges.bottom = edges.top + clientBox.height + pointerBox.height;
      edges.top   -= pointerBox.height;
    }

    return edges;
  },

  satisfies: function (boundingBox, clientBox, targetBox, pointerBox) {
    var isSolution = true,
        edges = this.staticBoundary(boundingBox, clientBox, targetBox, pointerBox);

    switch (this.behavior) {
    // Handle snap positioning
    case 'snap':
      edges = mixin(edges, this.guidelineBoundary(this.guideline, boundingBox, clientBox, targetBox, pointerBox));

      // Assert that the view is within the constraints of the viewport
      isSolution = edges.top  > 0 && edges.bottom < boundingBox.height &&
                   edges.left > 0 && edges.right  < boundingBox.width;

      break;
    case 'slide':
      // Algorithm:
      // 1. Return false if the height of the popup is greater than
      //    the height of the viewport.
      isSolution = clientBox.height < boundingBox.height - pointerBox.height * 2;

      if (isSolution) {
        // 2. Compute the lowest bounds for each of the constraints
        //    given.
        var startEdge  = mixin(this.guidelineBoundary(this.guideline[0], boundingBox, clientBox, targetBox, pointerBox), edges);
        var endEdge    = mixin(this.guidelineBoundary(this.guideline[1], boundingBox, clientBox, targetBox, pointerBox), edges);
        var tmp;

        switch (this.orientation) {
        case 'above':
        case 'below':
          if (startEdge.left > endEdge.left) {
            tmp = startEdge;
            startEdge = endEdge;
            endEdge = tmp;
          }
          break;
        case 'left':
        case 'right':
          if (startEdge.top > endEdge.top) {
            tmp = startEdge;
            startEdge = endEdge;
            endEdge = tmp;
          }
          break;
        }

        var vPadding = pointerBox.height;
        var hPadding = pointerBox.width;

        // 3. Is either edge case a solution?
        isSolution = (startEdge.top > vPadding && startEdge.bottom < boundingBox.height - vPadding &&
                      startEdge.left > hPadding && startEdge.right < boundingBox.width - hPadding) ||
                     (endEdge.top > vPadding && endEdge.bottom < boundingBox.height - vPadding &&
                      endEdge.left > hPadding && endEdge.right < boundingBox.width - hPadding);
        break;
      }
    }

    if (isSolution && this.condition) {
      isSolution = this.condition(boundingBox, clientBox, targetBox);
    }

    return isSolution;
  }

});

export default OrientationConstraint;
