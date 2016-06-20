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
const once = Ember.run.once;

const get = Ember.get;
const set = Ember.set;

const alias = Ember.computed.alias;
const bool = Ember.computed.bool;
const filterBy = Ember.computed.filterBy;

const addObserver = Ember.addObserver;
const removeObserver = Ember.removeObserver;

const isSimpleClick = Ember.ViewUtils.isSimpleClick;
const $ = Ember.$;
const { getOwner } = Ember;

const integrates = function (key) {
  return computed({
    get() {
      return getOwner(this).lookup(`pop-over-integrations:${key}`);
    }
  });
};

const classify = function (template) {
  var dependentKey = template.match(/{{(.*)}}/)[1];
  return computed(dependentKey, {
    get() {
      let value = get(this, dependentKey);
      return value ? template.replace(`{{${dependentKey}}}`, value) : null;
    }
  });
};

export default Ember.Component.extend({

  active: false,

  supportsLiquidFire: integrates('liquid-fire'),

  classNames: ['pop-over'],

  classNameBindings: ['orientationClassName', 'pointerClassName'],

  orientationClassName: classify('orient-{{orientation}}'),

  pointerClassName: classify('pointer-{{pointer}}'),

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

  addTarget(target, options) {
    get(this, 'targets').pushObject(Target.create(options, {
      component: this,
      target: target,
      _viewRegistry: getOwner(this).lookup('-view-registry:main')
    }));
  },

  targets: computed({
    get() {
      return Ember.A();
    }
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

    addObserver(this, 'active', this, 'retile');
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
      let didinsert = get(this, 'ondidinsert');
      if (didinsert) {
        didinsert(this);
      }
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

    removeObserver(this, 'active', this, 'retile');
    this.__retile = null;
  }),

  mouseEnter() {
    if (get(this, 'disabled')) { return; }
    set(this, 'hovered', true);
  },

  mouseLeave() {
    if (get(this, 'disabled')) { return; }
    set(this, 'hovered', false);
    get(this, 'targets').setEach('hovered', false);
  },

  mouseDown() {
    if (get(this, 'disabled')) { return; }
    set(this, 'pressed', true);
  },

  mouseUp() {
    if (get(this, 'disabled')) { return; }
    set(this, 'pressed', false);
  },

  documentClick(evt) {
    if (get(this, 'disabled')) { return; }

    set(this, 'pressed', false);
    var targets = get(this, 'targets');
    var element = get(this, 'element');
    var clicked = isSimpleClick(evt) &&
      (evt.target === element || $.contains(element, evt.target));
    var clickedAnyTarget = targets.any(function (target) {
      return target.isClicked(evt);
    });

    if (!clicked && !clickedAnyTarget) {
      targets.setEach('pressed', false);
    }
  },

  areAnyTargetsActive: bool('activeTargets.length'),

  activeTargets: filterBy('targets', 'active', true),

  activeTarget: computed('activeTargets.[]', {
    get() {
      if (get(this, 'areAnyTargetsActive')) {
        return get(this, 'targets').findBy('anchor', true) ||
               get(this, 'activeTargets.firstObject');
      }
      return null;
    }
  }),

  activate(target) {
    get(this, 'targets').findBy('target', target).set('active', true);
  },

  deactivate(target) {
    if (target == null) {
      get(this, 'targets').setEach('active', false);
    } else {
      get(this, 'targets').findBy('target', target).set('active', false);
    }
  },

  /**
    Before the menu is shown, setup click events
    to catch when the user clicks outside the
    menu.
   */
  visibilityDidChange: on('init', observer('areAnyTargetsActive', function () {
    once(() => {
      var proxy = this.__documentClick = this.__documentClick || bind(this, 'documentClick');
      var active = get(this, 'areAnyTargetsActive');
      var inactive = !active;
      var visible = get(this, 'active');
      var hidden = !visible;

      if (active && hidden) {
        $(document).on('mousedown', proxy);
        this.show();

      // Remove click events immediately
      } else if (inactive && visible) {
        $(document).off('mousedown', proxy);
        this.hide();
      }
    });
  })),

  hide() {
    if (this.isDestroyed) { return; }
    set(this, 'active', false);
  },

  show() {
    if (this.isDestroyed) { return; }
    set(this, 'active', true);
  },

  retile() {
    if (get(this, 'active')) {
      scheduleOnce('afterRender', this, 'tile');
    }
  },

  tile() {
    var target = get(this, 'activeTarget');
    // Don't tile if there's nothing to constrain the pop over around
    if (!get(this, 'element') || !target) {
      return;
    }

    this.$('.pop-over-hidden').css('display', 'block');
    var $popover = this.$('.pop-over-hidden');
    if ($popover.length === 0) {
      $popover = this.$('.pop-over-compass');
    }
    let $pointer = $popover.children('.pop-over-container')
                           .children('.pop-over-pointer');

    var boundingRect = Rectangle.ofElement(window);
    var popOverRect = Rectangle.ofElement($popover[0], 'padding');
    var targetRect = Rectangle.ofElement(target.element, 'padding');
    var pointerRect = Rectangle.ofElement($pointer[0], 'borders');

    if (boundingRect.intersects(targetRect)) {
      var flowName = get(this, 'flow');
      var constraints = getOwner(this).lookup('pop-over-constraint:' + flowName);
      Ember.assert(
        `The flow named '${flowName}' was not registered with the {{pop-over}}.
         Register your flow by adding an additional export to 'app/flows.js':

         export function ${flowName} () {
           return this.orientBelow().andSnapTo(this.center);
         });`, constraints);

      var solution;
      for (var i = 0, len = constraints.length; i < len; i++) {
        solution = constraints[i].solveFor(boundingRect, targetRect, popOverRect, pointerRect);
        if (solution.valid) { break; }
      }

      this.setProperties({
        orientation: solution.orientation,
        pointer:     solution.pointer
      });

      var offset = $popover.offsetParent().offset();
      popOverRect.top = popOverRect.top - offset.top;
      popOverRect.left = popOverRect.left - offset.left;
      this.$('.pop-over-hidden').css('display', 'none');

      $popover = this.$('.pop-over-compass:not(.pop-over-hidden)');
      $popover.css({
        top: popOverRect.top + 'px',
        left: popOverRect.left + 'px',
        width: popOverRect.width + 'px',
        height: popOverRect.height + 'px'
      });
      scheduleOnce('afterRender', this, 'positionPointer', $popover, pointerRect);
    }
  },

  positionPointer($compass, pointerRect) {
    let selector = '.pop-over-container > .pop-over-pointer';
    let $pointer = get(this, 'supportsLiquidFire') ?
        $(`> .liquid-container > .liquid-child > ${selector}`, $compass) :
        $(selector, $compass);

    $pointer.css({
      top: pointerRect.top + 'px',
      left: pointerRect.left + 'px'
    });
  }

});
