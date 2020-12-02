export class TheTourniquette extends Entity {

  rotateAngle = 100

  constructor(model: BoxShape, transform: Transform) {

    super()
    this.addComponent(model)
    model.withCollisions = true
    this.addComponent(transform)
    engine.addEntity(this)
  }

}
