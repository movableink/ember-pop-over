/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
    // Add options here
  });

  app.import('bower_components/dom-ruler/dist/dom-ruler.amd.js', {
    exports: {
      'dom-ruler': ['default']
    }
  });

  return app.toTree();
};
