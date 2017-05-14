import Ember from 'ember';

const isSimpleClick = Ember.ViewUtils.isSimpleClick;
const { run: { bind, next, cancel } } = Ember;

function labelFor(element) {
  while (element.parent) {
    if (element.tagName.toLowerCase() === 'label') {
      return element;
    }
    element = element.parent;
  }
}

function distance(x1, x2, y1, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function velocityFromEvents(lastEvt, evt) {
  evt.timestamp = Date.now();
  let velocity = 0;

  if (lastEvt) {
    let d = distance(lastEvt.pageX, evt.pageX, lastEvt.pageY, evt.pageY);
    let dt = evt.timestamp - lastEvt.timestamp;
    velocity = d / dt;
  }

  return velocity;
}

/**
  This class sets up a single event listener bound to the document for the
  events so there are less event listeners attached to DOM elements. It also
  normalizes events so they behave according to the user in interactive ways.

  In particular the `mouseenter` event keeps track of the velocity of the
  mouse to let the event handlers know if a target was hovered on purpose
  or is being passed through.

  In addition to this, this class normalizes mouse events to pointer events
  to support devices that use touch.
 */
export default class {

  threshold = 0.1

  constructor() {
    this._listeners = Ember.A();
  }

  beginListening() {
    let handlers = this._handlers = {
      focusin:    bind(this, 'focus'),
      focusout:   bind(this, 'blur'),
      mouseleave: bind(this, 'mouseleave'),
      mousedown:  bind(this, 'mousedown')
      mouseup:    bind(this, 'mouseup')
    };

    let body = document.body;
    body.addEventListener('focusin', handlers.focusin, {
      passive: true
    });
    body.addEventListener('focusout', handlers.focusout, {
      passive: true
    });
    body.addEventListener('mousemove', handlers.mousemove, {
      passive: true
    });
    body.addEventListener('mouseleave', handlers.mouseleave, {
      passive: true
    });
    body.addEventListener('mousedown', handlers.mousedown, {
      passive: false
    });
    body.addEventListener('touchstart', handlers.touchstart, {
      passive: false
    });
  }

  endListening() {
    let body = document.body;
    let handlers = this._handlers;
    body.removeEventListener('focusin', handlers.focusin, {
      passive: true
    });
    body.removeEventListener('focusout', handlers.focusout, {
      passive: true
    });
    body.removeEventListener('mousemove', handlers.mousemove, {
      passive: true
    });
    body.removeEventListener('mouseleave', handlers.mouseleave, {
      passive: true
    });
    body.removeEventListener('mousedown', handlers.mousedown, {
      passive: false
    });
    body.addEventListener('touchstart', handlers.touchstart, {
      passive: false
    });
  }

  addEventListeners(selector, handlers) {
    if (this._listeners.length === 0) {
      this.beginListening();
    }

    // Listeners are ordered by most specific to least specific
    let insertAt = this._listeners.length;

    for (let i = 0, len = this._listeners.length; i < len; i++) {
      let listener = this._listeners[i];
      Ember.assert(`Cannot add multiple listeners for the same element ${selector}, ${listener.selector}`, document.querySelector(selector) !== document.querySelector(listener.selector));

      if (document.querySelector(`${listener.selector} ${selector}`) ||
          document.querySelector(selector) === document.querySelector(listener.selector)) {
        insertAt = i;
      }
    }

    this._listeners.splice(insertAt, 0, { selector, handlers });
  }

  removeEventListeners(selector) {
    this._listeners.removeObject(this._listeners.findBy('selector', selector));

    if (this._listeners.length === 0) {
      this.endListening();
    }
  }

  findListener(evt) {
    let label = labelFor(evt.target);

    return this._listeners.find(function ({ selector }) {
      let element = document.querySelector(selector);
      return element === evt.target ||
             element.contains(evt.target) ||
             (label && label.attributes.for.value === element.id);
    });
  }

  focus(evt) {
    this.triggerEvent('focus', evt);
  }

  blur(evt) {
    this.triggerEvent('blur', evt);
  }

  mousemove(evt) {
    let lastEvent = evt;

    Ember.run.throttle(this, function (evt) {
      // Check when the mouse has a full-stop
      cancel(this._fullStop);
      this._fullStop = later(this, () => {
        this.mouseenter(lastEvent);
      }, 200);

      let velocity = velocityFromEvents(this._evt, evt);
      let threshold = this.threshold;
      this._evt = evt;

      if (velocity < threshold) {
        this.mouseenter(evt);
      }
    }, evt, 50);
  }

  mouseenter(evt) {
    this._willLeave = false;
    this.triggerEvent('pointerenter', evt);
    this._willLeave = false;
  }

  mouseleave(evt) {
    this._willLeave = true;
    later(() => {
      if (this._willLeave) {
        this._willLeave = false;
        this.triggerEvent('pointerleave', evt);
      }
    }, 150);
  }

  mousedown(evt) {
    if (isSimpleClick(evt) && this.triggerEvent('pointerdown', evt)) {
      document.body.addEventListener('mouseup', this._handlers.mouseup, {
        passive: true
      });
    }
  }

  mouseup(evt) {
    document.body.removeEventListener('mouseup', this._handlers.mouseup, {
      passive: true
    });

    if (isSimpleClick(evt)) {
      this.triggerEvent('pointerup', evt);
    }
  }

  touchstart(evt) {
    if (this.triggerEvent('pointerdown', evt)) {
      document.body.addEventListener('touchend', this._handlers.touchend, {
        passive: true
      });
    }
  }

  touchend(evt) {
    document.body.removeEventListener('touchend', this._handlers.touchend, {
      passive: true
    });

    this.triggerEvent('pointerup', evt);
  }

  triggerEvent(eventName, evt) {
    let listener = this.findListener(evt);
    if (listener) {
      listener.handlers[eventName](evt);
      return true;
    }
    return false;
  }
}
