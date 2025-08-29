import type { Hero } from '../hero/Hero'
import { AbilityState } from '../abilities/AbilityBase'

/**
 * Updates abilities every frame to handle recovery and cooldown timers.
 */
export class CastingSystem {
  constructor(private readonly hero: Hero) {}

  update(dt: number): void {
    for (const key of Object.keys(this.hero.slots) as (keyof typeof this.hero.slots)[]) {
      const ability = this.hero.getAbility(key)
      if (ability && (ability.state !== AbilityState.Idle || ability.cooldownRemaining > 0))
        ability.onUpdate(dt)
    }
  }
}
