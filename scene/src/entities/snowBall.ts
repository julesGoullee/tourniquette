export class SnowBall extends Entity {

  body: CANNON.Body
  userId: string

  constructor(model: SphereShape, transform: Transform, world: CANNON.World, userId, ballPhysicsMaterial: CANNON.Material) {

    super()
    model.withCollisions = false
    this.userId = userId
    this.addComponent(model)
    this.addComponent(transform)
    engine.addEntity(this)

    this.body = new CANNON.Body({
      mass: 2,
      position: new CANNON.Vec3(
        transform.position.x,
        transform.position.y,
        transform.position.z
      ),
      material: ballPhysicsMaterial,
      allowSleep: true,
      sleepSpeedLimit: 0.1,
      sleepTimeLimit: 0.01,
      linearDamping: 0.9,
      angularDamping: 0.9,
      shape: new CANNON.Sphere(0.1),
    })
    this.body.wakeUp()
    world.addBody(this.body)

  }

}
