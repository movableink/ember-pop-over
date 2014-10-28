import Constraint from "ember-popup-menu/system/constraint";
import Rectangle from "ember-popup-menu/system/rectangle";
import { test } from "ember-qunit";

module("Constraint Solver");

test("above and below solutions (with no pointer)", function () {
  var bounds = new Rectangle(0, 0, 100, 100);
  var target = new Rectangle(45, 45, 10, 10);
  // Solves for above and below; not left nor right
  var popup  = new Rectangle(0, 0, 50, 20);
  var pointer = new Rectangle(0, 0, 0, 0);

  var constraint = new Constraint({
    orientation: 'above',
    behavior: 'snap',
    guideline: 'center'
  });
  var solution = constraint.solveFor(bounds, target, popup, pointer);
  equal(solution.orientation, 'above');
  equal(solution.pointer, 'center');
  ok(solution.valid);

  equal(popup.x, 25);
  equal(popup.y, 25);


  constraint = new Constraint({
    orientation: 'below',
    behavior: 'snap',
    guideline: 'center'
  });
  solution = constraint.solveFor(bounds, target, popup, pointer);
  equal(solution.orientation, 'below');
  equal(solution.pointer, 'center');
  ok(solution.valid);

  equal(popup.x, 25);
  equal(popup.y, 55);
});

test("vertical slide", function () {
  var bounds = new Rectangle(0, 0, 100, 100);
  var target = new Rectangle(45, 45, 10, 10);
  var popup  = new Rectangle(0, 0, 40, 90);
  var pointer = new Rectangle(0, 0, 0, 0);

 ['right', 'left'].forEach(function (orientation) {
    var constraint = new Constraint({
      orientation: orientation,
      behavior: 'slide',
      guideline: ['bottom-edge', 'top-edge']
    });

    var solution;
    var left = orientation === 'right' ? 55 : 5;

    for (var y = 0; y < 27; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popup, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'top-edge');
      ok(solution.valid);

      equal(popup.top, 0);
      equal(popup.left, left);
    }

    for (; y < 54; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popup, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'center');
      ok(solution.valid);

      equal(popup.top, 0);
      equal(popup.left, left);
    }

    for (; y <= 90; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popup, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'bottom-edge');
      ok(solution.valid);

      if (y < 80) {
        equal(popup.top, 0);
      } else {
        equal(popup.top, y - 80);
      }
      equal(popup.left, left);
    }

    target = new Rectangle(45, y, 10, 10);
    solution = constraint.solveFor(bounds, target, popup, pointer);
    equal(solution.orientation, orientation);
    equal(solution.pointer, 'bottom-edge');
    ok(!solution.valid);
  });
});

test("vertical slide from center -> bottom", function () {
  var bounds = new Rectangle(0, 0, 100, 100);
  var target = new Rectangle(45, 45, 10, 10);
  var popup  = new Rectangle(0, 0, 40, 70);
  var pointer = new Rectangle(0, 0, 0, 0);

  ['right', 'left'].forEach(function (orientation) {
    var constraint = new Constraint({
      orientation: orientation,
      behavior: 'slide',
      guideline: ['center', 'top-edge']
    });

    var solution;
    var left = orientation === 'right' ? 55 : 5;

    for (var y = 0; y < 20; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popup, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'top-edge');
      ok(solution.valid);

      equal(popup.top, 0);
      equal(popup.left, left);
    }

    for (; y <= 60; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popup, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'center');
      ok(solution.valid);

      if (y < 30) {
        equal(popup.top, 0);
      } else {
        equal(popup.top, y - 30);
      }
      equal(popup.left, left);
    }

    target = new Rectangle(45, y, 10, 10);
    solution = constraint.solveFor(bounds, target, popup, pointer);
    equal(solution.orientation, orientation);
    equal(solution.pointer, 'center');
    ok(!solution.valid);

    equal(popup.top, 31);
    equal(popup.left, left);
  });
});

test("vertical slide from top -> center", function () {
  var bounds = new Rectangle(0, 0, 100, 100);
  var target = new Rectangle(45, 45, 10, 10);
  var popup  = new Rectangle(0, 0, 40, 70);
  var pointer = new Rectangle(0, 0, 0, 0);

  ['right', 'left'].forEach(function (orientation) {
    var constraint = new Constraint({
      orientation: orientation,
      behavior: 'slide',
      guideline: ['bottom-edge', 'center']
    });

    var left = orientation === 'right' ? 55 : 5;

    var y = 29;
    target = new Rectangle(45, y++, 10, 10);
    var solution = constraint.solveFor(bounds, target, popup, pointer);
    ok(!solution.valid);

    equal(popup.top, -1);
    equal(popup.left, left);

    for (y; y < 40; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popup, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'center');
      ok(solution.valid);

      equal(popup.top, 0);
      equal(popup.left, left);
    }

    for (; y <= 90; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popup, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'bottom-edge');
      ok(solution.valid);

      if (y <= 60) {
        equal(popup.top, 0);
      } else {
        equal(popup.top, y - 60);
      }
      equal(popup.left, left);
    }

    target = new Rectangle(45, y, 10, 10);
    solution = constraint.solveFor(bounds, target, popup, pointer);
    ok(!solution.valid);

    equal(popup.top, 31);
    equal(popup.left, left);
  });
});

test("vertical slide from bottom -> center", function () {
  var bounds = new Rectangle(0, 0, 100, 100);
  var target = new Rectangle(45, 45, 10, 10);
  var popup  = new Rectangle(0, 0, 40, 70);
  var pointer = new Rectangle(0, 0, 0, 0);

  ['right', 'left'].forEach(function (orientation) {
    var constraint = new Constraint({
      orientation: orientation,
      behavior: 'slide',
      guideline: ['top-edge', 'center']
    });

    var left = orientation === 'right' ? 55 : 5;

    var y = -1;
    target = new Rectangle(45, y++, 10, 10);
    var solution = constraint.solveFor(bounds, target, popup, pointer);
    ok(!solution.valid);

    equal(popup.top, -1);
    equal(popup.left, left);

    for (; y < 50; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popup, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'top-edge');
      ok(solution.valid);

      if (y < 30) {
        equal(popup.top, y);
      } else {
        equal(popup.top, 30);
      }
      equal(popup.left, left);
    }

    for (; y <= 60; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popup, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'center');
      ok(solution.valid);

      equal(popup.top, 30);
      equal(popup.left, left);
    }

    target = new Rectangle(45, y, 10, 10);
    solution = constraint.solveFor(bounds, target, popup, pointer);
    ok(!solution.valid);

    equal(popup.top, 31);
    equal(popup.left, left);
  });
});
