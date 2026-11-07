import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useSettingsStore } from './stores/settingsStore';

// Apply initial theme before rendering to avoid flash
useSettingsStore.getState().applyTheme();

createRoot(document.getElementById('root')!).render(<App />);
