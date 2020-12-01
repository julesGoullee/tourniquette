import { movePlayerTo } from '@decentraland/RestrictedActions'

export class Teleporter extends Entity {

    constructor(model: BoxShape, transform: Transform) {

    super()
    this.addComponent(model)
    model.withCollisions = true
    this.addComponent(transform)
    this.addComponent(
       new OnPointerDown(
         (e) => {
           movePlayerTo({ x: 3, y: 13, z: 8 }, { x: 8, y: 13, z: 8 })
         },
         { hoverText: "Start" }
       )
     )

    engine.addEntity(this)

  }

}
