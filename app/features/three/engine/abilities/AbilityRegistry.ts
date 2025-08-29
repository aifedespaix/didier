import type { Ability } from './AbilityBase'

export type AbilityFactory = () => Ability

const registry = new Map<string, AbilityFactory>()

/** Registers a factory for the given ability id. */
export function registerAbility(id: string, factory: AbilityFactory): void {
  registry.set(id, factory)
}

/** Creates a new ability instance for the given id. */
export function createAbility(id: string): Ability {
  const factory = registry.get(id)
  if (!factory)
    throw new Error(`Ability '${id}' is not registered`)
  return factory()
}
