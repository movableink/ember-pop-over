import Ember from "ember";

var computed = Ember.computed;
var get = Ember.get;

export default function(property) {
  return computed(property, function stringify() {
    return String(get(this, property));
  });
}
