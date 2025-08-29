/* eslint-disable test/no-import-node-test */
import * as assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import type { AbilityContext } from '../app/features/three/engine/abilities/AbilityBase'
import { AbilityBase, AbilityState, CastMode } from '../app/features/three/engine/abilities/AbilityBase'
import { Hero } from '../app/features/three/engine/hero/Hero'
import { InputMap } from '../app/features/three/engine/input/InputMap'

class DummyAbility extends AbilityBase {
  previewContext: AbilityContext | null = null
  commitContext: AbilityContext | null = null
  constructor() {
    super('dummy', 'Dummy', 0, 5, 0)
    this.mode = CastMode.Quick
  }
  override onPreview(ctx: AbilityContext): void {
    super.onPreview(ctx)
    this.previewContext = ctx
  }
  override onCommit(ctx: AbilityContext): void {
    super.onCommit(ctx)
    this.commitContext = ctx
  }
}

class KeyEvent extends Event {
  constructor(type: string, public key: string) {
    super(type)
  }
}

class PointerEvt extends Event {
  constructor(type: string, public clientX: number, public clientY: number, public button: number) {
    super(type)
  }
}

class StubElement extends EventTarget {
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 100, height: 100 } as DOMRect
  }
}

function createDeps(origin: THREE.Object3D) {
  const element = new StubElement() as unknown as HTMLElement
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 10, 10)
  camera.lookAt(0, 0, 0)
  return { element, camera, origin }
}

test('action supports multiple keys and forbids conflicts', () => {
  ;(globalThis as any).window = new EventTarget()
  const origin = new THREE.Object3D()
  const deps = createDeps(origin)
  const ability = new DummyAbility()
  const hero = new Hero({ primary: ability, secondary: null, tertiary: null, ultimate: null })

  const input = new InputMap(hero, deps, { primary: ['a', 'x'] })

  deps.element.dispatchEvent(new PointerEvt('pointermove', 50, 50, 0))
  window.dispatchEvent(new KeyEvent('keydown', 'x'))
  assert.equal(ability.state, AbilityState.Preview)
  window.dispatchEvent(new KeyEvent('keyup', 'x'))
  assert.equal(ability.state, AbilityState.Casting)
  assert.notEqual(ability.commitContext, null)

  input.dispose()
})

