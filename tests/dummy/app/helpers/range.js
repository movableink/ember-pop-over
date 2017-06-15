import Ember from 'ember';

export default Ember.Helper.helper(function ([from, to]) {
  let len = from - to;
  let array = [];
  for (let i = from; i <= to; i++) {
    array.push(i);
  }
  return array;
});

