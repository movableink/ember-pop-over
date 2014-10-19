import Ember from "ember";
import Orientation from "./orientation";

var Flow = Ember.Object.extend({

  setupOrienters: function () {
    this.orientAbove = Orientation.create({ orientation: 'above' });
    this.orientBelow = Orientation.create({ orientation: 'below' });
    this.orientRight = Orientation.create({ orientation: 'right' });
    this.orientLeft = Orientation.create({ orientation: 'left' });
  }.on('init'),

  topEdge:    'top-edge',
  bottomEdge: 'bottom-edge',
  leftEdge:   'left-edge',
  rightEdge:  'right-edge',
  center:     'center'
});

export default Flow;
