'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker to enable PWA capabilities.
 */
export function ServiceWorkerRegister(): null {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed', error);
      });
    }
  }, []);
  return null;
}
