import utils from '../../node_modules/decentraland-ecs-utils/index'

import { AvatarFreezeBox } from '../entities/avatarFreezeBox'

export class AvatarFreezeBoxes {

  boxes: AvatarFreezeBox[] = []

  constructor(){

  }

  add(transforms: Transform[]){

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
