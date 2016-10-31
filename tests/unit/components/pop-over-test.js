import {
  moduleForComponent,
  test
} from 'ember-qunit';
import run from 'ember-runloop';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pop-over', {
  integration: true,
  setup() {
    this.click = function (selector) {
      let $el = this.$(selector);
      run($el, 'mousedown');
      this.focus(selector);
      run($el, 'mouseup');
      run($el, 'click');
    };

    this.focus = function (selector) {
      let $el = this.$(selector);
      if (!document.hasFocus || document.hasFocus()) {
        run($el, 'focus');
      } else {
        run($el, 'trigger', 'focusin');
      }
    };
  }
});


test('classNames are applied when pointer and orientation are set', function(assert) {
  assert.expect(5);

  assert.hasClasses = function (element, classes) {
    let actual = element.prop('class').split(' ');
    let expected = classes.split(' ');
    assert.ok(
      actual.length === expected.length && expected.reduce(function (hasAll, expected) {
        return hasAll && actual.indexOf(expected) !== -1;
      }, true)
    );
  }

  this.register('pop-over-constraint:test', [{
    orientation: 'top',
    pointer: 'center',
    solveFor() { return true; }
  }], { instantiate: false });

  this.render(hbs`{{pop-over for="ember-testing" on='click' flow='test' orientation=orientation pointer=pointer active=active supportsLiquidFire=false}}`);

  this.set('active', true);

  let $ = this.$('.pop-over');
  assert.hasClasses($, 'ember-view pop-over');

  this.set('orientation', 'above');
  assert.hasClasses($, 'ember-view pop-over orient-above');

  this.set('orientation', 'below');
  this.set('pointer', 'center');
  assert.hasClasses($, 'ember-view pop-over orient-below pointer-center');

  this.set('orientation', null);
  this.set('pointer', 'left');
  assert.hasClasses($, 'ember-view pop-over pointer-left');

  this.set('pointer', null);
  assert.hasClasses($, 'ember-view pop-over');
});
