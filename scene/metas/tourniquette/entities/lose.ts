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

  constructor() {

    super()
    engine.addEntity(this)
    this.setParent(Attachable.AVATAR)

    const model = new GLTFShape('metas/tourniquette/models/lose.glb')
    model.withCollisions = false
    this.addComponent(model)

    const transform = new Transform({
      position: new Vector3(0,1,2),
      scale: new Vector3(.2,.2,.2),
      rotation: Quaternion.Euler(0,-90,0)
    })
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
