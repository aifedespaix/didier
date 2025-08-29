/* eslint-disable test/no-import-node-test */
import * as assert from 'node:assert/strict'
import test from 'node:test'
import { AbilityBase, AbilityState, CastMode } from '../app/features/three/engine/abilities/AbilityBase'
import { Hero } from '../app/features/three/engine/hero/Hero'
import { InputMap } from '../app/features/three/engine/input/InputMap'

class DummyAbility extends AbilityBase {
  constructor() {
    super('dummy', 'Dummy', 0, 0)
    this.mode = CastMode.Quick
  }
}

class KeyEvent extends Event {
  constructor(type: string, public key: string) {
    super(type)
  }
}

test('quick cast preview and commit', () => {
  ;(globalThis as any).window = new EventTarget()
  const ability = new DummyAbility()
  const hero = new Hero({ primary: ability, secondary: null, tertiary: null, ultimate: null })
  const input = new InputMap(hero)
  input.castMode = CastMode.Quick

  window.dispatchEvent(new KeyEvent('keydown', 'a'))
  assert.equal(ability.state, AbilityState.Preview)
  window.dispatchEvent(new KeyEvent('keyup', 'a'))
  assert.equal(ability.state, AbilityState.Casting)

  input.dispose()
})
