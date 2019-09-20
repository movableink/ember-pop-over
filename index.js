'use strict';

module.exports = {
  name: require('./package').name,

  options: {
    autoImport: {
      alias: {
        'dom-ruler': 'dom-ruler/dist/umd/dom-ruler.js'
      }
    }
  },

  included(app) {
    this._super.included.apply(this, arguments);

    app.import("vendor/styles/ember-popup-menu.css");
  }
};
