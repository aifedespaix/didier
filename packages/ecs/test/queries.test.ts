import {
  addComponent,
  addEntity,
  createWorld,
  resetGlobals,
  type IWorld,
} from 'bitecs';
import { describe, expect, it } from 'vitest';
import {
  Health,
  InputState,
  Position,
  Team,
  Velocity,
  healthQuery,
  inputQuery,
  movableQuery,
  teamQuery,
} from '../src';

/**
 * Linear congruential generator producing deterministic sequences.
 */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

interface SeededWorld {
  world: IWorld;
  movable: number[];
  withHealth: number[];
  withInput: number[];
  withTeam: number[];
}

function buildSeededWorld(seed: number, count: number): SeededWorld {
  const rand = makeRng(seed);
  const world = createWorld();
  const movable: number[] = [];
  const withHealth: number[] = [];
  const withInput: number[] = [];
  const withTeam: number[] = [];

  for (let i = 0; i < count; i++) {
    const eid = addEntity(world);
    const hasPosition = rand() > 0.5;
    const hasVelocity = rand() > 0.5;
    if (hasPosition) {
      addComponent(world, Position, eid);
      Position.x[eid] = rand();
      Position.y[eid] = rand();
    }
    if (hasVelocity) {
      addComponent(world, Velocity, eid);
      Velocity.x[eid] = rand();
      Velocity.y[eid] = rand();
    }
    if (hasPosition && hasVelocity) {
      movable.push(eid);
    }
    if (rand() > 0.5) {
      addComponent(world, Health, eid);
      Health.current[eid] = rand() * 100;
      Health.max[eid] = 100;
      withHealth.push(eid);
    }
    if (rand() > 0.5) {
      addComponent(world, InputState, eid);
      InputState.up[eid] = rand() > 0.5 ? 1 : 0;
      InputState.down[eid] = rand() > 0.5 ? 1 : 0;
      InputState.left[eid] = rand() > 0.5 ? 1 : 0;
      InputState.right[eid] = rand() > 0.5 ? 1 : 0;
      InputState.action[eid] = rand() > 0.5 ? 1 : 0;
      withInput.push(eid);
    }
    if (rand() > 0.5) {
      addComponent(world, Team, eid);
      Team.id[eid] = Math.floor(rand() * 4);
      withTeam.push(eid);
    }
  }

  return { world, movable, withHealth, withInput, withTeam };
}

describe('reusable queries', () => {
  it('Given identical seeds When building worlds Then queries select identical entities', () => {
    const worldA = buildSeededWorld(123, 20);
    resetGlobals();
    const worldB = buildSeededWorld(123, 20);

    expect(Array.from(movableQuery(worldA.world))).toEqual(
      Array.from(movableQuery(worldB.world)),
    );
    expect(Array.from(healthQuery(worldA.world))).toEqual(
      Array.from(healthQuery(worldB.world)),
    );
    expect(Array.from(inputQuery(worldA.world))).toEqual(
      Array.from(inputQuery(worldB.world)),
    );
    expect(Array.from(teamQuery(worldA.world))).toEqual(
      Array.from(teamQuery(worldB.world)),
    );
  });

  it('Given a seeded world When running queries Then only entities with matching components are returned', () => {
    const seeded = buildSeededWorld(42, 25);

    expect(Array.from(movableQuery(seeded.world))).toEqual(seeded.movable);
    expect(Array.from(healthQuery(seeded.world))).toEqual(seeded.withHealth);
    expect(Array.from(inputQuery(seeded.world))).toEqual(seeded.withInput);
    expect(Array.from(teamQuery(seeded.world))).toEqual(seeded.withTeam);
  });
});
