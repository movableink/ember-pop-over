import Ember from "ember";
import Orientation from "./orientation";

const on = Ember.on;

export default Ember.Object.extend({
  setupOrienters: on('init', function() {
    this.orientAbove = Orientation.create({ orientation: 'above' });
    this.orientBelow = Orientation.create({ orientation: 'below' });
    this.orientRight = Orientation.create({ orientation: 'right' });
    this.orientLeft = Orientation.create({ orientation: 'left' });
  }),

  topEdge:    'top-edge',
  bottomEdge: 'bottom-edge',
  leftEdge:   'left-edge',
  rightEdge:  'right-edge',
  center:     'center'
});
