import utils from "../../node_modules/decentraland-ecs-utils/index"
export class ThePilones extends Entity {


  constructor(gameSpot: Vector3) {

    super()
    const model = new BoxShape()
    this.addComponent(model)
    model.withCollisions = true

    const myMaterial = new Material()
    myMaterial.albedoColor = new Color4(0, 0, 0, 0)
    myMaterial.castShadows = false
    this.addComponent(myMaterial)

    this.addComponent(new Transform({
      position: gameSpot,
      scale: new Vector3(1, 0.2, 1),
      rotation: Quaternion.Euler(0, 45, 0)
    }))

    engine.addEntity(this)

  }

}
