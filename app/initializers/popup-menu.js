import Ember from "ember";
import config from "../config/environment";
import { registerFlow, registerAnimation } from "ember-popup-menu/system/dsl";

var A = Ember.A;
var keys = Ember.keys;

export var initialize = function (container) {
  var matcher = new RegExp(config.modulePrefix + '/popup-menu/flows/.*');

  A(keys(window.require.entries)).filter(function (path) {
    return matcher.test(path);
  }).forEach(function (path) {
    var flowName = path.replace(config.modulePrefix + '/popup-menu/flows/', '');
    registerFlow(container, flowName, window.require(path)['default']);
  });

  matcher = new RegExp(config.modulePrefix + '/popup-menu/animators/.*');

  A(keys(window.require.entries)).filter(function (path) {
    return matcher.test(path);
  }).forEach(function (path) {
    var animatorName = path.replace(config.modulePrefix + '/popup-menu/animators/', '');
    registerAnimation(container, animatorName, window.require(path)['default']);
  });
};

export default {
  name: "register-popup-menu-extensions",
  initialize: initialize
};
