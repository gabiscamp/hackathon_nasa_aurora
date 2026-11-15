/**
 * NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information) client.
 *
 * Reads coronal mass ejections (CMEs) whose WSA-ENLIL+Cone model run predicts an
 * arrival at Mars, plus geomagnetic storms (GST). Endpoints: /DONKI/CME and /DONKI/GST
 * on api.nasa.gov. If the request fails, callers fall back to DONKI_SNAPSHOT, which the
 * UI must label as "not live" (Space Apps challenge rule).
 *
 * Written with help from an AI assistant (Claude, Anthropic); see README "Use of AI".
 */

const API_BASE = 'https://api.nasa.gov/DONKI';
/** Free key from api.nasa.gov; set VITE_NASA_API_KEY on Vercel. DEMO_KEY is rate-limited per hour. */
const API_KEY: string = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
const REQUEST_TIMEOUT_MS = 8000;
const CME_WINDOW_DAYS = 30;
const GST_WINDOW_DAYS = 45;

/** One CME that DONKI predicts will reach Mars. */
export interface MarsCme {
  id: string;
  /** When the cloud left the Sun (ISO, UTC). */
  leftSunAt: string;
  /** Predicted arrival at Mars (ISO, UTC). Earliest of the model runs. */
  arrivesAt: string;
  /** km/s, from the most accurate analysis. */
  speedKmS: number;
  /** true when every model run says it only grazes Mars. */
  glancingBlow: boolean;
  link: string;
}

/** One geomagnetic storm measured at Earth. */
export interface GeoStorm {
  id: string;
  startedAt: string;
  /** Highest Kp index (0–9) during the storm. */
  maxKp: number;
  link: string;
}

export interface SpaceWeatherData {
  marsCmes: MarsCme[];
  storms: GeoStorm[];
  /** When the data was read from DONKI (ISO). */
  fetchedAt: string;
  /** Total CMEs DONKI listed in the window (not only Mars-bound ones). */
  totalCmes: number;
}

// --- Raw API shapes (only the fields we read) ---

interface RawImpact {
  location: string;
  arrivalTime: string;
  isGlancingBlow: boolean;
}

interface RawEnlil {
  impactList: RawImpact[] | null;
}

interface RawCmeAnalysis {
  isMostAccurate: boolean;
  speed: number | null;
  enlilList: RawEnlil[] | null;
}

export interface RawCme {
  activityID: string;
  startTime: string;
  link: string;
  cmeAnalyses: RawCmeAnalysis[] | null;
}

interface RawKp {
  kpIndex: number;
}

export interface RawGst {
  gstID: string;
  startTime: string;
  link: string;
  allKpIndex: RawKp[] | null;
}

/** Keeps only CMEs with a predicted Mars arrival; one entry per CME, newest first. */
export function parseMarsCmes(raw: RawCme[]): MarsCme[] {
  const result: MarsCme[] = [];

  for (const cme of raw) {
    const analysis = cme.cmeAnalyses?.find((a) => a.isMostAccurate);
    if (!analysis) continue;

    const impacts = (analysis.enlilList ?? [])
      .flatMap((run) => run.impactList ?? [])
      .filter((impact) => impact.location === 'Mars');
    if (impacts.length === 0) continue;

    const earliest = impacts.reduce((a, b) => (a.arrivalTime <= b.arrivalTime ? a : b));
    result.push({
      id: cme.activityID,
      leftSunAt: cme.startTime,
      arrivesAt: earliest.arrivalTime,
      speedKmS: Math.round(analysis.speed ?? 0),
      glancingBlow: impacts.every((impact) => impact.isGlancingBlow),
      link: cme.link,
    });
  }

  return result.sort((a, b) => b.leftSunAt.localeCompare(a.leftSunAt));
}

export function parseStorms(raw: RawGst[]): GeoStorm[] {
  return raw
    .map((gst) => ({
      id: gst.gstID,
      startedAt: gst.startTime,
      maxKp: Math.max(0, ...(gst.allKpIndex ?? []).map((k) => k.kpIndex)),
      link: gst.link,
    }))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

function isoDate(daysAgo: number, now: Date): string {
  const d = new Date(now.getTime() - daysAgo * 86_400_000);
  return d.toISOString().slice(0, 10);
}

async function getJson<T>(path: string, startDate: string, endDate: string, signal: AbortSignal): Promise<T[]> {
  const url = `${API_BASE}/${path}?startDate=${startDate}&endDate=${endDate}&api_key=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`DONKI ${path} answered ${res.status}`);
  const text = await res.text();
  // DONKI answers an empty body when there are no events in the window.
  if (text.trim() === '') return [];
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error(`DONKI ${path} did not return a list`);
  return data as T[];
}

/** Fetches live data from DONKI. Throws on network error, timeout or bad response. */
export async function fetchSpaceWeather(now: Date = new Date()): Promise<SpaceWeatherData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const end = isoDate(0, now);

  try {
    const [cmes, storms] = await Promise.all([
      getJson<RawCme>('CME', isoDate(CME_WINDOW_DAYS, now), end, controller.signal),
      getJson<RawGst>('GST', isoDate(GST_WINDOW_DAYS, now), end, controller.signal),
    ]);
    return {
      marsCmes: parseMarsCmes(cmes),
      storms: parseStorms(storms),
      fetchedAt: now.toISOString(),
      totalCmes: cmes.length,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Whole days a CME takes to travel from the Sun to Mars. */
export function travelDays(cme: MarsCme): number {
  const ms = new Date(cme.arrivesAt).getTime() - new Date(cme.leftSunAt).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}
