import * as ui from '../node_modules/@dcl/ui-utils/index'
import { getCurrentRealm } from '@decentraland/EnvironmentAPI'
import { Ground } from './entities/ground'
import { TheTourniquette } from "./entities/theTourniquette"

class Game implements ISystem {

  webSocketUrl = 'ws://192.168.100.4:13370'
  socket: WebSocket
  userId: string

  ground: Entity
  theTourniquette: Entity

  constructor() {

    this.createGround()
    this.createTheTourniquette()

  }

  update(dt: number): void {

  }

  createGround(){
    this.ground = new Ground(new GLTFShape('models/FloorBaseGrass.glb'), new Transform({
      position: new Vector3(8, -0.11, 8),
      scale:  new Vector3(1.6, 1, 1.6)
    }) )

  }

  createTheTourniquette(){
    this.theTourniquette = new TheTourniquette(new BoxShape(), new Transform({
      position: new Vector3(8, 1, 8),
      scale:  new Vector3(12, 0.5, 0.01)
    }) )

  }


  start(){

  }

  async joinSocketsServer() {

    const realm = await getCurrentRealm()
    log(`You are in the realm: `, realm.displayName)

    this.socket = new WebSocket(
      `${this.webSocketUrl}/broadcast/${realm.displayName}`
    )

    this.socket.onopen = (event) => {
      log('WebSocket: connection open', event)
      this.socket.send(JSON.stringify({
        type: 'USER_ID',
        data: {
          userId: this.userId
        }
      }) )
      new ui.OptionPrompt(
        'Welcome!',
        'You can train here, do you want to participate to the next battle?',
        () => {
          this.socket.send(JSON.stringify({
            type: 'PLAYER_READY',
            data: {}
          }) )
        },
        () => {
          log(`Nope`)
        },
        'Yep',
        'Nope',
        true
      )
    }

    this.socket.onclose = (closeEvent) => {
      log('WebSocket: connection close', closeEvent)
    }

    this.socket.onerror = (event) => {
      log('WebSocket: connection error', event)
    }

    this.socket.onmessage = (event) => {

      const parsed: any = JSON.parse(event.data)
      log('WebSocket: message', parsed)

      switch (parsed.type){
        case 'PING': {
          this.socket.send(JSON.stringify({
            type: 'PONG',
            data: {
              time: Date.now()
            }
          }) )
          break
        }
        case 'PATH': {
          break
        }
        case 'START': {
          this.start()
          break
        }
        case 'USER_LEFT': {
          break
        }
      }

    }

  }

}

const game = new Game()
engine.addSystem(game)
