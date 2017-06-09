import Ember from "ember";
import EventListener from './event-listener';

import get from 'ember-metal/get';
import set from 'ember-metal/set';
import { copy } from 'ember-metal/utils';
import computed from 'ember-computed';
import { w } from 'ember-string';
import { bind, next } from 'ember-runloop';
import { assert } from 'ember-metal/utils';
import { A } from 'ember-array/utils';
import Evented from 'ember-evented';
import EmberObject from 'ember-object';

function includes(haystack, needle) {
  if (haystack.includes) {
    return haystack.includes(needle);
  } else {
    return haystack.contains(needle);
  }
}

function guard(fn) {
  return function (evt) {
    if (get(this, 'component.disabled')) { return; }
    fn.call(this, evt);
  };
}

function getElementForTarget(target) {
  if (typeof target === 'string') {
    return document.getElementById(target);
  } else if (get(target, 'element')) {
    return get(target, 'element');
  } else {
    return target;
  }
}

const VALID_ACTIVATORS = ["focus", "hover", "click", "hold"];
function parseActivators(value) {
  if (value) {
    let activators = value;
    if (typeof value === "string") {
      activators = A(w(value));
    }
    assert(
      `${value} are not valid activators.
        Valid events are ${VALID_ACTIVATORS.join(', ')}`,
      A(copy(activators)).removeObjects(VALID_ACTIVATORS).length === 0
    );
    return activators;
  }

  assert(
    `You must provide an event name to the {{pop-over}}.
      Valid events are ${VALID_ACTIVATORS.join(', ')}`,
    false
  );
}

function poll(target, scope, fn) {
  if (getElementForTarget(target)) {
    scope[fn]();
  } else {
    next(null, poll, target, scope, fn);
  }
}

const listener = new EventListener();

export default EmberObject.extend(Evented, {

  init() {
    let target = get(this, 'target');
    assert("You cannot make the {{pop-over}} a target of itself.", get(this, 'component') !== target);

    if (get(target, 'element')) {
      this.attach();
    } else if (target.one) {
      target.one('didInsertElement', this, 'attach');
    } else if (typeof target === 'string') {
      poll(target, this, 'attach');
    }
  },

  attach() {
    let element = getElementForTarget(this.target);

    // Already attached or awaiting an element to exist
    if (get(this, 'attached') || element == null) { return; }

    set(this, 'attached', true);
    set(this, 'element', element);

    this._listenerId = listener.addEventListeners(element, {
      focus:        bind(this, 'focus'),
      blur:         bind(this, 'blur'),
      pointerenter: bind(this, 'pointerEnter'),
      pointerleave: bind(this, 'pointerLeave'),
      pointerdown:  bind(this, 'pointerDown'),
      pointerup:    bind(this, 'pointerUp')
    });
  },

  detach() {
    listener.removeEventListeners(this._listenerId);

    set(this, 'element', null);
    set(this, 'target', null);
    set(this, 'component', null);
  },

  on: computed({
    set(key, value) {
      return parseActivators(value);
    }
  }),

  active: computed('focused', 'hovered', 'pressed', 'component.hovered', 'component.pressed', {
    get() {
      let activators = get(this, 'on');
      let active = false;

      if (includes(activators, 'focus')) {
        active = active || get(this, 'focused');
        if (includes(activators, 'hold')) {
          active = active || get(this, 'component.pressed');
        }
      }

      if (includes(activators, 'hover')) {
        active = active || get(this, 'hovered');
        if (includes(activators, 'hold')) {
          active = active || get(this, 'component.hovered');
        }
      }

      if (includes(activators, 'click') || includes(activators, 'hold')) {
        active = active || get(this, 'pressed');
      }

      return !!active;
    },

    set(key, value) {
      let activators = get(this, 'on');
      if (value) {
        if (includes(activators, 'focus')) {
          set(this, 'focused', true);
        } else if (includes(activators, 'hover')) {
          set(this, 'hovered', true);
        } else if (includes(activators, 'click')) {
          set(this, 'pressed', true);
        }
      } else {
        set(this, 'focused', false);
        set(this, 'hovered', false);
        set(this, 'pressed', false);
      }
      return value;
    }
  }),

  focus: guard(function () {
    set(this, 'focused', true);
  }),

  blur: guard(function () {
    set(this, 'focused', false);
  }),

  pointerEnter: guard(function() {
    set(this, 'hovered', true);
  }),

  pointerLeave: guard(function () {
    set(this, 'hovered', false);
  }),

  pointerDown: guard(function (evt) {
    let element = this.element;
    let active = !get(this, 'active');
    set(this, 'pressed', active);

    if (active) {
      this.holdStart = new Date().getTime();
      evt.preventDefault();
    }

    element.focus();
  }),

  pointerUp: guard(function () {
    let activators = get(this, 'on');

    if (includes(activators, 'click') && includes(activators, 'hold')) {
      // If the user waits more than 400ms between pointerDown and pointerUp,
      // we can assume that they are clicking and dragging to the menu item,
      // and we should close the menu if they pointerup anywhere not inside
      // the menu.
      if (new Date().getTime() - this.holdStart > 400) {
        set(this, 'pressed', false);
      }
    }
    return true;
  })

});

