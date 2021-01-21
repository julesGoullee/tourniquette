import * as ui from '../../node_modules/@dcl/ui-utils/index'
import { PromptStyles, ButtonStyles } from '../../node_modules/@dcl/ui-utils/utils/types'

export default (isWin) => {
  const prompt = new ui.CustomPrompt(PromptStyles.DARKLARGE, 500, 600)
  prompt.addText(`You ${isWin ? 'win' : 'loose'}`, 0, 260, Color4.White(), 20)
  const content = prompt.addText(``, -140, -180)
  content.text.hTextAlign = 'left'
  prompt.addButton(
    `Ok`,
    0,
    -250,
    () => {
      // prompt.close()
    },
    ButtonStyles.E
  )
}
