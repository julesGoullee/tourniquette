import * as ui from '../../../node_modules/@dcl/ui-utils/index'
import {ButtonStyles, PromptStyles} from '../../../node_modules/@dcl/ui-utils/utils/types'

export class Tutorial {

  prompt: ui.CustomPrompt
  canvas: UICanvas

  constructor(canvas: UICanvas) {

    this.canvas = canvas
    this.prompt = new ui.CustomPrompt(PromptStyles.DARKLARGE, 800, 600)
    this.prompt.closeIcon.width = 0
    this.prompt.closeIcon.height = 0

    const imageTitle = new UIImage(this.canvas, new Texture('metas/tourniquette/images/title.png') )
    imageTitle.width = 283
    imageTitle.height = 65
    imageTitle.positionX = 0
    imageTitle.positionY = 250
    imageTitle.sourceWidth = 283
    imageTitle.sourceHeight = 65

    const imageJump = new UIImage(this.canvas, new Texture('metas/tourniquette/images/jump.jpg') )
    imageJump.width = 200
    imageJump.height = 400
    imageJump.positionY = 10
    imageJump.positionX = -260
    imageJump.sourceWidth = 366
    imageJump.sourceHeight = 840

    const imageThrowSnowBall = new UIImage(this.canvas, new Texture('metas/tourniquette/images/swap.jpg') )
    imageThrowSnowBall.width = 200
    imageThrowSnowBall.height = 400
    imageThrowSnowBall.positionY = 10
    imageThrowSnowBall.positionX = 0
    imageThrowSnowBall.sourceWidth = 366
    imageThrowSnowBall.sourceHeight = 840

    const imageReverseRotation = new UIImage(this.canvas, new Texture('metas/tourniquette/images/throw-ball.jpg') )
    imageReverseRotation.width = 200
    imageReverseRotation.height = 400
    imageReverseRotation.positionY = 10
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
        imageTitle.opacity = 0
        imageJump.width = 0
        imageThrowSnowBall.width = 0
        imageReverseRotation.width = 0
        imageTitle.width = 0
        imageJump.height = 0
        imageThrowSnowBall.height = 0
        imageReverseRotation.height = 0
        imageTitle.height = 0
        this.prompt.close()
      },
      ButtonStyles.E
    )

  }

}
