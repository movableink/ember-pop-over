import Ember from "ember";
import Flow from "ember-pop-over/system/flow";
import config from "../config/environment";
import * as flows from "../flows";

const get = Ember.get;
const keys = Ember.keys;

export var initialize = function (container) {
  keys(flows).forEach(function (flowName) {
    if (flowName == 'default') { return; }
    let constraints = get(flows[flowName].call(Flow.create()), 'constraints');
    container.register(`pop-over-constraint:${flowName}`, constraints, { instantiate: false });
  });
};

export default {
  name: "register-pop-over-flows",
  initialize: initialize
};
