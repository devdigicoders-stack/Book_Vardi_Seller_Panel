import { useEffect, useRef } from 'react';

// BroadcastChannel for instant same-origin tab sync
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('bookvardi_platform_sync')
  : null;

let lastKnownRevision = 0;

/**
 * Pushes updated platform entities across all 3 portals
 * Writes to local storage, BroadcastChannel, and Vite backend dev servers
 */
export async function pushPlatformSync(payload) {
  const timestamp = Date.now();
  lastKnownRevision = timestamp;

  // 1. Post to BroadcastChannel for instant same-origin updates
  if (channel) {
    try {
      channel.postMessage({ type: 'PLATFORM_SYNC', revision: timestamp, payload });
    } catch (e) {
      console.debug('BroadcastChannel send error:', e);
    }
  }

  // 2. Persist to localStorage
  try {
    localStorage.setItem('bv_platform_sync_rev', String(timestamp));
    localStorage.setItem('bv_platform_sync_payload', JSON.stringify(payload));
  } catch (e) {
    console.debug('LocalStorage write error:', e);
  }

  // 3. Post to backend dev server sync endpoint (tries current host, then sibling ports)
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const candidateUrls = [
    `${currentOrigin}/api/save-mock-data`,
    'http://localhost:5173/api/save-mock-data',
    'http://localhost:5174/api/save-mock-data',
    'http://localhost:5175/api/save-mock-data'
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return { success: true, revision: timestamp, origin: url };
      }
    } catch (e) {
      // Continue to next port
    }
  }

  return { success: true, revision: timestamp, fallback: true };
}

/**
 * Fetches the latest global platform sync state from the backend
 */
export async function fetchPlatformSyncState() {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const candidateUrls = [
    `${currentOrigin}/api/sync-data`,
    'http://localhost:5173/api/sync-data',
    'http://localhost:5174/api/sync-data',
    'http://localhost:5175/api/sync-data'
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {}
  }
  return null;
}

/**
 * React Hook to subscribe to cross-portal synchronization events
 */
export function usePlatformSyncListener(onSyncReceived) {
  const onSyncRef = useRef(onSyncReceived);
  onSyncRef.current = onSyncReceived;

  useEffect(() => {
    // 1. Listen on BroadcastChannel
    const handleBroadcast = (event) => {
      if (event.data?.type === 'PLATFORM_SYNC' && event.data.payload) {
        if (event.data.revision > lastKnownRevision) {
          lastKnownRevision = event.data.revision;
          onSyncRef.current?.(event.data.payload, event.data.revision);
        }
      }
    };

    if (channel) {
      channel.addEventListener('message', handleBroadcast);
    }

    // 2. Poller function for cross-port synchronization
    let isPolling = false;
    const pollServerState = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const syncState = await fetchPlatformSyncState();
        if (syncState && syncState.revision && syncState.revision > lastKnownRevision) {
          lastKnownRevision = syncState.revision;
          if (syncState.data) {
            onSyncRef.current?.(syncState.data, syncState.revision);
          }
        }
      } catch (err) {
        // Quietly fail during hot-reloading
      } finally {
        isPolling = false;
      }
    };

    // Initial check on mount
    pollServerState();

    // Poll every 2500ms
    const interval = setInterval(pollServerState, 2500);

    // Also poll whenever tab regains focus or visibility
    const handleFocus = () => pollServerState();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      if (channel) {
        channel.removeEventListener('message', handleBroadcast);
      }
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);
}
