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
  /** Duration spent recovering after the effect resolves. */
  readonly recovery: number
  readonly range: number
  state: AbilityState
  mode: CastMode

  /** Seconds remaining before the ability can be used again. */
  cooldownRemaining: number

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
  public cooldownRemaining = 0
  private recoveryRemaining = 0

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly cooldown: number,
    public readonly range: number,
    public readonly recovery: number,
  ) {}

  onPreview(_context: AbilityContext): void {
    if (this.cooldownRemaining > 0 || this.state !== AbilityState.Idle)
      return
    this.state = AbilityState.Preview
  }

  onCommit(_context: AbilityContext): void {
    if (this.cooldownRemaining > 0)
      return
    this.state = AbilityState.Casting
    this.cooldownRemaining = this.cooldown
    this.recoveryRemaining = this.recovery
  }

  onCancel(): void {
    this.state = AbilityState.Idle
  }

  onUpdate(dt: number): void {
    if (this.cooldownRemaining > 0)
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt)

    if (this.state === AbilityState.Recovery) {
      this.recoveryRemaining -= dt
      if (this.recoveryRemaining <= 0)
        this.state = AbilityState.Idle
    }
  }
}
