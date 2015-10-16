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
  return computed({
    get() {
      return Ember.A(toArray(defaultValue));
    },
    set(key, value) {
      value = toArray(value);
      return Ember.A(value || toArray(defaultValue));
    }
  });
}
