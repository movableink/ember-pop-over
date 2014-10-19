/* global require, module */

var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

var app = new EmberAddon();

app.import('bower_components/dom-ruler/dist/dom-ruler.amd.js', {
  exports: {
    'dom-ruler': ['default']
  }
});

module.exports = app.toTree();
