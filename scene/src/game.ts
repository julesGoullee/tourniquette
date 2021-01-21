import { Tourniquette } from '../metas/tourniquette/tourniquette'

const tourniquetteLandOwnerData = {
  host_data: `
  {
    "tourniquette": {
      "position": {"x":8, "y":0, "z":8},
      "rotation": {"x":0, "y":0, "z":0}
    }
  }`
}

engine.addSystem(new Tourniquette(null, tourniquetteLandOwnerData))
