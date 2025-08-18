import { addComponent, addEntity } from 'bitecs';
import type { IWorld } from 'bitecs';
import { Position, Velocity } from './components';
import type { Vector2 } from './types';

/**
 * Creates an entity with a {@link Position} component.
 * @param world - World in which the entity is created.
 * @param position - Initial position of the entity.
 * @returns Identifier of the newly created entity.
 */
export function createPositionEntity(world: IWorld, position: Vector2): number {
  const eid = addEntity(world);
  addComponent(world, Position, eid);
  Position.x[eid] = position.x;
  Position.y[eid] = position.y;
  return eid;
}

/**
 * Creates an entity with {@link Position} and {@link Velocity} components.
 * @param world - World in which the entity is created.
 * @param position - Initial position of the entity.
 * @param velocity - Initial velocity of the entity.
 * @returns Identifier of the newly created entity.
 */
export function createMovingEntity(
  world: IWorld,
  position: Vector2,
  velocity: Vector2,
): number {
  const eid = createPositionEntity(world, position);
  addComponent(world, Velocity, eid);
  Velocity.x[eid] = velocity.x;
  Velocity.y[eid] = velocity.y;
  return eid;
}
