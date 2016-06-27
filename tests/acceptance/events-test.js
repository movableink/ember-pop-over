import Ember from 'ember';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import mouseUp from '../helpers/mouse-up';
import simpleClick from '../helpers/simple-click';
import mouseDown from '../helpers/mouse-down';
import mouseEnter from '../helpers/mouse-enter';
import mouseLeave from '../helpers/mouse-leave';
import focus from '../helpers/focus';
import blur from '../helpers/blur';
import { test } from 'ember-qunit';

var later = Ember.run.later;

moduleForAcceptance('Acceptance: Events');

test('on="click"', function (assert) {
  assert.expect(6);
  visit('/');

  simpleClick("#click");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 1);
  });

  simpleClick("#click");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 0);
  });

  simpleClick("#click span");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 1);
  });

  simpleClick(".other", null, { which: 1 });
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 0);
  });

  mouseDown("#click");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 1);
  });

  andThen(function () {
    var defer = Ember.RSVP.defer();
    later(defer, 'resolve', 400);
    return defer.promise;
  });

  mouseUp("#click");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 1);
  });
});

test('on="click hold"', function (assert) {
  assert.expect(4);
  visit('/');

  mouseDown("#click-hold");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 1);
  });

  andThen(function () {
    var defer = Ember.RSVP.defer();
    later(defer, 'resolve', 400);
    return defer.promise;
  });

  mouseUp("#click-hold");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 0);
  });

  simpleClick("#click-hold");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 1);
  });

  simpleClick("#click-hold");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 0);
  });
});

test('on="hover"', function (assert) {
  assert.expect(2);
  visit('/');

  mouseEnter("#hover");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 1);
  });

  mouseLeave("#hover");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 0);
  });
});

test('on="hover hold"', function (assert) {
  assert.expect(4);
  visit('/');

  mouseEnter("#hover-hold");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 1);
  });

  mouseLeave("#hover-hold");
  mouseEnter("#hover-hold-menu");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 1);
  });

  mouseEnter("#hover-hold-menu .inner");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 1);
  });

  mouseLeave("#hover-hold-menu");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 0);
  });
});

test('on="focus"', function (assert) {
  assert.expect(2);
  visit('/');

  focus("#focus");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 1);
  });

  blur("#focus");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 0);
  });
});

test('on="hover focus"', function (assert) {
  assert.expect(3);
  visit('/');

  focus("#hover-focus");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 1);
  });

  blur("#hover-focus");
  mouseEnter("#hover-focus");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 1);
  });

  mouseLeave("#hover-focus");
  andThen(function () {
    assert.ok(find(".pop-over-container:visible").length === 0);
  });
});
