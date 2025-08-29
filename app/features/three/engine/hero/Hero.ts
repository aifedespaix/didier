import type { Ability } from '../abilities/AbilityBase'

/** Slots available on a hero. */
export interface AbilitySlots {
  primary: Ability | null
  secondary: Ability | null
  tertiary: Ability | null
  ultimate: Ability | null
}

/**
 * Represents a controllable hero with a set of ability slots.
 */
export class Hero {
  public readonly slots: AbilitySlots

  constructor(slots?: Partial<AbilitySlots>) {
    this.slots = {
      primary: slots?.primary ?? null,
      secondary: slots?.secondary ?? null,
      tertiary: slots?.tertiary ?? null,
      ultimate: slots?.ultimate ?? null,
    }
  }

  getAbility(slot: keyof AbilitySlots): Ability | null {
    return this.slots[slot]
  }

  setAbility(slot: keyof AbilitySlots, ability: Ability | null): void {
    this.slots[slot] = ability
  }
}
