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

  this.render(hbs`{{pop-over on='click' orientation=orientation pointer=pointer supportsLiquidFire=false}}`);
  this.click('.pop-over');

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
