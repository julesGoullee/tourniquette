import * as WebSocket from 'ws'

const CONFIG = {
  PORT: parseInt(process.env.PORT || '13370', 10),
  MAX_PLAYERS_COUNT: parseInt(process.env.MAX_PLAYERS_COUNT || '4', 10),
}

interface Position {
  x: number
  y: number
  z: number
}

class User {

  static Users: User[] = []

  ws: WebSocket
  room: Room
  id?: string
  displayName?: string
  isPlaying = false
  hitTourniquetteAllowed = false
  hitSnowBallAllowed = true
  fallenOut = false
  intervalAlive?: NodeJS.Timeout
  wsIsAlive = true
  position: Position = { x: -1, y: -1, z: -1 }

  constructor(ws: WebSocket, room: Room){

    this.ws = ws
    this.room = room

  }

  isOutsideParcel() {

    return this.position.x < 0 ||
      this.position.x > 16 ||
      this.position.z > 16 ||
      this.position.z < 0

  }

  onTick(data: any){

    this.wsIsAlive = true
    if(data.position.x && data.position.y && data.position.z){
      this.position = data.position
    }

    if(this.isPlaying && !this.fallenOut && this.isOutsideParcel() ){

      console.info(`User: on tick user outside ${this.id}`)

      this.room.userFallOut(this)

    }

  }

  listen(){

    console.log('WebSocket: client open')
    this.wsIsAlive = true

    this.ws.send(JSON.stringify({
      type: 'HELLO',
      data: {
        isPlaying: this.room.isPlaying,
        players: this.room.users.filter(oneUser => oneUser.isPlaying).map(oneUser => {
          return { id: oneUser.id, displayName: oneUser.displayName }
        })
      }
    }) )

    this.intervalAlive = setInterval( () =>{

      if(this.ws.readyState === WebSocket.OPEN && this.wsIsAlive){

        this.ws.send(JSON.stringify({
          type: 'PING',
          data: {
            time: Date.now(),
          }
        }) )

      } else {

        console.warn('WebSocket: connection dead', this.id)
        this.ws.close()
        this.disconnect()

      }

      this.wsIsAlive = false

    }, 2 * 1000);

    this.ws.on('message', (data) => {

      const parsed = JSON.parse(data.toString() )

      if(!['PONG', 'HIT_SNOW_BALL'].includes(parsed.type) ){

        console.info('WebSocket: client message', { userId: this.id }, parsed)

      }

      switch (parsed.type){

        case 'PONG':

          this.onTick(parsed.data)
          break

        case 'USER_ID':

          if(User.Users.find(user => user.id === parsed.data.userId) ){

            console.info('WebSocket: user already join, close the connection', parsed)
            this.ws.close(0, 'User already joined')

          }

          if(!this.id){

            this.id = parsed.data.userId
            this.displayName = parsed.data.displayName

          }

          this.room.playerReady(this)

          break

        case 'START':

          this.room.start(this)
          break

        case 'FALLEN_OUT':

          this.room.userFallOut(this)
          break

        case 'HIT':

          this.room.hit(this)
          break

        case 'HIT_SNOW_BALL':
          this.room.hitSnowBall(this, parsed.data)
          break
      }

    })

    this.ws.once('error', (error) => {

      console.error(`WebSocket: client error ${this.id}`, error)
      this.disconnect()

    })

    this.ws.once('close', () => {

      console.log(`WebSocket: client close ${this.id}`)
      this.disconnect()

    })

    this.ws.once('unexpected-response', () => {

      console.log(`WebSocket: client unexpected response ${this.id}`)
      this.disconnect()
    })

  }

  disconnect(){

    if(this.intervalAlive){

      clearInterval(this.intervalAlive)

    }

    this.position = { x: -1, y: -1, z: -1 }
    this.room.removeUser(this)

  }

}

class Room {

  static Rooms: Room[] = []

  id: string
  users: User[] = []
  queueUsersReady: User[] = []
  isPlaying = false
  timeoutChangeDirection: NodeJS.Timeout | undefined
  currentDirection = '+'

  constructor(id: string){

    this.id = id

  }

  static getRoom(roomId: string){

    const room = this.Rooms.find(room => room.id === roomId)

    if(!room){

      const newRoom = new Room(roomId)
      console.log(`Room: ${newRoom.id} create`)
      this.Rooms.push(newRoom)
      return newRoom

    } else {

      return room

    }

  }

  addUser(user: User){

    this.users.push(user)

  }

  removeUser(user: User){

    if(!this.users.find(oneUser => oneUser === user) ){

      console.error(`Room: error removedUser, cannot find user ${user.id}`)

    }

    this.users = this.users.filter(oneUser => oneUser !== user)
    this.queueUsersReady = this.queueUsersReady.filter(oneUser => oneUser !== user)

    if(this.users.length === 0){

      console.info(`Room: ${this.id} all users left`)
      Room.Rooms = Room.Rooms.filter(room => room !== this)

    } else if(this.isPlaying && user.isPlaying && !user.fallenOut){

      user.fallenOut = true
      user.isPlaying = false

      this.users.forEach(oneUser => {

        if(oneUser.ws.readyState === WebSocket.OPEN && oneUser.id){

          oneUser.ws.send(JSON.stringify({
            type: 'FALLEN_OUT',
            data: {
              userId: user.id
            }
          }) )

        }

      })

      if(this.users.filter(oneUser => oneUser.isPlaying && !oneUser.fallenOut).length >= 1){

        this.endGame()

      }

    }

  }

  start(userInit: User){

    if(this.isPlaying){

      console.error(`Room: cannot start already playing`)

      return false

    }

    if(this.queueUsersReady.filter(user => !user.isOutsideParcel() || user === userInit).length === 0){

      console.error(`Room: cannot start queue empty`)

      return false

    }

    this.isPlaying = true
    this.currentDirection = '+'
    const usersPlaying = this.queueUsersReady.filter(user => !user.isOutsideParcel() || user === userInit).splice( 0, CONFIG.MAX_PLAYERS_COUNT + 1)

    usersPlaying.forEach(oneUser => {
      oneUser.isPlaying = true
      oneUser.hitTourniquetteAllowed = true
    })

    const players = this.users.filter(oneUser => oneUser.isPlaying).map(oneUser => {
      return { id: oneUser.id, displayName: oneUser.displayName }
    })
    console.log('Start game', { players: players.map(player => player.id ) })

    this.users.forEach( (oneUser: User) => {

      if(oneUser.ws.readyState === WebSocket.OPEN){

        oneUser.ws.send(JSON.stringify({
          type: 'START',
          data: { players }
        }) )

      }

    })

  }

  playerReady(user: User){

    if(!user.isPlaying && !this.queueUsersReady.find(oneUser => oneUser === user) ){

      console.info(`Room: ${user.id} ready`)
      this.queueUsersReady.push(user)

    }

  }

  endGame(){

    this.isPlaying = false

    if(this.timeoutChangeDirection){

      clearTimeout(this.timeoutChangeDirection)

    }

    const userWinner = this.users.filter(oneUser => oneUser.isPlaying && !oneUser.fallenOut)

    if(userWinner.length > 1){

      console.log(`Room: endGame error more than one winner ${userWinner}`)

    } else if(userWinner.length === 0){

      console.log(`Room: endGame nobody left`)

    } else {

      console.log(`Room: endGame winner ${userWinner[0].id}`)

    }

    this.users.forEach(oneUser => {

      if(oneUser.isPlaying){

        oneUser.isPlaying = false
        oneUser.fallenOut = false
        oneUser.hitTourniquetteAllowed = false
        this.queueUsersReady.push(oneUser)

      }

    })

    this.users.forEach(oneUser => {

      if(oneUser.ws.readyState === WebSocket.OPEN && oneUser.id){

        oneUser.ws.send(JSON.stringify({
          type: 'END_GAME',
          data: {
            userWinner: userWinner.length > 0 ? userWinner[0].id : null
          }
        }) )

      }

    })

  }

  userFallOut(user: User){

    if(!this.isPlaying || !user.isPlaying){

      console.log(`Room: userFallOut error not playing ${user.id}`)
      return false

    }

    user.fallenOut = true
    user.hitTourniquetteAllowed = false

    this.users.forEach( (oneUser: User) => {

      if(oneUser.ws.readyState === WebSocket.OPEN){

        oneUser.ws.send(JSON.stringify({
          type: 'FALLEN_OUT',
          data: {
            playerId: user.id
          }
        }) )

      }

    })

    if(this.users.filter(oneUser => oneUser.isPlaying && !oneUser.fallenOut).length <= 1 ){

      this.endGame()

    }

  }

  hit(user: User){

    if(!this.isPlaying || !user.isPlaying){

      console.log(`Room: user hit error not playing ${user.id}`)
      return false

    }
    if(!user.hitTourniquetteAllowed){

      console.log(`Room: user hit tourniquette not allowed ${user.id}`)
      return false

    }

    const sign = this.currentDirection === '+' ? '-' : '+'
    this.currentDirection = sign
    user.hitTourniquetteAllowed = false

    setTimeout( () => {

      user.hitTourniquetteAllowed = true

    }, 2 * 1000)

    console.log(`Room: user hit tourniquette ${user.id}`)

    this.users.forEach( (oneUser: User) => {

      if(oneUser.ws.readyState === WebSocket.OPEN){

        oneUser.ws.send(JSON.stringify({
          type: 'CHANGE_DIRECTION',
          data: { sign }
        }) )

      }

    })

  }

  hitSnowBall(user: User, data: any){

    if(!user.hitSnowBallAllowed){
      console.log(`Room: user hit snow ball not allowed ${user.id}`)

      return false

    }

    user.hitSnowBallAllowed = false

    setTimeout(() => {

      user.hitSnowBallAllowed = true

    }, 1000)

    this.users.forEach( (oneUser: User) => {

      if(oneUser.ws.readyState === WebSocket.OPEN && oneUser !== user){

        oneUser.ws.send(JSON.stringify({
          type: 'HIT_SNOW_BALL',
          data: Object.assign(data, { userId: user.id })
        }) )

      }

    })

  }

}

const webSocketServer = new WebSocket.Server({
  port: CONFIG.PORT,
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    serverMaxWindowBits: 10, // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10, // Limits zlib concurrency for perf.
    threshold: 1024 // Size (in bytes) below which messages
    // should not be compressed.
  }
})

webSocketServer.on('connection', (clientWs: WebSocket, request) => {

  console.log('WebSocket: new connection')
  const room: Room = Room.getRoom(request.url || '')
  const user: User = new User(clientWs, room)
  room.addUser(user)
  user.listen()

})

webSocketServer.once('listening', () => {

  console.log(`Listening on port ${CONFIG.PORT}`)

})
