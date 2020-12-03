export class AvatarFreezeBox extends Entity {

  constructor(model: BoxShape, transform: Transform) {

    super()
    this.addComponent(model)
    model.withCollisions = true
    this.addComponent(transform)

    const myMaterial = new Material()
    myMaterial.albedoColor = new Color4(0, 0, 0, 0)
    myMaterial.castShadows = false
    this.addComponent(myMaterial)

    engine.addEntity(this)
  }

}
