import Ember from 'ember';
import startApp from '../helpers/start-app';

var App;
var later = Ember.run.later;

module('Acceptance: Events', {
  setup: function() {
    App = startApp();
  },
  teardown: function() {
    Ember.run(App, 'destroy');
  }
});

var mouseDown = function (selection) {
  triggerEvent(selection, "mousedown");
};

var mouseUp = function (selection) {
  triggerEvent(selection, "mouseup");
};

test('on="click"', function() {
  expect(4);
  visit('/');

  click("#click");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  click("#click");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 0);
  });

  click("#click span");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  click(".other");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 0);
  });
});

test('on="click hold"', function() {
  expect(4);
  visit('/');

  mouseDown("#click-hold");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  andThen(function () {
    var defer = Ember.RSVP.defer();
    later(defer, 'resolve', 400);
    return defer.promise;
  });

  mouseUp("#click-hold");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 0);
  });

  click("#click-hold");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  click("#click-hold");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 0);
  });
});
