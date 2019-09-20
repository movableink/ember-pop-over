import Rectangle from "ember-pop-over/system/rectangle";
import { module, test } from "qunit";

module("Rectangle", function() {
  test("intersecting two overlapping rectangles", function(assert) {
    let a = new Rectangle(0, 0, 15, 15);
    let b = new Rectangle(5, 10, 15, 15);

    let intersection = Rectangle.intersection(a, b);
    assert.equal(intersection.x, 5);
    assert.equal(intersection.width, 10);

    assert.equal(intersection.y, 10);
    assert.equal(intersection.height, 5);

    assert.ok(a.intersects(b));
  });

  test("intersecting two non-overlapping rectangles", function(assert) {
    let a = new Rectangle(0, 0, 5, 10);
    let b = new Rectangle(5, 10, 15, 15);

    let intersection = Rectangle.intersection(a, b);
    assert.equal(intersection.x, 0);
    assert.equal(intersection.width, 0);

    assert.equal(intersection.y, 0);
    assert.equal(intersection.height, 0);

    assert.notOk(a.intersects(b));
  });

  test("whether one rectangle contains another", function(assert) {
    let a = new Rectangle(0, 0, 100, 100);
    let b = new Rectangle(5, 10, 20, 20);

    assert.ok(a.contains(b));
    assert.notOk(b.contains(a));
  });
});
