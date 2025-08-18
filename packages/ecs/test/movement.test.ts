import { describe, expect, it } from 'vitest';
import { createWorld } from 'bitecs';
import { Position } from '../src/components';
import { createMovingEntity } from '../src/factories';
import { moveSystem } from '../src/systems/movement';

describe('moveSystem', () => {
  it('produces deterministic updates for identical worlds', () => {
    const worldA = createWorld();
    const worldB = createWorld();
    const position = { x: 0, y: 0 };
    const velocity = { x: 1, y: -1 };

    const entityA = createMovingEntity(worldA, position, velocity);
    const entityB = createMovingEntity(worldB, position, velocity);

    moveSystem(worldA, 1);
    moveSystem(worldB, 1);

    expect(Position.x[entityA]).toBe(Position.x[entityB]);
    expect(Position.y[entityA]).toBe(Position.y[entityB]);
  });

  it('accumulates position linearly over time', () => {
    const world = createWorld();
    const entity = createMovingEntity(world, { x: 0, y: 0 }, { x: 2, y: 0.5 });

    moveSystem(world, 0.5);
    moveSystem(world, 0.5);

    expect(Position.x[entity]).toBeCloseTo(2);
    expect(Position.y[entity]).toBeCloseTo(0.5);
  });
});
