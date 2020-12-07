export class Lose extends Entity {

  entity: Entity

  animations = [
    'YAction',
    'OAction',
    'UAction',
    'LAction',
    'O.002Action',
    'SAction',
    'EAction',
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

  playLose() {

    this.animations.forEach(animation => {
      this.getComponent(Animator).getClip(animation).reset()
      this.getComponent(Animator).getClip(animation).play()
    })

  }

}
