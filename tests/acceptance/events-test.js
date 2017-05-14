import Ember from 'ember';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import { triggerEvent, click, find, focus, blur } from 'ember-native-dom-helpers';
import { test } from 'ember-qunit';

var later = Ember.run.later;
var wait = async function (ms) {
  var defer = Ember.RSVP.defer();
  later(defer, 'resolve', ms);
  await defer.promise;
}

moduleForAcceptance('Acceptance: Events');

test('on="click"', async function (assert) {
  await visit('/');

  await click("#click");
  assert.ok(find(".pop-over-container:visible").length === 1);

  await click("#click");
  assert.ok(find(".pop-over-container:visible").length === 0);

  await click("#click span");
  assert.ok(find(".pop-over-container:visible").length === 1);

  await click(".other", { which: 1 });
  assert.notOk(find(".pop-over-container:visible").length);

  await triggerEvent('#click', 'mousedown');
  assert.ok(find(".pop-over-container:visible").length);

  await triggerEvent('#click', 'mouseup');
  assert.ok(find(".pop-over-container:visible").length);
});

test('on="click hold"', async function (assert) {
  await visit('/');

  await triggerEvent('#click-hold', 'mousedown');
  assert.ok(find(".pop-over-container:visible").length === 1);

  await wait(400);

  await triggerEvent('#click-hold', 'mouseup');
  assert.ok(find(".pop-over-container:visible").length === 0);

  await click("#click-hold");
  assert.ok(find(".pop-over-container:visible").length === 1);

  await click("#click-hold");
  assert.ok(find(".pop-over-container:visible").length === 0);
});


test('on="hover"', async function (assert) {
  await visit('/');

  await triggerEvent('#hover', 'mousemove');
  debugger;
  assert.ok(find('.pop-over-container'));

  await triggerEvent('#hover', 'mouseleave');
  debugger;
  await wait(200);
  assert.notOk(find('.pop-over-container'));
});

test('on="hover hold"', async function (assert) {
  await visit('/');

  await triggerEvent('#hover-hold', 'mousemove');
  assert.ok(find(".pop-over-container:visible").length === 1);

  await triggerEvent('#hover-hold', 'mouseleave');
  await triggerEvent('#hover-hold-menu', 'mouseenter');
  assert.ok(find(".pop-over-container:visible").length === 1);

  await triggerEvent('#hover-hold-menu .inner', 'mouseenter');
  assert.ok(find(".pop-over-container:visible").length === 1);

  await triggerEvent("#hover-hold-menu", 'mouseleave');
  await wait(200);
  assert.ok(find(".pop-over-container:visible").length === 0);
});

test('on="focus"', async function (assert) {
  await visit('/');

  await focus("#focus");
  assert.ok(find(".pop-over-container:visible").length === 1);

  await blur("#focus");
  assert.ok(find(".pop-over-container:visible").length === 0);
});

test('on="hover focus"', async function (assert) {
  await visit('/');

  await focus("#hover-focus");
  assert.ok(find(".pop-over-container:visible").length === 1);

  await blur("#hover-focus");
  await triggerEvent('#hover-focus', 'mousemove');
  assert.ok(find(".pop-over-container:visible").length === 1);

  await triggerEvent('#hover-focus', 'mouseleave');
  assert.ok(find(".pop-over-container:visible").length === 0);
});
