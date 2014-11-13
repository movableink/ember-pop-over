import Ember from "ember";
import Target from "ember-popup-menu/system/target";
import { test } from "ember-qunit";

var get = Ember.get;
var run = Ember.run;

module("Event Target");

test('"for" takes an string id', function() {
  expect(1);

  var target = Target.create({
    target: "ember-testing-container",
    on: 'click'
  });
  target.attach();
  equal(target.element, document.getElementById("ember-testing-container"));
  target.detach();
});

test('"for" takes an element', function() {
  expect(1);

  var element = document.getElementById("ember-testing-container");
  var target = Target.create({
    target: element,
    on: 'click'
  });
  target.attach();
  equal(target.element, element);
  target.detach();
});

test('"for" takes a view', function() {
  expect(1);

  var view = Ember.View.create();
  run(function () {
    view.appendTo("#qunit-fixture");
  });
  var target = Target.create({
    target: view,
    on: 'click'
  });
  target.attach();

  equal(target.element, get(view, 'element'));

  run(function () {
    view.destroy();
  });
  target.detach();
});
