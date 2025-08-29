/* eslint-disable test/no-import-node-test */
import * as assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { DashAbility } from '../app/features/three/engine/abilities/impl/DashAbility'
import { DASH_EPSILON } from '../app/features/three/engine/movement/DashSystem'

test('dash clamps distance to first obstacle', () => {
  const caster = new THREE.Object3D()
  caster.rotation.y = Math.PI

  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
  wall.position.set(0, 0, 2)
  wall.updateMatrixWorld()

  const ability = new DashAbility(caster, { distance: 5, recovery: 0 }, [wall])
  ability.onCommit({ origin: new THREE.Vector3(), target: new THREE.Vector3() })

  const maxZ = 2 - 0.5 - DASH_EPSILON
  assert.ok(Math.abs(caster.position.z - maxZ) < 0.01)
})

test('dash slides along surfaces when enabled', () => {
  const caster = new THREE.Object3D()
  caster.lookAt(new THREE.Vector3(1, 0, 1))

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
  )
  wall.position.set(1, 0, 0)
  wall.rotation.y = -Math.PI / 2
  wall.updateMatrixWorld()

  const distance = 3
  const ability = new DashAbility(caster, { distance, recovery: 0 }, [wall], true)
  ability.onCommit({ origin: new THREE.Vector3(), target: new THREE.Vector3() })

  const forward = new THREE.Vector3()
  caster.getWorldDirection(forward)
  const hitDistance = 1 / forward.x
  const remaining = distance - hitDistance
  const expectedX = 1 - DASH_EPSILON * forward.x
  const expectedZ = forward.z * (hitDistance - DASH_EPSILON) + remaining

  assert.ok(Math.abs(caster.position.x - expectedX) < 0.01)
  assert.ok(Math.abs(caster.position.z - expectedZ) < 0.01)
})
