export class CountDownBox extends Entity {

  entity: Entity

  constructor(model: GLTFShape) {

    super()
    engine.addEntity(this)
    this.setParent(Attachable.FIRST_PERSON_CAMERA)

    this.addComponent(model)
    this.addComponent(new Transform())
    // this.getComponent(Transform).position = new Vector3(3, 0, 0)
    this.getComponent(Transform).position = new Vector3(0,0,3)
    this.getComponent(Transform).scale = new Vector3(.5,.5,.5)
    this.getComponent(Transform).rotation = new Quaternion(0,180,0)
    this.addComponent(new Animator());
    const action1 = new AnimationState("1Action")
    const action2 = new AnimationState("2Action")
    const action3 = new AnimationState("3Action")
    const go = new AnimationState("321GO")
    action1.looping = false
    action2.looping = false
    action3.looping = false
    go.looping = false
    this.getComponent(Animator).addClip(action1)
    this.getComponent(Animator).addClip(action2)
    this.getComponent(Animator).addClip(action3)
    this.getComponent(Animator).addClip(go)


  }

  playCountDown() {
    this.getComponent(Animator).getClip('1Action').reset()
    this.getComponent(Animator).getClip('2Action').reset()
    this.getComponent(Animator).getClip('3Action').reset()
    this.getComponent(Animator).getClip('321GO').reset()

    this.getComponent(Animator).getClip('1Action').play()
    this.getComponent(Animator).getClip('2Action').play()
    this.getComponent(Animator).getClip('3Action').play()
    this.getComponent(Animator).getClip('321GO').play()
  }

}


