import Ember from "ember";
import Target from "ember-pop-over/system/target";
import { module } from "qunit";
import { test } from "ember-qunit";
import run from 'ember-runloop';
import get from 'ember-metal/get';

module("Event Target");

test('"for" takes an string id', function (assert) {
  let target = Target.create({
    target: "ember-testing-container",
    on: 'click'
  });
  target.attach();
  assert.equal(target.element, document.getElementById("ember-testing-container"));
  target.detach();
});

test('"for" takes an element', function (assert) {
  let element = document.getElementById("ember-testing-container");
  let target = Target.create({
    target: element,
    on: 'click'
  });
  target.attach();
  assert.equal(target.element, element);
  target.detach();
});

test('"for" takes a component', function (assert) {
  let component = Ember.Component.create();
  run(function () {
    component.appendTo("#qunit-fixture");
  });
  let target = Target.create({
    target: component,
    on: 'click'
  });
  target.attach();

  assert.equal(target.element, get(component, 'element'));

  run(function () {
    component.destroy();
  });
  target.detach();
});
