/* global require */
import computed from 'ember-computed';

export default function (module) {
  return computed(function () {
    return Object.keys(require.entries).some(function (moduleName) {
      return moduleName.split('/')[0] === module;
    });
  });
}
