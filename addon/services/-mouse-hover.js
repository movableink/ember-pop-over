import { get } from '@ember/object';
import { assert } from '@ember/debug';
import EmberMap from '@ember/map';
import { throttle, cancel, later } from '@ember/runloop';
import Service from '@ember/service';
import $ from 'jquery';

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
  This service sets up a single event listener bound to the document for the
  'mousemove' event, and keeps track of the velocity of the mouse. The service
  can be given a series of targets (DOM elements) to keep track of, and, if the
  mouse's velocity is below a specified threshold, it will loop through the
  targets and see if any are hovered. If so, it will invoke a callback
  function on that target.

  @class HoverIntent
  @extends Ember.Service
 */
export default Service.extend({
  threshold: 0.1,

  init(...args) {
    this._super(...args);

    this._mousemove = (evt) => {
      this._lastEvt = evt;
      throttle(this, this.mouseMove, evt, 50);
    }
    $(document).on('mousemove', this._mousemove);
  },

  destroy(...args) {
    this._super(...args);
    this._listeners.clear();
    $(document).off('mousemove', this._mousemove);
  },

  addEventListener(element, callback) {
    let listeners = this._listeners = this._listeners || EmberMap.create();

    assert(listeners.has(element), 'The element you provided was already registered for hover events');
    listeners.set(element, callback);
  },

  removeEventListener(element) {
    this._listeners.delete(element);
  },

  mouseMove(evt) {
    if (this.isDestroyed) { return; }

    // Check when the mouse has a full-stop
    cancel(this._fullStop);
    this._fullStop = later(this, () => {
      this._didHover(this._lastEvt);
    }, 200);

    let velocity = velocityFromEvents(this._evt, evt);
    let threshold = get(this, 'threshold');
    this._evt = evt;

    if (velocity < threshold) {
      this._didHover(evt);
    }
  },

  _didHover(evt = {}) {
    let targetElement = evt.target;

    this._listeners.forEach(function (callback, element) {
      if ($.contains(element, targetElement) || element === targetElement) {
        callback();
      }
    });
  }
});
