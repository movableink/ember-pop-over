import Ember from "ember";

var RSVP = Ember.RSVP;
var scheduleOnce = Ember.run.scheduleOnce;

export default {
  in: function () {
    var $element = this.$();

    return new RSVP.Promise(function (resolve) {
      scheduleOnce('afterRender', function () {
        $element.css({ scale: 0.9, opacity: 0 });
        $element.transition( { scale: 1, opacity: 1 }, 100, resolve);
      });
    });
  },

  out: function () {
    var $element = this.$();
    var self = this;

    return new RSVP.Promise(function (resolve, reject) {
      $element.transition({ scale: 0.9, opacity: 0 }, 70, function () {
        if (!self.isDestroyed) {
          resolve();
        } else {
          reject();
        }
      });
    });
  }
};
