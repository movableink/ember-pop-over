import Ember from "ember";

const computed = Ember.computed;
const w = Ember.String.w;

const toArray = function (value) {
  if (typeof value === "string") {
    value = w(value);
  }
  return value;
};

export default function(defaultValue) {
  defaultValue = defaultValue || [];
  return computed(function w(key, value) {
    if (arguments.length > 1) {
      value = toArray(value);
    }
    return Ember.A(value || toArray(defaultValue));
  });
}
