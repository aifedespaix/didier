import type { HealthComponent } from '../stats/HealthComponent'

export interface DamageEvent {
  amount: number
  target: HealthComponent
}

/**
 * Applies damage to health components and emits events.
 */
export class DamageSystem {
  public readonly events: DamageEvent[] = []

  damage(target: HealthComponent, amount: number): void {
    target.current = Math.max(0, target.current - amount)
    this.events.push({ amount, target })
  }
}
