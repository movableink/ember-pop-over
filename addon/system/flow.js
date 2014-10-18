import Ember from "ember";
import Orientation from "./orientation";

var Flow = Ember.Object.extend({

  topEdge:    'top-edge',
  bottomEdge: 'bottom-edge',
  leftEdge:   'left-edge',
  rightEdge:  'right-edge',
  center:     'center',

  orientAbove: function () {
    return Orientation.create({ orientation: 'above' });
  }.property(),

  orientBelow: function () {
    return Orientation.create({ orientation: 'below' });
  }.property(),

  orientLeft:  function () {
    return Orientation.create({ orientation: 'left' });
  }.property(),

  orientRight: function () {
    return Orientation.create({ orientation: 'right' });
  }.property()
});

export default Flow;
