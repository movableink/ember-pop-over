import { later } from '@ember/runloop';
import mouseUp from '../helpers/mouse-up';
import mouseDown from '../helpers/mouse-down';
import mouseEnter from '../helpers/mouse-enter';
import mouseMove from '../helpers/mouse-move';
import mouseLeave from '../helpers/mouse-leave';
import focus from '../helpers/focus';
import blur from '../helpers/blur';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { click, visit } from '@ember/test-helpers';

function wait (ms) {
  return new Promise(function(resolve) {
    later(resolve, ms);
  });
}

module('Acceptance: Events', function(hooks) {
  setupApplicationTest(hooks);

  test('on="click"', async function(assert) {
    assert.expect(6);
    await visit('/');

    await click("#click");
    assert.dom(".pop-over-container").isVisible();

    await click("#click");
    assert.dom(".pop-over-container").isNotVisible();

    await click("#click span");
    assert.dom(".pop-over-container").isVisible();

    await click(".other", null, { which: 1 });
    assert.dom(".pop-over-container").isNotVisible();

    await mouseDown("#click");
    assert.dom(".pop-over-container").isVisible();

    await mouseUp("#click");
    assert.dom(".pop-over-container").isVisible();
  });

  test('on="click hold"', async function(assert) {
    assert.expect(4);
    await visit('/');

    await mouseDown("#click-hold");
    assert.dom(".pop-over-container").isVisible();

    await wait(400);

    await mouseUp("#click-hold");
    assert.dom(".pop-over-container").isNotVisible();

    await click("#click-hold");
    assert.dom(".pop-over-container").isVisible();

    await click("#click-hold");
    assert.dom(".pop-over-container").isNotVisible();
  });


  test('on="hover"', async function(assert) {
    assert.expect(2);
    await visit('/');

    await mouseMove("#hover");
    assert.dom(".pop-over-container").isVisible();

    await mouseLeave("#hover");
    await wait(200);

    assert.dom(".pop-over-container").isNotVisible();
  });

  test('on="hover hold"', async function(assert) {
    assert.expect(4);
    await visit('/');

    await mouseMove("#hover-hold");
    assert.dom(".pop-over-container").isVisible();

    await mouseLeave("#hover-hold");
    await mouseEnter("#hover-hold-menu");
    assert.dom(".pop-over-container").isVisible();

    await mouseEnter("#hover-hold-menu .inner");
    assert.dom(".pop-over-container").isVisible();

    await mouseLeave("#hover-hold-menu");
    await wait(200);
    assert.dom(".pop-over-container").isNotVisible();
  });

  test('on="focus"', async function(assert) {
    assert.expect(2);
    await visit('/');

    await focus("#focus");
    assert.dom(".pop-over-container").isVisible();

    await blur("#focus");
    assert.dom(".pop-over-container").isNotVisible();
  });

  test('on="hover focus"', async function(assert) {
    assert.expect(3);
    await visit('/');

    await focus("#hover-focus");
    assert.dom(".pop-over-container").isVisible();

    await blur("#hover-focus");
    await mouseMove("#hover-focus");
    assert.dom(".pop-over-container").isVisible();

    await mouseLeave("#hover-focus");
    assert.dom(".pop-over-container").isNotVisible();
  });
});
