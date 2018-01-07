import EmberObject from '@ember/object';
import Orientation from './orientation';

export default EmberObject.extend({
  init() {
    this.orientAbove = Orientation.create({ orientation: 'above' });
    this.orientBelow = Orientation.create({ orientation: 'below' });
    this.orientRight = Orientation.create({ orientation: 'right' });
    this.orientLeft = Orientation.create({ orientation: 'left' });
    this.orientCenter = Orientation.create({ orientation: 'center' });
    this._super();
  },

  topEdge:    'top-edge',
  bottomEdge: 'bottom-edge',
  leftEdge:   'left-edge',
  rightEdge:  'right-edge',
  center:     'center'
});
