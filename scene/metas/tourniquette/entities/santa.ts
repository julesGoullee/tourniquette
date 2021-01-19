
export class Santa extends Entity {

  constructor(model: GLTFShape, transform: Transform) {
    super()
    engine.addEntity(this)
    this.addComponent(model)
    this.addComponent(transform)

    this.addComponent(new Animator());

    [
      'santaRunning',
      'santaJumping',
      'santaIdle',
    ].forEach(animationName => {

      const animState = new AnimationState(animationName)
      // animState.stop()
      // animState.reset()
      // animState.playing = false
      // animState.speed = 1
      animState.looping = true
      this.getComponent(Animator).addClip(animState)

    })

  }

  playRunning() {
    this.stopAnimations()
    this.getComponent(Animator).getClip('santaRunning').play()
  }

  playIdle() {
    this.stopAnimations()
    this.getComponent(Animator).getClip('santaIdle').play()
  }

  playJump() {
    this.stopAnimations()
    this.getComponent(Animator).getClip('santaJumping').play()
  }

  private stopAnimations() {
    this.getComponent(Animator).getClip('santaRunning').pause()
    this.getComponent(Animator).getClip('santaJumping').pause()
    this.getComponent(Animator).getClip('santaIdle').pause()
  }
}
