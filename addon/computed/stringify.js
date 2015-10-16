import Ember from "ember";

const computed = Ember.computed;
const get = Ember.get;

export default function(property) {
  return computed(property, {
    get() {
      return String(get(this, property));
    }
  });
}
