module.exports = {
  name: 'ember-popup-menu',
  included: function (app) {
    this._super.included(app);
    app.import('bower_components/dom-ruler/dist/dom-ruler.amd.js', {
      exports: {
        'dom-ruler': ['default']
      }
    });
    app.import("vendor/styles/ember-popup-menu.css");
  }
};
