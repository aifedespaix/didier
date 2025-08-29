import type * as THREE from 'three'

/**
 * Cast mode selected by the player or overridden by a specific ability.
 */
export enum CastMode {
  Smart = 'smart',
  Normal = 'normal',
  Quick = 'quick',
}

/**
 * Internal state of an ability during the casting workflow.
 */
export enum AbilityState {
  Idle = 'idle',
  Preview = 'preview',
  Casting = 'casting',
  Recovery = 'recovery',
}

/**
 * Context information provided to an ability when casting.
 */
export interface AbilityContext {
  /** Starting position of the ability, usually the caster's location. */
  origin: THREE.Vector3
  /** Target position or direction. */
  target: THREE.Vector3
}

/**
 * Contract implemented by all abilities.
 */
export interface Ability {
  readonly id: string
  readonly name: string
  readonly cooldown: number
  readonly range: number
  state: AbilityState
  mode: CastMode

  /** Called when the player requests a preview. */
  onPreview: (context: AbilityContext) => void
  /** Called when the cast is confirmed. */
  onCommit: (context: AbilityContext) => void
  /** Called when the cast is cancelled. */
  onCancel: () => void
  /** Called on every frame while the ability is active. */
  onUpdate: (dt: number) => void
}

/**
 * Base class providing default implementations.
 */
export abstract class AbilityBase implements Ability {
  public state: AbilityState = AbilityState.Idle
  public mode: CastMode = CastMode.Smart

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly cooldown: number,
    public readonly range: number,
  ) {}

  onPreview(_context: AbilityContext): void {
    this.state = AbilityState.Preview
  }

  onCommit(_context: AbilityContext): void {
    this.state = AbilityState.Casting
  }

  onCancel(): void {
    this.state = AbilityState.Idle
  }

  onUpdate(_dt: number): void {
    // Default no-op
  }
}
