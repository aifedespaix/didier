import { renderHook, act } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { useKeyboardMovement } from '../useKeyboardMovement';

describe('useKeyboardMovement', () => {
  test('updates position on key presses', () => {
    const { result } = renderHook(() => useKeyboardMovement(1));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });
    expect(result.current.x).toBe(-1);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    });
    expect(result.current.x).toBe(0);
  });
});
