import * as ui from '../../node_modules/@dcl/ui-utils/index'
import {ButtonStyles, PromptStyles} from '../../node_modules/@dcl/ui-utils/utils/types'

export class Tutorial {

  prompt: ui.CustomPrompt
  canvas: UICanvas

  constructor(canvas: UICanvas) {

    this.canvas = canvas
    this.prompt = new ui.CustomPrompt(PromptStyles.DARKLARGE, 800, 600)
    this.prompt.closeIcon.width = 0
    this.prompt.closeIcon.height = 0
    // this.prompt.addText('Jump', -300, -170, Color4.White(), 30)
    // this.prompt.addText(`     Throw
    //  snowball`, -20, -190, Color4.White(), 30)
    // this.prompt.addText(`    Reverse
    // rotation`, 270, -190, Color4.White(), 30)
    const imageJump = new UIImage(this.canvas, new Texture('images/jump.png') )
    imageJump.width = 200
    imageJump.height = 400
    imageJump.positionY = 30
    imageJump.positionX = -260
    imageJump.sourceWidth = 366
    imageJump.sourceHeight = 840

    const imageThrowSnowBall = new UIImage(this.canvas, new Texture('images/swap.png') )
    imageThrowSnowBall.width = 200
    imageThrowSnowBall.height = 400
    imageThrowSnowBall.positionY = 30
    imageThrowSnowBall.positionX = 0
    imageThrowSnowBall.sourceWidth = 366
    imageThrowSnowBall.sourceHeight = 840

    const imageReverseRotation = new UIImage(this.canvas, new Texture('images/throw-ball.png') )
    imageReverseRotation.width = 200
    imageReverseRotation.height = 400
    imageReverseRotation.positionY = 30
    imageReverseRotation.positionX = 250
    imageReverseRotation.sourceWidth = 366
    imageReverseRotation.sourceHeight = 840

    this.prompt.addButton(
      'GO',
      0,
      -250,
      () => {
        imageJump.opacity = 0
        imageThrowSnowBall.opacity = 0
        imageReverseRotation.opacity = 0
        imageJump.width = 0
        imageThrowSnowBall.width = 0
        imageReverseRotation.width = 0
        imageJump.height = 0
        imageThrowSnowBall.height = 0
        imageReverseRotation.height = 0

        this.prompt.close()
      },
      ButtonStyles.E
    )

  }

}
