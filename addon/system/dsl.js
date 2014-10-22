import Ember from "ember";
import Flow from "./flow";

var get = Ember.get;

var registerFlow = function (container, flowName, constraintGenerator) {
  var constraints = get(constraintGenerator.call(Flow.create()), 'constraints');
  container.register('popup-constraint:' + flowName, constraints, { instantiate: false });
};

var registerAnimation = function (container, animationName, animator) {
  container.register('popup-animation:' + animationName, animator, { instantiate: false });
};

export { registerFlow, registerAnimation };
