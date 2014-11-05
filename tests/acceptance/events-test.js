import Ember from 'ember';
import startApp from '../helpers/start-app';

var App;

module('Acceptance: Events', {
  setup: function() {
    App = startApp();
  },
  teardown: function() {
    Ember.run(App, 'destroy');
  }
});

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
