import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getValue, removeValue, subscribe } from '@/storage/storage';

const PENDING_ROUTE_KEY = 'pending-route';

/**
 * Watches chrome.storage for a route queued by the background service
 * worker (in response to a keyboard command) and navigates to it. Lives
 * inside the Router so it can use `useNavigate`.
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
    // On mount: side panel was just opened by a command — pick it up.
    void consume();
    // Already-open side panel: react to background writes live.
    return subscribe<string | null>(PENDING_ROUTE_KEY, (next) => {
      if (next) void consume();
    });
  }, [navigate]);

  return null;
}
