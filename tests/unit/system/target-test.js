import Component from '@ember/component';
import Target from "ember-pop-over/system/target";
import { module, test } from 'qunit';
import { setupRenderingTest } from "ember-qunit";
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module("system:target", function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.actions = {};
    this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);
  });

  test('"for" takes an string id', async function(assert) {
    await render(hbs`<div id="string-id"></div>`);
    let target = Target.create({
      target: "string-id",
      on: 'click'
    });

    target.attach();
    assert.equal(target.element, document.getElementById('string-id'));
    target.detach();
  });

  test('"for" takes an element', async function(assert) {
    await render(hbs`<div id="test"></div>`)
    let element = document.getElementById("test");
    let target = Target.create({
      target: element,
      on: 'click'
    });
    target.attach();
    assert.equal(target.element, element);
    target.detach();
  });

  test('"for" takes a component', async function(assert) {
    this.owner.register('component:place-holder', Component.extend({
      didInsertElement() {
        this.get('oninsert')(this);
      }
    }));

    this.actions.setComponent = (component) => {
      this.set('component', component);
    };
    await render(hbs`{{place-holder oninsert=(action 'setComponent')}}`);

    let target = Target.create({
      target: this.get('component'),
      on: 'click'
    });
    target.attach();

    assert.equal(target.element, this.get('component.element'));

    target.detach();
  });
});
