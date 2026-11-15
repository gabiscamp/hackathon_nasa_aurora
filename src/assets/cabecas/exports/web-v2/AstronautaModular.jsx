// AstronautaModular.jsx — uniforme NASA + cabeça trocável (rosto ou capacete), montados em tempo real.
// Arte desenhada por código (Agent Sprite Forge / codeart2d). Quadro do corpo 32x47 px, cabeça 32x26 px.
//
// <AstronautaModular cabeca="cabeca-3" capacete={false} acao="walk" direcao="up" scale={3} />
//   cabeca:   "cabeca-1" | "cabeca-2" | "cabeca-3" | "cabeca-4"   (o rosto de cada tripulante)
//   capacete: true -> desenha o capacete no lugar do rosto (exploração fora da nave)
//   acao:     "idle" | "walk"
//   direcao:  "down" (frente) | "up" (costas) | "right" | "left"
//   scale:    ampliação inteira; imagem nítida (pixelated)
//
// Como encaixa: cada quadro do corpo tem um ponto de encaixe (uniforme-nasa-head-anchors.json,
// atlasFrames[i] = quadro i de uniforme-nasa.json). A cabeça é desenhada em (anchor.x - pin.x, anchor.y - pin.y),
// na vista (front | side | back) que o próprio quadro declara. Pés do personagem: (16, 46).
import { useEffect, useState } from "react";
import bodyPng from "./uniforme-nasa.png";
import bodyAtlas from "./uniforme-nasa.json";
import anchors from "./uniforme-nasa-head-anchors.json";
import headsPng from "./cabecas.png";
import heads from "./cabecas.json";

const TAGS = Object.fromEntries(bodyAtlas.meta.frameTags.map((tag) => [tag.name, tag]));
export const CABECAS = heads.order.filter((name) => name !== "capacete");
export const DIRECOES = ["down", "up", "right", "left"];

function tagFor(acao, direcao) {
  const lado = direcao === "left" ? "right" : direcao;          // esquerda = direita espelhada
  return TAGS[`${acao}_${lado}`] ?? TAGS[`idle_${lado}`] ?? TAGS.idle_down;
}

export default function AstronautaModular({ cabeca = "cabeca-1", capacete = false, acao = "idle", direcao = "down", scale = 3, playing = true, style }) {
  const tag = tagFor(acao, direcao);
  const [index, setIndex] = useState(tag.from);
  const current = index >= tag.from && index <= tag.to ? index : tag.from;

  useEffect(() => setIndex(tag.from), [tag.name]);
  useEffect(() => {
    if (!playing || tag.from === tag.to) return undefined;
    const timer = setTimeout(() => setIndex(current < tag.to ? current + 1 : tag.from), bodyAtlas.frames[current].duration);
    return () => clearTimeout(timer);
  }, [current, tag, playing]);

  const body = bodyAtlas.frames[current].frame;
  const anchor = anchors.atlasFrames[current];
  const view = anchor.view;                                   // "front" | "side" | "back"
  const head = heads.heads[capacete ? "capacete" : cabeca]?.[view] ?? heads.heads["cabeca-1"][view];
  const pin = heads.pin[view];
  const sheet = (url, size, f) => ({
    backgroundImage: `url(${url})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${size.w * scale}px ${size.h * scale}px`,
    backgroundPosition: `${-f.x * scale}px ${-f.y * scale}px`,
    imageRendering: "pixelated",
  });
  const headsSize = { w: heads.frame[0] * heads.columns.length, h: heads.frame[1] * heads.order.length };

  return (
    <div
      role="img"
      aria-label={`astronauta ${capacete ? "de capacete" : cabeca} (${acao}, ${direcao})`}
      style={{ position: "relative", width: body.w * scale, height: body.h * scale,
               transform: direcao === "left" ? "scaleX(-1)" : undefined, ...style }}
    >
      <div style={{ position: "absolute", inset: 0, ...sheet(bodyPng, bodyAtlas.meta.size, body) }} />
      <div
        style={{
          position: "absolute",
          left: (anchor.x - pin[0]) * scale,
          top: (anchor.y - pin[1]) * scale,
          width: head.w * scale,
          height: head.h * scale,
          ...sheet(headsPng, headsSize, head),
        }}
      />
    </div>
  );
}
