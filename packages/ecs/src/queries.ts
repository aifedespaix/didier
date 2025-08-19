import { defineQuery } from 'bitecs';
import { Health, InputState, Position, Team, Velocity } from './components';

/**
 * Entities that possess both {@link Position} and {@link Velocity} components.
 */
export const movableQuery = defineQuery([Position, Velocity]);

/**
 * Entities that expose a {@link Health} component.
 */
export const healthQuery = defineQuery([Health]);

/**
 * Entities providing an {@link InputState} component.
 */
export const inputQuery = defineQuery([InputState]);

/**
 * Entities associated with a {@link Team} identifier.
 */
export const teamQuery = defineQuery([Team]);
