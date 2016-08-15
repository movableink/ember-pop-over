export default function (selector) {
  andThen(function () {
    findWithAssert(selector).trigger('mouseenter');
  });
}
