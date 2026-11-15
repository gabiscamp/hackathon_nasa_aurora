import { create } from 'zustand';
import { fetchSpaceWeather, type SpaceWeatherData } from '../services/donki';
import { DONKI_SNAPSHOT } from '../data/donkiSnapshot';

/**
 * Space weather from NASA DONKI, shared by any screen or mission that needs it.
 * 'live'    → read from api.nasa.gov in this session.
 * 'offline' → the request failed; showing DONKI_SNAPSHOT, which must be labeled NOT LIVE.
 *
 * Written with help from an AI assistant (Claude, Anthropic).
 */
export type SpaceWeatherStatus = 'idle' | 'loading' | 'live' | 'offline';

interface SpaceWeatherState {
  status: SpaceWeatherStatus;
  data: SpaceWeatherData;
  load: () => Promise<void>;
}

const CACHE_KEY = 'aurora-donki-cache';
/** Reuse a live answer for an hour so replays don't burn the DEMO_KEY hourly limit. */
const CACHE_TTL_MS = 60 * 60 * 1000;

function readCache(): SpaceWeatherData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as SpaceWeatherData;
    if (Date.now() - new Date(cached.fetchedAt).getTime() > CACHE_TTL_MS) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeCache(data: SpaceWeatherData): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage blocked (private window etc.) — the game works without the cache.
  }
}

export const useSpaceWeatherStore = create<SpaceWeatherState>()((set, get) => ({
  status: 'idle',
  data: DONKI_SNAPSHOT,

  load: async () => {
    const { status } = get();
    if (status === 'loading' || status === 'live') return;

    const cached = readCache();
    if (cached) {
      set({ status: 'live', data: cached });
      return;
    }

    set({ status: 'loading' });
    try {
      const data = await fetchSpaceWeather();
      writeCache(data);
      set({ status: 'live', data });
    } catch (err) {
      console.warn('[DONKI] live data unavailable, using offline backup:', err);
      set({ status: 'offline', data: DONKI_SNAPSHOT });
    }
  },
}));
