export function around() {
  return this.orientAbove.andSnapTo(this.center, this.leftEdge, this.rightEdge)
   .then(this.orientRight.andSlideBetween(this.bottomEdge, this.topEdge))
   .then(this.orientBelow.andSnapTo(this.center, this.rightEdge, this.leftEdge))
   .then(this.orientLeft .andSlideBetween(this.topEdge, this.bottomEdge))
   .then(this.orientAbove.andSnapTo(this.center));
}

export function dropdown() {
  return this.orientBelow.andSnapTo(this.center, this.rightEdge, this.leftEdge)
   .then(this.orientLeft.andSnapTo(this.topEdge, this.bottomEdge))
   .then(this.orientRight.andSnapTo(this.topEdge))
   .then(this.orientBelow.andSnapTo(this.center));
}

export function flip() {
  return this.orientAbove.andSnapTo(this.center, this.leftEdge, this.rightEdge)
                         .where(function (boundingRect, _, targetRect) {
                            var centerY = targetRect.height / 2 + targetRect.y,
                                halfway = boundingRect.height / 2;
                            return centerY > halfway;
                         })
   .then(this.orientBelow.andSnapTo(this.center, this.rightEdge, this.leftEdge)
                         .where(function (boundingRect, _, targetRect) {
                            var centerY = targetRect.height / 2 + targetRect.y,
                                halfway = boundingRect.height / 2;
                            return centerY < halfway;
                         })
   )
   .then(this.orientAbove.andSnapTo(this.center));
}

export function popup() {
  return this.orientAbove.andSnapTo(this.center, this.rightEdge, this.leftEdge, this.center);
}
