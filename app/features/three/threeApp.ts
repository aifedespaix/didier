import type { PlayerState } from './entities/Player'
import * as THREE from 'three'
import { createAbility, registerAbility } from './engine/abilities/AbilityRegistry'
import { CircleAoeAbility } from './engine/abilities/impl/CircleAoeAbility'
import { DashAbility } from './engine/abilities/impl/DashAbility'
import { RectPushAbility } from './engine/abilities/impl/RectPushAbility'
import abilitiesConfig from './engine/config/balance/abilities.json'
import { Hero } from './engine/hero/Hero'
import { InputMap } from './engine/input/InputMap'
import { CollisionService } from './engine/physics/CollisionService'
import { CastingSystem } from './engine/systems/CastingSystem'
import { DamageSystem } from './engine/systems/DamageSystem'
import { createGround } from './entities/Ground'
import { createLights } from './entities/Lights'
import { createPlayer } from './entities/Player'
import { MouseInput } from './input/MouseInput'
import { updateCameraFollow } from './systems/CameraFollowSystem'
import { updateMovement } from './systems/MovementSystem'

export interface ThreeApp {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  player: PlayerState
  dispose: () => void
}

/**
 * Creates and starts the Three.js application bound to the provided canvas.
 */
export function createThreeApp(canvas: HTMLCanvasElement, container: HTMLElement): ThreeApp {
  const scene = new THREE.Scene()
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.shadowMap.enabled = true
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  const clock = new THREE.Clock()

  const player = createPlayer()
  scene.add(player.mesh)

  // Systems
  const collision = new CollisionService([])
  const damage = new DamageSystem()

  // Register abilities
  registerAbility('rect-push', () => new RectPushAbility(player.mesh, collision, damage, abilitiesConfig['rect-push']))
  registerAbility('dash', () => new DashAbility(player.mesh, abilitiesConfig.dash))
  registerAbility('circle-aoe', () => new CircleAoeAbility(collision, damage, abilitiesConfig['circle-aoe']))

  const hero = new Hero({
    primary: createAbility('rect-push'),
    secondary: createAbility('dash'),
    tertiary: createAbility('circle-aoe'),
    ultimate: null,
  })

  const input = new InputMap(hero)
  const casting = new CastingSystem(hero)

  const ground = createGround()
  scene.add(ground)

  const lights = createLights()
  scene.add(lights.ambient)
  scene.add(lights.directional)

  const mouse = new MouseInput(canvas, camera, player, scene)

  const cameraOffset = new THREE.Vector3(0, 10, 10)
  camera.position.copy(cameraOffset)
  camera.lookAt(player.mesh.position)

  let raf = 0

  function onResize() {
    const width = container.clientWidth
    const height = container.clientHeight
    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  function tick() {
    const dt = clock.getDelta()
    updateMovement(player, dt)
    updateCameraFollow(camera, player.mesh, dt, cameraOffset)
    mouse.update(dt)
    casting.update(dt)
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }

  onResize()
  window.addEventListener('resize', onResize)
  raf = requestAnimationFrame(tick)

  return {
    scene,
    camera,
    renderer,
    player,
    dispose() {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      mouse.dispose()
      input.dispose()
      renderer.dispose()
    },
  }
}
