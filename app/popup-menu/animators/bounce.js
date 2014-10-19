import Ember from "ember";

var RSVP = Ember.RSVP;
var get = Ember.get;
var scheduleOnce = Ember.run.scheduleOnce;

export default {
  in: function () {
    var $element = this.$();

    var marginName;
    switch (get(this, 'orientation')) {
    case 'above': marginName = 'marginBottom'; break;
    case 'below': marginName = 'marginTop';    break;
    case 'left':  marginName = 'marginRight';  break;
    case 'right': marginName = 'marginLeft';   break;
    default: return RSVP.resolve();
    }

    return new RSVP.Promise(function (resolve) {
      scheduleOnce('afterRender', function () {
        var css = { scale: 0.9, opacity: 0 };
        css[marginName] = '-10px';
        $element.css(css);

        var transition = { scale: 1, opacity: 1 };
        transition[marginName] = 0;
        $element.transition(transition, 200, 'easeOutBack', resolve);
      });
    });
  },

  out: function () {
    var $element = this.$();
    var self = this;

    var marginName;
    switch (get(this, 'orientation')) {
    case 'above': marginName = 'marginBottom'; break;
    case 'below': marginName = 'marginTop';    break;
    case 'left':  marginName = 'marginRight';  break;
    case 'right': marginName = 'marginLeft';   break;
    default: return RSVP.resolve();
    }

    return new RSVP.Promise(function (resolve, reject) {
      var transition = { scale: 0.9, opacity: 0 };
      transition[marginName] = '-20px';
      $element.transition(transition, 200, 'easeInBack', function () {
        if (!self.isDestroyed) {
          $element.css(marginName, '-10px');
          resolve();
        } else {
          reject();
        }
      });
    });
  }
};
