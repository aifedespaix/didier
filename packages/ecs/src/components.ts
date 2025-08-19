import { defineComponent, Types } from 'bitecs';

/**
 * Position of an entity in a two-dimensional space.
 */
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

/**
 * Velocity of an entity expressed in units per second.
 */
export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

/**
 * Health of an entity represented by its current and maximum values.
 */
export const Health = defineComponent({
  current: Types.f32,
  max: Types.f32,
});

/**
 * Current input state for an entity.
 *
 * Each field is treated as a boolean flag (1 = pressed, 0 = released).
 */
export const InputState = defineComponent({
  up: Types.ui8,
  down: Types.ui8,
  left: Types.ui8,
  right: Types.ui8,
  action: Types.ui8,
});

/**
 * Team identifier for grouping entities.
 */
export const Team = defineComponent({
  id: Types.ui8,
});
