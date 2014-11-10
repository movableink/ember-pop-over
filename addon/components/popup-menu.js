import Ember from "ember";
import Rectangle from "../system/rectangle";

var bind = Ember.run.bind;
var scheduleOnce = Ember.run.scheduleOnce;
var next = Ember.run.next;
var get = Ember.get;
var set = Ember.set;
var fmt = Ember.String.fmt;
var w = Ember.String.w;
var keys = Ember.keys;
var guidFor = Ember.guidFor;
var copy = Ember.copy;
var alias = Ember.computed.alias;
var isArray = Ember.isArray;

var addObserver = Ember.addObserver;
var removeObserver = Ember.removeObserver;

var RSVP = Ember.RSVP;
var $ = Ember.$;

var anyFlag = function (flags, flag) {
  var flagKeys = keys(flags);
  for (var i = 0, len = flagKeys.length; i < len; i++) {
    var key = flagKeys[i];
    if (flags[key] && get(flags[key], flag)) {
      return true;
    }
  }
  return false;
};

var anyTargetClicked = function (targets, evt) {
  for (var i = 0, len = targets.length; i < len; i++) {
    if (isClicked(targets[i], evt)) {
      return true;
    }
  }

  var label = labelForEvent(evt);
  if (label) {
    for (i = 0, len = targets.length; i < len; i++) {
      if (isLabelClicked(targets[i], label)) {
        return true;
      }
    }
  }
  return false;
};

var isClicked = function (target, evt) {
  var label = labelForEvent(evt);
  return evt.target === target || $.contains(target, evt.target) ||
         isLabelClicked(target, label);
};

var isLabelClicked = function (target, label) {
  if (label == null) {
    return false;
  }
  return $(label).attr('for') === $(target).attr('id');
};

var labelForEvent = function (evt) {
  return labelForTarget($(evt.target));
};

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

  disabled: false,

  orientation: null,

  pointer: null,

  flow: 'around',

  /**
    The target element of the popup menu.
    Can be a view, id, or element.
   */
  for: null,

  targetElements: function () {
    var targets = get(this, 'for') || [];
    if (typeof targets === "string") {
      targets = w(targets);
    }

    // Ember.View instances are array-like???
    if (!isArray(targets) || Ember.View.detectInstance(targets)) {
      targets = [targets];
    }

    var component = this;
    return targets.map(function (target) {
      if (Ember.View.detectInstance(target)) {
        Ember.assert("You cannot make the {{popup-menu}} a target of itself.", component !== target);
        return get(target, 'element');
      } else if (typeof target === "string") {
        return document.getElementById(target);
      } else {
        return target;
      }
    });
  }.property('for', 'for.element'),

  on: function (key, value) {
    if (value) {
      var activators = value;
      if (typeof value === "string") {
        activators = w(value);
      }
      Ember.assert("%@ are not valid activators.\nValid activators are 'focus', 'hover', 'click', and 'hold'".fmt(value),
             get(copy(activators).removeObjects(["focus", "hover", "click", "hold"]), 'length') === 0);
      return activators;
    }

    Ember.assert("You must provide an event name to the {{popup-menu}}.\nValid events are 'focus', 'hover', 'click', and 'hold'", false);
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
    this.retile();
  }.observes('willChange').on('init'),

  // ..............................................
  // Event management
  //

  attachWindowEvents: function () {
    this.retile();

    var eventManager = {
      scroll: bind(this, 'retile'),
      resize: bind(this, 'retile')
    };
    this.__events = eventManager;

    keys(eventManager).forEach(function (event) {
      $(window).on(event, eventManager[event]);
    });

    addObserver(this, 'isVisible', this, 'retile');
  }.on('didInsertElement'),

  removeWindowEvents: function () {
    var eventManager = this.__events;
    keys(eventManager).forEach(function (event) {
      $(window).off(event, eventManager[event]);
    });

    if (this.__documentClick) {
      $(document).off('mousedown', this.__documentClick);
    }

    removeObserver(this, 'isVisible', this, 'retile');
    this.__events = null;
  }.on('willDestroyElement'),


  notifyForWillChange: function () {
    next(this, 'notifyPropertyChange', 'targetElements');
  }.on('didInsertElement'),

  attachEventsToTargetElement: function () {
    var targets = get(this, 'targetElements');
    var component = this;
    var allFlags = this.__flags = {};
    var eventManagers = this.__eventManagers = {};
    var $document = $(document);

    allFlags.self = Ember.Object.create();

    targets.forEach(function (target) {
      var $target = $(target);
      var guid = guidFor(target);
      var flags = allFlags[guid] = Ember.Object.create();

      var eventManager = eventManagers[guid] = {
        focusin:    bind(component, 'targetFocus', target, flags),
        focusout:   bind(component, 'targetBlur', target, flags),
        mouseenter: bind(component, 'targetEnter', target, flags),
        mouseleave: bind(component, 'targetLeave', target, flags),
        mousedown:  bind(component, 'targetMouseDown', target, flags)
      };

      keys(eventManager).forEach(function (event) {
        $target.on(event, eventManager[event]);
      });

      if ($target.attr('id')) {
        var selector = fmt("label[for='%@']", [$target.attr('id')]);
        keys(eventManager).forEach(function (event) {
          $document.on(event, selector, eventManager[event]);
        });
      }
    });
  }.observes('targetElements'),

  removeEvents: function () {
    var targets = get(this, 'targetElements');
    var eventManagers = this.__eventManagers;
    var $document = $(document);

    if (eventManagers == null) {
      return;
    }

    targets.forEach(function (target) {
      var eventManager = eventManagers[guidFor(target)];
      var $target = $(target);
      var id = $target.attr('id');

      keys(eventManager).forEach(function (event) {
        $target.off(event, eventManager[event]);
      });


      if (id) {
        var selector = fmt("label[for='%@']", [id]);
        keys(eventManager).forEach(function (event) {
          $document.off(event, selector, eventManager[event]);
        });
      }
    });

    this.__eventManagers = null;
  }.observesBefore('targetElements').on('willDestroyElement'),

  targetFocus: function (target, flags) {
    if (get(this, 'disabled')) { return; }
    set(this, 'activeTarget', target);
    set(flags, 'focused', true);
    this.notifyPropertyChange('isActive');
  },

  targetBlur: function (target, flags) {
    if (get(this, 'disabled')) { return; }
    set(this, 'activeTarget', target);
    set(flags, 'focused', false);
    this.notifyPropertyChange('isActive');
  },

  targetEnter: function (target, flags) {
    if (get(this, 'disabled')) { return; }
    set(this, 'activeTarget', target);
    set(flags, 'hovered', true);
    this.notifyPropertyChange('isActive');
  },

  targetLeave: function (target, flags) {
    if (get(this, 'disabled')) { return; }
    set(this, 'activeTarget', target);
    set(flags, 'hovered', false);
    this.notifyPropertyChange('isActive');
  },

  mouseEnter: function () {
    if (get(this, 'disabled')) { return; }
    var flags = this.__flags.self;
    set(this, 'activeTarget', get(this, 'element'));
    set(flags, 'hovered', true);
    this.notifyPropertyChange('isActive');
  },

  mouseLeave: function () {
    if (get(this, 'disabled')) { return; }
    var flags = this.__flags;
    keys(flags).forEach(function (key) {
      set(flags[key], 'hovered', false);
    });
    this.notifyPropertyChange('isActive');
  },

  targetMouseDown: function (target, flags, evt) {
    if (get(this, 'disabled')) { return false; }

    var isActive = get(this, 'isActive');
    if (isClicked(target, evt)) {
      isActive = !isActive;
      set(flags, 'active', isActive);
      set(this, 'activeTarget', target);
      this.notifyPropertyChange('isActive');
      if (isActive) {
        var eventManager = this.__eventManagers[guidFor(target)];
        flags.holdStart = new Date().getTime();
        eventManager.mouseup = bind(this, 'targetMouseUp', target, flags, eventManager);
        $(document).on('mouseup', eventManager.mouseup);

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
  targetMouseUp: function (target, flags, eventManager, evt) {
    $(document).off('mouseup', eventManager.mouseup);
    eventManager.mouseup = null;

    var label = labelForEvent(evt);

    // Treat clicks on <label> elements as triggers to
    // open the menu
    if (isLabelClicked(target, label)) {
      return true;
    }

    var $target = $(evt.target);
    if (!$target.hasClass('ember-view')) {
      $target = $target.parents('ember-view');
    }
    var targetView = Ember.View.views[$target.attr('id')];
    var activators = get(this, 'on');

    if (targetView && targetView.nearestOfType(PopupMenuComponent)) {
      targetView.trigger('click');
    } else if (activators.contains('click') && activators.contains('hold')) {
      // If the user waits more than 400ms between mouseDown and mouseUp,
      // we can assume that they are clicking and dragging to the menu item,
      // and we should close the menu if they mouseup anywhere not inside
      // the menu.
      if (new Date().getTime() - flags.holdStart > 400) {
        set(flags, 'active', false);
        this.notifyPropertyChange('isActive');
      }
    }
    return true;
  },

  documentClick: function (evt) {
    if (get(this, 'disabled')) { return; }

    var targets = get(this, 'targetElements');
    var clickedInsidePopup = isClicked(get(this, 'element'), evt);
    var clickedTarget = anyTargetClicked(targets, evt);

    if (!clickedInsidePopup && !clickedTarget) {
      var flags = this.__flags;
      keys(flags).forEach(function (key) {
        set(flags[key], 'active', false);
      });
      this.notifyPropertyChange('isActive');
    }
  },

  isActive: function (key, value) {
    var activators = get(this, 'on');
    var isActive = false;
    var allFlags = this.__flags || {};
    var flags = allFlags.self || Ember.Object.create();

    if (value != null) {
      if (value === false) {
        keys(flags).forEach(function (key) {
          set(allFlags[key], 'focused', false);
          set(allFlags[key], 'hovered', false);
          set(allFlags[key], 'active', false);
        });
      } else if (value === true) {
        if (activators.contains('click') || activators.contains('hold')) {
          set(flags, 'active', true);
        } else if (activators.contains('focus')) {
          set(flags, 'focused', true);
        } else if (activators.contains('hover')) {
          set(flags, 'hovered', true);
        }
      }
    }

    if (activators.contains('focus')) {
      isActive = isActive || anyFlag(allFlags, 'focused');
    }

    if (activators.contains('hover')) {
      allFlags.self = null;
      isActive = isActive || anyFlag(allFlags, 'hovered');
      if (activators.contains('hold')) {
        isActive = isActive || get(flags, 'hovered');
      }
      allFlags.self = flags;
    }

    if (activators.contains('click') || activators.contains('hold')) {
      isActive = isActive || anyFlag(allFlags, 'active');
    }

    return !!isActive;
  }.property('on'),


  /**
    Before the menu is shown, setup click events
    to catch when the user clicks outside the
    menu.
   */
  visibilityDidChange: function () {
    if (this.__animating) { return; }

    var proxy = this.__documentClick = this.__documentClick || bind(this, 'documentClick');
    var animation = get(this, 'animation');
    var component = this;

    var isActive = get(this, 'isActive');
    var isInactive = !isActive;
    var isVisible = get(this, 'isVisible');
    var isHidden = !isVisible;

    if (isActive && isHidden) {
      this.__animating = true;
      this.show(animation).then(function () {
        $(document).on('mousedown', proxy);
        component.__animating = false;
      });

    // Remove click events immediately
    } else if (isInactive && isVisible) {
      this.__animating = true;
      $(document).off('mousedown', proxy);
      this.hide(animation).then(function () {
        component.__animating = false;
      });
    }
  }.observes('isActive').on('init'),

  hide: function (animationName) {
    var deferred = RSVP.defer();
    var component = this;
    var animation = this.container.lookup('popup-animation:' + animationName);
    next(this, function () {
      if (animation) {
        var promise = animation.out.call(this);
        promise.then(function () {
          set(component, 'isVisible', false);
        });
        deferred.resolve(promise);
      } else {
        set(component, 'isVisible', false);
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

  tile: function () {
    // Don't tile if there's nothing to constrain the popup menu around
    if (!get(this, 'element') || !get(this, 'activeTarget') && get(this, 'isActive')) {
      return;
    }

    var $popup = this.$();
    var $pointer = $popup.children('.popup-menu_pointer');

    var boundingRect = Rectangle.ofElement(window);
    var popupRect = Rectangle.ofView(this, 'padding');
    var targetRect = Rectangle.ofElement(get(this, 'activeTarget'), 'padding');
    var pointerRect = Rectangle.ofElement($pointer[0], 'borders');

    if (boundingRect.intersects(targetRect)) {
      var flowName = get(this, 'flow');
      var constraints = this.container.lookup('popup-constraint:' + flowName);
      Ember.assert(fmt(
        ("The flow named '%@1' was not registered with the {{popup-menu}}.\n" +
         "Register your flow by creating a file at 'app/popup-menu/flows/%@1.js' with the following function body:\n\nexport default function %@1 () {\n  return this.orientBelow().andSnapTo(this.center);\n});"), [flowName]), constraints);
      var solution;
      for (var i = 0, len = constraints.length; i < len; i++) {
        solution = constraints[i].solveFor(boundingRect, targetRect, popupRect, pointerRect);
        if (solution.valid) { break; }
      }

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
