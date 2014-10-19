import Ember from "ember";
import Rectangle from "../system/rectangle";
import Flow from "../system/flow";
import { getLayout } from "dom-ruler";

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
    return fmt('orient-%@', [get(this, 'orientation')]);
  }.property('orientation'),

  pointerClassName: function () {
    return fmt('pointer-%@', [get(this, 'pointer')]);
  }.property('pointer'),

  orientation: null,

  pointer: null,

  flow: function (key, flowName) {
    var generator;
    if (flowName) {
      generator = this.container.lookup('popup-menu/flow:' + flowName);
      assert(fmt(
        ("The flow named '%@1' was not registered with PopupMenuComponent.\n" +
         "Register your flow by using `PopupMenuComponent.registerFlow('%@1', function () { ... });`."), [flowName]), generator);
    } else {
      generator = this.container.lookup('popup-menu/flow:around');
    }

    return get(generator.call(Flow.create()), 'constraints');
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
    if (evt.target !== target &&
        !$.contains(target, evt.target) &&
        label == null &&
        label.attr('for') !== $(target).attr('id')) {
      set(this, 'isTargetActive', false);
    }
  },


  isActive: function () {
    var activators = get(this, 'on');
    var isActive = false;

    if (activators.contains('focus')) {
      isActive = isActive || get(this, 'isTargetFocused');
    }

    if (activators.contains('hover')) {
      isActive = isActive || get(this, 'isHoveringOverTarget');
    }

    if (activators.contains('click') || activators.contains('click')) {
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
    var animation = get(this, 'animation') || 'scale';
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


  retile: function () {
    if (get(this, 'isVisible')) {
      scheduleOnce('afterRender', this, 'tile');
    }
  },

  adjust: function () {
    if (get(this, 'isVisible')) {
      scheduleOnce('afterRender', this, 'tile', true);
    }
  },

  scroll: function () {
    this.retile();
  },

  resize: function () {
    this.retile();
  },


  hide: function (animationName) {
    var deferred = RSVP.defer();
    var self = this;
    var animation = this.container.lookup('popup-menu/animation:' + animationName);
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
    var animation = this.container.lookup('popup-menu/animation:' + animationName);
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

  tile: function (animate) {
    // Don't tile if there's nothing to constrain the popup menu around
    if (!get(this, 'element') || !get(this, 'for')) {
      return;
    }

    var constraints = get(this, 'flow'),
        boundingBox = getLayout(window),
        clientBox   = getLayout(get(this, 'element')).padding,
        targetBox   = getLayout(get(this, 'for')).padding,
        pointerBox  = getLayout(this.$().children('.popup-menu_pointer')[0]).borders,
        constraint,
        solution;

    var targetOffset = $(get(this, 'for')).offset(),
        scrollOffset = {
          left: $(window).scrollLeft(),
          top:  $(window).scrollTop()
        };

    targetBox.x = targetOffset.left - scrollOffset.left;
    targetBox.y = targetOffset.top  - scrollOffset.top;

    // If the targetBox is completely invisible, don't tile
    if (targetBox.x + targetBox.width  < 0                 ||
        targetBox.x                    > boundingBox.width ||
        targetBox.y + targetBox.height < 0                 ||
        targetBox.y                    > boundingBox.height) {
      return;
    }

    $(get(this, 'element')).css({ x: 0, y: 0 });
    var clientOffset = $(get(this, 'element')).offset();
    clientBox.x = clientOffset.left;
    clientBox.y =  clientOffset.top;

    constraint = constraints.find(function (constraint) {
      return constraint.satisfies(boundingBox, clientBox, targetBox, pointerBox);
    });

    if (constraint == null) {
      constraint = get(constraints, 'lastObject');
    }

    var $pointer = this.$().children('.popup-menu_pointer');

    solution = constraint.solveFor(Rectangle.ofElement(window),
                                   Rectangle.ofView(this),
                                   Rectangle.ofElement(get(this, 'for')),
                                   Rectangle.ofElement($pointer[0]));
    this._solution = solution;

    if (get(this, 'isActive')) {
      this.$().attr('style', '');
      $pointer.attr('style', '');
    }

    this.setProperties({
      orientation: get(solution, 'orientation'),
      pointer:     get(solution, 'pointer')
    });

    if (animate && get(this, 'solution')) {
      var oldSolution  = get(this, 'solution'),
          keys         = Ember.keys(get(solution, 'position')),
          initialStyle = keys.reduce(function (style, key) {
            style[key] = get(oldSolution, 'position')[key];
            return style;
          }, {});

      this.$().css(initialStyle);

      keys         = keys(get(solution, 'pointerPosition'));
      initialStyle = keys.reduce(function (style, key) {
        style[key] = get(oldSolution, 'pointerPosition')[key];
        return style;
      }, {});
      $pointer.css(initialStyle);

      this.$().transition(get(solution, 'position'), 250);
      $pointer.transition(get(solution, 'pointerPosition'), 250);
    } else {
      var offset = this.$().offsetParent().offset();
      var top = get(solution, 'clientBox.top') - offset.top;
      var left = get(solution, 'clientBox.left') - offset.left;
      this.$().css({
        top: top + 'px',
        left: left + 'px'
      });
      $pointer.css({
        top: get(solution, 'pointerBox.top') + 'px',
        left: get(solution, 'pointerBox.left') + 'px'
      });
    }

    set(this, 'solution', solution);
  }

});

export default PopupMenuComponent;
