import Constraint from "ember-pop-over/system/constraint";
import Rectangle from "ember-pop-over/system/rectangle";
import { module, test } from "qunit";

module("Constraint Solver", function() {
  test("above and below solutions (with no pointer)", function (assert) {
    let bounds = new Rectangle(0, 0, 100, 100);
    let target = new Rectangle(45, 45, 10, 10);
    // Solves for above and below; not left nor right
    let popover  = new Rectangle(0, 0, 50, 20);
    let pointer = new Rectangle(0, 0, 0, 0);
    let shouldCover = false;

    let constraint = new Constraint({
      orientation: 'above',
      behavior: 'snap',
      guideline: 'center'
    });

    // Snap to above, outside target.
    let solution = constraint.solveFor(bounds, target, popover, pointer, shouldCover);
    assert.equal(solution.orientation, 'above');
    assert.equal(solution.pointer, 'center');
    assert.ok(solution.valid);

    assert.equal(popover.x, 25);
    assert.equal(popover.y, 25);

    // Snap to top edge, outside target.
    shouldCover = true;
    solution = constraint.solveFor(bounds, target, popover, pointer, shouldCover);
    assert.equal(popover.x, 25);
    assert.equal(popover.y, 45);

    shouldCover = false;
    constraint = new Constraint({
      orientation: 'below',
      behavior: 'snap',
      guideline: 'center'
    });
    
    // Snap to bottom edge, outside target.
    solution = constraint.solveFor(bounds, target, popover, pointer, shouldCover);
    assert.equal(solution.orientation, 'below');
    assert.equal(solution.pointer, 'center');
    assert.ok(solution.valid);

    assert.equal(popover.x, 25);
    assert.equal(popover.y, 55);

    // Snap to bottom edge, covering target.
    shouldCover = true;
    solution = constraint.solveFor(bounds, target, popover, pointer, shouldCover);
    assert.equal(popover.x, 25);
    assert.equal(popover.y, 35);
  });

  test("vertical slide", function (assert) {
    let bounds = new Rectangle(0, 0, 100, 100);
    let target = new Rectangle(45, 45, 10, 10);
    let popover  = new Rectangle(0, 0, 40, 90);
    let pointer = new Rectangle(0, 0, 0, 0);

   ['right', 'left'].forEach(function (orientation) {
      let constraint = new Constraint({
        orientation: orientation,
        behavior: 'slide',
        guideline: ['bottom-edge', 'top-edge']
      });

      let solution;
      let left = orientation === 'right' ? 55 : 5;

      for (var y = 0; y < 27; y++) {
        target = new Rectangle(45, y, 10, 10);
        solution = constraint.solveFor(bounds, target, popover, pointer);
        assert.equal(solution.orientation, orientation);
        assert.equal(solution.pointer, 'top-edge');
        assert.ok(solution.valid);

        assert.equal(popover.top, 0);
        assert.equal(popover.left, left);
      }

      for (; y < 54; y++) {
        target = new Rectangle(45, y, 10, 10);
        solution = constraint.solveFor(bounds, target, popover, pointer);
        assert.equal(solution.orientation, orientation);
        assert.equal(solution.pointer, 'center');
        assert.ok(solution.valid);

        assert.equal(popover.top, 0);
        assert.equal(popover.left, left);
      }

      for (; y <= 90; y++) {
        target = new Rectangle(45, y, 10, 10);
        solution = constraint.solveFor(bounds, target, popover, pointer);
        assert.equal(solution.orientation, orientation);
        assert.equal(solution.pointer, 'bottom-edge');
        assert.ok(solution.valid);

        if (y < 80) {
          assert.equal(popover.top, 0);
        } else {
          assert.equal(popover.top, y - 80);
        }
        assert.equal(popover.left, left);
      }

      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popover, pointer);
      assert.equal(solution.orientation, orientation);
      assert.equal(solution.pointer, 'bottom-edge');
      assert.notOk(solution.valid);
    });
  });

  test("vertical slide from center -> bottom", function (assert) {
    let bounds = new Rectangle(0, 0, 100, 100);
    let target = new Rectangle(45, 45, 10, 10);
    let popover  = new Rectangle(0, 0, 40, 70);
    let pointer = new Rectangle(0, 0, 0, 0);

    ['right', 'left'].forEach(function (orientation) {
      let constraint = new Constraint({
        orientation: orientation,
        behavior: 'slide',
        guideline: ['center', 'top-edge']
      });

      let solution;
      let left = orientation === 'right' ? 55 : 5;

      for (var y = 0; y < 20; y++) {
        target = new Rectangle(45, y, 10, 10);
        solution = constraint.solveFor(bounds, target, popover, pointer);
        assert.equal(solution.orientation, orientation);
        assert.equal(solution.pointer, 'top-edge');
        assert.ok(solution.valid);

        assert.equal(popover.top, 0);
        assert.equal(popover.left, left);
      }

      for (; y <= 60; y++) {
        target = new Rectangle(45, y, 10, 10);
        solution = constraint.solveFor(bounds, target, popover, pointer);
        assert.equal(solution.orientation, orientation);
        assert.equal(solution.pointer, 'center');
        assert.ok(solution.valid);

        if (y < 30) {
          assert.equal(popover.top, 0);
        } else {
          assert.equal(popover.top, y - 30);
        }
        assert.equal(popover.left, left);
      }

      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popover, pointer);
      assert.equal(solution.orientation, orientation);
      assert.equal(solution.pointer, 'center');
      assert.notOk(solution.valid);

      assert.equal(popover.top, 31);
      assert.equal(popover.left, left);
    });
  });

  test("vertical slide from top -> center", function (assert) {
    let bounds = new Rectangle(0, 0, 100, 100);
    let target = new Rectangle(45, 45, 10, 10);
    let popover  = new Rectangle(0, 0, 40, 70);
    let pointer = new Rectangle(0, 0, 0, 0);

    ['right', 'left'].forEach(function (orientation) {
      let constraint = new Constraint({
        orientation: orientation,
        behavior: 'slide',
        guideline: ['bottom-edge', 'center']
      });

      let left = orientation === 'right' ? 55 : 5;

      let y = 29;
      target = new Rectangle(45, y++, 10, 10);
      let solution = constraint.solveFor(bounds, target, popover, pointer);
      assert.notOk(solution.valid);

      assert.equal(popover.top, -1);
      assert.equal(popover.left, left);

      for (y; y < 40; y++) {
        target = new Rectangle(45, y, 10, 10);
        solution = constraint.solveFor(bounds, target, popover, pointer);
        assert.equal(solution.orientation, orientation);
        assert.equal(solution.pointer, 'center');
        assert.ok(solution.valid);

        assert.equal(popover.top, 0);
        assert.equal(popover.left, left);
      }

      for (; y <= 90; y++) {
        target = new Rectangle(45, y, 10, 10);
        solution = constraint.solveFor(bounds, target, popover, pointer);
        assert.equal(solution.orientation, orientation);
        assert.equal(solution.pointer, 'bottom-edge');
        assert.ok(solution.valid);

        if (y <= 60) {
          assert.equal(popover.top, 0);
        } else {
          assert.equal(popover.top, y - 60);
        }
        assert.equal(popover.left, left);
      }

      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popover, pointer);
      assert.notOk(solution.valid);

      assert.equal(popover.top, 31);
      assert.equal(popover.left, left);
    });
  });

  test("vertical slide from bottom -> center", function (assert) {
    let bounds = new Rectangle(0, 0, 100, 100);
    let target = new Rectangle(45, 45, 10, 10);
    let popover  = new Rectangle(0, 0, 40, 70);
    let pointer = new Rectangle(0, 0, 0, 0);

    ['right', 'left'].forEach(function (orientation) {
      let constraint = new Constraint({
        orientation: orientation,
        behavior: 'slide',
        guideline: ['top-edge', 'center']
      });

      let left = orientation === 'right' ? 55 : 5;

      let y = -1;
      target = new Rectangle(45, y++, 10, 10);
      let solution = constraint.solveFor(bounds, target, popover, pointer);
      assert.notOk(solution.valid);

      assert.equal(popover.top, -1);
      assert.equal(popover.left, left);

      for (; y < 50; y++) {
        target = new Rectangle(45, y, 10, 10);
        solution = constraint.solveFor(bounds, target, popover, pointer);
        assert.equal(solution.orientation, orientation);
        assert.equal(solution.pointer, 'top-edge');
        assert.ok(solution.valid);

        if (y < 30) {
          assert.equal(popover.top, y);
        } else {
          assert.equal(popover.top, 30);
        }
        assert.equal(popover.left, left);
      }

      for (; y <= 60; y++) {
        target = new Rectangle(45, y, 10, 10);
        solution = constraint.solveFor(bounds, target, popover, pointer);
        assert.equal(solution.orientation, orientation);
        assert.equal(solution.pointer, 'center');
        assert.ok(solution.valid);

        assert.equal(popover.top, 30);
        assert.equal(popover.left, left);
      }

      target = new Rectangle(45, y, 10, 10);
      solution = constraint.solveFor(bounds, target, popover, pointer);
      assert.notOk(solution.valid);

      assert.equal(popover.top, 31);
      assert.equal(popover.left, left);
    });
  });
});
