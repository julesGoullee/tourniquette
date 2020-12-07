import {PhysicsWorld} from "../modules/physicsWorld";
import utils from '../../node_modules/decentraland-ecs-utils/index'
import {setInterval} from "../utils";


const vectorScale = 75

export class SnowBall extends Entity {

  body: CANNON.Body
  userId: string
  physicsWorld: PhysicsWorld

  constructor(transform: Transform, physicsWorld: PhysicsWorld, userId, inputVector: Vector3) {

    super()
    const model = new SphereShape()
    model.withCollisions = false
    this.userId = userId
    this.addComponent(model)
    this.addComponent(transform)
    engine.addEntity(this)

    this.physicsWorld = physicsWorld

    const { world, ballPhysicsMaterial } = physicsWorld

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
    world.addBody(this.body)

    this.body.wakeUp()
    this.body.applyImpulse(
      new CANNON.Vec3(
        inputVector.x * vectorScale,
        inputVector.y * vectorScale,
        inputVector.z * vectorScale
      ),
      new CANNON.Vec3(
        this.body.position.x,
        this.body.position.y,
        this.body.position.z
      )
    )
  }

  destroy() {
    this.physicsWorld.world.removeBody(this.body)
    engine.removeEntity(this)
  }

  addBallCollider(otherBall: SnowBall) {

    const snowBallPhysicsContactMaterial = new CANNON.ContactMaterial(
      otherBall.body.material,
      this.body.material,
      {
        friction: 0.4,
        restitution: 0.75,
      }
    )
    this.physicsWorld.world.addContactMaterial(snowBallPhysicsContactMaterial)

  }

  addSplasher(canvas: UICanvas) {
    this.addComponent(
      new utils.TriggerComponent(
        new utils.TriggerBoxShape(new Vector3(0.2, 0.2, 0.2), Vector3.Zero() ),
        null, null, null, null,
        () => {

          const imageAtlas = 'images/snowBall.png'
          const imageTexture = new Texture(imageAtlas)
          const snowSplash = new UIImage(canvas, imageTexture)
          snowSplash.opacity = 1
          snowSplash.isPointerBlocker = false

          const timer = setInterval(() => {

            if(snowSplash.opacity === 0.1){

              timer.clearInterval()

            } else {

              snowSplash.opacity -= 0.05

            }
          }, 100)

          snowSplash.name = "clickable-image"
          snowSplash.width = '800px'
          snowSplash.height = '600px'
          snowSplash.sourceWidth = 800
          snowSplash.sourceHeight = 600
          snowSplash.vAlign = 'center'
          snowSplash.hAlign = 'center'
          snowSplash.positionY = Math.random() * 300 - 100
          snowSplash.positionX = Math.random() * 300 - 100
          // Move player
          // log('enter')
          // const position = ball.getComponent(Transform).position.clone().subtract(new Vector3(0, 1, 0))
          // const rotation = ball.getComponent(Transform).rotation.clone().subtract(Quaternion.Euler(0, -45, 0) )
          // const snowHit = new SnowBallHit(new BoxShape(), new Transform({
          //   position,
          //   rotation,
          //   scale: new Vector3(0.5, 1, 0.1)
          // }))
          // snowHit.addComponent(new utils.MoveTransformComponent(position, this.camera.position, 1) )
          // snowHit.addComponent(new utils.Delay(1000, () => {
          //   engine.removeEntity(snowHit)
          // }) )

        },
        () => {}, false
      )
    )

  }

  update() {
    const transform = this.getComponent(Transform)

    if (!transform.position.equals(new Vector3(this.body.position.x, this.body.position.y, this.body.position.z)) || !transform.rotation.equals(new Quaternion(this.body.quaternion.x, this.body.quaternion.y, this.body.quaternion.z, this.body.quaternion.w))) {

      transform.position.copyFrom(new Vector3(this.body.position.x, this.body.position.y, this.body.position.z))
      transform.rotation.copyFrom(new Quaternion(this.body.quaternion.x, this.body.quaternion.y, this.body.quaternion.z, this.body.quaternion.w))

    }
  }
}
