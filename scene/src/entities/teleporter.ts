import { movePlayerTo } from '@decentraland/RestrictedActions'

export class Teleporter extends Entity {

  onPointerDown: OnPointerDown

  constructor(onClick) {

    super()
    this.addComponent(new BoxShape())
    // model.withCollisions = true

    const myMaterial = new Material()
    myMaterial.albedoColor = new Color4(0, 0, 0, 0)
    myMaterial.castShadows = false
    this.addComponent(myMaterial)

    this.addComponent(new Transform({
      // position: new Vector3(2, 2, 2),
      position: new Vector3(8, 6, 7.5),
      scale: new Vector3(1, 1, 1)
    }) )
    engine.addEntity(this)

    this.onPointerDown = new OnPointerDown(onClick)
    this.addComponent(this.onPointerDown)

    this.gamePlaying(false);

  }

  gamePlaying(gamePlaying: boolean) {
    if(gamePlaying) {
      this.onPointerDown.hoverText = 'Game running ...'
    }
    else {
      this.onPointerDown.hoverText = 'Start'
    }
  }

}
