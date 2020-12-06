import {setTimeout} from "../utils";
import {TheTourniquette} from "../entities/theTourniquette";

// const camera = Camera.instance

const backgroundMusicClip = new AudioClip("sounds/welcome-music.mp3")
const meteoClip = new AudioClip("sounds/meteo.mp3")
const gameMusicClip = new AudioClip("sounds/game-music.mp3")
const failGameClip = new AudioClip("sounds/lose-game.mp3")
const startGameClip = new AudioClip("sounds/start-game.mp3")
const winGameClip = new AudioClip("sounds/win-game.mp3")
const endGameClip = new AudioClip("sounds/santa.mp3")
const playerFallClip = new AudioClip("sounds/massive-fall.mp3")
// const throwBallClip = new AudioClip("sounds/stub.mp3")

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

  backgroundMusic(playing: boolean = true) {
    const transform = new Transform({
      position: new Vector3(8, 4, 8),
    })
    const sound = this.getOrCreateSound('backgroundMusic', backgroundMusicClip, transform)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.playing = playing
    audioSource.loop = true
    audioSource.volume = 0.3

    const meteosound = this.getOrCreateSound('backgroundMeteo', meteoClip, transform)
    const meteoaudiosource = meteosound.getComponent(AudioSource);
    meteoaudiosource.playing = playing
    meteoaudiosource.loop = true
    meteoaudiosource.volume = 1
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

    setTimeout(() => {
      audioSource.playOnce()
    }, 1000)
  }
  failGame() {
    const transform = new Transform({
      position: new Vector3(8, 4, 8),
    })
    const sound = this.getOrCreateSound('failGame', failGameClip, transform)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.playOnce()
  }
  winGame() {
    const transform = new Transform({
      position: new Vector3(8, 8, 8),
    })
    const sound = this.getOrCreateSound('winGame', winGameClip, transform)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.playOnce()
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
    audioSource.playOnce()

    this.reverseTourniquetteCounter = (this.reverseTourniquetteCounter + 1) % 2
  }

  throwBall() {
    /*
    const transform = new Transform({
      position: camera.position,
      rotation: camera.rotation,
    })
    const sound = this.getOrCreateSound('throwBall', throwBallClip, transform)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.playOnce()

    this.reverseTourniquetteCounter = (this.reverseTourniquetteCounter + 1) % 2
    */
  }

}
