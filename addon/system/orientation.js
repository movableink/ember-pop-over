import { reads } from '@ember/object/computed';
import { isArray, A } from '@ember/array';
import EmberObject, { get, set } from '@ember/object';
import Constraint from "./constraint";

const slice = Array.prototype.slice;

export default EmberObject.extend({

  init: function () {
    this._super();

    this._constraints = A();
    set(this, 'defaultConstraint', {
      orientation: get(this, 'orientation')
    });
  },

  orientation: null,

  defaultConstraint: null,

  constraints: reads('defaultConstraint'),

  andSnapTo: function (snapGuidelines) {
    let constraints = A();
    let guideline;
    let orientation = get(this, 'orientation');

    snapGuidelines = slice.call(arguments);

    for (let i = 0, len = snapGuidelines.length; i < len; i++) {
      guideline = snapGuidelines[i];

      constraints.push(
        new Constraint({
          orientation: orientation,
          behavior:    'snap',
          guideline:   guideline
        })
      );
    }

    if (!isArray(get(this, 'constraints'))) {
      set(this, 'constraints', A());
    }

    this._constraints.pushObjects(constraints);
    get(this, 'constraints').pushObjects(constraints);

    return this;
  },

  andSlideBetween: function () {
    let constraint = new Constraint({
      orientation: get(this, 'orientation'),
      behavior:    'slide',
      guideline:   slice.call(arguments)
    });

    if (!isArray(get(this, 'constraints'))) {
      set(this, 'constraints', A());
    }

    this._constraints.pushObject(constraint);

    // Always unshift slide constraints,
    // since they should be handled first
    get(this, 'constraints').unshiftObject(constraint);

    return this;
  },

  where: function (condition) {
    this._constraints.forEach(function (constraint) {
      constraint.condition = condition;
    });

    return this;
  },

  then: function (guideline) {
    if (guideline !== this) {
      get(this, 'constraints').pushObjects(get(guideline, 'constraints'));
    }

    return this;
  }

});
