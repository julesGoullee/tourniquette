import { Player } from './Player'
import {setTimeout, ITimeoutClean} from "../utils";

export class GameMessage {
  uiText: UIText
  timeout: ITimeoutClean | null
  constructor(canvas: UICanvas) {
    this.uiText = new UIText(canvas)
    this.uiText.font = new Font(Fonts.SanFrancisco)
    this.uiText.fontSize = 30
    this.uiText.vAlign = 'top'
    this.uiText.hAlign = 'center'

    this.timeout = null
  }

  setMessage(text: string) {
    if(this.timeout) {
      this.timeout.clearTimeout()
      this.timeout = null;
    }
    this.uiText.value = text
    this.timeout = setTimeout(() => {
      this.uiText.value = ''
      this.timeout = null;
    }, 5000)
  }
}

export function createUserWinnerUI(winner: Player, canvas: UICanvas) {

  const userWinnerText = new UIText(canvas)
  userWinnerText.value = `${winner.displayName} won the game !`

  userWinnerText.positionX = -50
  userWinnerText.positionY = 200
  userWinnerText.vAlign = 'center'
  userWinnerText.hAlign = 'center'
  userWinnerText.fontSize = 30
  userWinnerText.color = Color4.White()


  const imageAtlas = 'metas/tourniquette/images/couronne.png'
  const imageTexture = new Texture(imageAtlas)
  const userWinnerImg = new UIImage(canvas, imageTexture)
  userWinnerImg.opacity = 1
  userWinnerImg.isPointerBlocker = false
  userWinnerImg.name = "clickable-image"
  userWinnerImg.width = '100px'
  userWinnerImg.height = '100px'
  userWinnerImg.sourceWidth = 600
  userWinnerImg.sourceHeight = 600
  userWinnerImg.vAlign = 'center'
  userWinnerImg.hAlign = 'center'
  userWinnerImg.positionX = -150
  userWinnerImg.positionY = 200

  setTimeout(() => {
    userWinnerText.value = ''
    userWinnerText.visible = false
    userWinnerText.isPointerBlocker = false

    userWinnerImg.opacity = 0
    userWinnerImg.visible = false
    userWinnerImg.isPointerBlocker = false
  }, 3000)

}
