import {SoundSystem} from "../modules/sounds";
import {setTimeout} from "../utils";

export class CountDownBox extends Entity {

  entity: Entity
  animations = [
    '1Action',
    '2Action',
    '3Action',
    '321GO'
  ]
  soundSystem: SoundSystem

  constructor(soundSystem: SoundSystem) {

    super()
    engine.addEntity(this)

    this.soundSystem = soundSystem

    this.setParent(Attachable.AVATAR)
    this.addComponent(new GLTFShape('metas/tourniquette/models/countDown.glb'))
    this.getComponent(GLTFShape).withCollisions = false

    this.addComponent(new Transform({
      position: new Vector3(0,1,3),
      scale: new Vector3(.5,.5,.5),
      rotation: new Quaternion(0,180,0)
    }) )

    this.addComponent(new Animator())
    this.animations.forEach(animation => {
      const animationState = new AnimationState(animation)
      animationState.looping = false
      // animationState.playing = false
      this.getComponent(Animator).addClip(animationState)
      this.getComponent(Animator).getClip(animation).reset()
    })

  }

  playCountDown() {
    setTimeout(() => {
      this.soundSystem.startGame()
    }, 1000)

    this.animations.forEach(animation => {
      this.getComponent(Animator).getClip(animation).reset()
      this.getComponent(Animator).getClip(animation).play()
    })
  }

}


