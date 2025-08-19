'use client';

import { Canvas } from '@react-three/fiber';
import { Cube } from '../components/Cube';
import { HUD } from '../components/HUD';
import { useKeyboardMovement } from '../hooks/useKeyboardMovement';
import { useServerInfo } from '../hooks/useServerInfo';

export function Game({ wsUrl = '/ws' }: { wsUrl?: string }): JSX.Element {
  const position = useKeyboardMovement();
  const info = useServerInfo(wsUrl);

  return (
    <>
      <Canvas style={{ width: '100vw', height: '100vh' }}>
        <ambientLight />
        <Cube position={position} />
      </Canvas>
      <HUD latency={info.latency} protocolVersion={info.protocolVersion} />
    </>
  );
}

export default function Page(): JSX.Element {
  return <Game />;
}
