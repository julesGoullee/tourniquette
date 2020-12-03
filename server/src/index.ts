import * as WebSocket from 'ws'

const CONFIG = {
  PORT: parseInt(process.env.PORT || '13370', 10),
  MAX_PLAYERS_COUNT: parseInt(process.env.MAX_PLAYERS_COUNT || '4', 10),
}

class User {

  static Users: User[] = []

  ws: WebSocket
  room: Room
  id?: string
  isPlaying = false
  fallenOut = false
  intervalAlive?: NodeJS.Timeout
  wsIsAlive = true

  constructor(ws: WebSocket, room: Room){

    this.ws = ws
    this.room = room

  }

  listen(){

    console.log('WebSocket: client open')
    this.wsIsAlive = true

    this.intervalAlive = setInterval( () =>{

      if(this.ws.readyState === WebSocket.OPEN && this.wsIsAlive){

        this.ws.send(JSON.stringify({
          type: 'PING',
          data: {
            time: Date.now()
          }
        }) )

      } else {

        console.warn('WebSocket: connection dead', this.id)
        this.disconnect()

      }

      this.wsIsAlive = false

    }, 5 * 1000);

    this.ws.on('message', (data) => {

      const parsed = JSON.parse(data.toString() )

      console.info('WebSocket: client message', { userId: this.id }, parsed)

      switch (parsed.type){

        case 'PONG':
          this.wsIsAlive = true
          break

        case 'USER_ID':

          if(User.Users.find(user => user.id === parsed.data.userId) ){

            console.info('WebSocket: user already join, close the connection', parsed)
            this.ws.close(0, 'User already joined')

          }

          if(!this.id){

            this.id = parsed.data.userId

          }

          this.room.playerReady(this)

          break

        case 'START':

          this.room.start()
          break

        case 'FALLEN_OUT':

          this.room.userFallOut(this)
          break

      }

    })

    this.ws.once('error', (error) => {

      console.error('WebSocket: client error', error)
      this.disconnect()

    })

    this.ws.once('close', () => {

      console.log('WebSocket: client close')
      this.disconnect()

    })

    this.ws.once('unexpected-response', () => {

      console.log('WebSocket: client unexpected response')
      this.disconnect()
    })

  }

  disconnect(){

    if(this.intervalAlive){

      clearInterval(this.intervalAlive)

    }

    this.room.removeUser(this)

  }

}

class Room {

  static Rooms: Room[] = []

  id: string
  users: User[] = []
  queueUsersReady: User[] = []
  isPlaying = false

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

    this.users = this.users.filter(oneUser => oneUser !== user)
    this.queueUsersReady = this.queueUsersReady.filter(oneUser => oneUser !== user)

    if(this.users.length === 0){

      console.info(`Room: ${this.id} all users left`)
      Room.Rooms = Room.Rooms.filter(room => room !== this)

    } else {

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

  start(){

    if(this.isPlaying){

      console.error(`Room: cannot start already playing`)

      return false

    }

    if(this.queueUsersReady.length === 0){

      console.error(`Room: cannot start queue empty`)

      return false

    }

    this.isPlaying = true
    const usersPlaying = this.queueUsersReady.splice( 0, CONFIG.MAX_PLAYERS_COUNT + 1)

    usersPlaying.forEach(oneUser => {
      oneUser.isPlaying = true
    })

    this.users.forEach( (oneUser: User) => {

      if(oneUser.ws.readyState === WebSocket.OPEN){

        oneUser.ws.send(JSON.stringify({
          type: 'START',
          data: {
            playersId: this.users.filter(oneUser => oneUser.isPlaying).map(oneUser => oneUser.id)
          }
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

    const userWinner = this.users.filter(oneUser => oneUser.isPlaying && !oneUser.fallenOut)

    if(userWinner.length > 1){

      console.log(`Room: endGame error more than one winner ${userWinner}`)

    } else if(userWinner.length === 0){

      console.log(`Room: endGame nobody left`)

    } else {

      console.log(`Room: endGame winner ${userWinner[0].id}`)

    }

    this.isPlaying = false
    this.users.forEach(oneUser => {

      if(oneUser.isPlaying){

        oneUser.isPlaying = false
        oneUser.fallenOut = false
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

    user.fallenOut = true

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
