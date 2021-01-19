import utils from '../../../node_modules/decentraland-ecs-utils/index'
import {SoundSystem} from "../modules/sounds";

class TheTourniquetteCollider extends Entity {

  constructor() {

    super()
    const model = new BoxShape()
    model.withCollisions = true
    this.addComponent(model)

    const myMaterial = new Material()
    myMaterial.albedoColor = new Color4(0, 0, 0, 0)
    myMaterial.castShadows = false
    this.addComponent(myMaterial)

    const transform = new Transform({
      //position: new Vector3(8, 13, 8),
      position: new Vector3(0, 0.6, 0),
      scale: new Vector3(14, 1, 0.04),
      rotation: Quaternion.Euler(0,0,0)
    })
    this.addComponent(transform)

  }

}

class TheTourniquetteGrelot extends Entity {

  constructor() {

    super()

    const transform = new Transform({
      position: new Vector3(-6, 4, 0),
    })

    this.addComponent(transform)

  }

}

export class TheTourniquetteModel extends Entity {

  constructor() {

    super()
    const model = new GLTFShape('metas/tourniquette/models/sucreDorge.glb')
    this.addComponent(model)

  }

}

export class TheTourniquette extends Entity {

  theTourniquetteModel: TheTourniquetteModel
  theTourniquetteCollider: TheTourniquetteCollider
  theTourniquetteGrelot: TheTourniquetteGrelot

  rotationSpeed: number
  soundSystem: SoundSystem

  constructor(soundSystem: SoundSystem, onClick: () => void) {

    super()

    this.soundSystem = soundSystem

    const transform = new Transform({
      //position: new Vector3(8, 13, 8),
      position: new Vector3(8, 12, 8),
      scale:  new Vector3(1, 1, 1),
      rotation: Quaternion.Euler(0,45,0)
    })

    this.addComponent(transform)

    engine.addEntity(this)

    this.theTourniquetteModel = new TheTourniquetteModel()
    this.theTourniquetteModel.setParent(this)
    this.theTourniquetteCollider = new TheTourniquetteCollider()
    this.theTourniquetteCollider.setParent(this)
    this.theTourniquetteGrelot = new TheTourniquetteGrelot()
    this.theTourniquetteGrelot.setParent(this)
    this.soundSystem.grelots(this.theTourniquetteGrelot)


    const onPointerDown = new OnPointerDown(
      onClick,
      {
        button: ActionButton.PRIMARY,
        hoverText: '',
        showFeedback: false,
        distance: 4
      }
    )
    this.theTourniquetteCollider.addComponent(onPointerDown)

  }

  enableClick() {
    const onPointerDown = this.theTourniquetteCollider.getComponent(OnPointerDown)
    onPointerDown.hoverText = 'Reverse'
    onPointerDown.showFeedback = true
  }

  disableClick() {
    const onPointerDown = this.theTourniquetteCollider.getComponent(OnPointerDown)
    onPointerDown.hoverText = ''
    onPointerDown.showFeedback = false
  }

  resetRotation() {
    this.stopRotating()
    this.getComponent(Transform).rotation = Quaternion.Euler(0, 45, 0)
  }

  startNormalRotation() {
    this.stopRotating()
    this.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, 50, 0) ) )
  }

  stopRotating() {
    if(this.hasComponent(utils.Interval) ){

      this.getComponent(utils.Interval).setCallback(null)
      this.removeComponent(utils.Interval)

    }
    if(this.hasComponent(utils.KeepRotatingComponent) ){

      this.getComponent(utils.KeepRotatingComponent).stop()

    }
  }

  startGameRotation() {

    this.rotationSpeed = 50
    this.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, this.rotationSpeed, 0) ) )

    this.addComponentOrReplace(new utils.Interval(3000,() => {

      if (Math.abs(this.rotationSpeed) < 100) {

        this.rotationSpeed = this.rotationSpeed > 0 ? this.rotationSpeed + 5 : this.rotationSpeed - 5
        this.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, this.rotationSpeed, 0)))

      } else {

        this.getComponent(utils.Interval).setCallback(null)
        this.removeComponent(utils.Interval)

      }
    }))

  }

  invertRotation(sign: string) {
    if(this.hasComponent(utils.KeepRotatingComponent) ){

      this.rotationSpeed = sign === '+' ? Math.abs(this.rotationSpeed) : -this.rotationSpeed
      this.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, this.rotationSpeed, 0) ) )
      this.soundSystem.reverseTourniquette(this)

    }
  }
}
