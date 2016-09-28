import Ember from 'ember';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import guidFor from 'ember-metal/utils';
import $ from 'jquery';
import { bind, later, cancel } from 'ember-runloop';
import { assert } from 'ember-metal/utils';

function distance(x1, x2, y1, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * This service sets up a single event listener bound to the document for the
 * 'mousemove' event, and keeps track of the velocity of the mouse. The service
 * can be given a series of targets (DOM elements) to keep track of, and, if the
 * mouse's velocity is below a specified threshold, it will loop through the
 * targets and see if any are hovered. If so, it will invoke a callback
 * function on that target.
 *
 * @class HoverIntent
 * @extends Ember.Service
 */
export default Ember.Service.extend({
  // private properties used to calculate the mouse velocity
  _mouseX: null,
  _mouseY: null,
  _timestamp: null,
  _mouseVelocity: null,
  threshold: .1, // pixels moved per millisecond


  init() {
    this._super(...arguments);
    $(document).on('mousemove', bind(this, this.onMouseMove));
  },

  getVelocity(ev) {
    const now = Date.now();

    if (this._mouseX && this._mouseY && this._timestamp) {
      const d = distance(this._mouseX, ev.pageX, this._mouseY, ev.pageY);
      const changeInTime = now - this._timestamp;
      this._mouseVelocity = d / changeInTime;
    } else {
      this._mouseVelocity = 0;
    }

    this._mouseX = ev.pageX; 
    this._mouseY = ev.pageY;
    this._timestamp = now;

    return this._mouseVelocity;
  },

  /**
   * The addTarget function adds to a tracked object of 'target' objects, which
   * are simple Javascript objects expecting two properties to be defined:
   *
   */
  targets: {},
  addTarget(hoverTarget) {
    const targets = get(this, 'targets');

    let id = '' + hoverTarget.id;
    if (!id || id.length === 0) {
      id = guidFor(hoverTarget); 
    }

    assert(
      !targets.hasOwnProperty(id),
      `The target ${hoverTarget} has already been registered to the hover-intent service`
    );

    assert(
      hoverTarget.hasOwnProperty('callback') && typeof hoverTarget['callback'] === 'function',
      'The hover-intent service requires targets to supply a callback function'
    );

    assert(
      hoverTarget.hasOwnProperty('$element'),
      'The hover-intent service requires targets to include a jQuery object to track hover events'
    );

    targets[id] = hoverTarget; 
  },

  onMouseMove(ev) {
    const getVelocity = bind(this, get(this, 'getVelocity'));

    /**
      Set up a debounce to catch edge case where user is moving quickly, then
      stops suddenly, causing the event listener not to update its velocity to 0.
    */
    cancel(get(this, '_timeout'));
    set(this, '_timeout', later(this, this.checkForHover, 200));

    const mouseVelocity = getVelocity(ev);
    const threshold = get(this, 'threshold');

    if (mouseVelocity < threshold) {
      this.checkForHover();
    }
  },

  checkForHover() {
    const targets = get(this, 'targets');
    for(const target in targets) {
      const targetObj = targets[target];
      if (targetObj.$element.is(':hover')) {
        get(targetObj, 'callback')();
      }
    }
  }
});
