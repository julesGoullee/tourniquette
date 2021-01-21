export class XmasBall extends Entity {

  constructor(pivot: Entity) {

    super()
    this.addComponent(new GLTFShape('metas/tourniquette/models/xmasBall.glb'))
    this.addComponent(new Transform({
      position: new Vector3(0, -0.11, 0),
      scale:  new Vector3(1, 1, 1)
    }))
    this.setParent(pivot)
    engine.addEntity(this)

  }

}
