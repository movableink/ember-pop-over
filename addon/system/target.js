import Ember from "ember";

const keys = Object.keys;
const copy = Ember.copy;
const get = Ember.get;
const set = Ember.set;

const computed = Ember.computed;

const generateGuid = Ember.generateGuid;

const w = Ember.String.w;

const bind = Ember.run.bind;
const next = Ember.run.next;

const isSimpleClick = Ember.ViewUtils.isSimpleClick;
const $ = Ember.$;

function guard (fn) {
  return function (evt) {
    if (get(this, 'component.disabled')) { return; }
    fn.call(this, evt);
  };
}

function getElementForTarget(target) {
  if (typeof target === 'string') {
    return document.getElementById(target);
  } else if (get(target, 'element')) {
    return get(target, 'element');
  } else {
    return target;
  }
}

function getLabelSelector($element) {
  var id = $element.attr('id');
  if (id) {
    return `label[for="${id}"]`;
  }
}

function getNearestComponentForElement(registry, element) {
  var $target = $(element);
  if (!$target.hasClass('ember-view')) {
    $target = $target.parents('ember-view');
  }
  return registry[$target.attr('id')];
}

function labelForEvent(evt) {
  var $target = $(evt.target);
  if ($target[0].tagName.toLowerCase() === 'label') {
    return $target;
  } else {
    return $target.parents('label');
  }
}

function isLabelClicked(target, label) {
  if (label == null) {
    return false;
  }
  return $(label).attr('for') === $(target).attr('id');
}

const VALID_ACTIVATORS = ["focus", "hover", "click", "hold"];
function parseActivators(value) {
  if (value) {
    var activators = value;
    if (typeof value === "string") {
      activators = Ember.A(w(value));
    }
    Ember.assert(
      `${value} are not valid activators.
        Valid events are ${VALID_ACTIVATORS.join(', ')}`,
      Ember.A(copy(activators)).removeObjects(VALID_ACTIVATORS).length === 0
    );
    return activators;
  }

  Ember.assert(
    `You must provide an event name to the {{pop-over}}.
      Valid events are ${VALID_ACTIVATORS.join(', ')}`,
    false
  );
}

function poll(target, scope, fn) {
  if (getElementForTarget(target)) {
    scope[fn]();
  } else {
    next(null, poll, target, scope, fn);
  }
}


var Target = Ember.Object.extend(Ember.Evented, {

  init: function () {
    var target = get(this, 'target');
    Ember.assert("You cannot make the {{pop-over}} a target of itself.", get(this, 'component') !== target);

    this.eventManager = {
      focusin:    bind(this, 'focus'),
      focusout:   bind(this, 'blur'),
      mouseenter: bind(this, 'mouseEnter'),
      mouseleave: bind(this, 'mouseLeave'),
      mousedown:  bind(this, 'mouseDown')
    };

    if (get(target, 'element')) {
      this.attach();
    } else if (target.one) {
      target.one('didInsertElement', this, 'attach');
    } else if (typeof target === 'string') {
      poll(target, this, 'attach');
    }
  },

  attach: function () {
    var element = getElementForTarget(this.target);
    var $element = $(element);
    var $document = $(document);

    // Already attached or awaiting an element to exist
    if (get(this, 'attached') || element == null) { return; }

    set(this, 'attached', true);
    set(this, 'element', element);

    var id = $element.attr('id');
    if (id == null) {
      id = generateGuid();
      $element.attr('id', id);
    }

    var eventManager = this.eventManager;

    keys(eventManager).forEach(function (event) {
      $document.on(event, `#${id}`, eventManager[event]);
    });

    var selector = getLabelSelector($element);
    if (selector) {
      keys(eventManager).forEach(function (event) {
        $document.on(event, selector, eventManager[event]);
      });
    }
  },

  detach: function () {
    var element = this.element;
    var $element = $(element);
    var $document = $(document);

    var eventManager = this.eventManager;

    var id = $element.attr('id');
    keys(eventManager).forEach(function (event) {
      $document.off(event, '#' + id, eventManager[event]);
    });

    var selector = getLabelSelector($element);
    if (selector) {
      keys(eventManager).forEach(function (event) {
        $document.off(event, selector, eventManager[event]);
      });
    }

    // Remove references for GC
    this.eventManager = null;
    set(this, 'element', null);
    set(this, 'target', null);
    set(this, 'component', null);
  },

  on: computed({
    set(key, value) {
      return parseActivators(value);
    }
  }),

  isClicked: function (evt) {
    if (isSimpleClick(evt)) {
      var label = labelForEvent(evt);
      var element = this.element;
      return evt.target === element || $.contains(element, evt.target) ||
        isLabelClicked(element, label);
    }
    return false;
  },

  active: computed('focused', 'hovered', 'pressed', 'component.hovered', 'component.pressed', {
    set(key, value) {
      var activators = get(this, 'on');
      if (value) {
        if (activators.contains('focus')) {
          set(this, 'focused', true);
        } else if (activators.contains('hover')) {
          set(this, 'hovered', true);
        } else if (activators.contains('click')) {
          set(this, 'pressed', true);
        }
      } else {
        set(this, 'focused', false);
        set(this, 'hovered', false);
        set(this, 'pressed', false);
      }

      return value;
    },

    get() {
      var activators = get(this, 'on');
      var active = false;

      if (activators.contains('focus')) {
        active = active || get(this, 'focused');
        if (activators.contains('hold')) {
          active = active || get(this, 'component.pressed');
        }
      }

      if (activators.contains('hover')) {
        active = active || get(this, 'hovered');
        if (activators.contains('hold')) {
          active = active || get(this, 'component.hovered');
        }
      }

      if (activators.contains('click') || activators.contains('hold')) {
        active = active || get(this, 'pressed');
      }

      return !!active;
    }
  }),

  focus: guard(function () {
    set(this, 'focused', true);
  }),

  blur: guard(function () {
    set(this, 'focused', false);
  }),

  mouseEnter: guard(function () {
    set(this, 'hovered', true);
  }),

  mouseLeave: guard(function () {
    set(this, 'hovered', false);
  }),

  mouseDown: guard(function (evt) {
    if (!this.isClicked(evt)) {
      return false;
    }

    var element = this.element;
    var active = !get(this, 'active');
    set(this, 'pressed', active);

    if (active) {
      this.holdStart = new Date().getTime();

      var eventManager = this.eventManager;
      eventManager.mouseup = bind(this, 'mouseUp');
      $(document).on('mouseup', eventManager.mouseup);

      evt.preventDefault();
    }

    $(element).focus();
    return true;
  }),

  mouseUp: function (evt) {
    // Remove mouseup event
    var eventManager = this.eventManager;
    $(document).off('mouseup', eventManager.mouseup);
    eventManager.mouseup = null;

    var label = labelForEvent(evt);

    // Treat clicks on <label> elements as triggers to
    // open the menu
    if (isLabelClicked(this.element, label)) {
      return true;
    }

    var view = getNearestComponentForElement(this._viewRegistry, evt.target);
    var activators = get(this, 'on');

    // Manually trigger a click on internal elements
    if (view && view.nearestOfType(get(this, 'component').constructor)) {
      view.trigger('click');

    } else if (activators.contains('click') && activators.contains('hold')) {
      // If the user waits more than 400ms between mouseDown and mouseUp,
      // we can assume that they are clicking and dragging to the menu item,
      // and we should close the menu if they mouseup anywhere not inside
      // the menu.
      if (new Date().getTime() - this.holdStart > 400) {
        set(this, 'pressed', false);
      }
    }
    return true;
  }

});

export default Target;
