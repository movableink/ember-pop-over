import Ember from "ember";
import Target from "../system/target";
import Rectangle from "../system/rectangle";
import w from "../computed/w";

var bind = Ember.run.bind;
var scheduleOnce = Ember.run.scheduleOnce;
var next = Ember.run.next;
var cancel = Ember.run.cancel;

var get = Ember.get;
var set = Ember.set;
var fmt = Ember.String.fmt;

var alias = Ember.computed.alias;
var bool = Ember.computed.bool;
var filterBy = Ember.computed.filterBy;

var addObserver = Ember.addObserver;
var removeObserver = Ember.removeObserver;

var RSVP = Ember.RSVP;

var isSimpleClick = Ember.ViewUtils.isSimpleClick;
var $ = Ember.$;

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

  on: null,

  addTarget: function (target, options) {
    get(this, 'targets').pushObject(Target.create(options, {
      component: this,
      target: target
    }));
  },

  targets: function () {
    return [];
  }.property(),

  /**
    Property that notifies the popup menu to retile
   */
  'will-change': alias('willChange'),
  willChange: w(),

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

    var retile = this.__retile = bind(this, 'retile');
    ['scroll', 'resize'].forEach(function (event) {
      $(window).on(event, retile);
    });

    addObserver(this, 'isVisible', this, 'retile');
  }.on('didInsertElement'),

  attachTargets: function () {
    // Add implicit target
    if (get(this, 'for') && get(this, 'on')) {
      this.addTarget(get(this, 'for'), {
        on: get(this, 'on')
      });
    }

    next(this, function () {
      get(this, 'targets').invoke('attach');
    });
  }.on('didInsertElement'),

  removeEvents: function () {
    get(this, 'targets').invoke('detach');
    set(this, 'targets', []);

    var retile = this.__retile;
    ['scroll', 'resize'].forEach(function (event) {
      $(window).off(event, retile);
    });

    if (this.__documentClick) {
      $(document).off('mousedown', this.__documentClick);
      this.__documentClick = null;
    }

    removeObserver(this, 'isVisible', this, 'retile');
    this.__retile = null;
  }.on('willDestroyElement'),

  mouseEnter: function () {
    if (get(this, 'disabled')) { return; }
    set(this, 'hovered', true);
  },

  mouseLeave: function () {
    if (get(this, 'disabled')) { return; }
    set(this, 'hovered', false);
    get(this, 'targets').setEach('hovered', false);
  },

  mouseDown: function () {
    if (get(this, 'disabled')) { return; }
    set(this, 'active', true);
  },

  mouseUp: function () {
    if (get(this, 'disabled')) { return; }
    set(this, 'active', false);
  },

  documentClick: function (evt) {
    if (get(this, 'disabled')) { return; }

    set(this, 'active', false);
    var targets = get(this, 'targets');
    var element = get(this, 'element');
    var clicked = isSimpleClick(evt) &&
      (evt.target === element || $.contains(element, evt.target));
    var clickedAnyTarget = targets.any(function (target) {
      return target.isClicked(evt);
    });

    if (!clicked && !clickedAnyTarget) {
      targets.setEach('active', false);
    }
  },

  isActive: bool('activeTargets.length'),

  activeTargets: filterBy('targets', 'isActive', true),

  activeTarget: function () {
    if (get(this, 'isActive')) {
      return get(this, 'targets').findBy('anchor', true) ||
             get(this, 'activeTargets.firstObject');
    }
    return null;
  }.property('activeTargets.[]'),

  activate: function (target) {
    get(this, 'targets').findBy('target', target).set('isActive', true);
  },

  deactivate: function (target) {
    if (target == null) {
      get(this, 'targets').setEach('isActive', false);
    } else {
      get(this, 'targets').findBy('target', target).set('isActive', false);
    }
  },

  /**
    Before the menu is shown, setup click events
    to catch when the user clicks outside the
    menu.
   */
  visibilityDidChange: function () {
    var component = this;

    if (this._animation) {
      this._animation.then(function () {
        component.visibilityDidChange();
      });
    }

    scheduleOnce('afterRender', this, 'animateMenu');
  }.observes('isActive').on('init'),

  animateMenu: function () {
    var component = this;
    var proxy = this.__documentClick = this.__documentClick || bind(this, 'documentClick');
    var animation = get(this, 'animation');

    var isActive = get(this, 'isActive');
    var isInactive = !isActive;
    var isVisible = get(this, 'isVisible');
    var isHidden = !isVisible;

    if (isActive && isHidden) {
      this._animation = this.show(animation).then(function () {
        $(document).on('mousedown', proxy);
        component._animation = null;
      });

    // Remove click events immediately
    } else if (isInactive && isVisible) {
      $(document).off('mousedown', proxy);
      this._animation = this.hide(animation).then(function () {
        component._animation = null;
      });
    }
  },

  hide: function (animationName) {
    var deferred = RSVP.defer();
    var component = this;
    var animation = this.container.lookup('popup-animation:' + animationName);
    this._hider = next(this, function () {
      if (this.isDestroyed) { return; }

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
    cancel(this._hider);

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
    var target = get(this, 'activeTarget');
    // Don't tile if there's nothing to constrain the popup menu around
    if (!get(this, 'element') || !target) {
      return;
    }

    var $popup = this.$();
    var $pointer = $popup.children('.popup-menu_pointer');

    var boundingRect = Rectangle.ofElement(window);
    var popupRect = Rectangle.ofView(this, 'padding');
    var targetRect = Rectangle.ofElement(target.element, 'padding');
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
