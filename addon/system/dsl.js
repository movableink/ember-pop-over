var registerFlow = function (container, flowName, constraintGenerator) {
  container.register('popup-menu/flow:' + flowName, constraintGenerator, { instantiate: false });
};

var registerAnimation = function (container, animationName, animator) {
  container.register('popup-menu/animat:' + animationName, animator, { instantiate: false });
};

export { registerFlow, registerAnimation };
