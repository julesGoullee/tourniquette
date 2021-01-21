import {Dialog, NPC} from '../../../node_modules/@dcl/npc-utils/index'

export class Lutin extends Entity {

  constructor(pivot: Entity) {

    super()

    const lutinSpeaks: Dialog[] = [
      {
        text: `Welcome to the wonderful place of Santaland!`,
        triggeredByNext: () => {
          lutin.playAnimation('talking', true)
        }
      },
      {
        text: `We are here to save Christmas, do you want to know more ?`,
        isQuestion: true,
        buttons: [
          { label: `Tell me!`,
            goToDialog: 2,
            triggeredActions:  () => {
              lutin.playAnimation('shakingHead', true)
            }},
          { label: `No thanks`,
            goToDialog: 14,
            triggeredActions:  () => {
              lutin.playAnimation('sadIdle', true)
            }
          },
        ],
      },
      {
        text: `We have a crazy problem this year...`,
        triggeredByNext: () => {
          lutin.playAnimation('sadIdle', false)
        }
      },
      {
        text: `Santa has been captured...`,
      },
      {
        text: `We need your help to bring him back and save Christmas`,
        triggeredByNext: () => {
          lutin.playAnimation('talking', true)
        }
      },
      {
        text: `Would you accept to achieve this mission ?`,
        isQuestion: true,
        buttons: [
          { label: `Of course!`,
            goToDialog: 6,
            triggeredActions:  () => {
              lutin.playAnimation('capuera', false)
            } },

          { label: `I'm busy`,
            goToDialog: 14,
            triggeredActions:  () => {
              lutin.playAnimation('sadIdle', true)
            }},
        ],
      },
      {
        text: `Yihiii, you're amazing !`,
        triggeredByNext: () => {
          lutin.playAnimation('pointing', true)
        }
      },
      {
        text: `Look at this ... to understand the game`,
      },
      {
        text: `First, go in the house upstairs and click on the fireplace`,
      },
      {
        text: `This will start the game`,
      },
      {
        text: `Then, the purpose is to be the last man standing!`,
      },
      {
        text: `To do so, don't fall from your platform`,
      },
      {
        text: `And jump to avoid hitting the sugar cane`,
      },
      {
        text: `You can click on the sugar cane to change its rotation`,
      },
      {
        text: `GoodLuck !`,
        isEndOfDialog: true,
        triggeredByNext: () => {
        }
      },
      {
        text: `Ok! You can come back to me later`,
        triggeredByNext: () => {
          lutin.playAnimation('pointing', true)
        }
      },
      {
        text: `If you want to help us, take the stairs and click on the fireplace to start.`,
        isEndOfDialog: true,
      },
    ]

    const lutin = new NPC(
      {
        position: new Vector3(4.5, 1, -7.5),
        rotation: Quaternion.Euler(0, 90 , 0)
      },
      'metas/tourniquette/models/lutin.glb',
      () => {
          lutin.talk(lutinSpeaks, 0)
          lutin.playAnimation('dancingJoy', false)

      },
      {
        idleAnim : 'dancingJoy',
        faceUser : true,
        portrait: { path: 'metas/tourniquette/images/lutin.png', height: 256, width: 256 },
        darkUI: true,
        coolDownDuration: 3,
        hoverText: 'CHAT',
        onlyClickTrigger: true,
        // onlyExternalTrigger: false,
        reactDistance: 1,
        continueOnWalkAway: false,
        // onWalkAway: () => {},
      }
    )
    lutin.setParent(pivot)
  }

}
