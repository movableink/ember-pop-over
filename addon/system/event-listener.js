import Ember from 'ember';

const isSimpleClick = Ember.ViewUtils.isSimpleClick;
const { run: { bind, later, cancel } } = Ember;

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

  constructor(threshold=0.1) {
    this._listeners = Ember.A();
    this.threshold = threshold;
    this._uid = 0;
  }

  beginListening() {
    let handlers = this._handlers = {
      focusin:    bind(this, 'focus'),
      focusout:   bind(this, 'blur'),
      mousemove: bind(this, 'mousemove'),
      mouseleave: bind(this, 'mouseleave'),
      mousedown:  bind(this, 'mousedown'),
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

  addEventListeners(element, handlers) {
    if (this._listeners.length === 0) {
      this.beginListening();
    }

    // Listeners are ordered by most specific to least specific
    let insertAt = this._listeners.length;

    for (let i = 0, len = this._listeners.length; i < len; i++) {
      let listener = this._listeners[i];

      if (listener.element.contains(element) ||
          element === listener.element) {
        insertAt = i;
      }
    }

    let id = this._uid++;
    this._listeners.splice(insertAt, 0, { id, element, handlers });
    return id;
  }

  removeEventListeners(id) {
    this._listeners.removeObject(this._listeners.findBy('id', id));

    if (this._listeners.length === 0) {
      this.endListening();
    }
  }

  findListeners(evt) {
    let label = labelFor(evt.target);

    return this._listeners.filter(function ({ element }) {
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
    let oldEnteredListeners = this._enteredListeners || [];
    let enteredListeners = this.findListeners(evt);

    oldEnteredListeners.forEach(function (oldListener) {
      let exists = enteredListeners.indexOf(oldListener) !== -1;
      if (!exists) {
        oldListener.handlers.pointerleave(evt);
      }
    });

    enteredListeners.forEach(function (listener) {
      let exists = oldEnteredListeners.indexOf(listener) !== -1;
      if (!exists) {
        listener.handlers.pointerenter(evt);
      }
    });

    this._enteredListeners = enteredListeners;
  }

  mouseleave(evt) {
    let listeners = this._enteredListeners;
    if (listeners) {
      for (let i = 0, len = listeners.length; i < len; i++) {
        listeners[i].handlers.pointerleave(evt);
      }
    }
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
    console.log(eventName, evt);
    let listeners = this.findListeners(evt);
    if (listeners) {
      for (let i = 0, len = listeners.length; i < len; i++) {
        listeners[i].handlers[eventName](evt);
      }
      return true;
    }
    return false;
  }
}
