import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/animations.css';
import App from './App.tsx';
import { validateMissions } from './engine/missionEngine';
import { ROOM_NAMES } from './components/hud/LocationHint';

// Development check of the mission data: broken follow-up links, rooms without a "!", choices with no crew.
if (import.meta.env.DEV) {
  for (const error of validateMissions(Object.keys(ROOM_NAMES))) console.error(`[missions] ${error}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
