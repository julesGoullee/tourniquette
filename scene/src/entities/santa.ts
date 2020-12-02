
export class Santa extends Entity {
  constructor(model: GLTFShape, transform: Transform) {
    super()
    engine.addEntity(this)
    this.addComponent(model)
    this.addComponent(transform)

    this.addComponent(new Animator())
    this.getComponent(Animator).addClip(new AnimationState("run", { looping: true }))
    this.getComponent(Animator).addClip(new AnimationState("sit", { looping: true }))
  }
  // Play running animation
  playRunning() {
    this.stopAnimations()
    this.getComponent(Animator).getClip("run").play()
  }

  // Play idle animation
  playIdle() {
    this.stopAnimations()
    this.getComponent(Animator).getClip("sit").play()
  }

  // Bug workaround: otherwise the next animation clip won't play
  private stopAnimations() {
    this.getComponent(Animator).getClip("run").stop()
    this.getComponent(Animator).getClip("sit").stop()
  }
}
