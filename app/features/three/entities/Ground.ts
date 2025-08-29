import * as THREE from 'three'

/**
 * Creates the ground mesh and optional grid helper.
 * The ground is a large plane that receives shadows.
 */
export function createGround(size = 100): THREE.Group {
  const planeGeometry = new THREE.PlaneGeometry(size, size)
  const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 })
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.rotation.x = -Math.PI / 2
  plane.receiveShadow = true

  const grid = new THREE.GridHelper(size, size / 2, 0x000000, 0x000000)
  grid.material.transparent = true
  ;(grid.material as THREE.Material).opacity = 0.2

  const group = new THREE.Group()
  group.add(plane)
  group.add(grid)
  return group
}
