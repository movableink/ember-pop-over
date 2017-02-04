/* global node: true */
module.exports = {
  name: 'ember-pop-over',
  included: function (app) {
    this._super.included(app);
    app.import('bower_components/dom-ruler/dist/amd/dom-ruler.js', {
      exports: {
        'dom-ruler': ['default']
      }
    });
    app.import("vendor/styles/ember-popup-menu.css");
  }
};
