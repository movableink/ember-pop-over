import Ember from "ember";
import Target from "ember-pop-over/system/target";
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

test('"for" takes a component', function() {
  expect(1);

  var component = Ember.Component.create();
  run(function () {
    component.appendTo("#qunit-fixture");
  });
  var target = Target.create({
    target: component,
    on: 'click'
  });
  target.attach();

  equal(target.element, get(component, 'element'));

  run(function () {
    component.destroy();
  });
  target.detach();
});
