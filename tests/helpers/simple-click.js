import { run } from '@ember/runloop';
import { find, triggerEvent } from '@ember/test-helpers';
import jQuery from 'jquery';

export default async function (selector) {
  var element = find(selector);
  await triggerEvent(element, 'mousedown');

  const $element = jQuery(element);

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

  await triggerEvent(element, 'mouseup');
  await triggerEvent(element, "click", { which: 1 });
}
