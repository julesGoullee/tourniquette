import utils from "../../node_modules/decentraland-ecs-utils/index"
import { movePlayerTo } from '@decentraland/RestrictedActions'

export class Teleporter extends Entity {

  rotateAngle = 70

  constructor(model: BoxShape, transform: Transform) {

    super()
    this.addComponent(model)
    model.withCollisions = true
    this.addComponent(transform)
    this.addComponent(new utils.KeepRotatingComponent(Quaternion.Euler(0, this.rotateAngle, 0)))
    this.addComponent(
       new OnPointerDown(
         (e) => {
           movePlayerTo({ x: 1, y: 0, z: 1 }, { x: 8, y: 1, z: 8 })
         },
         { hoverText: "Start" }
       )
     )

    engine.addEntity(this)

  }

}
