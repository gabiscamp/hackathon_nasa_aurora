/**
 * Texture URLs for the station pieces. Built from src/assets/Nave/ by
 * scripts/build_station_assets.py (magenta keyed out, trimmed, scaled).
 */
import type { PieceKey } from './stationLayout';
import labUrl from '../../assets/station/lab.png';
import gymUrl from '../../assets/station/gym.png';
import kitchenUrl from '../../assets/station/kitchen.png';
import capsulesUrl from '../../assets/station/capsules.png';
import bathroomUrl from '../../assets/station/bathroom.png';
import dormitoryUrl from '../../assets/station/dormitory.png';
import nodeUrl from '../../assets/station/node.png';
import airlockUrl from '../../assets/station/airlock.png';
import trussUrl from '../../assets/station/truss.png';
import radiatorUrl from '../../assets/station/radiator.png';
import solarUrl from '../../assets/station/solar.png';

export const STATION_TEXTURE_URLS: Record<PieceKey, string> = {
  lab: labUrl,
  gym: gymUrl,
  kitchen: kitchenUrl,
  capsules: capsulesUrl,
  bathroom: bathroomUrl,
  dormitory: dormitoryUrl,
  node: nodeUrl,
  airlock: airlockUrl,
  truss: trussUrl,
  radiator: radiatorUrl,
  solar: solarUrl,
};

export function stationTextureKey(piece: PieceKey): string {
  return `station-${piece}`;
}
