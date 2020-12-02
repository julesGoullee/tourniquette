//import * as ui from '../node_modules/@dcl/ui-utils/index'
import { getCurrentRealm } from '@decentraland/EnvironmentAPI'
import utils from '../node_modules/decentraland-ecs-utils/index'
import {movePlayerTo} from '@decentraland/RestrictedActions'
import { getUserData } from '@decentraland/Identity'

import { Ground } from './entities/ground'
import { TheTourniquette } from './entities/theTourniquette'
import { ThePilones } from './entities/pilones'
import { Teleporter } from './entities/teleporter'
import { AvatarHitbox } from './entities/avatarHitbox'
import { Santa } from './entities/santa'

class Game implements ISystem {

  webSocketUrl = 'ws://192.168.100.4:13370'
  socket: WebSocket
  userId: string
  currentPosition: Vector3

  gameSpots: Vector3[] = [
    new Vector3(3, 12, 8),
    new Vector3(8, 12, 3),
    new Vector3(13, 12, 8),
    new Vector3(8, 12, 13)
  ]
  marginPilones = 3

  ground: Entity
  pilones: Entity[] = []
  theTourniquette: Entity
  teleporter: Entity
  avatarHitbox: Entity
  santa: Santa

  constructor() {

    this.createGround()
    this.createTheTourniquette()
    this.createThePilones()
    this.createTeleporter()
    //this.createAvatarHitbox()
    this.joinSocketsServer().catch(error => log('error join socket server', error) )

  }

  createSanta(){

    this.santa = new Santa(new GLTFShape("models/santa.glb"), new Transform({ position: new Vector3(0, 0.05, -0.10), scale: new Vector3(0, 0, 0)}) )
    this.santa.setParent(Attachable.AVATAR)

    // Hide avatars
    const hideAvatarsEntity = new Entity()
      hideAvatarsEntity.addComponent(new AvatarModifierArea({ area: { box: new Vector3(16, 4, 11) }, modifiers: [AvatarModifiers.HIDE_AVATARS] }) )
    hideAvatarsEntity.addComponent(new Transform({ position: new Vector3(8, 2, 10.5) }) )
    engine.addEntity(hideAvatarsEntity)

    // Create to show Santa avatar
    hideAvatarsEntity.addComponent(
      new utils.TriggerComponent(
        new utils.TriggerBoxShape(new Vector3(16, 4, 11), Vector3.Zero() ),
        null, null, null, null,
        () => { this.santa.getComponent(Transform).scale.setAll(1) },
        () => { this.santa.getComponent(Transform).scale.setAll(0) }
      )
    )


  }

  update(dt: number): void {

    if(this.santa){

      if(this.currentPosition.equals(Camera.instance.position) ){

        this.santa.playIdle()

      } else {

        this.currentPosition.copyFrom(Camera.instance.position)
        this.santa.playRunning()

      }

    }

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
      scale:  new Vector3(12.5, 0.2, 0.01),
      rotation: Quaternion.Euler(0,45,0)
    }) )

  }

  createThePilones(){
    const scale = new Vector3(1.5, 0.2, 1.5)
    this.gameSpots.forEach(gameSpot => {
      this.pilones.push(new ThePilones(new BoxShape(), new Transform({
        position: gameSpot,
        scale
      }) ))
    })

  }

  createTeleporter(){

    this.teleporter = new Teleporter(new BoxShape(), new Transform({
      position: new Vector3(8, 1, 8),
      scale: new Vector3(1, 1, 1)
    }) )

    this.teleporter.addComponent(
      new OnPointerDown(
        (e) => {
          // this.createSanta()
          if(!this.socket){
            log('Error socket not connected')
            return false
          }
          this.socket.send(JSON.stringify({
            type: 'START',
            data: {}
          }) )

        },
        { hoverText: 'Start' }
      )
    )


  }

  createAvatarHitbox(){

    this.avatarHitbox = new AvatarHitbox(new BoxShape(), new Transform({
      position: new Vector3(0, 0, 0),
      scale: new Vector3(0.5, 2, 0.5)
    }) )

  }

  start(playersId : []){

    movePlayerTo(this.gameSpots[playersId.indexOf(this.userId as never)].add(new Vector3(0, 1, 0)), { x: 8, y: 13, z: 8 })

    this.theTourniquette.addComponent(new utils.Delay(1000, () => {
      this.theTourniquette.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, 100, 0) ) )
    }))

  }

  async joinSocketsServer() {

    const realm = await getCurrentRealm()
    log(`You are in the realm: `, realm.displayName)

    const userData = await getUserData()
    this.userId = userData.userId
    log(`You are: `, userData.userId)

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
          this.start(parsed.data.playersId)
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
