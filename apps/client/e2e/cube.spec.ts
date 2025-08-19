import { test, expect } from '@playwright/test';
import { WebSocketServer, WebSocket } from 'ws';
import { Snapshot } from '../../../packages/protocol/src';
import { encodeSnapshot } from '../../../packages/netcode/src/codec';

async function getCubeX(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => (globalThis as any).__cubePosition.x as number);
}

test.describe('cube movement', () => {
  test('moves offline', async ({ page }) => {
    await page.goto('/');
    const x0 = await getCubeX(page);
    await page.keyboard.press('KeyR');
    await page.waitForTimeout(50);
    const x1 = await getCubeX(page);
    expect(x1).toBeGreaterThan(x0);
  });

  test('moves while connected to server', async ({ page }) => {
    const server = new WebSocketServer({ port: 12349 });
    server.on('connection', (socket: WebSocket) => {
      const snapshot = new Snapshot({ version: 1, positions: [0, 0] });
      socket.send(encodeSnapshot(snapshot));
    });
    await page.goto('/?ws=ws://localhost:12349');
    await page.waitForSelector('text=Protocol:');
    const x0 = await getCubeX(page);
    await page.keyboard.press('KeyR');
    await page.waitForTimeout(50);
    const x1 = await getCubeX(page);
    expect(x1).toBeGreaterThan(x0);
    server.close();
  });
});
