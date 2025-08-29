import * as THREE from 'three'

export interface PlayerState {
  mesh: THREE.Mesh
  speed: number // units per second
  target: THREE.Vector3 | null
  epsilon: number
}

export function createPlayer(): PlayerState {
  const geometry = new THREE.BoxGeometry(0.8, 0.2, 1.2)
  const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(0, 0.1, 0)
  mesh.castShadow = true

  return {
    mesh,
    speed: 6,
    target: null,
    epsilon: 0.03,
  }
}

