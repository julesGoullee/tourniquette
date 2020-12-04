//import * as ui from '../node_modules/@dcl/ui-utils/index'
import { getCurrentRealm } from '@decentraland/EnvironmentAPI'
import utils from '../node_modules/decentraland-ecs-utils/index'
import {Dialog, NPC} from '../node_modules/@dcl/npc-utils/index'
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
import { AvatarFreezeBox } from './entities/avatarFreezeBox'
// import { lutinSpeaks } from 'entities/dialog'
import { SnowSystem } from './modules/snow'
import { setTimeout, ITimeoutClean } from './utils'
import { SnowBallHit } from './entities/snowBallHit'
import { SnowBall } from './entities/snowBall'
// import { Kdo } from './entities/kdo'


class Game implements ISystem {

  webSocketUrl = 'ws://127.0.0.1:13370'
  timeoutReconnectWebSocket: ITimeoutClean | undefined
  socket: WebSocket
  userId: string
  camera: Camera = Camera.instance
  input = Input.instance
  canvas: UICanvas
  endGameText: UIText
  isPlaying = false
  fallenOut = false
  hitAllowed = false

  // physics
  world: CANNON.World
  fixedTimeStep = 1.0 / 60.0
  maxSubSteps = 3
  ballPhysicsMaterial: CANNON.Material
  groundBody: CANNON.Body
  forwardVector = Vector3.Forward().rotate(Camera.instance.rotation)
  vectorScale = 75

  gameSpots: Vector3[] = [
    new Vector3(3, 12, 8),
    new Vector3(8, 12, 3),
    new Vector3(13, 12, 8),
    new Vector3(8, 12, 13)
  ]

  // ground: Entity
  xmasBall: Entity
  pilones: Entity[] = []
  snowBalls: SnowBallHit[] = []
  theTourniquette: Entity
  theTourniquetteCollider: Entity
  teleporter: Entity
  // avatarHitbox: Entity
  // santa: Santa
  // kdo: Kdo

  constructor() {

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
    this.canvas = new UICanvas()
    this.listenSnowBallHit()
    // this.createKdo()
    // this.createLutin()
    // this.createAvatarHitbox()
  }

  // createKdo(){
  //
  //   const startPosition = new Vector3(8, 20, 15.5)
  //   this.kdo = new Kdo(new SphereShape(), new Transform({
  //     position: startPosition,
  //     scale: new Vector3(0.5, 0.5, 0.5)
  //   }) )
  //   this.kdo.addComponent(
  //     new OnPointerDown(
  //       (e) => {
  //
  //         log('clicked')
  //       }, {
  //         hoverText: 'Open',
  //         showFeedback: true,
  //         distance: 5
  //       })
  //   )
  //   this.kdo.addComponent(new utils.MoveTransformComponent(startPosition, new Vector3(startPosition.x, 2, startPosition.z), 10) )
  //
  // }

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

  listenSnowBallHit(){
    this.input.subscribe('BUTTON_DOWN', ActionButton.POINTER, false, (e) => {

      if(!this.userId || !this.camera){
        return false
      }
      const inputVector = this.forwardVector.clone()
      const position = this.camera.position.clone()
      const rotation = this.camera.rotation.clone()

      if(this.socket && this.socket.readyState === WebSocket.OPEN){

        this.socket.send(
          JSON.stringify({
            type: 'HIT_SNOW_BALL',
            data: {
              inputVector,
              position,
              rotation
            },
          })
        )

      }

      this.createBall(this.userId, new Transform({
        position,
        rotation,
        scale: new Vector3(0.1, 0.1, 0.1)
      }), inputVector)
    })

  }

  createPhysicsWorld(){

    this.world = new CANNON.World()
    this.world.allowSleep = true
    this.world.gravity.set(0, -9.82, 0) // m/s²
    // this.world.broadphase = new CANNON.NaiveBroadphase()
    // this.world.defaultContactMaterial.contactEquationStiffness = 1e8;
    // this.world.defaultContactMaterial.contactEquationRelaxation = 10;
    // this.world.quatNormalizeFast = true;
    // this.world.quatNormalizeSkip = 8;
    // this.world.solver.iterations = 10;

    const groundPhysicsMaterial = new CANNON.Material('groundMaterial')
    const groundPhysicsContactMaterial = new CANNON.ContactMaterial(
      groundPhysicsMaterial,
      groundPhysicsMaterial,
      {
        friction: 0.5,
        restitution: 0.33,
      }
    )
    this.world.addContactMaterial(groundPhysicsContactMaterial)

    this.groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: groundPhysicsMaterial
    })
    this.groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2) // Reorient ground plane to be in the y-axis
    this.world.addBody(this.groundBody)

    this.ballPhysicsMaterial = new CANNON.Material('ballMaterial')
    const ballPhysicsContactMaterial = new CANNON.ContactMaterial(
      this.groundBody.material,
      this.ballPhysicsMaterial,
      {
        friction: 0.9,
        restitution: 0.2,
      }
    )
    this.world.addContactMaterial(ballPhysicsContactMaterial)

  }

  createLutin(){

    let isEndDialog = false
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
          isEndDialog = true
          log('trigger by next')
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
      { position: new Vector3(6, 1, 15) },
      'models/lutin.glb',
      () => {
        if(!isEndDialog){
          lutin.talk(lutinSpeaks, 0)
          lutin.playAnimation('dancingJoy', false)
        }

      },
      {
        idleAnim : 'sadIdle',
        faceUser : true,
        portrait: { path: 'images/lutin.png', height: 256, width: 256 },
        darkUI: true,
        coolDownDuration: 3,
        hoverText: 'CHAT',
        onlyExternalTrigger: false,
        reactDistance: 5,
        continueOnWalkAway: false,
        onWalkAway: () => {
          log('walked away')
        },
      }
    )

  }

  playerFallOut(){

    log('playerFallOut')
    this.fallenOut = true

    if(this.socket && this.socket.readyState === WebSocket.OPEN) {

      this.socket.send(JSON.stringify({
        type: 'FALLEN_OUT',
        data: {}
      }) )

    }
  }

  update(dt: number): void {

    if (this.isPlaying && !this.fallenOut && (
      this.camera.position.y < 11 ||
      this.camera.position.x < 0 ||
      this.camera.position.x > 16 ||
      this.camera.position.z > 16 ||
      this.camera.position.z < 0
    )) {

      this.playerFallOut()

    }

    this.forwardVector = Vector3.Forward().rotate(Camera.instance.rotation)

    this.world.step(this.fixedTimeStep, dt, this.maxSubSteps)
    this.snowBalls.forEach((snowBall) => {

      const transform = snowBall.getComponent(Transform)

      if (!transform.position.equals(new Vector3(snowBall.body.position.x, snowBall.body.position.y, snowBall.body.position.z)) || !transform.rotation.equals(new Quaternion(snowBall.body.quaternion.x, snowBall.body.quaternion.y, snowBall.body.quaternion.z, snowBall.body.quaternion.w))) {

        transform.position.copyFrom(new Vector3(snowBall.body.position.x, snowBall.body.position.y, snowBall.body.position.z))
        transform.rotation.copyFrom(new Quaternion(snowBall.body.quaternion.x, snowBall.body.quaternion.y, snowBall.body.quaternion.z, snowBall.body.quaternion.w))

      }

    })
  }

  createBall(userId: string, transform: Transform, inputVector: Vector3){

    const ball = new SnowBall(new SphereShape(), transform, this.world, userId, this.ballPhysicsMaterial)

    ball.body.wakeUp()
    ball.body.applyImpulse(
      new CANNON.Vec3(
        inputVector.x * this.vectorScale,
        inputVector.y * this.vectorScale,
        inputVector.z * this.vectorScale
      ),
      new CANNON.Vec3(
        ball.body.position.x,
        ball.body.position.y,
        ball.body.position.z
      )
    )

    this.snowBalls.forEach(otherBall => {

      const snowBallPhysicsContactMaterial = new CANNON.ContactMaterial(
        otherBall.body.material,
        ball.body.material,
        {
          friction: 0.4,
          restitution: 0.75,
        }
      )
      this.world.addContactMaterial(snowBallPhysicsContactMaterial)

    })

    ball.addComponent(new utils.Delay(4000, () => {

      this.world.removeBody(ball.body)
      engine.removeEntity(ball)
      this.snowBalls = this.snowBalls.filter(oneSnowBall => oneSnowBall !== ball)

    }) )

    if(this.userId !== userId){

      ball.addComponent(
        new utils.TriggerComponent(
          new utils.TriggerBoxShape(new Vector3(0.2, 0.2, 0.2), Vector3.Zero() ),
          null, null, null, null,
          () => {
            log('enter')
            const position = ball.getComponent(Transform).position.clone().subtract(new Vector3(0, 1, 0))
            const rotation = ball.getComponent(Transform).rotation.clone().subtract(Quaternion.Euler(0, -45, 0) )
            const snowHit = new SnowBallHit(new BoxShape(), new Transform({
              position,
              rotation,
              scale: new Vector3(0.5, 1, 0.1)
            }))
            snowHit.addComponent(new utils.MoveTransformComponent(position, this.camera.position, 1) )
            snowHit.addComponent(new utils.Delay(1000, () => {
              engine.removeEntity(snowHit)
            }) )

          },
          () => {}, false
        )
      )

    }

    this.snowBalls.push(ball)

    log('Fire snow ball')
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
      position: new Vector3(8, 13, 8),
      scale: new Vector3(14, 0.5, 0.04),
      rotation: Quaternion.Euler(0,45,0)
    }) )
    const onPointerDown = new OnPointerDown(
      (e) => {

        if(this.isPlaying && !this.fallenOut && this.hitAllowed){

          onPointerDown.hoverText = ''
          onPointerDown.showFeedback = false
          this.hitAllowed = false
          setTimeout(() => {

            this.hitAllowed = true
            onPointerDown.hoverText = 'Hit'
            onPointerDown.showFeedback = true

          }, 2 * 1000)
          log('theTourniquetteCollider clicked')
          if(this.socket && this.socket.readyState === WebSocket.OPEN) {

            this.socket.send(JSON.stringify({
              type: 'HIT',
              data: {}
            }) )

          }
        }
      }, {
        hoverText: 'Hit',
        showFeedback: true,
        distance: 4
      })
    this.theTourniquetteCollider.addComponent(onPointerDown)
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

          if(this.socket && this.socket.readyState === WebSocket.OPEN) {

            this.socket.send(JSON.stringify({
              type: 'START',
              data: {}
            }))
          }

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

  start(playersId: [string]){

    if(this.endGameText){
      this.endGameText.value = ''
    }
    this.hitAllowed = false
    const userPosition = playersId.indexOf(this.userId as never)
    this.theTourniquette.getComponent(Transform).rotation = Quaternion.Euler(0,45,0)
    if(this.theTourniquette.hasComponent(utils.KeepRotatingComponent) ){

      this.theTourniquette.getComponent(utils.KeepRotatingComponent).stop()

    }

    if(userPosition === -1){

      log('User not playing')
      return false

    }

    movePlayerTo(this.gameSpots[userPosition].add(new Vector3(0, 6, 0) ), { x: 8, y: 15, z: 8 })
    // movePlayerTo(new Vector3(8, 20, 8), { x: 8, y: 11, z: 8 })

    const avatarFreezeBox1 = new AvatarFreezeBox(new BoxShape(), new Transform({
      position: this.gameSpots[userPosition].add(new Vector3(1, 5, 0) ),
      scale: new Vector3(1, 10, 2)
    }) )
    const avatarFreezeBox2 = new AvatarFreezeBox(new BoxShape(), new Transform({
      position: this.gameSpots[userPosition].add(new Vector3(-1, 5, 0) ),
      scale: new Vector3(1, 10, 2)
    }) )
    const avatarFreezeBox3 = new AvatarFreezeBox(new BoxShape(), new Transform({
      position: this.gameSpots[userPosition].add(new Vector3(0, 5, 1) ),
      scale: new Vector3(2, 10, 1)
    }) )
    const avatarFreezeBox4 = new AvatarFreezeBox(new BoxShape(), new Transform({
      position: this.gameSpots[userPosition].add(new Vector3(0, 5, -1) ),
      scale: new Vector3(2, 10, 1)
    }) )
    this.theTourniquette.addComponent(new utils.Delay(2000, () => {
      engine.removeEntity(avatarFreezeBox1)
      engine.removeEntity(avatarFreezeBox2)
      engine.removeEntity(avatarFreezeBox3)
      engine.removeEntity(avatarFreezeBox4)
      // this.theTourniquette.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, 100, 0) ) )
      // this.theTourniquetteCollider.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, 100, 0) ) )
      this.isPlaying = true
      this.fallenOut = false
      this.hitAllowed = true
    }) )

  }

  endGame(userWinner: string){

    if(this.theTourniquette.hasComponent(utils.KeepRotatingComponent) ){

      this.theTourniquette.getComponent(utils.KeepRotatingComponent).stop()
      this.theTourniquette.getComponent(Transform).rotation = Quaternion.Euler(0,45,0)

    }

    if(this.theTourniquetteCollider.hasComponent(utils.KeepRotatingComponent) ){

      this.theTourniquetteCollider.getComponent(utils.KeepRotatingComponent).stop()
      this.theTourniquetteCollider.getComponent(Transform).rotation = Quaternion.Euler(0,45,0)

    }

    if(this.isPlaying){

      if(!this.endGameText){

        this.endGameText = new UIText(this.canvas)
        this.endGameText.font = new Font(Fonts.SanFrancisco)
        this.endGameText.fontSize = 30
        this.endGameText.vAlign = 'top'
        this.endGameText.hAlign = 'center'

      }
      this.hitAllowed = false
      this.isPlaying = false
      this.fallenOut = false
      if(userWinner === this.userId){

        this.endGameText.value = 'Congrats, You win'

      } else {

        this.endGameText.value = 'You lose'

      }

    }

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

      if(this.socket && this.socket.readyState === WebSocket.OPEN){

        this.socket.send(JSON.stringify({
          type: 'USER_ID',
          data: {
            userId: this.userId
          }
        }) )

      }

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
      log('WebSocket: message', parsed)

      switch (parsed.type){
        case 'PING': {

          if(this.socket && this.socket.readyState === WebSocket.OPEN) {

            this.socket.send(JSON.stringify({
              type: 'PONG',
              data: {
                time: Date.now()
              }
            }))

          }
          break
        }
        case 'START': {
          this.start(parsed.data.playersId)
          break
        }
        case 'END_GAME': {
          this.endGame(parsed.data.userWinner)
          break
        }
        case 'FALLEN_OUT': {
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

          const rotation = parsed.data.sign === '+' ? 100 : -100
          this.theTourniquette.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, rotation, 0) ) )
          this.theTourniquetteCollider.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0, rotation, 0) ) )

          break
        }
      }

    }

  }

  onSocketFailed(){

    if(this.teleporter){
      this.teleporter.getComponent(OnPointerDown).hoverText = 'Connection failed, try later'
    }

    if(!this.timeoutReconnectWebSocket) {

      this.timeoutReconnectWebSocket = setTimeout(() => {

        log('retry join socket server', error)
        this.joinSocketsServer()
          .then(() => {
            log('socker server reconnected')
            this.timeoutReconnectWebSocket = null
            this.teleporter.getComponent(OnPointerDown).hoverText = 'Start'
          })
          .catch(error => {
            log('error join socket server', error)
            this.timeoutReconnectWebSocket = null
            this.onSocketFailed()
          })

      }, 5000)
    }
  }
}

const game = new Game()
engine.addSystem(game)

const bounds = new Vector4(3, 13, 5, 16)
engine.addSystem(new SnowSystem(bounds))
