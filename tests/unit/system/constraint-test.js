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

  var constraint = new Constraint({
    orientation: 'right',
    behavior: 'slide',
    guideline: ['bottom-edge', 'top-edge']
  });

  var solution = constraint.solveFor(bounds, target, popup, pointer);
  equal(solution.orientation, 'right');
  equal(solution.pointer, 'center');
  ok(solution.valid);

  equal(popup.top, 0);
  equal(popup.left, 55);


  constraint = new Constraint({
    orientation: 'left',
    behavior: 'slide',
    guideline: ['bottom-edge', 'top-edge']
  });

  solution = constraint.solveFor(bounds, target, popup, pointer);
  equal(solution.orientation, 'left');
  equal(solution.pointer, 'center');
  ok(solution.valid);

  equal(popup.top, 0);
  equal(popup.left, 5);
});

test("vertical slide from center -> bottom", function () {
  var bounds = new Rectangle(0, 0, 100, 100);
  var target = new Rectangle(45, 45, 10, 10);
  var popup  = new Rectangle(0, 0, 40, 70);
  var pointer = new Rectangle(0, 0, 0, 0);

  var constraint = new Constraint({
    orientation: 'right',
    behavior: 'slide',
    guideline: ['center', 'top-edge']
  });

  var solution = constraint.solveFor(bounds, target, popup, pointer);
  equal(solution.orientation, 'right');
  equal(solution.pointer, 'center');
  ok(solution.valid);

  equal(popup.top, 15);
  equal(popup.left, 55);
});

test("vertical slide from top -> center", function () {
  var bounds = new Rectangle(0, 0, 100, 100);
  var target = new Rectangle(45, 45, 10, 10);
  var popup  = new Rectangle(0, 0, 40, 70);
  var pointer = new Rectangle(0, 0, 0, 0);

  var constraint = new Constraint({
    orientation: 'right',
    behavior: 'slide',
    guideline: ['bottom-edge', 'center']
  });

  var solution = constraint.solveFor(bounds, target, popup, pointer);
  equal(solution.orientation, 'right');
  equal(solution.pointer, 'bottom-edge');
  ok(solution.valid);

  equal(popup.top, 0);
  equal(popup.left, 55);

  target = new Rectangle(45, 30, 10, 10);

  solution = constraint.solveFor(bounds, target, popup, pointer);
  equal(solution.orientation, 'right');
  equal(solution.pointer, 'center');
  ok(solution.valid);

  equal(popup.top, 0);
  equal(popup.left, 55);
});