import {
  moduleForComponent,
  test
} from 'ember-qunit';
import Ember from "ember";

var get = Ember.get;
var set = Ember.set;
var run = Ember.run;

moduleForComponent('popup-menu', 'PopupMenuComponent');

test('"for" takes an string id', function() {
  expect(2);

  // creates the component instance
  var component = this.subject({
    on: "click"
  });
  set(component, 'for', "ember-testing-container");

  var targets = get(component, 'targetElements');
  equal(targets.length, 1);
  equal(targets[0], document.getElementById("ember-testing-container"));
});

test('"for" takes an element', function() {
  expect(2);

  // creates the component instance
  var component = this.subject({
    on: "click"
  });
  var element = document.getElementById("ember-testing-container");
  set(component, 'for', element);

  var targets = get(component, 'targetElements');
  equal(targets.length, 1);
  equal(targets[0], element);
});

test('"for" takes a view', function() {
  expect(3);

  // creates the component instance
  var component = this.subject({
    on: "click"
  });
  this.append();

  var view = get(component, 'parentView');
  ok(view);
  var element = get(view, 'element');
  set(component, 'for', view);

  var targets = get(component, 'targetElements');
  equal(targets.length, 1);
  equal(targets[0], element);
});

test('"retile" is called when will-change properties change', function() {
  expect(4);

  var RETILE_CALLED = false;

  // creates the component instance
  var component = this.subject({
    on: "click",
    retile: function () {
      RETILE_CALLED = true;
    }
  });

  run(function () {
    set(component, 'willChange', "text");
  });
  ok(RETILE_CALLED);

  RETILE_CALLED = false;
  run(function () {
    set(component, 'text', "Hello");
  });
  ok(RETILE_CALLED);

  RETILE_CALLED = false;
  run(function () {
    set(component, 'willChange', null);
  });
  ok(RETILE_CALLED);

  RETILE_CALLED = false;
  run(function () {
    set(component, 'text', "Hello");
   });
  ok(!RETILE_CALLED);
});

test('classNames are applied when pointer and orientation are set', function() {
  expect(5);

  // creates the component instance
  var component = this.subject({
    on: "click"
  });
  this.append();

  var $ = component.$();
  equal($.prop('class'), "ember-view popup-menu");

  run(function () {
    set(component, 'orientation', 'above');
  });
  equal($.prop('class'), "ember-view popup-menu orient-above");

  run(function () {
    set(component, 'orientation', 'below');
    set(component, 'pointer', 'center');
  });
  equal($.prop('class'), "ember-view popup-menu orient-below pointer-center");

  run(function () {
    set(component, 'orientation', null);
    set(component, 'pointer', 'left');
  });
  equal($.prop('class'), "ember-view popup-menu pointer-left");

  run(function () {
    set(component, 'pointer', null);
  });
  equal($.prop('class'), "ember-view popup-menu");
});
