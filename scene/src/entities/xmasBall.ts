export class XmasBall extends Entity {

  constructor(model: GLTFShape, transform: Transform) {

    super()
    this.addComponent(model)
    this.addComponent(transform)
    engine.addEntity(this)

  }

}
