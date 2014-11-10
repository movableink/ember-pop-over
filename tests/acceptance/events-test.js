import Ember from 'ember';
import startApp from '../helpers/start-app';
import mouseUp from '../helpers/mouse-up';
import simpleClick from '../helpers/simple-click';
import mouseDown from '../helpers/mouse-down';
import mouseEnter from '../helpers/mouse-enter';
import mouseLeave from '../helpers/mouse-leave';
import focus from '../helpers/focus';
import blur from '../helpers/blur';

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

test('on="click"', function() {
  expect(6);
  visit('/');

  simpleClick("#click");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  simpleClick("#click");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 0);
  });

  simpleClick("#click span");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  simpleClick(".other", null, { which: 1 });
  andThen(function () {
    ok(find(".popup-menu:visible").length === 0);
  });

  mouseDown("#click");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  andThen(function () {
    var defer = Ember.RSVP.defer();
    later(defer, 'resolve', 400);
    return defer.promise;
  });

  mouseUp("#click");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
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

  simpleClick("#click-hold");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  simpleClick("#click-hold");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 0);
  });
});

test('on="hover"', function() {
  expect(2);
  visit('/');

  mouseEnter("#hover");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  mouseLeave("#hover");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 0);
  });
});

test('on="hover hold"', function() {
  expect(4);
  visit('/');

  mouseEnter("#hover-hold");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  mouseLeave("#hover-hold");
  mouseEnter("#hover-hold-menu");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  mouseEnter("#hover-hold-menu .inner");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  mouseLeave("#hover-hold-menu");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 0);
  });
});

test('on="focus"', function() {
  expect(2);
  visit('/');

  focus("#focus");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  blur("#focus");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 0);
  });
});

test('on="hover focus"', function() {
  expect(3);
  visit('/');

  focus("#hover-focus");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  mouseEnter("#hover-focus");
  blur("#hover-focus");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 1);
  });

  mouseLeave("#hover-focus");
  andThen(function () {
    ok(find(".popup-menu:visible").length === 0);
  });
});
