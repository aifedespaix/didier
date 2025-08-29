/* eslint-disable test/no-import-node-test */
import * as assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { AbilityBase, AbilityState } from '../app/features/three/engine/abilities/AbilityBase'
import { Hero } from '../app/features/three/engine/hero/Hero'
import { CastingSystem } from '../app/features/three/engine/systems/CastingSystem'

class CooldownAbility extends AbilityBase {
  constructor(cooldown: number, recovery: number) {
    super('cooldown', 'Cooldown Ability', cooldown, 1, recovery)
  }

  override onCommit(context: any): void {
    super.onCommit(context)
    if (this.state !== AbilityState.Casting)
      return
    this.state = AbilityState.Recovery
  }
}

test('ability respects cooldown and recovery', () => {
  const ability = new CooldownAbility(2, 0.5)
  const hero = new Hero({ primary: ability, secondary: null, tertiary: null, ultimate: null })
  const casting = new CastingSystem(hero)
  const context = { origin: new THREE.Vector3(), target: new THREE.Vector3() }

  ability.onPreview(context)
  ability.onCommit(context)
  assert.equal(ability.state, AbilityState.Recovery)
  assert.ok(ability.cooldownRemaining > 0)

  casting.update(0.25)
  casting.update(0.25)
  assert.equal(ability.state, AbilityState.Idle)
  const remainingAfterRecovery = ability.cooldownRemaining
  assert.ok(remainingAfterRecovery > 0)

  ability.onPreview(context)
  assert.equal(ability.state, AbilityState.Idle)
  ability.onCommit(context)
  assert.equal(ability.state, AbilityState.Idle)
  assert.equal(ability.cooldownRemaining, remainingAfterRecovery)

  casting.update(1.5)
  assert.equal(ability.cooldownRemaining, 0)

  ability.onPreview(context)
  assert.equal(ability.state, AbilityState.Preview)
})
