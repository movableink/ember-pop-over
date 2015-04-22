import Constraint from "ember-pop-over/system/constraint";
import Rectangle from "ember-pop-over/system/rectangle";
import { test } from "ember-qunit";

module("Constraint Solver");

test("above and below solutions (with no pointer)", function () {
  var bounds = new Rectangle(0, 0, 100, 100);
  var target = new Rectangle(45, 45, 10, 10);
  // Solves for above and below; not left nor right
  var popover  = new Rectangle(0, 0, 50, 20);
  var pointer = new Rectangle(0, 0, 0, 0);

  var constraint = new Constraint({
    orientation: 'above',
    behavior: 'snap',
    guideline: 'center'
  });
  var solution = constraint.solveFor(bounds, target, popover, pointer);
  equal(solution.orientation, 'above');
  equal(solution.pointer, 'center');
  ok(solution.valid);

  equal(popover.x, 25);
  equal(popover.y, 25);


  constraint = new Constraint({
    orientation: 'below',
    behavior: 'snap',
    guideline: 'center'
  });
  solution = constraint.solveFor(bounds, target, popover, pointer);
  equal(solution.orientation, 'below');
  equal(solution.pointer, 'center');
  ok(solution.valid);

  equal(popover.x, 25);
  equal(popover.y, 55);
});

test("vertical slide", function () {
  var bounds = new Rectangle(0, 0, 100, 100);
  var target = new Rectangle(45, 45, 10, 10);
  var popover  = new Rectangle(0, 0, 40, 90);
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
      solution = constraint.solveFor(bounds, target, popover, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'top-edge');
      ok(solution.valid);

      equal(popover.top, 0);
      equal(popover.left, left);
    }

    for (; y < 54; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popover, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'center');
      ok(solution.valid);

      equal(popover.top, 0);
      equal(popover.left, left);
    }

    for (; y <= 90; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popover, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'bottom-edge');
      ok(solution.valid);

      if (y < 80) {
        equal(popover.top, 0);
      } else {
        equal(popover.top, y - 80);
      }
      equal(popover.left, left);
    }

    target = new Rectangle(45, y, 10, 10);
    solution = constraint.solveFor(bounds, target, popover, pointer);
    equal(solution.orientation, orientation);
    equal(solution.pointer, 'bottom-edge');
    ok(!solution.valid);
  });
});

test("vertical slide from center -> bottom", function () {
  var bounds = new Rectangle(0, 0, 100, 100);
  var target = new Rectangle(45, 45, 10, 10);
  var popover  = new Rectangle(0, 0, 40, 70);
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
      solution = constraint.solveFor(bounds, target, popover, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'top-edge');
      ok(solution.valid);

      equal(popover.top, 0);
      equal(popover.left, left);
    }

    for (; y <= 60; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popover, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'center');
      ok(solution.valid);

      if (y < 30) {
        equal(popover.top, 0);
      } else {
        equal(popover.top, y - 30);
      }
      equal(popover.left, left);
    }

    target = new Rectangle(45, y, 10, 10);
    solution = constraint.solveFor(bounds, target, popover, pointer);
    equal(solution.orientation, orientation);
    equal(solution.pointer, 'center');
    ok(!solution.valid);

    equal(popover.top, 31);
    equal(popover.left, left);
  });
});

test("vertical slide from top -> center", function () {
  var bounds = new Rectangle(0, 0, 100, 100);
  var target = new Rectangle(45, 45, 10, 10);
  var popover  = new Rectangle(0, 0, 40, 70);
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
    var solution = constraint.solveFor(bounds, target, popover, pointer);
    ok(!solution.valid);

    equal(popover.top, -1);
    equal(popover.left, left);

    for (y; y < 40; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popover, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'center');
      ok(solution.valid);

      equal(popover.top, 0);
      equal(popover.left, left);
    }

    for (; y <= 90; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popover, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'bottom-edge');
      ok(solution.valid);

      if (y <= 60) {
        equal(popover.top, 0);
      } else {
        equal(popover.top, y - 60);
      }
      equal(popover.left, left);
    }

    target = new Rectangle(45, y, 10, 10);
    solution = constraint.solveFor(bounds, target, popover, pointer);
    ok(!solution.valid);

    equal(popover.top, 31);
    equal(popover.left, left);
  });
});

test("vertical slide from bottom -> center", function () {
  var bounds = new Rectangle(0, 0, 100, 100);
  var target = new Rectangle(45, 45, 10, 10);
  var popover  = new Rectangle(0, 0, 40, 70);
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
    var solution = constraint.solveFor(bounds, target, popover, pointer);
    ok(!solution.valid);

    equal(popover.top, -1);
    equal(popover.left, left);

    for (; y < 50; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popover, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'top-edge');
      ok(solution.valid);

      if (y < 30) {
        equal(popover.top, y);
      } else {
        equal(popover.top, 30);
      }
      equal(popover.left, left);
    }

    for (; y <= 60; y++) {
      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popover, pointer);
      equal(solution.orientation, orientation);
      equal(solution.pointer, 'center');
      ok(solution.valid);

      equal(popover.top, 30);
      equal(popover.left, left);
    }

    target = new Rectangle(45, y, 10, 10);
    solution = constraint.solveFor(bounds, target, popover, pointer);
    ok(!solution.valid);

    equal(popover.top, 31);
    equal(popover.left, left);
  });
});
