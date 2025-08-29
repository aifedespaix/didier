import type { Hero } from '../hero/Hero'

/**
 * Updates active abilities every frame.
 */
export class CastingSystem {
  constructor(private readonly hero: Hero) {}

  update(dt: number): void {
    for (const key of Object.keys(this.hero.slots) as (keyof typeof this.hero.slots)[]) {
      const ability = this.hero.getAbility(key)
      ability?.onUpdate(dt)
    }
  }
}
