export default function () {
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
