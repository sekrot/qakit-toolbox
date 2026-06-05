import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Layout } from '@/components/Layout';
import { useSettings } from '@/storage/store';
import { HomeScreen } from './HomeScreen';
import { SettingsScreen } from './SettingsScreen';
import { ToolScreen } from './ToolScreen';
import { Onboarding } from './Onboarding';

export function App() {
  const onboarded = useSettings((s) => s.onboarded);
  const [hydrated, setHydrated] = useState(() => useSettings.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    return useSettings.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomeScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
            <Route path="tools/:toolId" element={<ToolScreen />} />
          </Route>
        </Routes>
        {hydrated && !onboarded && <Onboarding />}
      </HashRouter>
    </ThemeProvider>
  );
}
