import utils from "../../node_modules/decentraland-ecs-utils/index"
export class ThePilones extends Entity {


  constructor(model: BoxShape, transform: Transform) {

    super()
    this.addComponent(model)
    model.withCollisions = true

    // const myMaterial = new Material()
    // myMaterial.albedoColor = new Color4(0, 0, 0, 0)
    // myMaterial.castShadows = false
    // this.addComponent(myMaterial)


    this.addComponent(transform)

    engine.addEntity(this)

  }

}
