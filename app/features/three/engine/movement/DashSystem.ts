import * as THREE from 'three'

/** Distance kept from a collision surface to avoid clipping. */
export const DASH_EPSILON = 0.001

/**
 * Moves an object instantly along its forward vector by the given distance.
 * The movement is raycast against the provided obstacles and clamped to the
 * first hit. When `slide` is true the remaining distance is projected on the
 * hit surface allowing soft collisions.
 *
 * @param object - Object to move.
 * @param distance - Desired travel distance.
 * @param obstacles - List of collidable objects.
 * @param slide - Whether to slide along the hit surface instead of stopping.
 */
export function dash(
  object: THREE.Object3D,
  distance: number,
  obstacles: THREE.Object3D[] = [],
  slide = false,
): void {
  const forward = new THREE.Vector3()
  object.getWorldDirection(forward)

  const raycaster = new THREE.Raycaster()
  raycaster.far = distance
  raycaster.set(object.position, forward)
  const hits = raycaster.intersectObjects(obstacles, false)

  if (hits.length > 0) {
    const hit = hits[0]!
    const travel = Math.max(0, hit.distance - DASH_EPSILON)

    if (slide && hit.face) {
      const normal = hit.face.normal
        .clone()
        .transformDirection(hit.object.matrixWorld)
        .normalize()
      const remaining = distance - hit.distance
      const slideDir = forward.clone().projectOnPlane(normal).normalize()
      object.position
        .addScaledVector(forward, travel)
        .addScaledVector(slideDir, remaining)
      return
    }

    object.position.addScaledVector(forward, travel)
    return
  }

  object.position.addScaledVector(forward, distance)
}
