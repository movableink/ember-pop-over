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

  equal(popup.x, 25);
  equal(popup.y, 55);
});
