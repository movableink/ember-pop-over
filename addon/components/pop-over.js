import Ember from "ember";
import Target from "../system/target";
import Rectangle from "../system/rectangle";
import w from "../computed/w";

const computed = Ember.computed;
const on = Ember.on;
const observer = Ember.observer;

const bind = Ember.run.bind;
const scheduleOnce = Ember.run.scheduleOnce;
const next = Ember.run.next;

const get = Ember.get;
const set = Ember.set;

const alias = Ember.computed.alias;
const bool = Ember.computed.bool;
const filterBy = Ember.computed.filterBy;

const addObserver = Ember.addObserver;
const removeObserver = Ember.removeObserver;

const isSimpleClick = Ember.ViewUtils.isSimpleClick;
const $ = Ember.$;

export default Ember.Component.extend({

  isVisible: false,

  classNames: ['pop-over'],

  classNameBindings: ['orientationClassName', 'pointerClassName'],

  orientationClassName: computed('orientation', function () {
    var orientation = get(this, 'orientation');
    return orientation ? `orient-${orientation}` : null;
  }),

  pointerClassName: computed('pointer', function () {
    var pointer = get(this, 'pointer');
    return pointer ? `pointer-${pointer}` : null;
  }),

  disabled: false,

  orientation: null,

  pointer: null,

  flow: 'around',

  /**
    The target element of the pop over.
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

  targets: computed(function() {
    return Ember.A();
  }),

  /**
    Property that notifies the pop over to retile
   */
  'will-change': alias('willChange'),
  willChange: w(),

  willChangeDidChange: on('init', observer('willChange', function () {
    (get(this, '_oldWillChange') || Ember.A()).forEach(function (key) {
      removeObserver(this, key, this, 'retile');
    }, this);

    get(this, 'willChange').forEach(function (key) {
      addObserver(this, key, this, 'retile');
    }, this);

    set(this, '_oldWillChange', get(this, 'willChange'));
    this.retile();
  })),

  // ..............................................
  // Event management
  //

  attachWindowEvents: on('didInsertElement', function () {
    this.retile();

    var retile = this.__retile = bind(this, 'retile');
    ['scroll', 'resize'].forEach(function (event) {
      $(window).on(event, retile);
    });

    addObserver(this, 'isVisible', this, 'retile');
  }),

  attachTargets: on('didInsertElement', function () {
    // Add implicit target
    if (get(this, 'for') && get(this, 'on')) {
      this.addTarget(get(this, 'for'), {
        on: get(this, 'on')
      });
    }

    next(this, function () {
      get(this, 'targets').invoke('attach');
    });
  }),

  removeEvents: on('willDestroyElement', function () {
    get(this, 'targets').invoke('detach');

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
  }),

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

  activeTarget: computed('activeTargets.[]', function () {
    if (get(this, 'isActive')) {
      return get(this, 'targets').findBy('anchor', true) ||
             get(this, 'activeTargets.firstObject');
    }
    return null;
  }),

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
  visibilityDidChange: on('init', observer('isActive', function () {
    var proxy = this.__documentClick = this.__documentClick || bind(this, 'documentClick');

    var isActive = get(this, 'isActive');
    var isInactive = !isActive;
    var isVisible = get(this, 'isVisible');
    var isHidden = !isVisible;

    if (isActive && isHidden) {
      $(document).on('mousedown', proxy);
      this.show();

    // Remove click events immediately
    } else if (isInactive && isVisible) {
      $(document).off('mousedown', proxy);
      this.hide();
    }
  })),

  hide: function () {
    if (this.isDestroyed) { return; }
    set(this, 'isVisible', false);
  },

  show: function () {
    if (this.isDestroyed) { return; }
    set(this, 'isVisible', true);
  },

  retile: function () {
    if (get(this, 'isVisible')) {
      scheduleOnce('afterRender', this, 'tile');
    }
  },

  tile: function () {
    var target = get(this, 'activeTarget');
    // Don't tile if there's nothing to constrain the pop over around
    if (!get(this, 'element') || !target) {
      return;
    }

    var $popover = this.$();
    var $pointer = $popover.children('.pop-over-pointer');

    var boundingRect = Rectangle.ofElement(window);
    var popoverRect = Rectangle.ofView(this, 'padding');
    var targetRect = Rectangle.ofElement(target.element, 'padding');
    var pointerRect = Rectangle.ofElement($pointer[0], 'borders');

    if (boundingRect.intersects(targetRect)) {
      var flowName = get(this, 'flow');
      var constraints = this.container.lookup('pop-over-constraint:' + flowName);
      Ember.assert(
        `The flow named '${flowName}' was not registered with the {{pop-over}}.
         Register your flow by adding an additional export to 'app/flows.js':

         export function ${flowName} () {
           return this.orientBelow().andSnapTo(this.center);
         });`, constraints);

      var solution;
      for (var i = 0, len = constraints.length; i < len; i++) {
        solution = constraints[i].solveFor(boundingRect, targetRect, popoverRect, pointerRect);
        if (solution.valid) { break; }
      }

      this.setProperties({
        orientation: solution.orientation,
        pointer:     solution.pointer
      });

      var offset = $popover.offsetParent().offset();
      var top = popoverRect.top - offset.top;
      var left = popoverRect.left - offset.left;
      $popover.css({
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
