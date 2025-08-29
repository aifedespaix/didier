import type { CollisionService } from '../../physics/CollisionService'
import type { DamageSystem } from '../../systems/DamageSystem'
import type { AbilityContext } from '../AbilityBase'
import { AbilityBase, AbilityState } from '../AbilityBase'

export interface CircleAoeConfig {
  radius: number
  range: number
  delay: number
  damage: number
}

/**
 * Area of effect ability damaging units in a circle after a delay.
 */
export class CircleAoeAbility extends AbilityBase {
  constructor(
    private readonly collision: CollisionService,
    private readonly damageSystem: DamageSystem,
    private readonly config: CircleAoeConfig,
  ) {
    super('circle-aoe', 'Circle AOE', 6, config.range)
  }

  override onCommit(context: AbilityContext): void {
    super.onCommit(context)
    setTimeout(() => {
      const entities = this.collision.queryCircle(context.target, this.config.radius)
      entities.forEach(e => e.health && this.damageSystem.damage(e.health, this.config.damage))
      this.state = AbilityState.Recovery
    }, this.config.delay * 1000)
  }
}
