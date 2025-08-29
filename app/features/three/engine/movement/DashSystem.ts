import * as THREE from 'three'

/**
 * Moves an object instantly along its forward vector by the given distance.
 */
export function dash(object: THREE.Object3D, distance: number): void {
  const forward = new THREE.Vector3()
  object.getWorldDirection(forward)
  object.position.add(forward.multiplyScalar(distance))
}
