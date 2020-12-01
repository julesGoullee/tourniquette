import * as ui from '../node_modules/@dcl/ui-utils/index'
import { getCurrentRealm } from '@decentraland/EnvironmentAPI'
import { Ground } from './entities/ground'
import { TheTourniquette } from "./entities/theTourniquette"
import { ThePilones } from "./entities/pilones"
import { Teleporter } from "./entities/teleporter"
import { AvatarHitbox } from "./entities/avatarHitbox"
import {movePlayerTo} from "@decentraland/RestrictedActions";
import { getUserData } from "@decentraland/Identity"

class Game implements ISystem {

  webSocketUrl = 'ws://192.168.100.5:13370'
  socket: WebSocket
  userId: string

  ground: Entity
  pilones: Entity[] = []

  marginPilones = 3
  theTourniquette: Entity
  teleporter: Entity
  avatarHitbox: Entity

  constructor() {

    this.createGround()
    this.createTheTourniquette()
    this.createThePilones()
    this.createTeleporter()
    //this.createAvatarHitbox()
    this.joinSocketsServer()

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
      //position: new Vector3(8, 13, 8),
      position: new Vector3(8, 12.5, 8),
      scale:  new Vector3(12.5, 0.2, 0.01)
    }) )

  }

  createThePilones(){
    const scale = new Vector3(1.5, 0.2, 1.5)
    this.pilones.push(new ThePilones(new BoxShape(), new Transform({
        position: new Vector3(3, 12, 8),
        scale
      }) ))
    this.pilones.push(new ThePilones(new BoxShape(), new Transform({
      position: new Vector3(8, 12, 3),
      scale
    }) ))
    this.pilones.push(new ThePilones(new BoxShape(), new Transform({
      position: new Vector3(13, 12, 8),
      scale
    }) ))
    this.pilones.push(new ThePilones(new BoxShape(), new Transform({
      position: new Vector3(8, 12, 13),
      scale
    }) ))
  }

  createTeleporter(){

    this.teleporter = new Teleporter(new BoxShape(), new Transform({
      position: new Vector3(8, 1, 8),
      scale: new Vector3(1, 1, 1)
    }) )

    this.teleporter.addComponent(
      new OnPointerDown(
        (e) => {

          if(!this.socket){
            log('Error socket not connected')
            return false
          }
          this.socket.send(JSON.stringify({
            type: 'START',
            data: {}
          }) )

        },
        { hoverText: "Start" }
      )
    )


  }

  createAvatarHitbox(){

    this.avatarHitbox = new AvatarHitbox(new BoxShape(), new Transform({
      position: new Vector3(0, 0, 0),
      scale: new Vector3(0.5, 2, 0.5)
    }) )

  }

  start(){

    log('youhou')
  }

  async joinSocketsServer() {

    const realm = await getCurrentRealm()
    log(`You are in the realm: `, realm.displayName)

    const userData = await getUserData()
    this.userId = userData.displayName
    log(`You are: `, userData.displayName)

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
