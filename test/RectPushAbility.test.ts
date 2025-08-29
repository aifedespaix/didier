/* eslint-disable test/no-import-node-test */
import * as assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { RectPushAbility } from '../app/features/three/engine/abilities/impl/RectPushAbility'
import config from '../app/features/three/engine/config/balance/abilities.json'
import { CollisionService } from '../app/features/three/engine/physics/CollisionService'
import { DamageSystem } from '../app/features/three/engine/systems/DamageSystem'

test('knockback falloff', () => {
  const origin = new THREE.Vector3(0, 0, 0)
  const targetPoint = new THREE.Vector3(0, 0, 4)

  const near = new THREE.Object3D()
  near.position.set(0, 0, 0.5)
  const far = new THREE.Object3D()
  far.position.set(0, 0, 3.5)

  const collision = new CollisionService([
    { position: near.position, radius: 0.25, object: near },
    { position: far.position, radius: 0.25, object: far },
  ])
  const damage = new DamageSystem()
  const ability = new RectPushAbility(new THREE.Object3D(), collision, damage, config['rect-push'])

  ability.onCommit({ origin, target: targetPoint })

  assert.ok(Math.abs(near.position.z - (0.5 + 2.75)) < 0.01)
  assert.ok(Math.abs(far.position.z - (3.5 + 1.25)) < 0.01)
})
