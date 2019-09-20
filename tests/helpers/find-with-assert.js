import { assert } from '@ember/debug';
import { find } from '@ember/test-helpers';

export default function findWithAssert(selector) {
  const element = find(selector);

  assert(element, `Element matching \`${selector}\` could not be found`);

  return element;
}
