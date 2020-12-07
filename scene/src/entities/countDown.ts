export class CountDownBox extends Entity {

  entity: Entity
  animations = [
    '1Action',
    '2Action',
    '3Action',
    '321GO'
  ]

  constructor() {

    super()
    engine.addEntity(this)
    this.setParent(Attachable.AVATAR)
    this.addComponent(new GLTFShape('models/countDown.glb'))
    this.getComponent(GLTFShape).withCollisions = false

    this.addComponent(new Transform({
      position: new Vector3(0,1,3),
      scale: new Vector3(.5,.5,.5),
      rotation: new Quaternion(0,180,0)
    }) )

    this.addComponent(new Animator())
    this.animations.forEach(animation => {
      const animationState = new AnimationState(animation)
      animationState.looping = false
      // animationState.playing = false
      this.getComponent(Animator).addClip(animationState)
      this.getComponent(Animator).getClip(animation).reset()
    })

  }

  playCountDown() {
    this.animations.forEach(animation => {
      this.getComponent(Animator).getClip(animation).reset()
      this.getComponent(Animator).getClip(animation).play()
    })
  }

}


