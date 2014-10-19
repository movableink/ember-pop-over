import Ember from "ember";
import Flow from "./flow";

var slice = Array.prototype.slice;
var get = Ember.get;

var registerFlow = function (container, flowName, constraintGenerator) {
  var constraints = get(slice.call(constraintGenerator.call(Flow.create()), 'constraints'));
  container.register('popup-menu/flow:' + flowName, constraints);
};

var registerAnimation = function (container, animationName, animator) {
  container.register('popup-menu/flow:' + animationName, animator);
};

export { registerFlow, registerAnimation };
