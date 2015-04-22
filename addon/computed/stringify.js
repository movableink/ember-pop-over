import Ember from "ember";

const computed = Ember.computed;
const get = Ember.get;

export default function(property) {
  return computed(property, function stringify() {
    return String(get(this, property));
  });
}
