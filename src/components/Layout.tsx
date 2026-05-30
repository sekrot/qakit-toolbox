import { Settings as SettingsIcon, Home } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/Button';

export function Layout() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '';

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          {t('appName')}
        </Link>
        <div className="flex items-center gap-1">
          {!isHome && (
            <Link to="/" aria-label={t('home')}>
              <Button variant="ghost" size="icon">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link to="/settings" aria-label={t('settings')}>
            <Button variant="ghost" size="icon">
              <SettingsIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
