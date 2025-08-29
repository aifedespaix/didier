import * as THREE from 'three'

export interface Lights {
  ambient: THREE.AmbientLight
  directional: THREE.DirectionalLight
}

/**
 * Creates ambient and directional lights with shadows enabled.
 */
export function createLights(): Lights {
  const ambient = new THREE.AmbientLight(0xFFFFFF, 0.4)

  const directional = new THREE.DirectionalLight(0xFFFFFF, 0.8)
  directional.position.set(5, 10, 5)
  directional.castShadow = true
  directional.shadow.mapSize.set(1024, 1024)
  directional.shadow.camera.near = 1
  directional.shadow.camera.far = 50
  directional.shadow.camera.left = -20
  directional.shadow.camera.right = 20
  directional.shadow.camera.top = 20
  directional.shadow.camera.bottom = -20

  return { ambient, directional }
}
