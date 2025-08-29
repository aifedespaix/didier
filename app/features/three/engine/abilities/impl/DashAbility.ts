import type * as THREE from 'three'
import type { AbilityContext } from '../AbilityBase'
import { dash } from '../../movement/DashSystem'
import { AbilityBase, AbilityState } from '../AbilityBase'

export interface DashConfig {
  distance: number
}

/**
 * Simple forward dash of the caster.
 */
export class DashAbility extends AbilityBase {
  constructor(private readonly caster: THREE.Object3D, private readonly config: DashConfig) {
    super('dash', 'Dash', 3, config.distance)
  }

  override onCommit(context: AbilityContext): void {
    super.onCommit(context)
    dash(this.caster, this.config.distance)
    this.state = AbilityState.Recovery
  }
}
