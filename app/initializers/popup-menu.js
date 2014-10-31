import Ember from "ember";
import Flow from "ember-popup-menu/system/flow";
import config from "../config/environment";

var get = Ember.get;
var keys = Ember.keys;

export var initialize = function (container) {
  var matcher = new RegExp(config.modulePrefix + '/popup-menu/flows/.*');

  keys(window.require.entries).filter(function (path) {
    return matcher.test(path);
  }).forEach(function (path) {
    var flowName = path.replace(config.modulePrefix + '/popup-menu/flows/', '');
    var generator = window.require(path)['default'];
    var constraints = get(generator.call(Flow.create()), 'constraints');
    container.register('popup-constraint:' + flowName, constraints, { instantiate: false });
  });

  matcher = new RegExp(config.modulePrefix + '/popup-menu/animators/.*');

  keys(window.require.entries).filter(function (path) {
    return matcher.test(path);
  }).forEach(function (path) {
    var animationName = path.replace(config.modulePrefix + '/popup-menu/animators/', '');
    var animation = window.require(path)['default'];

    container.register('popup-animation:' + animationName, animation, { instantiate: false });
  });
};

export default {
  name: "register-popup-menu-extensions",
  initialize: initialize
};
