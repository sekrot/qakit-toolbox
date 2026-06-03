import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getValue, removeValue, subscribe } from '@/storage/storage';

const PENDING_ROUTE_KEY = 'pending-route';

interface NavigateMessage {
  type: 'navigate';
  route: string;
}

/**
 * Watches for a route queued by the background service worker (in response
 * to a keyboard command) and navigates to it. Lives inside the Router so
 * it can use `useNavigate`.
 *
 * Three channels feed the same `navigate()` call:
 *   1. On mount, read the value once — covers the cold-start path where the
 *      panel was just opened by a command.
 *   2. chrome.storage.onChanged subscription — covers the already-open panel.
 *   3. chrome.runtime.onMessage listener — covers the race where the storage
 *      subscription was registered a moment after the background's write.
 */
export function PendingRouteWatcher() {
  const navigate = useNavigate();

  useEffect(() => {
    const consume = async () => {
      const route = await getValue<string | null>(PENDING_ROUTE_KEY, null);
      if (route) {
        navigate(route);
        await removeValue(PENDING_ROUTE_KEY);
      }
    };

    void consume();
    const unsubStorage = subscribe<string | null>(PENDING_ROUTE_KEY, (next) => {
      if (next) void consume();
    });

    const onMessage = (message: unknown) => {
      const msg = message as Partial<NavigateMessage> | null;
      if (msg?.type === 'navigate' && typeof msg.route === 'string') {
        navigate(msg.route);
        void removeValue(PENDING_ROUTE_KEY);
      }
    };
    chrome.runtime.onMessage.addListener(onMessage);

    return () => {
      unsubStorage();
      chrome.runtime.onMessage.removeListener(onMessage);
    };
  }, [navigate]);

  return null;
}
