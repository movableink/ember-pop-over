import { defer } from 'rsvp';
import { later } from '@ember/runloop';
import mouseUp from '../helpers/mouse-up';
import simpleClick from '../helpers/simple-click';
import mouseDown from '../helpers/mouse-down';
import mouseEnter from '../helpers/mouse-enter';
import mouseMove from '../helpers/mouse-move';
import mouseLeave from '../helpers/mouse-leave';
import focus from '../helpers/focus';
import blur from '../helpers/blur';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';

var wait = function (ms) {
  return andThen(function () {
    var _defer = defer();
    later(_defer, 'resolve', ms);
    return _defer.promise;
  });
}

module('Acceptance: Events', function(hooks) {
  setupApplicationTest(hooks);

  test('on="click"', async function(assert) {
    assert.expect(6);
    await visit('/');

    simpleClick("#click");
    assert.ok(find(".pop-over-container:visible").length === 1);

    simpleClick("#click");
    assert.ok(find(".pop-over-container:visible").length === 0);

    simpleClick("#click span");
    assert.ok(find(".pop-over-container:visible").length === 1);

    await click(".other", null, { which: 1 });
    assert.ok(find(".pop-over-container:visible").length === 0);

    mouseDown("#click");
    assert.ok(find(".pop-over-container:visible").length === 1);

    mouseUp("#click");
    assert.ok(find(".pop-over-container:visible").length === 1);
  });

  test('on="click hold"', async function(assert) {
    assert.expect(4);
    await visit('/');

    mouseDown("#click-hold");
    assert.ok(find(".pop-over-container:visible").length === 1);

    wait(400);

    mouseUp("#click-hold");
    assert.ok(find(".pop-over-container:visible").length === 0);

    simpleClick("#click-hold");
    assert.ok(find(".pop-over-container:visible").length === 1);

    simpleClick("#click-hold");
    assert.ok(find(".pop-over-container:visible").length === 0);
  });


  test('on="hover"', async function(assert) {
    assert.expect(2);
    await visit('/');

    mouseMove("#hover");
    assert.ok(find(".pop-over-container:visible").length === 1);

    mouseLeave("#hover");
    wait(200);
    assert.ok(find(".pop-over-container:visible").length === 0);
  });

  test('on="hover hold"', async function(assert) {
    assert.expect(4);
    await visit('/');

    mouseMove("#hover-hold");
    assert.ok(find(".pop-over-container:visible").length === 1);

    mouseLeave("#hover-hold");
    mouseEnter("#hover-hold-menu");
    assert.ok(find(".pop-over-container:visible").length === 1);

    mouseEnter("#hover-hold-menu .inner");
    assert.ok(find(".pop-over-container:visible").length === 1);

    mouseLeave("#hover-hold-menu");
    wait(200);
    assert.ok(find(".pop-over-container:visible").length === 0);
  });

  test('on="focus"', async function(assert) {
    assert.expect(2);
    await visit('/');

    await focus("#focus");
    assert.ok(find(".pop-over-container:visible").length === 1);

    await blur("#focus");
    assert.ok(find(".pop-over-container:visible").length === 0);
  });

  test('on="hover focus"', async function(assert) {
    assert.expect(3);
    await visit('/');

    await focus("#hover-focus");
    assert.ok(find(".pop-over-container:visible").length === 1);

    await blur("#hover-focus");
    mouseMove("#hover-focus");
    assert.ok(find(".pop-over-container:visible").length === 1);

    mouseLeave("#hover-focus");
    assert.ok(find(".pop-over-container:visible").length === 0);
  });
});
