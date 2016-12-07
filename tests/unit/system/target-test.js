import Ember from "ember";
import Target from "ember-pop-over/system/target";
import { moduleForComponent, test } from "ember-qunit";
import hbs from 'htmlbars-inline-precompile';

moduleForComponent("Event Target", "system:target", {
  integration: true
});

test('"for" takes an string id', function (assert) {
  this.render(hbs`<div id="string-id"></div>`);
  let target = Target.create({
    target: "string-id",
    on: 'click'
  });

  target.attach();
  assert.equal(target.element, document.getElementById('string-id'));
  target.detach();
});

test('"for" takes an element', function (assert) {
  this.render(hbs`<div id="test"></div>`)
  let element = document.getElementById("test");
  let target = Target.create({
    target: element,
    on: 'click'
  });
  target.attach();
  assert.equal(target.element, element);
  target.detach();
});

test('"for" takes a component', function (assert) {
  this.register('component:place-holder', Ember.Component.extend({
    didInsertElement() {
      this.get('oninsert')(this);
    }
  }));

  this.on('setComponent', (component) => {
    this.set('component', component);
  });
  this.render(hbs`{{place-holder oninsert=(action 'setComponent')}}`);

  let target = Target.create({
    target: this.get('component'),
    on: 'click'
  });
  target.attach();

  assert.equal(target.element, this.get('component.element'));

  target.detach();
});
