import Ember from "ember";
import config from "../config/environment";
import registerFlow from "ember-popup-menu/system/dsl";

var A = Ember.A;
var keys = Ember.keys;

export var initialize = function (container) {
  var matcher = new RegExp(config.modulePrefix + '/flows/.*');

  A(keys(window.require.entries)).filter(function (path) {
    return matcher.test(path);
  }).forEach(function (path) {
    var flowName = path.replace(config.modulePrefix + '/flows/', '');
    registerFlow(container, flowName, window.require(path)['default']);
  });
};

export default {
  name: "register-popup-menu-flows",
  initialize: initialize
};
