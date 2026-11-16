import { useEffect, useRef } from 'react';
import type { CrewTeam } from '../../data/crews';
import bodyUrl from '../../assets/cabecas/exports/web-v2/uniforme-nasa.png';
import bodyAtlas from '../../assets/cabecas/exports/web-v2/uniforme-nasa.json';
import anchors from '../../assets/cabecas/exports/web-v2/uniforme-nasa-head-anchors.json';
import headsUrl from '../../assets/cabecas/exports/equipes/cabecas.png';
import headsAtlas from '../../assets/cabecas/exports/equipes/cabecas.json';

/** The same uniform, heads and neck anchors as the in-game selected crew. */
export function IntroCrew({ heads, seated = false }: { heads: CrewTeam['heads']; seated?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    const body = new Image();
    const headImage = new Image();
    const load = (image: HTMLImageElement, url: string) => new Promise<void>((resolve, reject) => {
      image.onload = () => resolve(); image.onerror = reject; image.src = url;
    });
    void Promise.all([load(body, bodyUrl), load(headImage, headsUrl)]).then(() => {
      if (cancelled) return;
      const ctx = ref.current?.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      if (seated) {
        // Coordinates match the cockpit illustration's seat backs (1672 × 941).
        // Draw only the small crown of each rear-facing head above its headrest.
        const seats = [280, 660, 1045, 1415];
        Object.values(heads).forEach((id, index) => {
          const head = headsAtlas.heads[id].back;
          ctx.save();
          ctx.beginPath();
          ctx.rect(seats[index] - 32, 382, 64, 26);
          ctx.clip();
          ctx.drawImage(headImage, head.x, head.y, head.w, head.h, seats[index] - 32, 382, 64, 55);
          ctx.restore();
        });
        return;
      }
      const frame = bodyAtlas.frames[0].frame;
      const anchor = anchors.atlasFrames[0];
      const [pinX, pinY] = headsAtlas.pin.front;
      Object.values(heads).forEach((id, index) => {
        const x = index * 44 + 6;
        const head = headsAtlas.heads[id].front;
        ctx.drawImage(body, frame.x, frame.y, frame.w, frame.h, x, 8, frame.w, frame.h);
        ctx.drawImage(headImage, head.x, head.y, head.w, head.h, x + anchor.x - pinX, 8 + anchor.y - pinY, head.w, head.h);
      });
    }).catch(() => { /* Scenery and captions remain available if a sprite fails to load. */ });
    return () => { cancelled = true; };
  }, [heads, seated]);
  return <canvas ref={ref} className={seated ? 'intro-seated-crew' : 'intro-crew'} width={seated ? 1672 : 180} height={seated ? 941 : 60} />;
}
