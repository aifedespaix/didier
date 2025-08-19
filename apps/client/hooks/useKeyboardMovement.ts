'use client';

import { useEffect, useState } from 'react';

export interface Position {
  x: number;
  y: number;
  z: number;
}

/**
 * Tracks a position vector updated via A/Z/E/R keyboard inputs.
 * @param step Amount of units to move per key press.
 */
export function useKeyboardMovement(step = 0.1): Position {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setPosition((prev: Position) => {
        switch (event.key.toLowerCase()) {
          case 'a':
            return { ...prev, x: prev.x - step };
          case 'z':
            return { ...prev, z: prev.z - step };
          case 'e':
            return { ...prev, z: prev.z + step };
          case 'r':
            return { ...prev, x: prev.x + step };
          default:
            return prev;
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step]);

  return position;
}
