'use client';

import { useRef } from 'react';
import type { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import type { Position } from '../hooks/useKeyboardMovement';

interface CubeProps {
  position: Position;
}

/**
 * Renders a cube that follows the provided position.
 */
export function Cube({ position }: CubeProps): JSX.Element {
  const ref = useRef<Mesh>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(position.x, position.y, position.z);
    }
  });
  return (
    <mesh ref={ref}>
      <boxGeometry />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}
