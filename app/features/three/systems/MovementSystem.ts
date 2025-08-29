import type { PlayerState } from '../entities/Player'
import * as THREE from 'three'

/**
 * Advances the player towards its target at constant speed.
 * Stops when within `epsilon` distance from the target.
 */
export function updateMovement(player: PlayerState, dt: number): void {
  if (!player.target)
    return

  const position = player.mesh.position
  const toTarget = new THREE.Vector3().subVectors(player.target, position)
  const distance = toTarget.length()

  if (distance <= player.epsilon) {
    position.copy(player.target)
    player.target = null
    return
  }

  const step = player.speed * dt
  if (step >= distance) {
    position.copy(player.target)
    player.target = null
    return
  }

  toTarget.normalize().multiplyScalar(step)
  position.add(toTarget)
}
