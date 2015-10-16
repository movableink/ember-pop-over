import Ember from "ember";

const computed = Ember.computed;
const bind = Ember.run.bind;
const get = Ember.get;

function flatten(array) {
  return Ember.A(array).reduce(function (a, b) {
    return a.concat(b);
  }, Ember.A());
}

function recursivelyFindByType(typeClass, children) {
  let view = Ember.A(children).find(function (view) {
    return typeClass.detectInstance(view);
  });

  if (view) {
    return view;
  }

  let childrenOfChildren = flatten(Ember.A(children).getEach('childViews'));
  if (childrenOfChildren.length === 0) {
    return null;
  }
  return recursivelyFindByType(typeClass, childrenOfChildren);
}

export default function(type) {
  var tracking = Ember.Map.create();
  var deleteItem;
  if (tracking.delete) {
    deleteItem = bind(tracking, 'delete');
  } else {
    deleteItem = bind(tracking, 'remove');
  }

  return computed('childViews.[]', {
    get(key) {
      var typeClass = this.container.lookupFactory('component:' + type) ||
                      this.container.lookupFactory('view:' + type);

      var children = Ember.A(get(this, 'childViews'));
      var appendedChildren = children.filterBy('_state', 'inDOM');
      var detachedChildren = children.filter(function (child) {
        return ['inBuffer', 'hasElement', 'preRender'].indexOf(child._state) !== -1;
      });

      appendedChildren.forEach(function (child) {
        deleteItem(child);
      });

      var notifyChildrenChanged = bind(this, 'notifyPropertyChange', key);
      detachedChildren.forEach(function (child) {
        if (!tracking.has(child)) {
          child.one('didInsertElement', this, notifyChildrenChanged);
          tracking.set(child, true);
        }
      });

      return recursivelyFindByType(typeClass, appendedChildren);
    }
  });
}
