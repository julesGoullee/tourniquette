const backgroundMusicClip = new AudioClip("sounds/background-music.mp3")
const gameMusicClip = new AudioClip("sounds/game-music.mp3")
const failGameClip = new AudioClip("sounds/failGame.mp3")
const startGameClip = new AudioClip("sounds/startGame.mp3")

class Sound extends Entity {
  constructor(source: AudioSource, transform: Transform = null) {
    super()
    engine.addEntity(this)
    this.addComponent(source)
    if(transform) {
      this.addComponent(transform)
    } else {
      this.setParent(Attachable.FIRST_PERSON_CAMERA)
    }
  }
}

export class SoundSystem implements ISystem {
  soundEntities: object;

  constructor() {
    this.soundEntities = {}
  }

  update() {}

  getOrCreateSound(name: string, audioClip: AudioClip, transform?: Transform) {
    if(!this.soundEntities[name]) {
      const source = new AudioSource(audioClip)
      this.soundEntities[name] = new Sound(source, transform)
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
  }

  gameMusic(playing: boolean = true) {
    const transform = new Transform({
      position: new Vector3(8, 8, 8),
    })
    const sound = this.getOrCreateSound('gameMusic', gameMusicClip, transform)
    const audioSource = sound.getComponent(AudioSource);
    audioSource.playing = playing
    audioSource.loop = true
    audioSource.volume = 0.5
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
    audioSource.playOnce()
  }

}
