import * as THREE from 'three'

export interface CollisionEntity {
  position: THREE.Vector3
  radius: number
  object?: THREE.Object3D
  health?: { current: number, max: number }
}

/**
 * Very small collision helper to test intersections between simple shapes.
 */
export class CollisionService {
  constructor(private readonly entities: CollisionEntity[]) {}

  /** Returns entities intersecting the given circle. */
  public queryCircle(center: THREE.Vector3, radius: number): CollisionEntity[] {
    return this.entities.filter(e => e.position.distanceTo(center) <= (radius + e.radius))
  }

  /** Returns entities intersecting the given rectangle oriented along forward vector. */
  public queryRectangle(origin: THREE.Vector3, forward: THREE.Vector3, length: number, width: number): CollisionEntity[] {
    const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize()
    const halfWidth = width / 2

    return this.entities.filter((e) => {
      const local = new THREE.Vector3().subVectors(e.position, origin)
      const z = local.dot(forward)
      if (z < 0 || z > length)
        return false
      const x = local.dot(right)
      return Math.abs(x) <= halfWidth + e.radius
    })
  }
}
