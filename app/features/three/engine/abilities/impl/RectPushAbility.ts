import type { CollisionEntity, CollisionService } from '../../physics/CollisionService'
import type { DamageSystem } from '../../systems/DamageSystem'
import type { AbilityContext } from '../AbilityBase'
import * as THREE from 'three'
import { AbilityBase, AbilityState } from '../AbilityBase'

export interface RectPushConfig {
  width: number
  length: number
  damage: number
  knockbackNear: number
  knockbackFar: number
  recovery: number
}

/**
 * Pushes targets in front of the caster within a rectangle.
 */
export class RectPushAbility extends AbilityBase {
  constructor(
    private readonly caster: THREE.Object3D,
    private readonly collision: CollisionService,
    private readonly damageSystem: DamageSystem,
    private readonly config: RectPushConfig,
  ) {
    super('rect-push', 'Rect Push', 4, config.length, config.recovery)
  }

  override onCommit(context: AbilityContext): void {
    super.onCommit(context)
    if (this.state !== AbilityState.Casting)
      return
    const forward = new THREE.Vector3().subVectors(context.target, context.origin).normalize()
    const entities = this.collision.queryRectangle(context.origin, forward, this.config.length, this.config.width)
    entities.forEach(e => this.applyEffect(e, context.origin))
    this.state = AbilityState.Recovery
  }

  private applyEffect(target: CollisionEntity, origin: THREE.Vector3): void {
    const distance = target.position.distanceTo(origin)
    const t = THREE.MathUtils.clamp(distance / this.config.length, 0, 1)
    const knock = THREE.MathUtils.lerp(this.config.knockbackNear, this.config.knockbackFar, t)
    if (target.object) {
      const dir = new THREE.Vector3().subVectors(target.position, origin).setY(0).normalize()
      target.object.position.add(dir.multiplyScalar(knock))
    }
    if (target.health)
      this.damageSystem.damage(target.health, this.config.damage)
  }
}
