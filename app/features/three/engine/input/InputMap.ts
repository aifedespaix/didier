import type { Hero } from '../hero/Hero'
import * as THREE from 'three'
import { CastMode } from '../abilities/AbilityBase'

export interface InputBindings {
  primary: string
  secondary: string
  tertiary: string
  ultimate: string
}

const defaultBindings: InputBindings = {
  primary: 'a',
  secondary: 'z',
  tertiary: 'e',
  ultimate: 'r',
}

/**
 * Listens to keyboard inputs and triggers ability casts on the hero.
 */
export class InputMap {
  public castMode: CastMode = CastMode.Smart
  private bindings: InputBindings
  private readonly hero: Hero

  constructor(hero: Hero, bindings: Partial<InputBindings> = {}) {
    this.hero = hero
    this.bindings = { ...defaultBindings, ...bindings }
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  private onKeyDown(event: KeyboardEvent): void {
    const slot = this.keyToSlot(event.key.toLowerCase())
    if (!slot)
      return
    const ability = this.hero.getAbility(slot)
    if (!ability)
      return
    if (ability.mode === CastMode.Quick || this.castMode === CastMode.Quick)
      ability.onPreview({ origin: new THREE.Vector3(), target: new THREE.Vector3() })
    else
      ability.onCommit({ origin: new THREE.Vector3(), target: new THREE.Vector3() })
  }

  private onKeyUp(event: KeyboardEvent): void {
    const slot = this.keyToSlot(event.key.toLowerCase())
    if (!slot)
      return
    const ability = this.hero.getAbility(slot)
    if (!ability)
      return
    if (ability.mode === CastMode.Quick || this.castMode === CastMode.Quick)
      ability.onCommit({ origin: new THREE.Vector3(), target: new THREE.Vector3() })
  }

  private keyToSlot(key: string): keyof InputBindings | null {
    const entries = Object.entries(this.bindings) as [keyof InputBindings, string][]
    const found = entries.find(([, k]) => k === key)
    return found ? found[0] : null
  }
}
