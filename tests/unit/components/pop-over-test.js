import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('pop-over', function(hooks) {
  setupRenderingTest(hooks);

  test('classNames are applied when pointer and orientation are set', async function(assert) {
    this.owner.register('pop-over-constraint:test', [{
      orientation: 'top',
      pointer: 'center',
      solveFor() { return true; }
    }], { instantiate: false });

    await render(hbs`
      {{pop-over for="ember-testing" on='click' flow='test' orientation=orientation pointer=pointer active=active}}
    `);

    this.set('active', true);

    this.set('orientation', 'above');
    assert.dom('.pop-over').hasClass('orient-above');

    this.set('orientation', 'below');
    assert.dom('.pop-over').hasClass('orient-below');

    this.set('pointer', 'center');
    assert.dom('.pop-over').hasClass('pointer-center');

    this.set('orientation', null);
    assert.dom('.pop-over').doesNotHaveClass('orient-below');

    this.set('pointer', 'left');
    assert.dom('.pop-over').hasClass('pointer-left');

    this.set('pointer', null);
    assert.dom('.pop-over').doesNotHaveClass('pointer-left');
  });
});
