import { HashRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Layout } from '@/components/Layout';
import { HomeScreen } from './HomeScreen';
import { SettingsScreen } from './SettingsScreen';
import { ToolScreen } from './ToolScreen';

export function App() {
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
      </HashRouter>
    </ThemeProvider>
  );
}
