import { Tourniquette } from '../metas/tourniquette/tourniquette'

const tourniquetteLandOwnerData = {
  host_data: `
  {
    "cube": {
      "position": {"x":10, "y":1, "z":10},
      "rotation": {"x":0, "y":0, "z":0},
      "scale": {"x":2, "y":2, "z":2}
    }
  }`
}

engine.addSystem(new Tourniquette(null, tourniquetteLandOwnerData))
