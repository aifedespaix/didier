import type { HealthComponent } from '../stats/HealthComponent'

export interface DamageEvent {
  type: 'damage'
  amount: number
  target: HealthComponent
}

export interface DeathEvent {
  type: 'death'
  target: HealthComponent
  timestamp: number
}

export type DamageSystemEvent = DamageEvent | DeathEvent

/**
 * Applies damage to health components and emits events.
 */
export class DamageSystem {
  public readonly events: DamageSystemEvent[] = []

  damage(target: HealthComponent, amount: number): void {
    target.current = Math.max(0, target.current - amount)
    this.events.push({ type: 'damage', amount, target })
    if (target.current <= 0 && !target.isDead) {
      target.isDead = true
      const timestamp = Date.now()
      target.deathTimestamp = timestamp
      this.events.push({ type: 'death', target, timestamp })
    }
  }
}
