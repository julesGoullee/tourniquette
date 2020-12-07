import {TheTourniquette} from "../entities/theTourniquette";

const camera = Camera.instance

const backgroundMusicClip = new AudioClip("sounds/welcome-music.mp3")
const meteoClip = new AudioClip("sounds/meteo.mp3")
const gameMusicClip = new AudioClip("sounds/game-music.mp3")
const failGameClip = new AudioClip("sounds/lose-game.mp3")
const startGameClip = new AudioClip("sounds/start-game.mp3")
const winGameClip = new AudioClip("sounds/win-game.mp3")
const endGameClip = new AudioClip("sounds/santa.mp3")
const playerFallClip = new AudioClip("sounds/massive-fall.mp3")
const throwBallClip = new AudioClip("sounds/snowball-throw.mp3")
const splashBallClip = new AudioClip("sounds/snowball-splash.mp3")
const grelotsClip = new AudioClip("sounds/grelots.mp3")

const reverseTourniquetteClip1 = new AudioClip("sounds/reverse-tourniquette-A.mp3")
const reverseTourniquetteClip2 = new AudioClip("sounds/reverse-tourniquette-B.mp3")
const reverseTourniquetteClip3 = new AudioClip("sounds/reverse-tourniquette-C.mp3")
const reverseTourniquetteClip4 = new AudioClip("sounds/reverse-tourniquette-D.mp3")
const reverseTourniquetteClip5 = new AudioClip("sounds/reverse-tourniquette-E.mp3")
const reverseTourniquetteClips = [
  reverseTourniquetteClip1,
  reverseTourniquetteClip2,
  reverseTourniquetteClip3,
  reverseTourniquetteClip4,
  reverseTourniquetteClip5,
]

class Sound extends Entity {
  constructor(source: AudioSource, transform?: Transform, parentEntity?: Entity) {
    super()
    engine.addEntity(this)
    this.addComponent(source)
    if(transform) {
      this.addComponent(transform)
    } else if(parentEntity) {
      this.setParent(parentEntity)
    } else {
      this.setParent(Attachable.FIRST_PERSON_CAMERA)
    }
  }
}

export class SoundSystem implements ISystem {
  soundEntities: object;
  reverseTourniquetteCounter: number = 0

  constructor() {
    this.soundEntities = {}
  }

  update() {}

  getOrCreateSound(name: string, audioClip: AudioClip, transform?: Transform, parentEntity?: Entity) {
    if(!this.soundEntities[name]) {
      const source = new AudioSource(audioClip)
      this.soundEntities[name] = new Sound(source, transform, parentEntity)
    }
    return this.soundEntities[name]
  }

  placeSoundAtPlayer(name: string, audioClip: AudioClip) {
    const existingSound = this.soundEntities[name]
    if(this.soundEntities[name]) {
      existingSound.getComponent(AudioSource).playing = false
      engine.removeEntity(existingSound)
      this.soundEntities[name] = null
    }
    // We clone so that it doesnt follow the player. If we follow, the sound will be replayed each time the player re-enter the scene
    const transform = new Transform({
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
    })
    const source = new AudioSource(audioClip)
    this.soundEntities[name] = new Sound(source, transform)
    return this.soundEntities[name]
  }

  backgroundMusic(playing: boolean = true) {
    const transform = new Transform({
      position: new Vector3(8, 4, 8),
    })
    const sound = this.getOrCreateSound('backgroundMusic', backgroundMusicClip, transform)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.playing = playing
    audioSource.loop = true
    audioSource.volume = 0.4
  }

  backgroundMeteo(playing: boolean = true) {
    const transform = new Transform({
      position: new Vector3(8, 7, 8),
    })
    const meteosound = this.getOrCreateSound('backgroundMeteo', meteoClip, transform)
    const meteoaudiosource = meteosound.getComponent(AudioSource);
    meteoaudiosource.playing = playing
    meteoaudiosource.loop = true
    meteoaudiosource.volume = 0.3
  }

  gameMusic(playing: boolean = true) {
    const transform = new Transform({
      position: new Vector3(8, 8, 8),
    })
    const sound = this.getOrCreateSound('gameMusic', gameMusicClip, transform)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.playing = playing
    audioSource.loop = true
    audioSource.volume = 1
  }

  startGame() {
    const transform = new Transform({
      position: new Vector3(8, 8, 8),
    })
    const sound = this.getOrCreateSound('startGame', startGameClip, transform)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.playOnce()
  }
  failGame() {
    const transform = new Transform({
      position: new Vector3(8, 4, 8),
    })
    const sound = this.getOrCreateSound('failGame', failGameClip, transform)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.volume = 0.8
    audioSource.playOnce()
  }
  winGame() {
    const transform = new Transform({
      position: new Vector3(8, 8, 8),
    })
    const sound = this.getOrCreateSound('winGame', winGameClip, transform)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.playOnce()
    audioSource.volume = 0.8
  }
  endGame() {
    const transform = new Transform({
      position: new Vector3(8, 4, 8),
    })
    const sound = this.getOrCreateSound('endGame', endGameClip, transform)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.playOnce()
  }

  otherPlayerFall() {
    const transform = new Transform({
      position: new Vector3(8, 4, 8),
    })
    const sound = this.getOrCreateSound('playerFall', playerFallClip, transform)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.volume = 0.4
    audioSource.playOnce()
  }

  reverseTourniquette(tourniquette: TheTourniquette) {
    const sound = this.getOrCreateSound(
      `reverseTourniquette-${this.reverseTourniquetteCounter}`,
      reverseTourniquetteClips[this.reverseTourniquetteCounter],
      undefined,
      tourniquette
    )
    const audioSource = sound.getComponent(AudioSource);
    audioSource.volume = 0.4
    audioSource.playOnce()

    this.reverseTourniquetteCounter = (this.reverseTourniquetteCounter + 1) % 2
  }

  throwBall() {
    const sound = this.placeSoundAtPlayer('throwBall', throwBallClip)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.volume = 0.4
    audioSource.playOnce()
  }

  snowBallSplash() {
    const sound = this.placeSoundAtPlayer('splashBall', splashBallClip)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.volume = 0.2
    audioSource.playOnce()
  }

  grelots(parent: Entity) {
    const sound = this.getOrCreateSound('grelots', grelotsClip, null, parent)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.volume = 0.3
    audioSource.playing = true
    audioSource.loop = true
  }

}
