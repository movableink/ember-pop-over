import Flow from "ember-pop-over/system/flow";
import config from "../config/environment";
import * as flows from "../flows";
import get from 'ember-metal/get';
import { A } from 'ember-array/utils';

export var initialize = function (app) {
  A(Object.keys(flows)).forEach(function (flowName) {
    if (flowName == 'default') { return; }
    let constraints = get(flows[flowName].call(Flow.create()), 'constraints');
    app.register(`pop-over-constraint:${flowName}`, constraints, { instantiate: false });
  });
};

export default {
  name: "register-pop-over-flows",
  initialize: initialize
};
