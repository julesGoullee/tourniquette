import utils from "../../node_modules/decentraland-ecs-utils/index"
export class ThePilones extends Entity {


  constructor(model: BoxShape, transform: Transform) {

    super()
    this.addComponent(model)
    model.withCollisions = true
    this.addComponent(transform)
    //this.addComponent(new utils.Interval(500, () => {
      //this.rotateAngle += 10
      //this.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, this.rotateAngle, 0) ) )
    //}))

    engine.addEntity(this)

  }

}
