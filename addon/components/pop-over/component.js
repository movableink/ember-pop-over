import { bool, filterBy } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { assert } from '@ember/debug';
import {
  later,
  once,
  next,
  scheduleOnce,
  bind
} from '@ember/runloop';
import { observer, computed, set, get } from '@ember/object';
import { removeObserver, addObserver } from '@ember/object/observers';
import { on } from '@ember/object/evented';
import { A } from '@ember/array';
import { getOwner } from '@ember/application';
import layout from './template';

import Target from '../../system/target';
import Rectangle from '../../system/rectangle';
import gravity from '../../system/gravity';
import scrollParent from '../../system/scroll-parent';

import jQuery from 'jquery';
import integrates from '../../computed/integrates';
import classify from '../../computed/classify';

export default Component.extend({
  _mouseHover: service('-mouse-hover'),

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
    Can be a view, id, or element.
   */
  for: null,

  on: null,

  addTarget(target, options) {
    get(this, 'targets').pushObject(Target.create(options, {
      target,
      onhover: get(this, '_mouseHover'),
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
    var clicked = evt.target === element || jQuery.contains(element, evt.target);
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
    get(this, 'targets').findBy('target', target).set('active', false);
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
      scheduleOnce('afterRender', this, 'tile');
    }
  },

  tile() {
    let target = get(this, 'activeTarget') || { element: jQuery('#' + get(this, 'for'))[0] };
    // Don't tile if there's nothing to constrain the pop over around
    if (!get(this, 'element') || !target) {
      return;
    }

    let $element = jQuery(this.element);

    let $popover = $element.find('> .pop-over-compass');
    if (get(this, 'supportsLiquidFire')) {
      $popover = $element.find('> .liquid-container > .liquid-child > .pop-over-compass');
      if ($element.find('> .liquid-animating').length) {
        $element.find('> .liquid-container > .liquid-child').css({
          width: jQuery(target.element).width() + 'px',
          height: jQuery(target.element).height() + 'px'
        });
      }
    }

    let $boundingElement = scrollParent($element.parent());
    let boundingRect = Rectangle.ofElement($boundingElement[0]);
    let popOverRect = Rectangle.ofElement($popover[0], 'borders');
    let targetRect = Rectangle.ofElement(target.element, 'borders');

    let $pointer = $popover.find('> .pop-over-container > .pop-over-pointer');
    let pointerRect;
    if ($pointer.length) {
      pointerRect = Rectangle.ofElement($pointer[0], 'borders');
    } else {
      pointerRect = new Rectangle(0,0,0,0);
    }
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
      solution = constraints[i].solveFor(boundingRect, targetRect, popOverRect, pointerRect, shouldCover);
      if (solution.valid) { break; }
    }

    this.setProperties({
      orientation: solution.orientation,
      pointer:     solution.pointer
    });

    set(this, 'hidden', Rectangle.intersection(boundingRect, targetRect).area === 0);

    if ($boundingElement[0] === document) {
      popOverRect.translateY(-1 * $boundingElement.scrollTop());
      popOverRect.translateX(-1 * $boundingElement.scrollLeft());
      targetRect.translateY(-1 * $boundingElement.scrollTop());
      targetRect.translateX(-1 * $boundingElement.scrollLeft());
    }


    if (get(this, 'supportsLiquidFire')) {
      // Position the container over the target
      $element.find('> .liquid-container').css({
        top: targetRect.top + 'px',
        left: targetRect.left + 'px'
      });

      $popover.css({
        top: (popOverRect.top - targetRect.top) + 'px',
        left: (popOverRect.left - targetRect.left) + 'px',
        width: popOverRect.width + 'px',
        height: popOverRect.height + 'px'
      });

      // Prevent flashing caused by liquid-fire
      $popover.css({ opacity: 0 });
      scheduleOnce('afterRender', this, 'showPopOver', $popover);
    } else {
      $popover.css({
        top: popOverRect.top + 'px',
        left: popOverRect.left + 'px',
        width: popOverRect.width + 'px',
        height: popOverRect.height + 'px'
      });
    }

    if ($pointer.length) {
      $pointer.css({
        top: pointerRect.top + 'px',
        left: pointerRect.left + 'px'
      });
    }

  },

  showPopOver($popover) {
    $popover.css({ opacity: 1 });
  }

});
