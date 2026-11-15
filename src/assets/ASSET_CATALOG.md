# Catálogo de Assets — Aurora Station

Regras: `docs/ART_DIRECTION.md`. Processo: skill `starship-art-studio`.

**Estados:** `Pendente` → `Em produção` → `Aprovado` → `Integrado`
**Legenda de origem:** `(0.5,1)` = centro da base · `(0.5,0.9375)` = pés do personagem · `(0,0)` = canto superior esquerdo.
Dimensões em **1x** (o jogo carrega 1x). O master fica em `_source/` com o dobro do tamanho.
Dimensões marcadas com **(prov.)** são provisórias e só valem depois que o blockout `MAP-001` for aprovado.

Assets integrados: ver a seção no fim do arquivo (MAP-002, CHR-020, CHR-030/031). A direção criativa é do time. Única imagem gerada com IA: o mapa `MAP-002`, com marca d'água no jogo.

---

## Resumo

| Conjunto | Total | Pendente | Em produção | Aprovado | Integrado |
|---|---|---|---|---|---|
| 1 Cenário e escala | 8 | 8 | 0 | 0 | 0 |
| 2 Objetos | 30 | 30 | 0 | 0 | 0 |
| 3 Personagens | 8 | 8 | 0 | 0 | 0 |
| 4 Spritesheets | 15 | 15 | 0 | 0 | 0 |
| 5 Interface | 20 | 20 | 0 | 0 | 0 |

---

## Conjunto 1 — Cenário e escala

| ID | Nome / arquivo | Categoria | Dimensões | Formato | Alpha | Origem | Orientação | Uso | Animação | Fonte | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MAP-001 | `tilemaps/ship.json` (blockout) | tilemap | 32×18 tiles (1536×864) | Tiled JSON | — | (0,0) | nave aponta para leste | layout, colisão e escala | — | — | Pendente |
| TIL-001 | `tilesets/ship-interior.png` + `-extruded.png` | tileset | 768×480 (16×10 tiles de 48) (prov.) | PNG-32 | sim | (0,0) | luz NO | piso (4 var.), paredes topo e face, cantos, molduras de porta, faixas de corredor, decalques | — | — | Pendente |
| TIL-002 | `tilesets/ship-hull.png` + `-extruded.png` | tileset | 480×384 (10×8 tiles) (prov.) | PNG-32 | sim | (0,0) | luz NO | borda externa do casco e chanfros | — | — | Pendente |
| ENV-001 | `environments/env-space-stars.png` | environment | 512×512, tileável | PNG-24 | não | (0,0) | — | fundo, TileSprite scrollFactor 0,05 | — | — | Pendente |
| ENV-002 | `environments/env-space-nebula.png` | environment | 1920×1080 | WebP q90 | não | (0.5,0.5) | — | camada de nebulosa, scrollFactor 0,1 | — | — | Pendente |
| ENV-003 | `environments/env-mars.png` | environment | 768×768 | PNG-32 | sim | (0.5,0.5) | luz NO | planeta no canto inferior esquerdo, scrollFactor 0,2 | rotação lenta via tween | — | Pendente |
| ENV-004 | `environments/env-asteroids.png` | environment | 4 quadros 96×96 (384×96) | PNG-32 | sim | (0.5,0.5) | luz NO | asteroides à deriva | tween de deriva e rotação | — | Pendente |
| ENV-005 | `environments/env-hull-engines.png` / `env-hull-nose.png` | environment | 240×576 / 288×480 (prov.) | PNG-32 | sim | (0,0) | oeste / leste | bloco de propulsores e nariz de vidro | brilho via FX-001 | — | Pendente |

## Conjunto 2 — Objetos do cenário (dimensões provisórias até MAP-001)

| ID | Nome / arquivo | Sala | Dimensões | Alpha | Origem | Colisão (pegada) | Interativo | Animação | Estado |
|---|---|---|---|---|---|---|---|---|---|
| OBJ-100 | `obj-bridge-nav-console.png` (**piloto**) | Ponte | 192×120 | sim | (0.5,1) | 4×1,5 tiles | sim | telas via FX-101 | Pendente |
| OBJ-101 | `obj-bridge-pilot-chair.png` | Ponte | 48×72 | sim | (0.5,1) | 1×1 | não | — | Pendente |
| OBJ-102 | `obj-bridge-viewport.png` | Ponte | 288×96 | sim | (0.5,1) | parede | não | estrelas via FX-102 | Pendente |
| OBJ-103 | `obj-bridge-comms.png` | Ponte | 48×96 | sim | (0.5,1) | 1×1 | sim | LED | Pendente |
| OBJ-110 | `obj-quarters-bed.png` | Alojamento | 96×120 | sim | (0.5,1) | 2×2 | sim (descansar) | — | Pendente |
| OBJ-111 | `obj-quarters-locker.png` | Alojamento | 48×96 | sim | (0.5,1) | 1×1 | sim | — | Pendente |
| OBJ-112 | `obj-quarters-rug.png` | Alojamento | 96×72 | sim | (0.5,0.5) | nenhuma (piso) | não | — | Pendente |
| OBJ-113 | `obj-quarters-poster.png` | Alojamento | 48×48 | sim | (0.5,1) | nenhuma (parede) | não | — | Pendente |
| OBJ-200 | `obj-lab-console.png` (**piloto lab**) | Laboratório | 144×96 | sim | (0.5,1) | 3×1 | sim | tela | Pendente |
| OBJ-201 | `obj-lab-containment-tank.png` | Laboratório | 96×144 | sim | (0.5,1) | 2×1 | sim | bolhas via FX-203 | Pendente |
| OBJ-202 | `obj-lab-sample-shelf.png` | Laboratório | 96×120 | sim | (0.5,1) | 2×1 | não | — | Pendente |
| OBJ-203 | `obj-lab-table.png` | Laboratório | 96×72 | sim | (0.5,1) | 2×1 | sim | — | Pendente |
| OBJ-300 | `obj-storage-crate-s/m/l.png` | Depósito | 48×48 / 48×72 / 96×96 | sim | (0.5,1) | 1×1 / 1×1 / 2×1,5 | não | — | Pendente |
| OBJ-301 | `obj-storage-shelf.png` | Depósito | 96×120 | sim | (0.5,1) | 2×1 | não | — | Pendente |
| OBJ-302 | `obj-storage-terminal.png` | Depósito | 48×96 | sim | (0.5,1) | 1×1 | sim | tela | Pendente |
| OBJ-400 | `obj-med-bed.png` | Enfermaria | 96×96 | sim | (0.5,1) | 2×1,5 | sim | — | Pendente |
| OBJ-401 | `obj-med-cabinet.png` | Enfermaria | 48×96 | sim | (0.5,1) | 1×1 | sim | — | Pendente |
| OBJ-402 | `obj-med-diagnostic.png` | Enfermaria | 96×96 | sim | (0.5,1) | 2×1 | sim | tela | Pendente |
| OBJ-403 | `obj-med-floor-cross.png` | Enfermaria | 96×96 | sim | (0.5,0.5) | nenhuma | não | — | Pendente |
| OBJ-500 | `obj-common-table.png` | Sala comum | 144×96 | sim | (0.5,1) | 3×1,5 | sim | — | Pendente |
| OBJ-501 | `obj-common-stool.png` | Sala comum | 48×48 | sim | (0.5,1) | 0,5×0,5 | não | — | Pendente |
| OBJ-502 | `obj-common-kitchen.png` | Sala comum | 192×96 | sim | (0.5,1) | 4×1 | sim (comer) | — | Pendente |
| OBJ-503 | `obj-common-fridge.png` | Sala comum | 48×96 | sim | (0.5,1) | 1×1 | sim | — | Pendente |
| OBJ-600 | `obj-eng-reactor.png` | Engenharia | 144×168 | sim | (0.5,1) | 3×2 | sim | pulso via FX-601 | Pendente |
| OBJ-601 | `obj-eng-pipe-panel.png` | Engenharia | 96×96 | sim | (0.5,1) | parede | sim (consertar) | — | Pendente |
| OBJ-602 | `obj-eng-tool-rack.png` | Engenharia | 96×96 | sim | (0.5,1) | 2×1 | não | — | Pendente |
| OBJ-900 | `obj-plant-a.png` / `obj-plant-b.png` | Geral | 48×72 | sim | (0.5,1) | 1×1 | não | balanço leve via tween | Pendente |
| OBJ-901 | `obj-door.png` (spritesheet) | Geral | 6 quadros 96×96 (576×96) | sim | (0.5,1) | 2×1 quando fechada | automática | abrir/fechar 12 fps, sem loop; LED vermelho = trancada | Pendente |
| FX-101 | `effects/fx-screen-glow.png` | Efeito | 4 quadros 64×64 | sim | (0.5,0.5) | — | — | 6 fps, loop, ADD | Pendente |
| FX-203 | `effects/fx-tank-bubbles.png` / `fx-reactor-pulse.png` (FX-601) | Efeito | 8 quadros 64×128 / 6 quadros 128×128 | sim | (0.5,1) / (0.5,0.5) | — | — | 10 fps / 8 fps, loop, ADD | Pendente |

## Conjunto 3 — Personagens

| ID | Nome / arquivo | Dimensões | Uso | Estado |
|---|---|---|---|---|
| CHR-001 | `characters/_source/commander-turnaround.png` | 3 poses, master livre (guia) | referência para spritesheets | Pendente |
| CHR-002 | `characters/_source/kira-turnaround.png` (**piloto**) | idem | idem | Pendente |
| CHR-003 | `characters/_source/leo-turnaround.png` | idem | idem | Pendente |
| CHR-004 | `characters/_source/maya-turnaround.png` | idem | idem | Pendente |
| CHR-011..014 | `characters/portrait-{commander,kira,leo,maya}.png` | 160×160, PNG-32, alpha | HUD 64 px, diálogo 80 px, CrewPanel | Pendente |

## Conjunto 4 — Spritesheets (grade 48×64, linhas: baixo, esquerda, direita, cima; origem (0.5,0.9375))

| ID | Arquivo | Dimensões | Quadros | FPS | Loop | Estado |
|---|---|---|---|---|---|---|
| SPR-0x1 | `characters/{id}-idle.png` × 4 personagens | 192×256 | 4×4 | 6 | sim | Pendente |
| SPR-0x2 | `characters/{id}-walk.png` × 4 | 288×256 | 6×4 | 10 | sim | Pendente |
| SPR-0x3 | `characters/{id}-interact.png` × 4 | 192×256 | 4×4 | 8 | não | Pendente |
| SPR-004 | `characters/commander-{idle,walk,interact}-tint.png` | mesmas grades | região de acento em escala de cinza | — | — | Pendente |
| FX-401 | `effects/fx-shadow-ellipse.png` | 32×12 | 1 | — | — | Pendente |
| FX-402 | `effects/fx-step-dust.png` | 4 quadros 32×32 | 4 | 12 | não | Pendente |

(As 3 linhas SPR-0x1..0x3 somam 12 arquivos; com SPR-004 e os 2 FX, o total é 15.)

## Conjunto 5 — Interface (React/DOM: exportar 2x do tamanho CSS)

| ID | Arquivo | Dimensões (arquivo) | Uso | Estado |
|---|---|---|---|---|
| UI-001..004 | `ui/icon-res-{energy,oxygen,shielding,health}.png` | 48×48 (CSS 24) | barras de recurso (ver nota) | Pendente |
| UI-010..015 | `ui/icon-item-{backpack,laptop,medkit,wrench,map,settings}.png` | 80×80 (CSS 40) | slots do inventário | Pendente |
| UI-020 | `ui/icon-mission.png` | 64×64 (CSS 32) | painel de missão | Pendente |
| UI-021 | `ui/hud-portrait-frame.png` | 144×144 (CSS 72), 9-slice | moldura do retrato | Pendente |
| UI-022 | `ui/hud-slot.png` / `hud-slot-active.png` | 96×96 (CSS 48) | slot do inventário | Pendente |
| UI-023 | `ui/hud-compass.png` | 200×200 (CSS 100) | minimapa / bússola | Pendente |
| UI-024 | `ui/hud-key-e.png` | 48×48 (CSS 24) | prompt "[E]" | Pendente |
| UI-025 | `ui/hud-dialogue-frame.png` | 9-slice 96×96 | caixa de diálogo | Pendente |
| FX-501 | `effects/fx-interact-highlight.png` | 4 quadros 128×128 | brilho âmbar de proximidade (Phaser) | Pendente |
| FX-502 | `effects/fx-alert-pulse.png` | 6 quadros 128×128 | alerta vermelho | Pendente |

> Nota: `CLAUDE.md` cita os recursos saúde, energia, oxigênio e comida, mas `useResourceStore.ts` usa energy, oxygen e shielding. Confirmar a lista final antes do Conjunto 5.

---

## Fichas detalhadas

Quando um asset passa para **Em produção**, crie aqui a ficha completa no formato da skill (§4) e anexe o relatório de QA ao aprovar.

---

## Integrados fora do pipeline (fornecidos pelo time em 2026-11-15)

| ID | Arquivo no jogo | Original | Dimensões | Uso | Fonte | Estado |
|---|---|---|---|---|---|---|
| MAP-002 | `public/assets/environments/station-map.png` | `assets/environments/_source/station-map-original.png` | 1600×800, PNG RGBA (fundo magenta removido) | Mapa da estação; piso navegável em `src/game/world/shipLayout.ts` | **Gerado com IA**, guiado pelo time a partir da planta da ISS | Integrado (com marca d'água) |
| ENV-002 | `public/assets/environments/mars-backdrop.jpg` | `src/assets/environments/_source/mars-backdrop-original.png` | 1672×941, JPEG q86 (~180 KB; original PNG 1,9 MB) | Fundo atrás da nave: órbita de Marte. Fixo na tela (não rola com o mapa), cobre a tela inteira, filtro linear. Também é o fundo do mapa grande (M) | Fornecido pelo time (origem a confirmar: se for IA, precisa de marca d'água) | Integrado |
| CHR-020 | `public/assets/characters/cmdr-mcclain-walk.png` | `assets/characters/_source/cmdr-mcclain-sheet-original.png` | 160×192, 4×4 quadros de 40×48 no tamanho nativo do pixel art, linhas: baixo, esquerda, direita, cima; pés em y=46 | Comandante Anne McClain (jogador), escala 1, filtro nearest | Pixel art do time, feita no Aseprite | Integrado |

Observação MAP-002: imagem gerada com IA (ChatGPT, OpenAI; confirmado pelo time em 2026-11-15). O time partiu da planta da ISS e foi guiando a geração. Pela regra do briefing, imagens de IA levam marca d'água visível: o `GameScene.addAiWatermark()` repete "AI-generated map" sobre o mapa, abaixo dos personagens. O uso está declarado em "Use of AI" na tela de créditos.

Observação CHR-020: feito à mão no Aseprite (não é IA), então não precisa de marca d'água. Creditados na tela de créditos. Estilo oficial atualizado para pixel art (ART_DIRECTION §0).

| CHR-030 | `src/assets/cabecas/exports/web-v2/uniforme-nasa.png` + `.json` + `uniforme-nasa-head-anchors.json` | `src/assets/cabecas/` (spec, master) | 27 quadros 32×47: idle/walk para baixo, cima e direita (esquerda = direita espelhada); pés em (16,46) | Corpo do astronauta modular (jogador sem folha própria e todos os tripulantes) | Pixel art do time (confirmar ferramenta, ver nota) | Integrado |
| CHR-031 | `src/assets/cabecas/exports/web-v2/cabecas.png` + `cabecas.json` | `src/assets/cabecas/master/` | 5 cabeças × 3 vistas, 32×26; pino do pescoço por vista | Rostos: cabeca-1 (loira), cabeca-2 (castanho), cabeca-3 (crespo), cabeca-4 (ruiva) e capacete; atribuição por astronauta em `src/data/astronauts.ts` (campo `head`) | Pixel art do time (confirmar ferramenta, ver nota) | Integrado |

Nota CHR-030/031: montados em tempo de carga por `src/game/world/modularAstronaut.ts` (uma folha por rosto). Origem confirmada pelo time (2026-11-15): corpo e cabeças desenhados à mão no Aseprite por um integrante do time. A arte também passou por IA, apenas como opção para melhorar a qualidade: o time informou o ChatGPT (2026-11-15); o cabeçalho de `AstronautaModular.jsx` cita "Agent Sprite Forge / codeart2d" (confirmar se também foi usado). Os pixels são do time, e `heads-manual.json` registra os ajustes manuais. Essa passagem pela IA está declarada em "Use of AI" na tela de créditos. Se algum PNG final tiver saído diretamente da IA, aplicar a marca d'água exigida pelo briefing.
