import Ember from "ember";

var run = Ember.run;

export default function (selector) {
  andThen(function () {
    var $element = find(selector);
    run($element, 'mousedown');

    if ($element.is(':input')) {
      var type = $element.prop('type');
      if (type !== 'checkbox' && type !== 'radio' && type !== 'hidden') {
        run($element, function(){
          // Firefox does not trigger the `focusin` event if the window
          // does not have focus. If the document doesn't have focus just
          // use trigger('focusin') instead.
          if (!document.hasFocus || document.hasFocus()) {
            this.focus();
          } else {
            this.trigger('focusin');
          }
        });
      }
    }

    run($element, 'mouseup');
  });
  triggerEvent(selector, "click", { which: 1 });
}
