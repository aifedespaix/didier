/* eslint-disable test/no-import-node-test */
import * as assert from 'node:assert/strict'
import test from 'node:test'
import { DamageSystem } from '../app/features/three/engine/systems/DamageSystem'

test('fires death event when health is depleted', () => {
  const system = new DamageSystem()
  const health = { current: 0, max: 100, isDead: false }
  system.damage(health, 0)
  const deathEvents = system.events.filter(e => e.type === 'death')
  assert.equal(deathEvents.length, 1)
  assert.equal(health.isDead, true)
})
