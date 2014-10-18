import Ember from "ember";

var OrientationConstraint = Ember.Object.extend({

  orientation: null,

  behavior: 'slide',

  guideline: null,

  condition: null,

  solveFor: function (boundingBox, clientBox, targetBox, pointerBox) {
    var solution = Ember.Object.create({
          orientation: get(this, 'orientation')
        }),
        padding;

    // Orient the pane
    switch (this.orientation) {
    case 'above':
      set(clientBox, 'top', get(targetBox, 'top') - get(pointerBox, 'height') - get(clientBox, 'height'));
      set(pointerBox, 'top', get(clientBox, 'height'));
      break;
    case 'below':
      set(clientBox, 'top', get(targetBox, 'bottom') + get(pointerBox, 'height'));
      set(pointerBox, 'top', get(pointerBox, 'height') * -1);
      break;
    case 'left':
      set(clientBox, 'left', get(targetBox, 'left') - get(pointerBox, 'width') - get(clientBox, 'width'));
      set(pointerBox, 'left', get(clientBox, 'width'));
      break;
    case 'right':
      set(clientBox, 'left', get(targetBox, 'right') + get(pointerBox, 'width'));
      set(pointerBox, 'left', get(pointerBox, 'width') * -1);
      break;
    }

    // The pane should slide in the direction specified by the flow
    if (this.behavior === 'slide') {
      switch (this.orientation) {
      case 'above':
      case 'below':
        // Divide the target box into thirds and use those
        // boundaries to determine where the pointer should
        // be located.
        // +--------------------------------------+
        // |            |            |            |
        // +--------------------------------------+
        var horizontal = {
          firstThird:  (get(targetBox, 'width') / 2 - get(clientBox, 'width') / 2) -
                       (get(targetBox, 'width') / 3 - get(clientBox, 'width') / 3) / 2,
          secondThird: (get(targetBox, 'width') / 2 - get(clientBox, 'width') / 2) +
                       (get(targetBox, 'width') / 3 - get(clientBox, 'width') / 3) / 2
        };
        var leftEdge;

        switch (this.guideline[0]) {
        case 'left-edge':
          leftEdge = Math.min(get(targetBox, 'width') / 2  - (get(pointerBox, 'width') * 1.5), 0);
          break;
        case 'center':
          leftEdge = get(targetBox, 'width') / 2 - get(clientBox, 'width') / 2;
          break;
        case 'right-edge':
          leftEdge = get(targetBox, 'width') - get(clientBox, 'width');
          break;
        }


        var leftSideX  = get(targetBox, 'left') + leftEdge;
        var rightSideX = leftSideX + get(clientBox, 'width');
        padding = get(pointerBox, 'width');

        // Adjust the popup so it remains in view
        if (leftSideX < get(boundingBox, 'left') + padding) {
          leftEdge = get(boundingBox, 'left') + padding;
        } else if (rightSideX > get(boundingBox, 'right') - padding) {
          leftEdge = get(boundingBox, 'right') - get(clientBox, 'width') - padding;
        } else {
          leftEdge = leftSideX;
        }

        var deltaX = get(targetBox, 'left') - leftEdge;

        // Solve for the pointers
        if (Math.abs(deltaX) < Math.abs(horizontal.firstThird)) {
          solution.pointer = 'left-edge';
          set(pointerBox, 'left', deltaX + Math.min(get(pointerBox, 'width'), get(targetBox, 'width') / 2 - get(pointerBox, 'width') / 2));
        } else if (Math.abs(deltaX) < Math.abs(horizontal.secondThird)) {
          solution.pointer = 'center';
          set(pointerBox, 'left', deltaX + get(targetBox, 'width') / 2 - get(pointerBox, 'width') / 2);
        } else {
          solution.pointer = 'right-edge';
          set(pointerBox, 'left', deltaX + get(targetBox, 'width') - get(pointerBox, 'width') * 3 / 2);
        }
        set(clientBox, 'left', leftEdge);
        break;
      case 'left':
      case 'right':
        var vertical = {
          firstThird:  (get(targetBox, 'height') / 2 - get(clientBox, 'height') / 2) -
                       (get(targetBox, 'height') / 3 - get(clientBox, 'height') / 3) / 2,
          secondThird: (get(targetBox, 'height') / 2 - get(clientBox, 'height') / 2) +
                       (get(targetBox, 'height') / 3 - get(clientBox, 'height') / 3) / 2
        };
        var topEdge;

        switch (this.guideline[0]) {
        case 'top-edge':
          topEdge = Math.min(get(targetBox, 'height') / 2  - get(pointerBox, 'height') * 1.5, 0);
          break;
        case 'center':
          topEdge = get(targetBox, 'height') / 2 - get(clientBox, 'height') / 2;
          break;
        case 'bottom-edge':
          topEdge = get(targetBox, 'height') - get(clientBox, 'height');
          break;
        }

        var topSideY    = get(targetBox, 'top') + topEdge;
        var bottomSideY = topSideY + get(clientBox, 'height');
        padding = get(pointerBox, 'height');

        // Adjust the popup so it remains in view
        if (topSideY < get(boundingBox, 'top') + padding) {
          topEdge = get(boundingBox, 'top') + padding;
        } else if (bottomSideY > get(boundingBox, 'bottom') - padding) {
          topEdge = get(boundingBox, 'bottom') - get(clientBox, 'height') - padding;
        } else {
          topEdge = topSideY;
        }

        var deltaY = get(targetBox, 'top') - topEdge;

        // Solve for the pointers
        if (Math.abs(deltaY) < Math.abs(vertical.firstThird)) {
          solution.pointer = 'top-edge';
          set(pointerBox, 'top', deltaY + Math.min(get(pointerBox, 'height'), get(targetBox, 'height') / 2 - get(pointerBox, 'height') / 2));
        } else if (Math.abs(deltaY) < Math.abs(vertical.secondThird)) {
          solution.pointer = 'center';
          set(pointerBox, 'top', deltaY + get(targetBox, 'height') / 2 - get(pointerBox, 'height') / 2);
        } else {
          solution.pointer = 'bottom-edge';
          set(pointerBox, 'top', deltaY + get(targetBox, 'height') - get(pointerBox, 'height') * 3 / 2);
        }
        set(clientBox, 'top', topEdge);
      }

    } else if (this.behavior === 'snap') {
      solution.pointer = this.guideline;

      switch (this.guideline) {

      // Center the menu and pointer to the target view
      case 'center':
        switch (this.orientation) {
        case 'above':
        case 'below':
          set(clientBox, 'left', get(targetBox, 'left') + get(targetBox, 'width') / 2 - get(clientBox, 'width') / 2);
          set(pointerBox, 'left', get(clientBox, 'width') / 2 - get(pointerBox, 'width') / 2);
          break;
        case 'left':
        case 'right':
          set(clientBox, 'top', get(targetBox, 'top') + get(targetBox, 'height') / 2 - get(clientBox, 'height') / 2);
          set(pointerBox, 'top', get(clientBox, 'height') / 2 - get(pointerBox, 'height') / 2);
        }
        break;

      // Align to edges
      // If the pointer is skewed towards the far end of the target view,
      // the popup is adjusted so the cursor is centered on the view
      case 'top-edge':
        var offsetTop = Math.min(get(targetBox, 'height') / 2 - (get(pointerBox, 'height') * 1.5), 0);
        set(clientBox, 'top', get(targetBox, 'top') + offsetTop);
        set(pointerBox, 'top', get(pointerBox, 'height'));
        break;

      case 'bottom-edge':
        var offsetBottom = Math.min(get(targetBox, 'height') / 2 - (get(pointerBox, 'height') * 1.5), 0);
        set(clientBox, 'top', get(targetBox, 'bottom') - offsetBottom - get(clientBox, 'height'));
        set(pointerBox, 'top', get(clientBox, 'height') - get(pointerBox, 'height') * 2);
        break;

      case 'right-edge':
        var offsetRight = Math.min(get(targetBox, 'width') / 2 - (get(pointerBox, 'width') * 1.5), 0);
        set(clientBox, 'left', get(targetBox, 'right') - offsetRight - get(clientBox, 'width'));
        set(pointerBox, 'left', get(clientBox, 'width') - get(pointerBox, 'width') * 2);
        break;

      case 'left-edge':
        var offsetLeft = Math.min(get(targetBox, 'width') / 2 - (get(pointerBox, 'width') * 1.5), 0);
        set(clientBox, 'left', get(targetBox, 'left') + offsetLeft);
        set(pointerBox, 'left', get(pointerBox, 'width'));
        break;
      }
    }

    solution.clientBox = clientBox;
    solution.pointerBox = pointerBox;

    return solution;
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
