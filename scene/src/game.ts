import { getCurrentRealm } from '@decentraland/EnvironmentAPI'
import utils from '../node_modules/decentraland-ecs-utils/index'
import { movePlayerTo } from '@decentraland/RestrictedActions'
import { getUserData } from '@decentraland/Identity'
import { CornerLabel } from '../node_modules/@dcl/ui-utils/index'

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

  constructor() {

    this.soundSystem = new SoundSystem()
    this.soundSystem.backgroundMusic()

    this.canvas = new CornerLabel('').canvas
    // this.createGround()
    new XmasBall()
    new Lutin()

    this.createThePilones()
    this.createTeleporter()
    this.physicsWorld = new PhysicsWorld()
    this.joinSocketsServer().catch(error => {
      log('error join socket server', error)
      this.onSocketFailed()
    })

    this.avatarFreezeBoxes = new AvatarFreezeBoxes()

    this.createTheTourniquette()
    this.countDownBox = new CountDownBox(this.soundSystem)
    this.win = new Win()
    this.lose = new Lose()

    this.createGameText()
    this.listenSnowBallHit()
    new Tutorial(this.canvas)

  }

  createGameText() {

    this.gameMessage = new GameMessage(this.canvas)

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

  createTheTourniquette(){

    this.theTourniquette = new TheTourniquette(this.soundSystem, () => {

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

    movePlayerTo(this.gameSpots[userPosition].add(new Vector3(0, 6, 0) ), { x: -14 * 16 + 8, y: 18, z: -120 * 16 +8 })
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
}

const game = new Game()
engine.addSystem(game)

const bounds = new Vector4(3, 13, 5, 16)
engine.addSystem(new SnowSystem(bounds))

engine.addSystem(game.soundSystem);
