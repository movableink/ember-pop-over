import {
  moduleForComponent,
  test
} from 'ember-qunit';
import Ember from "ember";

const get = Ember.get;
const set = Ember.set;
const run = Ember.run;
const hasClass = function (element, classNames) {
  let $el = $(element);
  let classList = Ember.A($.trim($el.prop('class')).split(/\s+/)).map(function (className) {
    return $.trim(className);
  }).join(' ');
  equal(classList, classNames);
};

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
    this.append();
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
    this.append();
    component.show();
  });

  let $ = component.$('.pop-over');
  hasClass($, 'pop-over');

  run(function () {
    set(component, 'orientation', 'above');
  });
  hasClass($, 'pop-over orient-above');

  run(function () {
    set(component, 'orientation', 'below');
    set(component, 'pointer', 'center');
  });
  hasClass($, "pop-over orient-below pointer-center");

  run(function () {
    set(component, 'orientation', null);
    set(component, 'pointer', 'left');
  });
  hasClass($, "pop-over pointer-left");

  run(function () {
    set(component, 'pointer', null);
  });
  hasClass($, "pop-over");
});
