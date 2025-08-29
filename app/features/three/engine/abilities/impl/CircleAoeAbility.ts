import type { CollisionService } from '../../physics/CollisionService'
import type { DamageSystem } from '../../systems/DamageSystem'
import type { AbilityContext } from '../AbilityBase'
import { AbilityBase, AbilityState } from '../AbilityBase'
import type * as THREE from 'three'

export interface CircleAoeConfig {
  radius: number
  range: number
  delay: number
  damage: number
  recovery: number
}

/**
 * Area of effect ability damaging units in a circle after a delay.
 */
export class CircleAoeAbility extends AbilityBase {
  private delayRemaining = 0
  private target: THREE.Vector3 | null = null

  constructor(
    private readonly collision: CollisionService,
    private readonly damageSystem: DamageSystem,
    private readonly config: CircleAoeConfig,
  ) {
    super('circle-aoe', 'Circle AOE', 6, config.range, config.recovery)
  }

  override onCommit(context: AbilityContext): void {
    super.onCommit(context)
    if (this.state !== AbilityState.Casting)
      return
    this.delayRemaining = this.config.delay
    this.target = context.target.clone()
  }

  override onCancel(): void {
    super.onCancel()
    this.delayRemaining = 0
    this.target = null
  }

  override onUpdate(dt: number): void {
    super.onUpdate(dt)

    if (this.state !== AbilityState.Casting || !this.target)
      return

    this.delayRemaining -= dt
    if (this.delayRemaining > 0)
      return

    const entities = this.collision.queryCircle(this.target, this.config.radius)
    entities.forEach(e => e.health && this.damageSystem.damage(e.health, this.config.damage))
    this.state = AbilityState.Recovery
    const overflow = -this.delayRemaining
    this.delayRemaining = 0
    this.target = null
    if (overflow > 0) {
      this.cooldownRemaining += overflow
      super.onUpdate(overflow)
    }
  }
}
