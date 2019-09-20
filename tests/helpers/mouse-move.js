import { settled } from '@ember/test-helpers';
import jQuery from 'jquery';

import findWithAssert from './find-with-assert';

export default async function (selector) {
  const element = findWithAssert(selector);

  jQuery(element).trigger('mousemove');

  await settled();
}
