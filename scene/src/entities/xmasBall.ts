export class XmasBall extends Entity {

  constructor() {

    super()
    this.addComponent(new GLTFShape('models/xmasBall.glb'))
    this.addComponent(new Transform({
      position: new Vector3(8, -0.11, 8),
      scale:  new Vector3(1, 1, 1)
    }))
    engine.addEntity(this)

  }

}
