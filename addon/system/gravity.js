import Flow from "./system/flow";

export default {
  nw: Flow.create().orientAbove.andSnapTo('left-edge'),
  n:  Flow.create().orientAbove.andSnapTo('center'),
  ne: Flow.create().orientAbove.andSnapTo('right-edge'),
  e:  Flow.create().orientRight.andSnapTo('center'),
  se: Flow.create().orientBelow.andSnapTo('right-edge'),
  s:  Flow.create().orientBelow.andSnapTo('center'),
  sw: Flow.create().orientBelow.andSnapTo('left-edge'),
  w:  Flow.create().orientLeft.andSnapTo('center')
};
