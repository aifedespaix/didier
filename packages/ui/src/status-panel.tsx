import React from 'react';

/**
 * Describes the current connection state displayed by {@link StatusPanel}.
 */
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

/**
 * Props for {@link StatusPanel}.
 */
export interface StatusPanelProps {
  /**
   * Connection state to display.
   */
  readonly connectionStatus: ConnectionStatus;
  /**
   * Semver of the protocol understood by the client.
   */
  readonly protocolVersion: string;
}

/**
 * A small panel displaying the current network connection state and protocol version.
 *
 * @example
 * ```tsx
 * <StatusPanel connectionStatus="connected" protocolVersion="1.2.3" />
 * ```
 */
export function StatusPanel({
  connectionStatus,
  protocolVersion,
}: StatusPanelProps): React.ReactElement {
  return (
    <div
      aria-live="polite"
      style={{
        fontFamily: 'sans-serif',
        backgroundColor: '#1f2937',
        color: '#f9fafb',
        padding: '0.5rem 1rem',
        borderRadius: '0.25rem',
        display: 'inline-block',
      }}
    >
      <div>
        Connection:{' '}
        <span data-testid="connection-status">{connectionStatus}</span>
      </div>
      <div>
        Protocol: <span data-testid="protocol-version">{protocolVersion}</span>
      </div>
    </div>
  );
}
