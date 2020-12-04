import utils from '../../node_modules/decentraland-ecs-utils/index'

function random(min: number, max: number) {
  return min + (max-min) *  Math.random();
}

const flakeTexture = new Texture('textures/snowflake.png')
const flakeShape = new PlaneShape()
const billboard = new Billboard(false, true, false)

const flakeMaterial = new Material()
flakeMaterial.albedoTexture = flakeTexture
flakeMaterial.alphaTexture = flakeTexture

const flakeScale = 0.2

// const cubeShape = new BoxShape()

class Flake extends Entity {

  x: number
  z: number
  bounds: Vector4

  static defaultBounds: Vector4 = new Vector4(0, 16, 0, 16)

  constructor(bounds: Vector4 = Flake.defaultBounds) {
    super()

    this.bounds = bounds

    const flakeTransform = new Transform({
      position: new Vector3(0, 0, 0),
      scale:  new Vector3(flakeScale, flakeScale, flakeScale),
    })

    // this.addComponent(cubeShape)
    this.addComponent(flakeShape)
    this.addComponent(flakeMaterial)
    this.addComponent(flakeTransform)
    this.addComponent(billboard)

    this.animate()
  }

  animate() {
    const x = random(this.bounds.x, this.bounds.y)
    const z = random(this.bounds.x, this.bounds.y)
    const duration = random(3, 5)

    const startPos = new Vector3(x, this.bounds.w, z);
    const endPos = new Vector3(x, this.bounds.z, z);

    this.addComponentOrReplace(
      new utils.MoveTransformComponent(startPos, endPos, duration, this.animate.bind(this))
    )
  }
}

export class SnowSystem implements ISystem {
  private snowEntity: Entity
  private flakes: Flake[]
  static MAX_FLAKES = 80
  bounds: Vector4

  constructor(bounds: Vector4) {
    this.bounds = bounds
    this.snowEntity = new Entity()
    this.flakes = []
    this.spawnFlakes()
    engine.addEntity(this.snowEntity)
  }

  spawnFlakes() {
    for(let i=0; i<SnowSystem.MAX_FLAKES; i++) {
      const flake = new Flake(this.bounds)
      flake.setParent(this.snowEntity)
      this.flakes.push(flake)
    }
  }

  update() {}
}

