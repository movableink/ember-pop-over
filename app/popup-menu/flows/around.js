export default function () {
  return this.orientAbove.andSnapTo(this.center, this.leftEdge, this.rightEdge)
   .then(this.orientRight.andSlideBetween(this.bottomEdge, this.topEdge))
   .then(this.orientBelow.andSnapTo(this.center, this.rightEdge, this.leftEdge))
   .then(this.orientLeft .andSlideBetween(this.topEdge, this.bottomEdge))
   .then(this.orientAbove.andSnapTo(this.center));
}
