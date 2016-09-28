import Ember from "ember";
const isSimpleClick = Ember.ViewUtils.isSimpleClick;

import get from 'ember-metal/get';
import set from 'ember-metal/set';
import { copy, generateGuid } from 'ember-metal/utils';
import computed from 'ember-computed';
import { w } from 'ember-string';
import { bind, next, later } from 'ember-runloop';
import $ from 'jquery';
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

function guard (fn) {
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

function getLabelSelector($element) {
  let id = $element.attr('id');
  if (id) {
    return `label[for="${id}"]`;
  }
}

function labelForEvent(evt) {
  let $target = $(evt.target);
  if ($target[0].tagName.toLowerCase() === 'label') {
    return $target;
  } else {
    return $target.parents('label');
  }
}

function isLabelClicked(target, label) {
  if (label == null) {
    return false;
  }
  return $(label).attr('for') === $(target).attr('id');
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


export default EmberObject.extend(Evented, {

  init: function () {
    let target = get(this, 'target');
    assert("You cannot make the {{pop-over}} a target of itself.", get(this, 'component') !== target);

    this.eventManager = {
      focusin:    bind(this, 'focus'),
      focusout:   bind(this, 'blur'),
      mouseleave: bind(this, 'mouseLeave'),
      mousedown:  bind(this, 'mouseDown')
    };

    if (get(this, 'requireIntent')) {
      this.eventManager.mousemove = bind(this, 'mouseMove');
    } else {
      this.eventManager.mouseenter = bind(this, 'mouseEnter');
    }

    if (get(target, 'element')) {
      this.attach();
    } else if (target.one) {
      target.one('didInsertElement', this, 'attach');
    } else if (typeof target === 'string') {
      poll(target, this, 'attach');
    }
  },

  attach: function () {
    let element = getElementForTarget(this.target);
    let $element = $(element);
    let $document = $(document);

    // Already attached or awaiting an element to exist
    if (get(this, 'attached') || element == null) { return; }

    set(this, 'attached', true);
    set(this, 'element', element);

    let id = $element.attr('id');
    if (id == null) {
      id = generateGuid();
      $element.attr('id', id);
    }

    let eventManager = this.eventManager;

    Object.keys(eventManager).forEach(function (event) {
      $document.on(event, `#${id}`, eventManager[event]);
    });

    let selector = getLabelSelector($element);
    if (selector) {
      Object.keys(eventManager).forEach(function (event) {
        $document.on(event, selector, eventManager[event]);
      });
    }
  },

  detach: function () {
    let element = this.element;
    let $element = $(element);
    let $document = $(document);

    let eventManager = this.eventManager;

    let id = $element.attr('id');
    Object.keys(eventManager).forEach(function (event) {
      $document.off(event, '#' + id, eventManager[event]);
    });

    let selector = getLabelSelector($element);
    if (selector) {
      Object.keys(eventManager).forEach(function (event) {
        $document.off(event, selector, eventManager[event]);
      });
    }

    // Remove references for GC
    this.eventManager = null;
    set(this, 'element', null);
    set(this, 'target', null);
    set(this, 'component', null);
  },

  on: computed({
    set(key, value) {
      return parseActivators(value);
    }
  }),

  isClicked: function (evt) {
    if (isSimpleClick(evt)) {
      let label = labelForEvent(evt);
      let element = this.element;
      return evt.target === element || $.contains(element, evt.target) ||
        isLabelClicked(element, label);
    }
    return false;
  },

  active: computed('focused', 'hovered', 'pressed', 'component.hovered', 'component.pressed', {
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
    },

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
    }
  }),

  focus: guard(function () {
    set(this, 'focused', true);
  }),

  blur: guard(function () {
    set(this, 'focused', false);
  }),

  mouseMove: guard(function (ev) {
    if (get(this, 'hovered')) {
      return;
    }

    if (ev.timeStamp - this._lastMouseMove < 20) {
      this._willLeave = false;
      set(this, 'hovered', true);
      this._willLeave = false;
    } else {
      this._lastMouseMove = ev.timeStamp;
    }
  }),

  mouseEnter: guard(function() {
    this._willLeave = false;
    set(this, 'hovered', true);
    this._willLeave = false;
  }),

  mouseLeave: guard(function () {
    this._willLeave = true;
    later(() => {
      if (get(this, 'component.disabled')) { return; }
      if (this._willLeave) {
        this._willLeave = false;
        set(this, 'hovered', false);
      }
    }, 150);
  }),

  mouseDown: guard(function (evt) {
    if (!this.isClicked(evt)) {
      return false;
    }

    let element = this.element;
    let active = !get(this, 'active');
    set(this, 'pressed', active);

    if (active) {
      this.holdStart = new Date().getTime();

      let eventManager = this.eventManager;
      eventManager.mouseup = bind(this, 'mouseUp');
      $(document).on('mouseup', eventManager.mouseup);

      evt.preventDefault();
    }

    $(element).focus();
    return true;
  }),

  mouseUp: function (evt) {
    // Remove mouseup event
    let eventManager = this.eventManager;
    $(document).off('mouseup', eventManager.mouseup);
    eventManager.mouseup = null;

    let label = labelForEvent(evt);

    // Treat clicks on <label> elements as triggers to
    // open the menu
    if (isLabelClicked(this.element, label)) {
      return true;
    }

    let activators = get(this, 'on');

    if (includes(activators, 'click') && includes(activators, 'hold')) {
      // If the user waits more than 400ms between mouseDown and mouseUp,
      // we can assume that they are clicking and dragging to the menu item,
      // and we should close the menu if they mouseup anywhere not inside
      // the menu.
      if (new Date().getTime() - this.holdStart > 400) {
        set(this, 'pressed', false);
      }
    }
    return true;
  }

});

