import { getCurrentRealm } from '@decentraland/EnvironmentAPI'
import { getParcel } from "@decentraland/ParcelIdentity"
import utils from '../../node_modules/decentraland-ecs-utils/index'
import { movePlayerTo } from '@decentraland/RestrictedActions'
import { getUserData } from '@decentraland/Identity'
import { CornerLabel } from '../../node_modules/@dcl/ui-utils/index'

import { Player, PlayersData } from './modules/Player'
import { TheTourniquette } from './entities/theTourniquette'
import { ThePilones } from './entities/pilones'
import { Teleporter } from './entities/teleporter'
import { XmasBall } from './entities/xmasBall'
import { SnowSystem } from './modules/snow'
import {setTimeout, ITimeoutClean} from './utils'
import { SnowBall } from './entities/snowBall'
import { SoundSystem } from './modules/sounds'
import { CountDownBox } from './entities/countDown'
import {Lutin} from './entities/lutin'
import {PhysicsWorld} from './modules/physicsWorld'
import { AvatarFreezeBoxes } from './modules/AvatarFreezeBoxes'
import { Win } from './entities/win'
import { Lose } from './entities/lose'
import {createUserWinnerUI, GameMessage} from './modules/ui'
import {Tutorial} from './modules/Tutorial'
import { getEntityWorldPosition } from '../../node_modules/decentraland-ecs-utils/helpers/helperfunctions'

export class Tourniquette implements ISystem {

  // webSocketUrl = 'ws://192.168.1.31:13370'
  // webSocketUrl = 'ws://localhost:13370'
  webSocketUrl = 'wss://i-am-decentraland.unexpected.io'
  api = null
  hostData = {
    tourniquette: {
      position: { x:8, y: 0, z: 8 },
      rotation: { x:0, y: 0, z: 0 },
    }
  }
  timeoutReconnectWebSocket: ITimeoutClean | undefined
  socket: WebSocket
  userId: string
  displayName: string
  playersInGame: Player[] = []
  camera: Camera = Camera.instance
  input = Input.instance
  canvas: UICanvas
  gameMessage: GameMessage
  userWinnerImg: UIImage
  userContainer: UIContainerStack
  isPlaying = false
  fallenOut = false
  hitTourniquetteAllowed = false
  hitSnowBallAllowed = true

  // physics
  physicsWorld: PhysicsWorld

  gameSpots: Vector3[] = [
    new Vector3(-5, 12, 0),
    new Vector3(0, 12, -5),
    new Vector3(5, 12, 0),
    new Vector3(0, 12, 5)
  ]

  // ground: Entity
  pivot: Entity
  xmasBall: Entity
  pilones: Entity[] = []
  snowBalls: SnowBall[] = []
  avatarFreezeBoxes: AvatarFreezeBoxes
  theTourniquette: TheTourniquette
  rotationSpeed = 50
  teleporter: Teleporter
  countDownBox: CountDownBox
  win: Win
  lose: Lose
  // avatarHitbox: Entity
  // santa: Santa
  // kdo: Kdo

  soundSystem: SoundSystem

  constructor(api, host){

    this.api = api
    this.createPivot()
    this.refreshHost(host)
    this.soundSystem = new SoundSystem(this.pivot)
    this.soundSystem.backgroundMusic()
    this.soundSystem.backgroundMeteo()

    this.canvas = new CornerLabel('').canvas
    new Tutorial(this.canvas)
    // this.createGround()
    new XmasBall(this.pivot)
    new Lutin(this.pivot)

    this.createThePilones()
    this.createTeleporter()
    this.physicsWorld = new PhysicsWorld()
    this.joinSocketsServer().catch(error => {
      log('error join socket server', error)
      this.onSocketFailed()
    })

    this.avatarFreezeBoxes = new AvatarFreezeBoxes(this.pivot)

    this.createTheTourniquette()
    this.countDownBox = new CountDownBox(this.soundSystem)
    this.win = new Win()
    this.lose = new Lose()

    this.createGameText()
    this.listenSnowBallHit()

    const bounds = new Vector4(-4, 5, 5, 16)
    engine.addSystem(new SnowSystem(this.pivot, bounds))
    engine.addSystem(this.soundSystem)

  }

  createGameText() {

    this.gameMessage = new GameMessage(this.canvas)

  }

  createPivot(){

    this.pivot = new Entity()
    this.pivot.addComponentOrReplace(new Transform({
      position: new Vector3(this.hostData.tourniquette.position.x, this.hostData.tourniquette.position.y, this.hostData.tourniquette.position.z),
      rotation: Quaternion.Euler(this.hostData.tourniquette.rotation.x, this.hostData.tourniquette.rotation.y, this.hostData.tourniquette.rotation.z),
      scale: new Vector3(1, 1, 1),
    }) )
    engine.addEntity(this.pivot)

  }

  listenSnowBallHit(){
    this.input.subscribe('BUTTON_DOWN', ActionButton.SECONDARY, true, (e) => {

      if(!this.hitSnowBallAllowed){
        log('hit snow ball cooldown')
        return false
      }

      this.hitSnowBallAllowed = false

      const position = this.camera.position.clone()
      const rotation = this.camera.rotation.clone()
      const inputVector = Vector3.Forward().rotate(Quaternion.Euler(-5, 0, 0)).rotate(rotation)

      this.sendSocket(
        'HIT_SNOW_BALL',
        {
          position,
          rotation,
          inputVector,
        }
      );

      this.createBall(this.userId, new Transform({
        position,
        rotation,
        scale: new Vector3(0.1, 0.1, 0.1)
      }), inputVector)

      this.soundSystem.throwBall()

    })

  }

  update(dt: number): void {

    if (this.isPlaying && !this.fallenOut && (
      this.camera.position.y < this.pivot.getComponent(Transform).position.y + 11 ||
      this.camera.position.x < this.pivot.getComponent(Transform).position.x - 8 ||
      this.camera.position.x > this.pivot.getComponent(Transform).position.x + 8 ||
      this.camera.position.z > this.pivot.getComponent(Transform).position.z + 8 ||
      this.camera.position.z < this.pivot.getComponent(Transform).position.z - 8
    )) {

      this.onFallout()

    }

    this.physicsWorld.step(dt)

    this.snowBalls.forEach((snowBall) => {

      snowBall.update()

    })
  }

  createBall(userId: string, transform: Transform, inputVector: Vector3){

    const ball = new SnowBall(transform, this.physicsWorld, userId, inputVector)

    this.snowBalls.forEach(otherBall => {

      ball.addBallCollider(otherBall)

    })

    if(ball.userId === this.userId){

      setTimeout(() => {

        this.hitSnowBallAllowed = true

      }, 1000)

    }

    ball.addComponent(new utils.Delay(4000, () => {

      ball.destroy()
      this.snowBalls = this.snowBalls.filter(oneSnowBall => oneSnowBall !== ball)

    }) )

    if(this.userId !== userId){

      ball.addSplasher(this.canvas, this.soundSystem)

    }

    this.snowBalls.push(ball)

    log('Fire snow ball')
  }

  createTheTourniquette(){

    this.theTourniquette = new TheTourniquette(this.pivot, this.soundSystem, () => {

      if(this.isPlaying && !this.fallenOut && this.hitTourniquetteAllowed){

        this.theTourniquette.disableClick()
        this.hitTourniquetteAllowed = false

        setTimeout(() => {

          this.theTourniquette.enableClick()
          this.hitTourniquetteAllowed = true

        }, 2 * 1000)

        this.sendSocket('HIT')
      }
    })

    this.theTourniquette.startNormalRotation()

  }

  createThePilones(){
    this.gameSpots.forEach(gameSpot => {
      this.pilones.push(new ThePilones(this.pivot, gameSpot))
    })
  }

  createTeleporter(){

    this.teleporter = new Teleporter(this.pivot, (e) => {

      this.sendSocket('START');

    })

  }

  start(players: [PlayersData] ){

    this.teleporter.gamePlaying(true)
    this.gameMessage.setMessage('')
    this.hitTourniquetteAllowed = false

    let userPosition = -1
    this.playersInGame = players.map( (playersData, i) => {
      const player = new Player(playersData.id, playersData.displayName, i)
      if(player.id === this.userId){
        userPosition = i
      }
      return player
    })

    if(userPosition === -1) {

      log('User not playing')
      return false

    }

    this.theTourniquette.resetRotation()

    movePlayerTo(getEntityWorldPosition(this.pilones[userPosition]).add(new Vector3(0, 6, 0) ), {
      x: this.pivot.getComponent(Transform).position.x,
      y: 18 + this.pivot.getComponent(Transform).position.y,
      z: this.pivot.getComponent(Transform).position.z
    })
    // movePlayerTo(new Vector3(8, 20, 8), { x: 8, y: 11, z: 8 })
    this.avatarFreezeBoxes.add(this.gameSpots[userPosition])

    this.countDownBox.playCountDown()
    this.soundSystem.backgroundMusic(false)

    this.theTourniquette.addComponent(new utils.Delay(4000, () => {

      this.theTourniquette.startGameRotation()
      this.soundSystem.gameMusic(true)

      this.isPlaying = true
      this.fallenOut = false
      this.hitTourniquetteAllowed = true

    }) )

  }

  endGame(userWinner: string){

    this.teleporter.gamePlaying(false)
    this.soundSystem.endGame()

    this.theTourniquette.startNormalRotation()

    if(this.theTourniquette.hasComponent(utils.Delay) ){ // end before delay start finish

      log('end before delay start finish')
      this.gameMessage.setMessage('Everyone left!')
      this.theTourniquette.getComponent(utils.Delay).setCallback(null)
      this.soundSystem.backgroundMusic(true)
      this.avatarFreezeBoxes.remove()

    }

    if(this.isPlaying){

      this.soundSystem.gameMusic(false)
      this.soundSystem.backgroundMusic(true)

      if(userWinner === this.userId){

        this.soundSystem.winGame()
        this.win.playWin()

      } else if(userWinner){

        const winner = this.playersInGame.filter(p => p.id === userWinner)[0]
        createUserWinnerUI(winner, this.canvas)

      }

    }

    this.hitTourniquetteAllowed = false
    this.isPlaying = false
    this.fallenOut = false

  }

  onFallout(){

    log('playerFallOut')
    this.fallenOut = true
    this.soundSystem.failGame()
    this.lose.playLose()


    this.sendSocket('FALLEN_OUT');

  }

  onPlayerFallout(playerId: string){

    if(playerId !== this.userId) {
      this.soundSystem.otherPlayerFall();
    }

    this.playersInGame.some(player => {

      if(player.id === playerId){

        player.fallenOut = true

        return true

      }

      return false

    })
  }

  async joinSocketsServer() {

    const [realm, userData, parcel] = await Promise.all([getCurrentRealm(), getUserData(), getParcel()])
    log(`You are in the realm: `, realm.displayName)
    log(`You are in parcel: `, parcel.land.sceneJsonData.scene.parcels[0])
    log(`You are: `, userData.userId)

    this.userId = userData.userId
    this.displayName = userData.displayName

    this.socket = new WebSocket(
      `${this.webSocketUrl}/broadcast/${realm.displayName}/${parcel.land.sceneJsonData.scene.parcels[0]}`
    )

    this.socket.onopen = (event) => {
      log('WebSocket: connection open', event)

      this.sendSocket(
        'USER_ID',
        {
          userId: this.userId,
          displayName: userData.displayName
        }
      );

    }

    this.socket.onclose = (closeEvent) => {
      log('WebSocket: connection close', closeEvent)
      this.onSocketFailed()
    }

    this.socket.onerror = (event) => {
      log('WebSocket: connection error', event)
      this.onSocketFailed()
    }

    this.socket.onmessage = (event) => {

      const parsed: any = JSON.parse(event.data)

      if(parsed.type !== 'PING') {

        log('WebSocket: message', parsed)

      }

      switch (parsed.type){
        case 'HELLO': {

          this.teleporter.gamePlaying(parsed.data.isPlaying)
          break

        }
        case 'PING': {


          this.sendSocket(
            'PONG',
            {
              time: Date.now(),
              position: this.camera.position.subtract(this.pivot.getComponent(Transform).position)
            }
          );

          break
        }
        case 'START': {
          this.start(parsed.data.players)
          break
        }
        case 'END_GAME': {
          this.endGame(parsed.data.userWinner)
          break
        }
        case 'FALLEN_OUT': {
          this.onPlayerFallout(parsed.data.playerId)
          break
        }
        case 'HIT_SNOW_BALL': {

          this.createBall(parsed.data.userId, new Transform({
            position: new Vector3(parsed.data.position.x, parsed.data.position.y, parsed.data.position.z),
            rotation: new Quaternion(parsed.data.rotation.x, parsed.data.rotation.y, parsed.data.rotation.z, parsed.data.rotation.w),
            scale: new Vector3(0.1, 0.1, 0.1)
          }), new Vector3(parsed.data.inputVector.x, parsed.data.inputVector.y, parsed.data.inputVector.z) )

          break
        }
        case 'CHANGE_DIRECTION': {

          this.theTourniquette.invertRotation(parsed.data.sign)
          break

        }
      }

    }

  }

  onSocketFailed(){

    if(this.teleporter){
      this.teleporter.getComponent(OnPointerDown).hoverText = 'Connection failed, come back later'
    }

    if(!this.timeoutReconnectWebSocket){

      this.timeoutReconnectWebSocket = setTimeout(() => {

        log('retry join socket server', error)
        this.joinSocketsServer()
          .then(() => {
            log('socker server reconnected')
            this.timeoutReconnectWebSocket = null
          })
          .catch(error => {
            log('error join socket server', error)
            this.timeoutReconnectWebSocket = null
            this.onSocketFailed()
          })

      }, 5000)
    }
  }

  sendSocket(type: string, data: any = {}) {
    if(this.socket && this.socket.readyState === WebSocket.OPEN){

      this.socket.send(
        JSON.stringify({
          type,
          data,
        })
      )

    }
  }

  refreshHost(host: any){

    this.hostData = JSON.parse(host.host_data)
    this.pivot.addComponentOrReplace(new Transform({
      position: new Vector3(this.hostData.tourniquette.position.x, this.hostData.tourniquette.position.y, this.hostData.tourniquette.position.z),
      rotation: Quaternion.Euler(this.hostData.tourniquette.rotation.x, this.hostData.tourniquette.rotation.y, this.hostData.tourniquette.rotation.z),
      scale: new Vector3(1, 1, 1),
    }) )

  }

}

