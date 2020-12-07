import { getCurrentRealm } from '@decentraland/EnvironmentAPI'
import utils from '../node_modules/decentraland-ecs-utils/index'
import {movePlayerTo} from '@decentraland/RestrictedActions'
import { getUserData } from '@decentraland/Identity'
import { CornerLabel } from '../node_modules/@dcl/ui-utils/index'

import { Player, PlayersData } from './modules/Player'
import { TheTourniquette } from './entities/theTourniquette'
import { TheTourniquetteCollider } from './entities/theTourniquetteCollider'
import { ThePilones } from './entities/pilones'
import { Teleporter } from './entities/teleporter'
import { XmasBall } from './entities/xmasBall'
import { SnowSystem } from './modules/snow'
import {setTimeout, ITimeoutClean} from './utils'
import { SnowBall } from './entities/snowBall'
import { SoundSystem } from './modules/sounds'
import { CountDownBox } from './entities/countDown'
import { HidePassportBox } from './entities/hidePassportBox'
import {Lutin} from './entities/lutin'
import {PhysicsWorld} from './modules/physicsWorld'
import { AvatarFreezeBoxes } from './modules/AvatarFreezeBoxes'

class Game implements ISystem {

  // webSocketUrl = 'ws://192.168.100.4:13370'
  webSocketUrl = 'ws://localhost:13370'
  // webSocketUrl = 'wss://i-am-decentraland.unexpected.io'
  timeoutReconnectWebSocket: ITimeoutClean | undefined
  socket: WebSocket
  userId: string
  displayName: string
  playersInGame: Player[] = []
  camera: Camera = Camera.instance
  input = Input.instance
  canvas: UICanvas
  gameText: UIText
  isPlaying = false
  fallenOut = false
  hitTourniquetteAllowed = false
  hitSnowBallAllowed = true

  // physics
  physicsWorld: PhysicsWorld

  gameSpots: Vector3[] = [
    new Vector3(3, 12, 8),
    new Vector3(8, 12, 3),
    new Vector3(13, 12, 8),
    new Vector3(8, 12, 13)
  ]

  // ground: Entity
  xmasBall: Entity
  pilones: Entity[] = []
  snowBalls: SnowBall[] = []
  avatarFreezeBoxes: AvatarFreezeBoxes
  theTourniquette: Entity
  theTourniquetteCollider: Entity
  rotationSpeed = 50
  teleporter: Teleporter
  countDownBox: CountDownBox
  hidePassport: Entity
  // avatarHitbox: Entity
  // santa: Santa
  // kdo: Kdo

  soundSystem: SoundSystem

  constructor() {

    this.canvas = new CornerLabel('').canvas
    // this.createGround()
    this.createXmasBall()
    this.createTheTourniquette()
    this.createThePilones()
    this.createTeleporter()
    this.createPhysicsWorld()
    this.joinSocketsServer().catch(error => {
      log('error join socket server', error)
      this.onSocketFailed()
    })
    this.createLutin()
    // this.createKdo()
    // this.createAvatarHitbox()
    this.createCountDown()
    this.soundSystem = new SoundSystem()
    this.soundSystem.backgroundMusic()
    this.avatarFreezeBoxes = new AvatarFreezeBoxes()
    this.createGameText()
    this.createHidePassport()

  }

  createHidePassport(){

    this.hidePassport = new HidePassportBox(new Transform({
      position: new Vector3(8, 8, 8),
      scale: new Vector3(16, 16, 16)
    }), new Vector3(16, 10, 16) )

    this.listenSnowBallHit()

  }

  createGameText() {

    this.gameText = new UIText(this.canvas)
    this.gameText.font = new Font(Fonts.SanFrancisco)
    this.gameText.fontSize = 30
    this.gameText.vAlign = 'top'
    this.gameText.hAlign = 'center'

  }


  listenSnowBallHit(){
    this.input.subscribe('BUTTON_DOWN', ActionButton.POINTER, true, (e) => {

      // log(e.hit.entityId, 'hit')
      if(e.hit.entityId === 'E1k'){ // fire

        return false

      }

      if(e.hit.entityId === 'E15'){ // tourniquette

        return false

      }
      if(e.hit.entityId === 'E11'){ // lutin

        return false

      }
      if(!this.userId || !this.camera){
        return false
      }

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

  createPhysicsWorld(){

    this.physicsWorld = new PhysicsWorld()

  }

  createCountDown() {
    this.countDownBox = new CountDownBox()
  }

  createLutin(){
    new Lutin()
  }

  update(dt: number): void {

    if (this.isPlaying && !this.fallenOut && (
      this.camera.position.y < 11 ||
      this.camera.position.x < 0 ||
      this.camera.position.x > 16 ||
      this.camera.position.z > 16 ||
      this.camera.position.z < 0
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

      ball.addSplasher(this.canvas)

    }

    this.snowBalls.push(ball)

    log('Fire snow ball')
  }

  createXmasBall(){
    this.xmasBall = new XmasBall(new GLTFShape('models/xmasBall.glb'), new Transform({
      position: new Vector3(8, -0.11, 8),
      scale:  new Vector3(1, 1, 1)
    }) )
  }

  createTheTourniquette(){
    this.theTourniquette = new TheTourniquette(new GLTFShape('models/sucreDorge.glb'), new Transform({
      //position: new Vector3(8, 13, 8),
      position: new Vector3(8, 12, 8),
      scale:  new Vector3(1, 1, 1),
      rotation: Quaternion.Euler(0,45,0)
    }) )
    this.theTourniquette.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, 100, 0) ) )

    this.theTourniquetteCollider = new TheTourniquetteCollider(new BoxShape(), this.theTourniquette, new Transform({
      position: new Vector3(0, 0.6, 0),
      scale: new Vector3(14, 1, 0.04),
      rotation: Quaternion.Euler(0,0,0)
    }) )
    const onPointerDown = new OnPointerDown(
      (e) => {

        if(this.isPlaying && !this.fallenOut && this.hitTourniquetteAllowed){

          onPointerDown.hoverText = ''
          onPointerDown.showFeedback = false
          this.hitTourniquetteAllowed = false
          setTimeout(() => {

            this.hitTourniquetteAllowed = true
            onPointerDown.hoverText = 'Reverse'
            onPointerDown.showFeedback = true

          }, 2 * 1000)

          this.sendSocket('HIT')
        }
      }, {
        hoverText: 'Reverse',
        showFeedback: true,
        distance: 4
      })
    this.theTourniquetteCollider.addComponent(onPointerDown)

  }

  createThePilones(){
    this.gameSpots.forEach(gameSpot => {
      this.pilones.push(new ThePilones(gameSpot))
    })
  }

  createTeleporter(){

    this.teleporter = new Teleporter((e) => {

      this.sendSocket('START');

    })

  }

  start(players: [PlayersData] ){

    this.teleporter.gamePlaying(true)
    this.gameText.value = ''
    this.hitTourniquetteAllowed = false
    if(this.theTourniquette.hasComponent(utils.KeepRotatingComponent) ){

      this.theTourniquette.getComponent(utils.KeepRotatingComponent).stop()

    }
    this.theTourniquette.getComponent(Transform).rotation = Quaternion.Euler(0, 45, 0)

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

    movePlayerTo(this.gameSpots[userPosition].add(new Vector3(0, 6, 0) ), { x: -14 * 16 + 8, y: 18, z: -120 * 16 +8 })
    // movePlayerTo(new Vector3(8, 20, 8), { x: 8, y: 11, z: 8 })
    this.avatarFreezeBoxes.add([
      new Transform({
        position: this.gameSpots[userPosition].add(new Vector3(1, 5, 0) ),
        scale: new Vector3(1, 10, 3)
      }),
      new Transform({
        position: this.gameSpots[userPosition].add(new Vector3(-1, 5, 0) ),
        scale: new Vector3(1, 10, 3)
      }),
      new Transform({
        position: this.gameSpots[userPosition].add(new Vector3(0, 5, 1) ),
        scale: new Vector3(2, 10, 1)
      }),
      new Transform({
        position: this.gameSpots[userPosition].add(new Vector3(0, 5, -1) ),
        scale: new Vector3(2, 10, 1)
      }),
    ])

    this.countDownBox.playCountDown()
    this.soundSystem.backgroundMusic(false)
    this.soundSystem.startGame()

    this.theTourniquette.addComponent(new utils.Delay(4000, () => {

      this.rotationSpeed = 50
      this.theTourniquette.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, this.rotationSpeed, 0) ) )

      this.theTourniquette.addComponentOrReplace(new utils.Interval(3000,() => {

        if(Math.abs(this.rotationSpeed) < 100){

          this.rotationSpeed = this.rotationSpeed > 0 ? this.rotationSpeed + 5 : this.rotationSpeed - 5
          this.theTourniquette.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, this.rotationSpeed, 0) ) )

        } else {

          this.theTourniquette.getComponent(utils.Interval).setCallback(null)

        }

      }) )

      this.soundSystem.gameMusic(true)

      this.isPlaying = true
      this.fallenOut = false
      this.hitTourniquetteAllowed = true

    }) )

  }

  endGame(userWinner: string){

    this.teleporter.gamePlaying(false)
    this.soundSystem.endGame()

    if(this.theTourniquette.hasComponent(utils.KeepRotatingComponent) ){

      this.theTourniquette.getComponent(utils.KeepRotatingComponent).stop()
      this.theTourniquette.getComponent(Transform).rotation = Quaternion.Euler(0,45,0)

    }

    if(this.theTourniquette.hasComponent(utils.Interval) ){

      this.theTourniquette.getComponent(utils.Interval).setCallback(null)

    }

    if(this.theTourniquette.hasComponent(utils.Delay) ){ // end before delay start finish

      log('end before delay start finish')
      this.gameText.value = 'Everyone left!'
      this.theTourniquette.getComponent(utils.Delay).setCallback(null)
      this.soundSystem.backgroundMusic(true)
      this.avatarFreezeBoxes.remove()

    }

    if(this.isPlaying){

      this.soundSystem.gameMusic(false)
      this.soundSystem.backgroundMusic(true)

      if(userWinner === this.userId){

        this.soundSystem.winGame()
        this.gameText.value = 'Congrats, You won !'

      } else if(userWinner){

        const winner = this.playersInGame.filter(p => p.id === userWinner)[0]
        this.gameText.value = `${winner.displayName} won the game !`

      }

    }

    this.hitTourniquetteAllowed = false
    this.isPlaying = false
    this.fallenOut = false

  }

  onFallout(){

    log('playerFallOut')
    this.fallenOut = true
    this.gameText.value = 'You lose...'
    this.soundSystem.failGame()

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

    const realm = await getCurrentRealm()
    log(`You are in the realm: `, realm.displayName)

    const userData = await getUserData()
    this.userId = userData.userId
    this.displayName = userData.displayName
    log(`You are: `, userData.userId)

    this.socket = new WebSocket(
      `${this.webSocketUrl}/broadcast/${realm.displayName}`
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
              position: this.camera.position
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

          this.rotationSpeed = parsed.data.sign === '+' ? Math.abs(this.rotationSpeed) : -this.rotationSpeed
          this.theTourniquette.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, this.rotationSpeed, 0) ) )

          this.soundSystem.reverseTourniquette(this.theTourniquette)
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
}

const game = new Game()
engine.addSystem(game)

const bounds = new Vector4(3, 13, 5, 16)
engine.addSystem(new SnowSystem(bounds))

engine.addSystem(game.soundSystem);
