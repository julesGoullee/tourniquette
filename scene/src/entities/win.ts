export class Win extends Entity {

  entity: Entity
  animations = [
    'Y.002Action',
    'O.003Action',
    'U.002Action',
    'WAction',
    'O.004Action',
    'NAction',
  ]

  constructor(model: GLTFShape, transform: Transform) {

    super()
    engine.addEntity(this)
    this.setParent(Attachable.AVATAR)
    model.withCollisions = false
    this.addComponent(model)
    this.addComponent(transform)
    this.addComponent(new Animator())
    this.animations.forEach(animation => {
      const animationState = new AnimationState(animation)
      animationState.looping = false
      // animationState.playing = false
      this.getComponent(Animator).addClip(animationState)
      this.getComponent(Animator).getClip(animation).reset()
    })
  }

  playWin() {
    this.animations.forEach(animation => {
      this.getComponent(Animator).getClip(animation).reset()
      this.getComponent(Animator).getClip(animation).play()
    })
  }

}
