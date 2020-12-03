//import * as ui from '../node_modules/@dcl/ui-utils/index'
import { getCurrentRealm } from '@decentraland/EnvironmentAPI'
import utils from '../node_modules/decentraland-ecs-utils/index'
import {movePlayerTo} from '@decentraland/RestrictedActions'
import { getUserData } from '@decentraland/Identity'

// import { Ground } from './entities/ground'
// import { AvatarHitbox } from './entities/avatarHitbox'
import { Santa } from './entities/santa'
import { TheTourniquette } from './entities/theTourniquette'
import { TheTourniquetteCollider } from './entities/theTourniquetteCollider'
import { ThePilones } from './entities/pilones'
import { Teleporter } from './entities/teleporter'
import { XmasBall } from './entities/xmasBall'


class Game implements ISystem {

  webSocketUrl = 'ws://192.168.100.4:13370'
  socket: WebSocket
  userId: string
  currentPosition = Vector3.Zero()
  camera: Camera = Camera.instance
  isPlaying = false
  fallenOut = false

  gameSpots: Vector3[] = [
    new Vector3(3, 12, 8),
    new Vector3(8, 12, 3),
    new Vector3(13, 12, 8),
    new Vector3(8, 12, 13)
  ]

  // ground: Entity
  xmasBall: Entity
  pilones: Entity[] = []
  theTourniquette: Entity
  theTourniquetteCollider: Entity
  teleporter: Entity
  // avatarHitbox: Entity
  santa: Santa

  constructor() {

    // this.createGround()
    this.createXmasBall()
    this.createTheTourniquette()
    this.createThePilones()
    this.createTeleporter()
    // this.createAvatarHitbox()
    this.joinSocketsServer().catch(error => log('error join socket server', error) )

  }

  // createSanta(){

    // this.santa = new Santa(new GLTFShape("models/santa.glb"), new Transform({ position: new Vector3(0, -1, -0.2), scale: new Vector3(1, 1.5, 1)}) )
    // this.santa.setParent(Attachable.AVATAR)
    //
    // // Hide avatars
    // const hideAvatarsEntity = new Entity()
    // hideAvatarsEntity.addComponent(new AvatarModifierArea({
    //   area: {
    //     box: new Vector3(16, 40, 16)
    //   },
    //   modifiers: [AvatarModifiers.HIDE_AVATARS]
    // }) )
    // hideAvatarsEntity.addComponent(new Transform({ position: new Vector3(8, 0, 8) }) )
    // engine.addEntity(hideAvatarsEntity)

    // Create to show Santa avatar
    // hideAvatarsEntity.addComponent(
    //   new utils.TriggerComponent(
    //     new utils.TriggerBoxShape(new Vector3(16, 20, 16), new Vector3(0, 10, 0) ),
    //     null, null, null, null,
    //     () => { this.santa.getComponent(Transform).scale.setAll(1) },
    //     () => { this.santa.getComponent(Transform).scale.setAll(0) }
    //   )
    // )


  // }

  playerFallOut(){

    log('playerFallOut')
    this.fallenOut = true
    this.socket.send(JSON.stringify({
      type: 'FALLEN_OUT',
      data: {}
    }) )

  }

  update(dt: number): void {

    if(this.isPlaying && !this.fallenOut && (
      this.camera.position.y < 11 ||
      this.camera.position.x < 0 ||
      this.camera.position.x > 16 ||
      this.camera.position.z > 16 ||
      this.camera.position.z < 0
    ) ){

      this.playerFallOut()

    }

    // if(this.santa){
    //   if(this.currentPosition.equals(Camera.instance.position) ){
    //
    //     this.santa.playIdle()
    //     log('playeidle')
    //
    //   } else {
    //
    //     if(Camera.instance.position.y > this.currentPosition.y + 0.35){
    //
    //       log('###################playejump')
    //       this.santa.playJump()
    //
    //     } else {
    //
    //       log('playerunning')
    //       this.santa.playRunning()
    //
    //     }
    //
    //     this.currentPosition = Camera.instance.position.clone()
    //
    //   }
    //
    // }

  }

  // createGround(){
  //   this.ground = new Ground(new GLTFShape('models/FloorBaseGrass.glb'), new Transform({
  //     position: new Vector3(8, -0.11, 8),
  //     scale:  new Vector3(1.6, 1, 1.6)
  //   }) )
  //
  // }

  createXmasBall(){
    this.xmasBall = new XmasBall(new GLTFShape('models/xmasBall.glb'), new Transform({
      position: new Vector3(8, -0.11, 8),
      scale:  new Vector3(1, 1, 1)
    }) )
  }

  createTheTourniquette(){
    this.theTourniquetteCollider = new TheTourniquetteCollider(new BoxShape(), new Transform({
      //position: new Vector3(8, 13, 8),
      position: new Vector3(8, 12.5, 8),
      scale:  new Vector3(14.5, 0.2, 0.01),
      rotation: Quaternion.Euler(0,45,0)
    }) )

    this.theTourniquette = new TheTourniquette(new GLTFShape('models/sucreDorge.glb'), new Transform({
      //position: new Vector3(8, 13, 8),
      position: new Vector3(8, 12, 8),
      scale:  new Vector3(1, 1, 1),
      rotation: Quaternion.Euler(0,45,0)
    }) )
    this.theTourniquette.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, 100, 0) ) )

  }

  createThePilones(){
    const scale = new Vector3(1, 0.2, 1)
    const rotation = Quaternion.Euler(0, 45, 0)
    this.gameSpots.forEach(gameSpot => {
      this.pilones.push(new ThePilones(new BoxShape(), new Transform({
        position: gameSpot,
        scale,
        rotation
      }) ))
    })

  }

  createTeleporter(){

    this.teleporter = new Teleporter(new BoxShape(), new Transform({
      // position: new Vector3(2, 2, 2),
      position: new Vector3(8, 6, 7.5),
      scale: new Vector3(1, 1, 1)
    }) )

    this.teleporter.addComponent(
      new OnPointerDown(
        (e) => {
          // if(!this.santa) {
            // this.createSanta()
          // }

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

  // createAvatarHitbox(){
  //
  //   this.avatarHitbox = new AvatarHitbox(new BoxShape(), new Transform({
  //     position: new Vector3(0, 0, 0),
  //     scale: new Vector3(0.5, 2, 0.5)
  //   }) )
  //   this.avatarHitbox.addComponent(
  //     new utils.TriggerComponent(
  //       new utils.TriggerBoxShape(new Vector3(16, 6, 16), new Vector3(8, 0, 8) ),
  //       null, null, null, null,
  //       () => { log('enter') },
  //       () => { log('exit') }, true
  //     )
  //   )
  // }

  start(playersId : []){

    const userPosition = playersId.indexOf(this.userId as never)
    this.theTourniquette.getComponent(Transform).rotation = Quaternion.Euler(0,45,0)
    if(this.theTourniquette.hasComponent(utils.KeepRotatingComponent) ){

      this.theTourniquette.getComponent(utils.KeepRotatingComponent).stop()

    }

    if(userPosition === -1){

      log('User not playing')
      return false

    }

    movePlayerTo(this.gameSpots[userPosition].add(new Vector3(0, 1, 0)), { x: 8, y: 12, z: 8 })
    // movePlayerTo(new Vector3(8, 20, 8), { x: 8, y: 11, z: 8 })

    this.theTourniquette.addComponent(new utils.Delay(2000, () => {
      this.theTourniquette.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, 100, 0) ) )
      this.theTourniquetteCollider.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, 100, 0) ) )
      this.isPlaying = true
      this.fallenOut = false
    }) )

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
        case 'END_GAME': {

          if(this.theTourniquette.hasComponent(utils.KeepRotatingComponent) ){

            this.theTourniquette.getComponent(utils.KeepRotatingComponent).stop()
            this.theTourniquette.getComponent(Transform).rotation = Quaternion.Euler(0,45,0)

          }

          if(this.theTourniquetteCollider.hasComponent(utils.KeepRotatingComponent) ){

            this.theTourniquetteCollider.getComponent(utils.KeepRotatingComponent).stop()
            this.theTourniquetteCollider.getComponent(Transform).rotation = Quaternion.Euler(0,45,0)

          }

          break
        }
        case 'FALLEN_OUT': {
          break
        }
      }

    }

  }

}

const game = new Game()
engine.addSystem(game)
