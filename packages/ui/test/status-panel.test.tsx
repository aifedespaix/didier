import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusPanel } from '../src/status-panel';

describe('StatusPanel', () => {
  it('displays connection status and protocol version', () => {
    render(
      <StatusPanel connectionStatus="connected" protocolVersion="1.2.3" />
    );
    expect(screen.getByTestId('connection-status').textContent).toBe(
      'connected'
    );
    expect(screen.getByTestId('protocol-version').textContent).toBe('1.2.3');
  });
});
