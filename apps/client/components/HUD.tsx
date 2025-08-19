'use client';

interface HudProps {
  latency: number | null;
  protocolVersion: string | null;
}

/**
 * Displays connection metrics in a heads-up display.
 */
export function HUD({ latency, protocolVersion }: HudProps): JSX.Element {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        padding: '0.5rem',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        fontFamily: 'monospace',
      }}
    >
      <div>{`Latency: ${latency ?? '…'}ms`}</div>
      <div>{`Protocol: ${protocolVersion ?? 'unknown'}`}</div>
    </div>
  );
}
