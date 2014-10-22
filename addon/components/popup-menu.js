import Ember from "ember";
import Rectangle from "../system/rectangle";

var assert = Ember.assert;
var bind = Ember.run.bind;
var scheduleOnce = Ember.run.scheduleOnce;
var next = Ember.run.next;
var get = Ember.get;
var set = Ember.set;
var fmt = Ember.String.fmt;
var w = Ember.String.w;
var keys = Ember.keys;
var copy = Ember.copy;
var alias = Ember.computed.alias;

var addObserver = Ember.addObserver;
var removeObserver = Ember.removeObserver;

var RSVP = Ember.RSVP;
var $ = Ember.$;

var labelForTarget = function ($target) {
  if ($target[0].tagName.toLowerCase() === 'label') {
    return $target;
  } else {
    return $target.parents('label');
  }
};

var PopupMenuComponent = Ember.Component.extend({

  isVisible: false,

  classNames: ['popup-menu'],

  classNameBindings: ['orientationClassName', 'pointerClassName'],

  orientationClassName: function () {
    var orientation = get(this, 'orientation');
    return orientation ? fmt('orient-%@', [orientation]) : null;
  }.property('orientation'),

  pointerClassName: function () {
    var pointer = get(this, 'pointer');
    return pointer ? fmt('pointer-%@', [pointer]) : null;
  }.property('pointer'),

  orientation: null,

  pointer: null,

  flow: function (key, flowName) {
    if (flowName) {
      var constraints = this.container.lookup('popup-constraint:' + flowName);
      assert(fmt(
        ("The flow named '%@1' was not registered with PopupMenuComponent.\n" +
         "Register your flow by using `PopupMenuComponent.registerFlow('%@1', function () { ... });`."), [flowName]), constraints);
      return constraints;
    }

    return this.container.lookup('popup-constraint:around');
  }.property(),

  /**
    The target element of the popup menu.
    Can be a view, id, or element.
   */
  for: function (key, value) {
    if (value) {
      this.__for = value;
      if (Ember.View.detectInstance(value)) {
        return get(value, 'element');
      } else if (typeof value === "string") {
        return document.getElementById(value);
      } else {
        return value;
      }
    }
    return null;
  }.property(),

  on: function (key, value) {
    if (value) {
      var activators = value;
      if (typeof value === "string") {
        activators = w(value);
      }
      assert("%@ are not valid activators.\nValid activators are 'focus', 'hover', 'click', and 'hold'".fmt(value),
             get(copy(activators).removeObjects(["focus", "hover", "click", "hold"]), 'length') === 0);
      return activators;
    }

    assert("You must provide an event name to the {{popup-menu}}.\nValid events are 'focus', 'hover', 'click', and 'hold'", false);
  }.property(),

  /**
    Property that notifies the popup menu to retile
   */
  'will-change': alias('willChange'),
  willChange: function (key, value) {
    if (value) {
      var observers = value;
      if (typeof value === "string") {
        observers = w(value);
      }
      return observers;
    }
    return [];
  }.property(),

  willChangeWillChange: function () {
    get(this, 'willChange').forEach(function (key) {
      removeObserver(this, key, this, 'retile');
    }, this);
  }.observesBefore('willChange'),

  willChangeDidChange: function () {
    get(this, 'willChange').forEach(function (key) {
      addObserver(this, key, this, 'retile');
    }, this);
  }.observes('willChange').on('init'),

  // ..............................................
  // Event management
  //

  attachWindowEvents: function () {
    this.retile();

    var eventManager = {
      scroll: bind(this, 'scroll'),
      resize: bind(this, 'resize')
    };
    this.__events = eventManager;

    keys(eventManager).forEach(function (event) {
      $(window).on(event, eventManager[event]);
    });

    this.addObserver('isVisible', this, this.retile);
  }.on('didInsertElement'),

  removeWindowEvents: function () {
    var eventManager = this.__events;
    keys(eventManager).forEach(function (event) {
      $(window).off(event, eventManager[event]);
    });

    this.removeObserver('isVisible', this, this.retile);
    this.__events = null;
  }.on('willDestroyElement'),


  notifyForWillChange: function () {
    if (this.__for) {
      next(set, this, 'for', this.__for);
    }
  }.on('didInsertElement'),

  attachEventsToTargetElement: function () {
    var target = get(this, 'for');
    if (target) {
      var $target = $(target);
      var eventManager = {
        focus: bind(this, 'targetFocus'),
        blur: bind(this, 'targetBlur'),
        mouseenter: bind(this, 'targetEnter'),
        mouseleave: bind(this, 'targetLeave'),
        mousedown: bind(this, 'targetMouseDown')
      };

      this.__targetEvents = eventManager;
      keys(eventManager).forEach(function (event) {
        $target.on(event, eventManager[event]);
      });

      if ($target.attr('id')) {
        var selector = fmt("label[for='%@']", $target.attr('id'));
        keys(eventManager).forEach(function (event) {
          $(document).on(event, selector, eventManager[event]);
        });
      }
    }
  }.observes('for'),

  removeEvents: function () {
    var eventManager = this.__targetEvents;
    var target = get(this, 'for');
    if (target && eventManager) {
      var $target = $(target);
      keys(eventManager).forEach(function (event) {
        $target.off(event, eventManager[event]);
      });

      if ($target.attr('id')) {
        var selector = fmt("label[for='%@']", $target.attr('id'));
        keys(eventManager).forEach(function (event) {
          $(document).off(event, selector, eventManager[event]);
        });
      }

      this.__targetEvents = null;
    }
  }.on('willDestroyElement'),


  targetFocus: function () {
    set(this, 'isTargetFocused', true);
  },

  targetBlur: function () {
    set(this, 'isTargetFocused', false);
  },

  targetEnter: function () {
    set(this, 'isHoveringOverTarget', true);
  },

  targetLeave: function () {
    set(this, 'isHoveringOverTarget', false);
  },

  targetMouseDown: function (evt) {
    var label = labelForTarget($(evt.target));
    var target = get(this, 'for');

    var clickedTarget = evt.target === target;
    var clickedLabel = label && label.attr('for') === $(target).attr('id');

    var isActive = get(this, 'isActive');
    if (clickedTarget || clickedLabel) {
      isActive = !isActive;
      set(this, 'isTargetActive', isActive);
      if (isActive) {
        this.__holdStart = new Date().getTime();
        this.__documentMouseUp = bind(this, 'targetMouseUp');
        $(document).on('mouseup', this.__documentMouseUp);

        evt.preventDefault();
      }

      $(target).focus();
      return true;
    }

    return false;
  },

  /** @private
    Differentiate between click and click and hold.

    When the user clicks the label, then holds the mouse down,
    the menu should close when they release the mouse.
   */
  targetMouseUp: function (evt) {
    $(document).off('mouseup', this.__documentMouseUp);
    this.__documentMouseUp = null;
    var target = get(this, 'for');

    var $target = $(evt.target);
    var label = labelForTarget($target);

    // Treat clicks on <label> elements as triggers to
    // open the menu
    if (label && label.attr('for') === $(target).attr('id')) {
      return true;
    }

    if (!$target.hasClass('ember-view')) {
      $target = $target.parents('ember-view');
    }
    var targetView = Ember.View.views[$target.attr('id')];

    if (targetView && targetView.nearestOfType(PopupMenuComponent)) {
      targetView.trigger('click');
    } else {
      // If the user waits more than 200ms between mouseDown and mouseUp,
      // we can assume that they are clicking and dragging to the menu item,
      // and we should close the menu if they mouseup anywhere not inside
      // the menu.
      if (new Date().getTime() - this.__holdStart > 400) {
        set(this, 'isTargetActive', false);
      }
    }
    return true;
  },

  documentClick: function (evt) {
    var target = get(this, 'for');
    var label = labelForTarget($(evt.target));
    var clickedInsidePopup = evt.target === get(this, 'element') || $.contains(get(this, 'element'), evt.target);
    var clickedLabel = label.attr('for') === $(target).attr('id');
    var clickedTarget = evt.target === target || $.contains(target, evt.target);

    if (!clickedInsidePopup && !clickedLabel && !clickedTarget) {
      set(this, 'isTargetActive', false);
    }
  },


  isActive: function (key, value) {
    if (value != null) {
      if (value === false) {
        set(this, 'isTargetFocused', false);
        set(this, 'isHoveringOverTarget', false);
        set(this, 'isTargetActive', false);
      } else if (value === true) {
        if (activators.contains('click') || activators.contains('hold')) {
          set(this, 'isTargetActive', true);
        } else if (activators.contains('focus')) {
          set(this, 'isTargetFocused', true);
        } else if (activators.contains('hover')) {
          set(this, 'isHoveringOverTarget', true);
        }
      }
    }

    var activators = get(this, 'on');
    var isActive = false;

    if (activators.contains('focus')) {
      isActive = isActive || get(this, 'isTargetFocused');
    }

    if (activators.contains('hover')) {
      isActive = isActive || get(this, 'isHoveringOverTarget');
    }

    if (activators.contains('click') || activators.contains('hold')) {
      isActive = isActive || get(this, 'isTargetActive');
    }

    return isActive;
  }.property('on', 'isTargetFocused', 'isHoveringOverTarget', 'isTargetActive'),


  /**
    Before the menu is shown, setup click events
    to catch when the user clicks outside the
    menu.
   */
  visibilityDidChange: function () {
    if (this.__animating) { return; }

    var proxy = this.__documentClick = this.__documentClick || bind(this, 'documentClick');
    var animation = get(this, 'animation');
    var self = this;

    this.__animating = true;
    if (get(this, 'isActive')) {
      this.show(animation).then(function () {
        $(document).on('mousedown', proxy);
        self.__animating = false;
      });

    // Remove click events immediately
    } else {
      $(document).off('mousedown', proxy);
      this.hide(animation).then(function () {
        self.__animating = false;
      });
    }
  }.observes('isActive').on('init'),

  hide: function (animationName) {
    var deferred = RSVP.defer();
    var self = this;
    var animation = this.container.lookup('popup-animation:' + animationName);
    next(this, function () {
      if (animation) {
        var promise = animation.out.call(this);
        promise.then(function () {
          set(self, 'isVisible', false);
        });
        deferred.resolve(promise);
      } else {
        set(self, 'isVisible', false);
        deferred.resolve();
      }
    });
    return deferred.promise;
  },

  show: function (animationName) {
    var deferred = RSVP.defer();
    var animation = this.container.lookup('popup-animation:' + animationName);
    set(this, 'isVisible', true);
    scheduleOnce('afterRender', this, function () {
      if (animation) {
        deferred.resolve(animation['in'].call(this));
      } else {
        deferred.resolve();
      }
    });
    return deferred.promise;
  },

  retile: function () {
    if (get(this, 'isVisible')) {
      scheduleOnce('afterRender', this, 'tile');
    }
  },

  scroll: function () {
    this.retile();
  },

  resize: function () {
    this.retile();
  },

  tile: function () {
    // Don't tile if there's nothing to constrain the popup menu around
    if (!get(this, 'element') || !get(this, 'for') && get(this, 'isActive')) {
      return;
    }

    var $popup = this.$();
    var $pointer = $popup.children('.popup-menu_pointer');

    var boundingRect = Rectangle.ofElement(window);
    var popupRect = Rectangle.ofView(this, 'padding');
    var targetRect = Rectangle.ofElement(get(this, 'for'), 'padding');
    var pointerRect = Rectangle.ofElement($pointer[0], 'borders');

    if (boundingRect.intersects(targetRect)) {
      var constraints = get(this, 'flow');
      var constraint = constraints.find(function (constraint) {
        return constraint.satisfies(boundingRect, popupRect, targetRect, pointerRect);
      });

      if (constraint == null) {
        constraint = get(constraints, 'lastObject');
      }

      var solution = constraint.solveFor(boundingRect, popupRect, targetRect, pointerRect);

      $popup.attr('style', '');
      $pointer.attr('style', '');

      this.setProperties({
        orientation: solution.orientation,
        pointer:     solution.pointer
      });

      var offset = $popup.offsetParent().offset();
      var top = popupRect.top - offset.top;
      var left = popupRect.left - offset.left;
      $popup.css({
        top: top + 'px',
        left: left + 'px'
      });
      $pointer.css({
        top: pointerRect.top + 'px',
        left: pointerRect.left + 'px'
      });
    }
  }

});

export default PopupMenuComponent;
