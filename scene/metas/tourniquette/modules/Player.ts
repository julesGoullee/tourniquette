export interface PlayersData {
  id: string
  displayName: string
}

export class Player {

  fallenOut = false
  id: string
  displayName: string
  position: number

  constructor(id, displayName, position){

    this.id = id
    this.displayName = displayName
    this.position = position

  }

}
