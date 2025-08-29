import type { Ability, AbilityContext } from '../abilities/AbilityBase'
import type { Hero } from '../hero/Hero'
import * as THREE from 'three'
import { raycastGround } from '../../utils/raycastGround'
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
 * Runtime dependencies required by {@link InputMap}.
 */
export interface InputDependencies {
  /** DOM element receiving pointer events. */
  element: HTMLElement
  /** Camera used to compute world coordinates from the pointer. */
  camera: THREE.Camera
  /** Object representing the hero for origin coordinates. */
  origin: THREE.Object3D
}

/**
 * Listens to keyboard inputs and mouse clicks to trigger ability casts on the hero.
 */
export class InputMap {
  public castMode: CastMode = CastMode.Smart

  private readonly bindings: InputBindings
  private readonly hero: Hero
  private readonly deps: InputDependencies

  private readonly pointer = new THREE.Vector2()
  private activeAbility: Ability | null = null

  constructor(hero: Hero, deps: InputDependencies, bindings: Partial<InputBindings> = {}) {
    this.hero = hero
    this.deps = deps
    this.bindings = { ...defaultBindings, ...bindings }

    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerDown = this.onPointerDown.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    this.deps.element.addEventListener('pointermove', this.onPointerMove)
  }

  /** Detaches all listeners. */
  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.deps.element.removeEventListener('pointermove', this.onPointerMove)
    this.detachMouseListeners()
  }

  /** Handles key presses to start ability previews. */
  private onKeyDown(event: KeyboardEvent): void {
    const slot = this.keyToSlot(event.key.toLowerCase())
    if (!slot)
      return
    const ability = this.hero.getAbility(slot)
    if (!ability)
      return

    const mode = ability.mode === CastMode.Smart ? this.castMode : ability.mode
    const context = this.buildContext()
    ability.onPreview(context)

    if (mode === CastMode.Normal) {
      this.activeAbility = ability
      this.attachMouseListeners()
    }
  }

  /** Handles key releases to commit quick-cast abilities. */
  private onKeyUp(event: KeyboardEvent): void {
    const slot = this.keyToSlot(event.key.toLowerCase())
    if (!slot)
      return
    const ability = this.hero.getAbility(slot)
    if (!ability)
      return

    const mode = ability.mode === CastMode.Smart ? this.castMode : ability.mode
    if (mode !== CastMode.Quick)
      return

    const context = this.buildContext()
    if (this.isWithinRange(ability, context))
      ability.onCommit(context)
    else
      ability.onCancel()
  }

  /** Tracks mouse position for ability targeting. */
  private onPointerMove(event: PointerEvent): void {
    const rect = this.deps.element.getBoundingClientRect()
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
  }

  /** Commits or cancels an active ability based on mouse input. */
  private onPointerDown(event: PointerEvent): void {
    if (!this.activeAbility)
      return

    if (event.button === 2) {
      this.activeAbility.onCancel()
    }
    else if (event.button === 0) {
      this.onPointerMove(event)
      const context = this.buildContext()
      if (this.isWithinRange(this.activeAbility, context))
        this.activeAbility.onCommit(context)
      else
        this.activeAbility.onCancel()
    }

    this.activeAbility = null
    this.detachMouseListeners()
  }

  /** Prevents the context menu on right click during casting. */
  private onContextMenu(event: Event): void {
    event.preventDefault()
  }

  /** Builds the ability context from the current hero and mouse position. */
  private buildContext(): AbilityContext {
    const origin = this.deps.origin.position.clone()
    const target = raycastGround(this.pointer, this.deps.camera) ?? origin.clone()
    return { origin, target }
  }

  /** Checks whether the target is within the ability's range. */
  private isWithinRange(ability: Ability, context: AbilityContext): boolean {
    return context.origin.distanceTo(context.target) <= ability.range
  }

  private attachMouseListeners(): void {
    this.deps.element.addEventListener('pointerdown', this.onPointerDown)
    this.deps.element.addEventListener('contextmenu', this.onContextMenu)
  }

  private detachMouseListeners(): void {
    this.deps.element.removeEventListener('pointerdown', this.onPointerDown)
    this.deps.element.removeEventListener('contextmenu', this.onContextMenu)
  }

  /** Maps a keyboard key to an ability slot. */
  private keyToSlot(key: string): keyof InputBindings | null {
    const entries = Object.entries(this.bindings) as [keyof InputBindings, string][]
    const found = entries.find(([, k]) => k === key)
    return found ? found[0] : null
  }
}
