import Ember from "ember";

var debounce = Ember.run.debounce;
var set = Ember.set;
var get = Ember.get;
var bind = Ember.run.bind;

// Normalize mouseWheel events
var mouseWheel = function (evt) {
  var oevt = evt.originalEvent,
      delta = 0,
      deltaY = 0, deltaX = 0;

  if (oevt.wheelDelta) {
    delta = oevt.wheelDelta / 120;
  }
  if (oevt.detail) {
    delta = oevt.detail / -3;
  }

  deltaY = delta;

  if (oevt.hasOwnProperty) {
    // Gecko
    if (oevt.hasOwnProperty('axis') && oevt.axis === oevt.HORIZONTAL_AXIS) {
      deltaY = 0;
      deltaX = -1 * delta;
    }

    // Webkit
    if (oevt.hasOwnProperty('wheelDeltaY')) {
      deltaY = oevt.wheelDeltaY / +120;
    }
    if (oevt.hasOwnProperty('wheelDeltaX')) {
      deltaX = oevt.wheelDeltaX / -120;
    }
  }

  evt.wheelDeltaX = deltaX;
  evt.wheelDeltaY = deltaY;

  return this.mouseWheel(evt);
};

/**
  Adding this mixin to a view will add scroll behavior that bounds
  the scrolling to the contents of the box.

  When the user has stopped scrolling and they are at an edge of the
  box, then it will relinquish control to the parent scroll container.

  This is useful when designing custom popup components that scroll
  that should behave like native controls.

  @class ScrollSandbox
  @extends Ember.Mixin
 */
var ScrollSandbox = Ember.Mixin.create({

  setupScrollHandlers: function () {
    this._mouseWheelHandler = bind(this, mouseWheel);
    this.$().on('mousewheel DOMMouseScroll', this._mouseWheelHandler);
  }.on('didInsertElement'),

  scrollingHasStopped: function () {
    set(this, 'isScrolling', false);
  },

  /** @private
    Prevent scrolling the result list from scrolling
    the window.
   */
  mouseWheel: function (evt) {
    var $element = this.$();
    var scrollTop = $element.scrollTop();
    var maximumScrollTop = $element.prop('scrollHeight') -
                           $element.outerHeight();
    var isAtScrollEdge;

    if (evt.wheelDeltaY > 0) {
      isAtScrollEdge = scrollTop === 0;
    } else if (evt.wheelDeltaY < 0) {
      isAtScrollEdge = scrollTop === maximumScrollTop;
    }

    if (get(this, 'isScrolling') && isAtScrollEdge) {
      evt.preventDefault();
      evt.stopPropagation();
    } else if (!isAtScrollEdge) {
      set(this, 'isScrolling', true);
    }
    debounce(this, this.scrollingHasStopped, 75);
  },

  teardownScrollHandlers: function () {
    this.$().off('mousewheel DOMMouseScroll', this._mouseWheelHandler);
  }.on('willDestroyElement')

});

export default ScrollSandbox;
