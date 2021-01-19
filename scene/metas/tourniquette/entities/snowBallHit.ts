export class SnowBallHit extends Entity {

  body: CANNON.Body

  constructor(model: BoxShape, transform: Transform) {

    super()
    model.withCollisions = true
    this.addComponent(model)
    this.addComponent(transform)
    const myMaterial = new Material()
    myMaterial.albedoColor = new Color4(0, 0, 0, 0)
    myMaterial.castShadows = false
    this.addComponent(myMaterial)
    engine.addEntity(this)

  }

}
