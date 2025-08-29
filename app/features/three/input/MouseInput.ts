import type { PlayerState } from '../entities/Player'
import * as THREE from 'three'
import { raycastGround } from '../utils/raycastGround'

/**
 * Handles mouse inputs for right-click movement on the ground.
 */
export class MouseInput {
  private readonly dom: HTMLElement
  private readonly camera: THREE.Camera
  private readonly player: PlayerState
  private readonly marker: THREE.Mesh

  constructor(dom: HTMLElement, camera: THREE.Camera, player: PlayerState, scene: THREE.Scene) {
    this.dom = dom
    this.camera = camera
    this.player = player

    this.marker = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.3, 32),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.8 }),
    )
    this.marker.rotation.x = -Math.PI / 2
    this.marker.visible = false
    scene.add(this.marker)

    this.onContextMenu = this.onContextMenu.bind(this)
    this.onPointerDown = this.onPointerDown.bind(this)

    this.dom.addEventListener('contextmenu', this.onContextMenu)
    this.dom.addEventListener('pointerdown', this.onPointerDown)
  }

  private onContextMenu(event: Event) {
    event.preventDefault()
  }

  private onPointerDown(event: PointerEvent) {
    if (event.button !== 2)
      return

    const rect = this.dom.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    const point = raycastGround(ndc, this.camera)
    if (point) {
      this.player.target = point
      this.marker.position.copy(point)
      this.marker.visible = true
    }
  }

  update(_dt: number): void {
    // Placeholder for marker animation
  }

  dispose(): void {
    this.dom.removeEventListener('contextmenu', this.onContextMenu)
    this.dom.removeEventListener('pointerdown', this.onPointerDown)
    this.marker.parent?.remove(this.marker)
  }
}
