/* eslint-disable test/no-import-node-test */
import * as assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { CircleAoeAbility } from '../app/features/three/engine/abilities/impl/CircleAoeAbility'
import { AbilityState } from '../app/features/three/engine/abilities/AbilityBase'
import config from '../app/features/three/engine/config/balance/abilities.json'
import { CollisionService } from '../app/features/three/engine/physics/CollisionService'
import { DamageSystem } from '../app/features/three/engine/systems/DamageSystem'

test('circle aoe triggers after delay then recovers', () => {
  const origin = new THREE.Vector3()
  const target = new THREE.Vector3()
  const enemy = new THREE.Object3D()
  enemy.position.copy(target)
  const health = { current: 100, max: 100, isDead: false }
  const collision = new CollisionService([{ position: enemy.position, radius: 0.5, object: enemy, health }])
  const damage = new DamageSystem()
  const ability = new CircleAoeAbility(collision, damage, config['circle-aoe'])

  ability.onCommit({ origin, target })
  ability.onUpdate(0.25)
  assert.equal(damage.events.length, 0)
  assert.equal(ability.state, AbilityState.Casting)

  ability.onUpdate(0.25)
  assert.equal(damage.events.length, 1)
  assert.equal(ability.state, AbilityState.Recovery)

  ability.onUpdate(config['circle-aoe'].recovery)
  assert.equal(ability.state, AbilityState.Idle)
})

test('circle aoe cancels before impact', () => {
  const origin = new THREE.Vector3()
  const target = new THREE.Vector3()
  const enemy = new THREE.Object3D()
  enemy.position.copy(target)
  const health = { current: 100, max: 100, isDead: false }
  const collision = new CollisionService([{ position: enemy.position, radius: 0.5, object: enemy, health }])
  const damage = new DamageSystem()
  const ability = new CircleAoeAbility(collision, damage, config['circle-aoe'])

  ability.onCommit({ origin, target })
  ability.onUpdate(0.25)
  ability.onCancel()
  ability.onUpdate(1)
  assert.equal(damage.events.length, 0)
  assert.equal(ability.state, AbilityState.Idle)
})
