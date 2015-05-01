import {
  moduleForComponent,
  test
} from 'ember-qunit';
import Ember from "ember";

const get = Ember.get;
const set = Ember.set;
const run = Ember.run;

moduleForComponent('pop-over', 'PopOverComponent');

test('"retile" is called when will-change properties change', function() {
  expect(4);

  var RETILE_CALLED = false;

  var component;
  run(this, function () {
    component = this.subject({
      on: "click",
      retile: function () {
        RETILE_CALLED = true;
      }
    });
    this.render();
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

  var component;
  run(this, function () {
    component = this.subject({
      on: "click"
    });
    this.render();
    component.show();
  });

  let $ = component.$();
  equal($.prop('class'), 'ember-view pop-over');

  run(function () {
    set(component, 'orientation', 'above');
  });
  equal($.prop('class'), 'ember-view pop-over orient-above');

  run(function () {
    set(component, 'orientation', 'below');
    set(component, 'pointer', 'center');
  });
  equal($.prop('class'), "ember-view pop-over orient-below pointer-center");

  run(function () {
    set(component, 'orientation', null);
    set(component, 'pointer', 'left');
  });
  equal($.prop('class'), "ember-view pop-over pointer-left");

  run(function () {
    set(component, 'pointer', null);
  });
  equal($.prop('class'), "ember-view pop-over");
});
