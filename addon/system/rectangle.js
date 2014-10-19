import Ember from "ember";
import { getLayout } from "dom-ruler";

var get = Ember.get;
var alias = Ember.computed.alias;

var $ = Ember.$;

var Rectangle = Ember.Object.extend({

  x: alias('left'),

  y: alias('top'),

  top: null,

  right: function () {
    return get(this, 'left') + get(this, 'width');
  }.property('left', 'width'),

  bottom: function () {
    return get(this, 'top') + get(this, 'height');
  }.property('top', 'height'),

  left: null,

  width: null,

  height: null,

  area: function () {
    return get(this, 'width') * get(this, 'height');
  }.property('width', 'height'),

  intersects: function (rect) {
    return get(Rectangle.intersection(this, rect), 'area') > 0;
  },

  contains: function (rect) {
    return get(Rectangle.intersection(this, rect), 'area') === get(rect, 'area');
  }

});

Rectangle.reopenClass({

  intersection: function (rectA, rectB) {
    // Find the edges
    var rect = {
          top:   Math.max(get(rectA, 'top'), get(rectB, 'top')),
          left:  Math.max(get(rectA, 'left'), get(rectB, 'left'))
        },
        right  = Math.min(get(rectA, 'right'), get(rectB, 'right')),
        bottom = Math.min(get(rectB, 'bottom'), get(rectB, 'bottom'));

    if (get(rectA, 'right') < get(rectB, 'left') ||
        get(rectB, 'right') < get(rectA, 'left') ||
        get(rectA, 'bottom') < get(rectB, 'top') ||
        get(rectB, 'bottom') < get(rectA, 'top')) {
      rect.width = rect.height = 0;
    } else {
      rect.width  = Math.max(0, right - rect.left);
      rect.height = Math.max(0, bottom - rect.top);
    }

    return Rectangle.create(rect);
  },

  ofView: function (view, boxModel) {
    return this.ofElement(get(view, 'element'), boxModel);
  },

  ofElement: function (element, boxModel) {
    var size = getLayout(element);
    if (boxModel) {
      size = size[boxModel];
    }
    var offset = $(element).offset() || { top: $(element).scrollTop(), left: $(element).scrollLeft() };

    return Rectangle.create({
      top:  offset.top,
      left: offset.left,
      width:  size.width,
      height: size.height
    });
  }

});

export default Rectangle;
