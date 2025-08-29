/* eslint-disable test/no-import-node-test */
import * as assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { createPlayer } from '../app/features/three/entities/Player'
import { updateMovement } from '../app/features/three/systems/MovementSystem'

const EPSILON = 0.000001

test('moves towards target at expected speed', () => {
  const player = createPlayer()
  player.target = new THREE.Vector3(6, 0.1, 0)
  updateMovement(player, 1)
  assert.ok(player.target === null)
  assert.ok(Math.abs(player.mesh.position.x - 6) < EPSILON)
})

test('does not overshoot target', () => {
  const player = createPlayer()
  player.target = new THREE.Vector3(2, 0.1, 0)
  updateMovement(player, 1)
  assert.ok(player.target === null)
  assert.ok(Math.abs(player.mesh.position.x - 2) < EPSILON)
})
