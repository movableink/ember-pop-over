import Ember from "ember";
import layout from './template';

import { assert } from 'ember-metal/utils';
import Component from 'ember-component';
import Target from '../../system/target';
import Rectangle from '../../system/rectangle';
import gravity from '../../system/gravity';
import scrollParent from '../../system/scroll-parent';

import { bind, scheduleOnce, next, once, later } from 'ember-runloop';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import computed, { bool, filterBy } from 'ember-computed';
import observer, { addObserver, removeObserver } from 'ember-metal/observer';
import { A } from 'ember-array/utils';
import on from 'ember-evented/on';
import integrates from '../../computed/integrates';
import classify from '../../computed/classify';

const getOwner = Ember.getOwner;

export default Component.extend({

  layout,

  active: false,

  supportsLiquidFire: integrates('liquid-fire'),

  classNames: ['pop-over'],

  classNameBindings: ['orientationClassName',
                      'pointerClassName',
                      'cover:position-over',
                      'hidden:-hidden'],

  orientationClassName: classify('orient-{{orientation}}'),

  pointerClassName: classify('pointer-{{pointer}}'),

  disabled: false,

  orientation: null,

  pointer: null,

  flow: 'around',

  gravity: null,

  cover: false,

  /**
    The target element of the pop over.
    Can be a component, id, or element.
   */
  for: null,

  on: null,

  addTarget(target, options) {
    get(this, 'targets').pushObject(Target.create(options, {
      target,
      component: this
    }));
  },

  targets: computed({
    get() {
      return A();
    }
  }),

  // ..............................................
  // Event management
  //

  attachWindowEvents: on('didInsertElement', function () {
    this.retile();

    var retile = this.__retile = bind(this, 'retile');
    ['scroll', 'resize'].forEach(function (event) {
      window.addEventListener(event, retile, true);
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
      if (this.isDestroyed) { return; }
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
      window.removeEventListener(event, retile, true);
    });

    if (this.__documentClick) {
      document.removeEventListener('mousedown', this.__documentClick);
      this.__documentClick = null;
    }

    removeObserver(this, 'active', this, 'retile');
    this.__retile = null;
  }),

  mouseEnter() {
    if (get(this, 'disabled')) { return; }
    this._willLeave = false;
    set(this, 'hovered', true);
    this._willLeave = false;
  },

  mouseLeave() {
    this._willLeave = true;
    later(() => {
      if (get(this, 'disabled')) { return; }
      if (A(A(get(this, 'targets')).filterBy('_willLeave', false)).isAny('hovered')) {
        this._willLeave = false;
        set(this, 'hovered', false);
      }

      if (this._willLeave) {
        this._willLeave = false;
        set(this, 'hovered', false);
        get(this, 'targets').setEach('hovered', false);
      }
    }, 150);
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
    var clicked = evt.target === element || element.contains(evt.target);
    var clickedAnyTarget = targets.any(function (target) {
      return evt.target === target.element || target.element.contains(evt.target);
    });

    if (!clicked && !clickedAnyTarget) {
      this.hide();
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
        document.addEventListener('mousedown', proxy);
        this.show();

      // Remove click events immediately
      } else if (inactive && visible) {
        document.removeEventListener('mousedown', proxy);
        this.hide();
      }
    });
  })),

  hide() {
    if (this.isDestroyed) { return; }
    get(this, 'targets').setEach('active', false);
    set(this, 'active', false);
    if (get(this, 'onhide')) {
      get(this, 'onhide')();
    }
  },

  show() {
    if (this.isDestroyed) { return; }
    set(this, 'active', true);
    if (get(this, 'onshow')) {
      get(this, 'onshow')();
    }
  },

  retile() {
    if (get(this, 'active')) {
      this.notifyPropertyChange('targetRect');
      this.notifyPropertyChange('boundingElement');
      scheduleOnce('afterRender', this, 'tile');
    }
  },

  targetRect: computed('activeTarget', {
    get() {
      let target = get(this, 'activeTarget') ||
          { element: document.querySelector('#' + get(this, 'for')) };
      if (target.element) {
        return Rectangle.ofElement(target.element, 'borders');
      }
    }
  }),

  boundingElement: computed({
    get() {
      return scrollParent(get(this, 'element').parentElement);
    }
  }),

  boundingRect: computed('boundingElement', {
    get() {
      let boundingElement = get(this, 'boundingElement');
      if (boundingElement === document.scrollingElement) {
        return Rectangle.ofElement(document);
      }
      return Rectangle.ofElement(boundingElement);
    }
  }),

  tile() {
    let element = get(this, 'element');
    let targetRect = get(this, 'targetRect');

    let boundingElement = get(this, 'boundingElement')
    let boundingRect = get(this, 'boundingRect');

    // Don't tile if there's nothing to constrain the pop over around
    if (!element || !targetRect) {
      return;
    }

    let popover = element.querySelector(':scope > .pop-over-compass');
    if (get(this, 'supportsLiquidFire')) {
      popover = element.querySelector(':scope > .liquid-container > .liquid-child > .pop-over-compass');
      if (element.querySelector(':scope > .liquid-animating')) {
        let child = element.querySelector(':scope > .liquid-container > .liquid-child');
        child.width = targetRect.width + 'px';
        child.height = targetRect.height + 'px';
      }
    }

    let popoverRect = Rectangle.ofElement(popover, 'borders');

    let pointer = popover.querySelector(':scope > .pop-over-container > .pop-over-pointer');
    let pointerRect = pointer ? Rectangle.ofElement(pointer, 'borders') : new Rectangle(0,0,0,0);

    let shouldCover = this.cover;
    let constraints = [];

    let gravityName = get(this, 'gravity');
    if (gravityName) {
      constraints = get(gravity[gravityName] || {}, 'constraints');
      assert(
        `There is no gravity "${gravityName}".

         Please choose one of ${Object.keys(gravity).map((dir) => `"${dir}"`)}.`, constraints);
    } else {
      var flowName = get(this, 'flow');
      constraints = getOwner(this).lookup('pop-over-constraint:' + flowName);
      assert(
        `The flow named '${flowName}' was not registered with the {{pop-over}}.
         Register your flow by adding an additional export to 'app/flows.js':

         export function ${flowName} () {
           return this.orientBelow().andSnapTo(this.center);
         });`, constraints);
    }

    let solution;
    for (let i = 0, len = constraints.length; i < len; i++) {
      solution = constraints[i].solveFor(boundingRect, targetRect, popoverRect, pointerRect, shouldCover);
      if (solution.valid) { break; }
    }

    this.setProperties({
      orientation: solution.orientation,
      pointer:     solution.pointer
    });

    set(this, 'hidden', Rectangle.intersection(boundingRect, targetRect).area === 0);

    if (boundingElement === document.scrollingElement) {
      popoverRect.translateY(-1 * boundingElement.scrollTop);
      popoverRect.translateX(-1 * boundingElement.scrollLeft);
      targetRect.translateY(-1 * boundingElement.scrollTop);
      targetRect.translateX(-1 * boundingElement.scrollLeft);
    }

    if (get(this, 'supportsLiquidFire')) {
      // Position the container over the target
      let container = element.querySelector(':scope > .liquid-container');
      let centerY = targetRect.top + targetRect.height / 2;
      let centerX = targetRect.left + targetRect.width / 2;
      container.style.top = centerY + 'px';
      container.style.left = centerX + 'px';

      popover.style.top = (popoverRect.top - centerY) + 'px';
      popover.style.left = (popoverRect.left - centerX) + 'px';
      popover.style.width = popoverRect.width + 'px';
      popover.style.height = popoverRect.height + 'px';

      // Prevent flashing caused by liquid-fire
      popover.style.opacity = 0;
      scheduleOnce('afterRender', this, 'showPopOver', popover);
    } else {
      popover.style.top = popoverRect.top + 'px';
      popover.style.left = popoverRect.left + 'px';
      popover.style.width = popoverRect.width + 'px';
      popover.style.height = popoverRect.height + 'px';
    }

    if (pointer) {
      pointer.style.top = pointerRect.top + 'px';
      pointer.style.left = pointerRect.left + 'px';
    }
  },

  showPopOver(popover) {
    popover.style.opacity = 1;
  }

});
