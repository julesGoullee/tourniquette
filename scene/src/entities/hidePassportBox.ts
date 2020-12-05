export class HidePassportBox extends Entity {

  constructor(transform: Transform, box: Vector3 ) {

    super()
    // this.addComponent(new BoxShape() )
    this.addComponent(
      new AvatarModifierArea({
        area: { box },
        modifiers: [AvatarModifiers.DISABLE_PASSPORTS],
      })
    )
    this.addComponent(transform)
    engine.addEntity(this)
  }

}
