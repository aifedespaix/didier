/**
 * Health value attached to an entity.
 */
export interface HealthComponent {
  current: number
  max: number
  /** Whether the entity has been marked as dead. */
  isDead: boolean
  /** Timestamp of death in milliseconds since epoch. */
  deathTimestamp?: number
}
