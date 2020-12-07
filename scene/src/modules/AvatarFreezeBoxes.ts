import utils from '../../node_modules/decentraland-ecs-utils/index'

import { AvatarFreezeBox } from '../entities/avatarFreezeBox'

export class AvatarFreezeBoxes {

  boxes: AvatarFreezeBox[] = []

  constructor(){

  }

  add(gameSpot: Vector3){

    const transforms = [
      new Transform({
        position: gameSpot.add(new Vector3(1, 5, 0) ),
        scale: new Vector3(1, 10, 3)
      }),
      new Transform({
        position: gameSpot.add(new Vector3(-1, 5, 0) ),
        scale: new Vector3(1, 10, 3)
      }),
      new Transform({
        position: gameSpot.add(new Vector3(0, 5, 1) ),
        scale: new Vector3(2, 10, 1)
      }),
      new Transform({
        position: gameSpot.add(new Vector3(0, 5, -1) ),
        scale: new Vector3(2, 10, 1)
      }),
    ]

    transforms.forEach( transform => {
      const box = new AvatarFreezeBox(new BoxShape(), transform)
      box.addComponent(new utils.Delay(4000, () => {
        this.boxes = this.boxes.filter(oneBox => oneBox !== box)
        engine.removeEntity(box)
      }) )
      this.boxes.push(box)
      engine.addEntity(box)
    })

  }

  remove(){

    this.boxes.forEach(box => {

      if(box.hasComponent(utils.Delay) ){
        box.getComponent(utils.Delay).setCallback(null)
      }
      engine.removeEntity(box)
    })
    this.boxes = []
  }

}
