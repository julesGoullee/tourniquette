const fixedTimeStep = 1.0 / 60.0
const maxSubSteps = 3

export class PhysicsWorld {

  world: CANNON.World
  ballPhysicsMaterial: CANNON.Material

  constructor() {
    this.world = new CANNON.World()
    this.world.allowSleep = true
    this.world.gravity.set(0, -9.82, 0) // m/s²
    // this.world.broadphase = new CANNON.NaiveBroadphase()
    // this.world.defaultContactMaterial.contactEquationStiffness = 1e8;
    // this.world.defaultContactMaterial.contactEquationRelaxation = 10;
    // this.world.quatNormalizeFast = true;
    // this.world.quatNormalizeSkip = 8;
    // this.world.solver.iterations = 10;

    const groundPhysicsMaterial = new CANNON.Material('groundMaterial')
    const groundPhysicsContactMaterial = new CANNON.ContactMaterial(
      groundPhysicsMaterial,
      groundPhysicsMaterial,
      {
        friction: 0.5,
        restitution: 0.33,
      }
    )
    this.world.addContactMaterial(groundPhysicsContactMaterial)

    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: groundPhysicsMaterial
    })
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2) // Reorient ground plane to be in the y-axis
    this.world.addBody(groundBody)

    this.ballPhysicsMaterial = new CANNON.Material('ballMaterial')
    const ballPhysicsContactMaterial = new CANNON.ContactMaterial(
      groundBody.material,
      this.ballPhysicsMaterial,
      {
        friction: 0.9,
        restitution: 0.2,
      }
    )
    this.world.addContactMaterial(ballPhysicsContactMaterial)

  }

  step(dt) {
    this.world.step(fixedTimeStep, dt, maxSubSteps)
  }
}
