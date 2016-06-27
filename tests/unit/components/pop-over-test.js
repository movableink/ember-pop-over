import {
  moduleForComponent,
  test
} from 'ember-qunit';
import run from 'ember-runloop';
import set from 'ember-metal/set';

moduleForComponent('pop-over');

test('classNames are applied when pointer and orientation are set', function(assert) {
  assert.expect(5);

  var component;
  run(this, function () {
    component = this.subject({
      on: 'click',
      supportsLiquidFire: false
    });
    this.render();
    component.show();
  });

  let $ = component.$();
  assert.equal($.prop('class'), 'ember-view pop-over');

  run(function () {
    set(component, 'orientation', 'above');
  });
  assert.equal($.prop('class'), 'ember-view pop-over orient-above');

  run(function () {
    set(component, 'orientation', 'below');
    set(component, 'pointer', 'center');
  });
  assert.equal($.prop('class'), "ember-view pop-over orient-below pointer-center");

  run(function () {
    set(component, 'orientation', null);
    set(component, 'pointer', 'left');
  });
  assert.equal($.prop('class'), "ember-view pop-over pointer-left");

  run(function () {
    set(component, 'pointer', null);
  });
  assert.equal($.prop('class'), "ember-view pop-over");
});
