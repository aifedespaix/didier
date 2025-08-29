import * as THREE from 'three'

/**
 * Smoothly follows the target by interpolating the camera position
 * towards the desired offset from the target.
 */
export function updateCameraFollow(
  camera: THREE.Camera,
  target: THREE.Object3D,
  dt: number,
  offset = new THREE.Vector3(0, 10, 10),
  smooth = 5,
): void {
  const desired = new THREE.Vector3().copy(target.position).add(offset)
  const lerpAlpha = 1 - Math.exp(-smooth * dt)
  camera.position.lerp(desired, lerpAlpha)
  camera.lookAt(target.position)
}
