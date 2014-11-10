import Ember from "ember";

var computed = Ember.computed;
var bind = Ember.run.bind;
var get = Ember.get;

var flatten = function (array) {
  return array.reduce(function (a, b) {
    return a.concat(b);
  }, []);
};

var recursivelyFindByType = function (typeClass, children) {
  var view = children.find(function (view) {
    return typeClass.detectInstance(view);
  });

  if (view) {
    return view;
  }

  var childrenOfChildren = flatten(children.getEach('childViews'));
  if (childrenOfChildren.length === 0) {
    return null;
  }
  return recursivelyFindByType(typeClass, childrenOfChildren);
};

export default function(type) {
  var tracking = Ember.Map.create();
  return computed('childViews.[]', function nearestChild(key) {
    var typeClass = this.container.lookupFactory('component:' + type) ||
                    this.container.lookupFactory('view:' + type);

    var children = get(this, 'childViews') || [];
    var appendedChildren = children.filterBy('_state', 'inDOM');
    var detachedChildren = children.filter(function (child) {
      return ['inBuffer', 'hasElement', 'preRender'].indexOf(child._state) !== -1;
    });

    appendedChildren.forEach(function (child) {
      tracking.delete(child);
    });

    var notifyChildrenChanged = bind(this, 'notifyPropertyChange', key);
    detachedChildren.forEach(function (child) {
      if (!tracking.has(child)) {
        child.one('didInsertElement', this, notifyChildrenChanged);
        tracking.set(child, true);
      }
    });

    return recursivelyFindByType(typeClass, appendedChildren);
  });
}
