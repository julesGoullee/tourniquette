import * as WebSocket from 'ws'

const CONFIG = {
  PORT: parseInt(process.env.PORT || '13370', 10),
  PLAYERS_COUNT: parseInt(process.env.PLAYERS_COUNT || '2', 10),
}

class User {

  static Users: User[] = []

  ws: WebSocket
  room: Room
  id?: string
  winnerId?: string
  isPlaying = false
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

      console.info('WebSocket: client message', parsed)

      switch (parsed.type){

        case 'PONG':
          this.wsIsAlive = true
          break

        case 'USER_ID':

          if(!this.id){

            this.id = parsed.data.userId
          }

          break

        case 'PLAYER_READY':

          this.room.playerReady(this)
          break

        case 'END_GAME':

          this.winnerId = parsed.data.userId
          this.room.userEndGame(this)
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
            type: 'USER_LEFT',
            data: {
              userId: user.id
            }
          }) )

        }

      })

      if(this.users.filter(oneUser => oneUser.isPlaying).length < 2){

        this.endGame()

      }

    }

  }

  start(){

    const usersPlaying = this.queueUsersReady.splice( 0, CONFIG.PLAYERS_COUNT)

    usersPlaying.forEach(oneUser => {
      oneUser.isPlaying = true
    })

    this.users.forEach( (otherUser: User) => {

      if(otherUser.ws.readyState === WebSocket.OPEN){

        otherUser.ws.send(JSON.stringify({
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

    if(!this.isPlaying && this.queueUsersReady.length >= CONFIG.PLAYERS_COUNT){

      this.start()

    } else {

      user.ws.send(JSON.stringify({
        type: 'TRAINING',
        data: {}
      }) )

    }

  }

  endGame(){

    const userKnowWinner = this.users.filter(oneUser => oneUser.isPlaying && oneUser.winnerId)
    console.log(`Room: endGame winner ${userKnowWinner.length > 0 && userKnowWinner[0].winnerId}`)

    this.isPlaying = false
    this.users.forEach(oneUser => {

      oneUser.isPlaying = false
      delete oneUser.winnerId

    })

    setTimeout( () => {

      if(this.queueUsersReady.length >= CONFIG.PLAYERS_COUNT){

        this.start()

      }

    }, 1000)

  }

  userEndGame(user: User){

    if(!this.users.find(oneUser => oneUser.isPlaying && !oneUser.winnerId) ){

      if(this.users.find(oneUser => oneUser.isPlaying && oneUser.winnerId !== user.winnerId) ){

        console.log('Room: userEndGame mismatch winner')

      } else {

        this.endGame()

      }

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
