export class TheTourniquetteCollider extends Entity {

  constructor(model: BoxShape, parent: Entity, transform: Transform) {

    super()
    this.addComponent(model)
    this.setParent(parent)
    model.withCollisions = true

    const myMaterial = new Material()
    myMaterial.albedoColor = new Color4(0, 0, 0, 0)
    myMaterial.castShadows = false
    this.addComponent(myMaterial)

    this.addComponent(transform)
    engine.addEntity(this)
  }

}
