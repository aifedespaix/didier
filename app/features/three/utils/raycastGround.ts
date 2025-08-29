import * as THREE from 'three'

/**
 * Computes the intersection point on the ground (y = `groundY`) from
 * normalized device coordinates.
 *
 * @param ndc - Pointer position in normalized device coordinates.
 * @param camera - Active camera.
 * @param groundY - Y position of the ground plane.
 */
export function raycastGround(
  ndc: THREE.Vector2,
  camera: THREE.Camera,
  groundY = 0,
): THREE.Vector3 | null {
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(ndc, camera)
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -groundY)
  const point = new THREE.Vector3()
  const hit = raycaster.ray.intersectPlane(plane, point)
  return hit ? point : null
}
