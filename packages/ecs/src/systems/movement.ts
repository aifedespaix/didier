import { defineQuery } from 'bitecs';
import type { IWorld } from 'bitecs';
import { Position, Velocity } from '../components';

const movableQuery = defineQuery([Position, Velocity]);

/**
 * Advances entity positions by applying velocity.
 *
 * @param world - ECS world to mutate.
 * @param deltaSeconds - Time delta in seconds.
 * @returns The mutated world for chaining.
 */
export function moveSystem(world: IWorld, deltaSeconds: number): IWorld {
  const entities = movableQuery(world);
  for (const eid of entities) {
    const px = Position.x[eid] ?? 0;
    const py = Position.y[eid] ?? 0;
    const vx = Velocity.x[eid] ?? 0;
    const vy = Velocity.y[eid] ?? 0;
    Position.x[eid] = px + vx * deltaSeconds;
    Position.y[eid] = py + vy * deltaSeconds;
  }
  return world;
}
