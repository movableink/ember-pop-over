module.exports = {
  name: require('./package').name,

  options: {
    nodeAssets: {
      'dom-ruler': {
        srcDir: 'dist/amd',
        import: ['dom-ruler.js']
      }
    }
  },

  included: function (app) {
    this._super.included.apply(this, arguments);
    app.import('vendor/dom-ruler/dom-ruler.js', {
      exports: {
        'dom-ruler': ['default']
      }
    });
    app.import("vendor/styles/ember-popup-menu.css");
  }
};
