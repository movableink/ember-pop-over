export default function () {
  let duration = 150;
  this.transition(
    this.hasClass('liquid-pop-over'),
    this.toValue(true),
    this.use('scale', { duration }),
    this.reverse('fade', { duration })
  )
}
