export default function () {
  return this.orientBelow.andSnapTo(this.center, this.rightEdge, this.leftEdge)
   .then(this.orientLeft.andSnapTo(this.topEdge, this.bottomEdge))
   .then(this.orientRight.andSnapTo(this.topEdge))
   .then(this.orientBelow.andSnapTo(this.center));  
}
