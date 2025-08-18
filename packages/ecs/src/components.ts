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
