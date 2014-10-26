import Rectangle from "ember-popup-menu/system/rectangle";
import { test } from "ember-qunit";

module("Rectangle");

test("intersecting two overlapping rectangles", function () {
  var a = new Rectangle(0, 0, 15, 15);
  var b = new Rectangle(5, 10, 15, 15);

  var intersection = Rectangle.intersection(a, b);
  equal(intersection.x, 5);
  equal(intersection.width, 10);

  equal(intersection.y, 10);
  equal(intersection.height, 5);

  ok(a.intersects(b));
});

test("intersecting two non-overlapping rectangles", function () {
  var a = new Rectangle(0, 0, 5, 10);
  var b = new Rectangle(5, 10, 15, 15);

  var intersection = Rectangle.intersection(a, b);
  equal(intersection.x, 0);
  equal(intersection.width, 0);

  equal(intersection.y, 0);
  equal(intersection.height, 0);

  ok(!a.intersects(b));
});

test("whether one rectangle contains another", function () {
  var a = new Rectangle(0, 0, 100, 100);
  var b = new Rectangle(5, 10, 20, 20);

  ok(a.contains(b));
  ok(!b.contains(a));
});
