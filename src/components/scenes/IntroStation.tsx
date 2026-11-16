import { PIECES, PLACEMENTS, STATION_SCALE, WORLD_WIDTH, WORLD_HEIGHT, placedCenter, pieceScale } from '../../game/world/stationLayout';
import { STATION_TEXTURE_URLS } from '../../game/world/stationAssets';

export function IntroStation() {
  return <svg className="intro-station" viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}>
    {[...PLACEMENTS].sort((a, b) => a.depth - b.depth).map((p, i) => {
      const c = placedCenter(p);
      const w = PIECES[p.piece].width * STATION_SCALE * pieceScale(p.piece);
      const h = PIECES[p.piece].height * STATION_SCALE * pieceScale(p.piece);
      return <image key={i} href={STATION_TEXTURE_URLS[p.piece]} x={-w / 2} y={-h / 2} width={w} height={h} transform={`translate(${c.x} ${c.y}) rotate(${p.angle}) scale(${p.flipX ? -1 : 1} ${p.flipY ? -1 : 1})`} />;
    })}
  </svg>;
}
