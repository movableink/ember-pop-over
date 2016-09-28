import Ember from 'ember';
import computed from 'ember-computed';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import guidFor from 'ember-metal/utils';
import $ from 'jquery';
import { bind, later, cancel } from 'ember-runloop';
import { assert } from 'ember-metal/utils';


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

  mouseVelocity: computed({
    get() {
      return this._mouseVelocity;
    },

    set(_, ev) {
      if (this._mouseX && this._mouseY && this._timestamp) {
        const changeInX = ev.pageX - this._mouseX;
        const changeInY = ev.pageY - this._mouseY;
        const distanceMoved = Math.sqrt(Math.pow(changeInX, 2) + Math.pow(changeInY, 2));
        const changeInTime = Date.now() - this._timestamp;

        const actualMouseVelocity = distanceMoved / changeInTime;

        this._mouseVelocity = Math.round(actualMouseVelocity * 100) / 100;
      } else {
        this._mouseVelocity = 0;
      }

      this._mouseX = ev.pageX; 
      this._mouseY = ev.pageY;
      this._timestamp = Date.now();

      return this._mouseVelocity;
    }
  }),

  init() {
    this._super(...arguments);
    this.setListener();
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

  setListener() {
    $(document).on('mousemove', this.onMouseMove.bind(this));
  },

  onMouseMove(ev) {
    clearTimeout(get(this, '_timeout'));

    set(this, 'mouseVelocity', ev);
    const mouseVelocity = get(this, 'mouseVelocity');
    const threshold = get(this, 'threshold');

    /**
      Set up a debounce to catch edge case where user is moving quickly, then
      stops suddenly, causing the event listener not to update its velocity to 0.
     */
    const isNativeEvent  = !!ev.originalEvent;
    if (isNativeEvent) {
      set(this, '_timeout', Ember.run.later(this, () => {
        $(document).trigger('mousemove')
      }, 200));
    }

    if (isNativeEvent && mouseVelocity > threshold) {
      return;
    }

    const targets = get(this, 'targets');
    for(const target in targets) {
      const targetObj = targets[target];
      if (targetObj.$element.is(':hover')) {
        get(targetObj, 'callback')();
      }
    }
  }
});
