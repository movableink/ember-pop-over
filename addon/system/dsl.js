import Ember from "ember";
import Flow from "./flow";

var slice = Array.prototype.slice;
var get = Ember.get;

export default function (container, flowName, constraintGenerator) {
  var constraints = get(slice.call(constraintGenerator.call(Flow.create()), 'constraints'));
  container.register('flow:' + flowName, constraints);
};
