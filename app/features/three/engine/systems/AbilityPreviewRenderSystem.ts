import * as THREE from 'three'

/**
 * Renders simple geometric previews for abilities.
 */
export class AbilityPreviewRenderSystem {
  private current: THREE.Object3D | null = null
  constructor(private readonly scene: THREE.Scene) {}

  clear(): void {
    if (this.current) {
      this.scene.remove(this.current)
      this.current = null
    }
  }

  showRectangle(length: number, width: number, position: THREE.Vector3, forward: THREE.Vector3): void {
    this.clear()
    const hw = width / 2
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, length),
      new THREE.Vector3(width, 0, length),
      new THREE.Vector3(width, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x00FF00 }))
    line.position.copy(position)
    line.rotation.y = Math.atan2(forward.x, forward.z)
    line.position.x -= hw
    this.scene.add(line)
    this.current = line
  }

  showCircle(radius: number, position: THREE.Vector3): void {
    this.clear()
    const shape = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI)
    const points = shape.getPoints(32).map(p => new THREE.Vector3(p.x, 0, p.y))
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: 0x00FF00 }))
    line.position.copy(position)
    this.scene.add(line)
    this.current = line
  }

  showArrow(length: number, position: THREE.Vector3, forward: THREE.Vector3): void {
    this.clear()
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, length),
    ]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x00FF00 }))
    line.position.copy(position)
    line.rotation.y = Math.atan2(forward.x, forward.z)
    this.scene.add(line)
    this.current = line
  }
}
