---
name: starship-art-studio
description: Direção de arte e pipeline de produção de assets 2D originais do Starship Explorer (Aurora Station) — cenários, tilesets, personagens chibi, spritesheets, objetos, ícones, UI e efeitos. Use antes de criar, encomendar, gerar, revisar, aprovar ou integrar qualquer imagem do jogo, ao escrever briefs/prompts de geração de imagem, ao definir dimensões/origem/grade de um asset, e ao atualizar assets/ASSET_CATALOG.md.
---

# Starship Art Studio

Esta skill transforma o Claude no **diretor de arte e produtor técnico de assets** do jogo. Ela **não gera imagens**: orienta quem gera (ferramenta de IA conectada, artista humano ou ambos), especifica cada asset com rigor técnico, revisa o resultado e controla o catálogo.

Documentos obrigatórios:

| Documento | Para quê |
|---|---|
| `docs/ART_DIRECTION.md` | **Lei visual**: escala, perspectiva, paleta, luz, materiais, proporções, regras de spritesheet. Leia antes de todo trabalho. |
| `assets/ASSET_CATALOG.md` | Registro de cada asset, sua especificação e seu estado. |
| `.claude/skills/spaceship-game-design/SKILL.md` | Layout de salas, HUD, tipografia e identidade da tripulação. |
| `references/wireframe/spaceship-reference-0{1,2}.png` | Ref. 01 = acabamento pintado. Ref. 02 = layout e escala (primária). |

---

## 1. Capacidade real de geração de imagens (levantamento de 2026-11-14)

Investigação feita neste ambiente:

| Verificado | Resultado |
|---|---|
| Ferramentas nativas do Claude Code | **Nenhuma gera imagens.** O Claude produz texto e código. Ele **consegue ver imagens** (ferramenta Read), o que serve para análise de referências e QA visual. |
| Servidores MCP locais (`~/.claude.json`, `.mcp.json`) | **Nenhum configurado.** |
| Conectores claude.ai ativos | Claude Docs, Google Drive e Google Docs. **Nenhum gera imagens.** O Drive pode servir para receber entregas de um artista. |
| Chaves de API de provedores de imagem no ambiente | **Nenhuma.** |
| Ferramentas locais | Sem ImageMagick (o `convert.exe` presente é o utilitário de disco do Windows, **não** o ImageMagick), sem Krita, Aseprite ou ComfyUI. Node.js LTS foi instalado em 2026-11-14. |

**Conclusão: hoje não existe gerador de imagens conectado.** Enquanto isso não mudar:

- **Não** produza SVG, canvas, CSS ou desenho procedural afirmando que é arte pintada. Placeholders geométricos são permitidos só no código, marcados `// TODO: replace with real asset`, e **nunca** entram no catálogo como "Aprovado".
- **Não** invente ferramentas, MCPs ou nomes de modelo. Se não há ferramenta, diga isso.
- O trabalho possível agora é: briefs, prompts, especificações, catálogo, revisão de imagens entregues e scripts de verificação.

### 1.1 Integrações reais propostas (escolha do time)

| Rota | Como funciona | Consistência de estilo | Requer |
|---|---|---|---|
| **A. API de geração + script local** (recomendada para hackathon) | Script Node em `tools/art/generate.mjs` lê o brief do catálogo e envia o prompt **com imagens de referência aprovadas**. Candidatos reais: OpenAI Images API (família `gpt-image`, aceita fundo transparente e edição com imagens de referência), Google Gemini (modelos de imagem com edição multi-referência), Replicate/fal.ai hospedando FLUX/FLUX Kontext (aceita LoRA de estilo). | Boa com referências; ótima com LoRA treinada nos primeiros assets aprovados. | Chave em `.env.local` (já ignorado pelo git), orçamento, conferir nome e preço do modelo **no dia da integração**. |
| **B. Servidor MCP de imagem** | Um servidor MCP que embrulha uma das APIs acima, adicionado com `claude mcp add`. O Claude passa a chamar a geração como ferramenta. | Igual à da API por baixo. | Mesma chave. Auditar o código do servidor antes de instalar, porque ele recebe a chave. |
| **C. Local (ComfyUI + SDXL/FLUX + LoRA + ControlNet)** | Geração na máquina, com ControlNet para travar pose e perspectiva. | A melhor, se houver LoRA. | GPU com ≥ 12 GB de VRAM e tempo de setup. |
| **D. Artista humano (Krita, gratuito)** | O Claude escreve os briefs e faz QA. O artista pinta. | Total. | Pessoa no time. |

**Rota recomendada:** A para gerar bases e conceitos, mais **pintura por cima e recorte** (rota D leve) em Krita. Motivo: modelos de imagem **não** entregam de forma confiável quadros de animação alinhados, tiles com encaixe perfeito, perspectiva idêntica entre gerações nem transparência limpa. Esses pontos sempre passam por limpeza manual e pela verificação da §6.

Antes de usar IA, **confirme as regras do NASA Space Apps sobre uso e declaração de IA generativa** e os termos de licença comercial do provedor. Registre o provedor e o modelo de cada asset no catálogo (coluna "Fonte").

Para ativar a rota A ou B, o time precisa fornecer: (1) provedor escolhido, (2) chave de API, (3) teto de gasto. Só então o Claude escreve o script ou configura o MCP.

---

## 2. Escala e câmera (resumo; detalhes em ART_DIRECTION §2)

```
Canvas lógico ......... 1280 × 720 (Scale.FIT, antialias, pixelArt:false)
TILE_SIZE ............. 48 px (1x no jogo)  | master 96 px (2x)
Quadro de personagem .. 48 × 64             | personagem ~56 px de altura
Origem do personagem .. (0.5, 0.9375)       | pé em y=60
Mapa .................. 32 × 18 tiles = 1536 × 864
Câmera ................ zoom 1.0, follow lerp 0.1, bounds = mapa
Múltiplo mínimo ....... 24 px (meio tile) para assets de mundo
```

Nunca escolha uma resolução fora dessa grade. Se um asset parecer precisar de outra, quem muda é a especificação (em ART_DIRECTION), não o asset isolado.

**Masters vs. arquivos do jogo:** pinte e guarde em **2x** em `assets/<categoria>/_source/` e exporte **1x** para `assets/<categoria>/`. O jogo carrega apenas 1x.

**Integração com o Vite (tarefa futura de programação):** o Vite serve estáticos de `public/`. Na hora de integrar, ou se aponta `publicDir` para `assets/` ou se copiam os exports para `public/assets/`. Essa decisão é da tarefa de integração, não desta skill.

---

## 3. Ordem de produção: conjuntos visuais

Nunca produza assets soltos. Trabalhe **um conjunto por vez**, cada um com revisão de conjunto antes de avançar:

| # | Conjunto | Conteúdo | Portão de saída |
|---|---|---|---|
| 1 | **Cenário e escala** | Blockout do mapa em Tiled (`MAP-001`) com tiles cinza de 48 px, tileset do interior, fundo espacial, casco exterior. | Personagem-placeholder 48×64 andando no blockout prova corredores, portas e proporções. Layout aprovado. |
| 2 | **Objetos do cenário** | Móveis e equipamentos sala por sala, mais os efeitos ambientais (brilho de tela, bolhas do tanque, pulso do reator). | Cada sala montada parece a referência e passa no teste de "identificar sem rótulo". |
| 3 | **Personagens** | Turnaround (frente, costas, perfil) e retrato de cada tripulante. | 4 silhuetas distintas, escala batendo com móveis aprovados. |
| 4 | **Spritesheets** | idle, walk e interact × 4 direções, folha de tinta do Comandante, sombra e poeira de passos. | Pés fixos em y=60, ciclo sem salto, legível em 1x. |
| 5 | **Interface** | Ícones de recursos e inventário, molduras de HUD, prompt de interação, bússola e efeitos de UI. | HUD < 20% da tela, contraste WCAG AA, ícone legível a 24 px. |

Dentro de cada conjunto: **1 asset-piloto → aprovação → resto do conjunto** usando o piloto como imagem de referência. Exemplos de piloto: a placa de piso no Conjunto 1, o console da ponte no 2, Kira no 3.

---

## 4. Ficha técnica obrigatória

Todo asset tem esta ficha no catálogo **antes** de entrar em produção:

```markdown
### OBJ-201 — Tanque de contenção do laboratório
- Categoria: objects / lab
- Arquivo: assets/objects/obj-lab-containment-tank.png  (master: assets/objects/_source/obj-lab-containment-tank@2x.kra)
- Dimensões 1x: 96 × 144 px  (pegada 2×1 tiles + 2 tiles de altura visível)
- Formato: PNG-32 RGBA
- Transparência: sim (fundo); o vidro é pintado opaco com reflexo
- Ponto de origem: (0.5, 1) — centro da base da pegada
- Corpo de colisão: 96 × 48 alinhado à base (offset 0, 96)
- Orientação: face frontal voltada ao sul; luz do noroeste
- Uso no jogo: Laboratório, parede norte; interativo ("[E] Analisar amostra")
- Animação: base estática + efeito separado FX-203 (bolhas, 8 quadros, 10 fps, loop, blend ADD)
- Depende de: TIL-001 (piso), OBJ-200 (piloto do conjunto lab)
- Fonte: (rota A/C/D + modelo/autor)
- Estado: Pendente
```

### Fórmulas de dimensão (1x)

| Tipo | Largura | Altura | Origem |
|---|---|---|---|
| Tile | 48 | 48 | (0,0), grade do Tiled |
| Objeto | `pegadaL × 48` | `(pegadaP + alturaVisível) × 48`, arredondado a 24 | (0.5, 1) |
| Personagem (quadro) | 48 | 64 | (0.5, 0.9375) |
| Efeito | potência de 2 (32, 64, 128) por quadro | idem | (0.5, 0.5) |
| Ícone de UI | renderizado pelo React, exportar **2x** do tamanho CSS (ícone de slot 40 px → arquivo 80×80) | — | n/a |
| Retrato | 160 × 160 (2x do maior uso, 80 px no diálogo) | — | n/a |

A UI é DOM (React), não canvas, por isso usa 2x para telas HiDPI. O mundo é canvas 1280×720, por isso usa 1x.

---

## 5. Como escrever briefs e prompts

### 5.1 Bloco de estilo fixo (copiar sempre, sem editar)

```
STYLE: hand-painted 2D game illustration, top-down 3/4 oblique view (~30° from overhead,
orthographic, no vanishing point), cozy sci-fi space station interior, soft painted textures
with visible gentle brushwork, soft blue-violet ambient light with warm amber light pools and
cyan screen glow, key light from upper-left, soft dark colored outlines (never pure black),
rounded friendly shapes, premium indie game finish, palette: cream-beige hull #8b7b6b,
floor #9a8f82, dark metal #2e3850, cyan #4dc9f6, amber #f5a623, violet #8b5cf6.
AVOID: flat vector, 3D render, photorealism, isometric diamond grid, text,
letters, logos, watermark, cast shadows on background, cropped edges.
```

### 5.2 Exemplo de objeto (Conjunto 2)

```
[STYLE block]
SUBJECT: a single laboratory containment tank: tall glass cylinder filled with glowing
cyan liquid and a small floating violet crystal sample, dark metal base and cap with
cream panels, two small cyan LEDs facing the viewer.
FRAMING: one object, centered, full object visible with generous empty margin,
front face toward the viewer, isolated on transparent background.
CONSISTENCY: match the material, outline and lighting of the attached reference images
(approved: OBJ-200 lab console, TIL-001 floor).
OUTPUT: 1024×1536, transparent background.
```

Pós-processo obrigatório: recortar, reduzir para o master 2x (192×288), conferir perspectiva sobre o piso, exportar 1x (96×144).

### 5.3 Exemplo de personagem (Conjunto 3: turnaround)

```
[STYLE block]
SUBJECT: chibi character, 2.5 heads tall, "Kira Santos", flight engineer: brown hair in a
high ponytail, warm brown skin, navy jumpsuit #2f4180 with cream trims and amber #f5a623
accents, tool belt, thick gloves, friendly confident smile, big expressive eyes.
LAYOUT: character turnaround sheet, same character 3 times side by side on transparent
background: facing down (toward viewer), facing left, facing up (back). Same scale, same
ground line, top-down 3/4 view as in a top-down game.
CONSISTENCY: match proportions of attached reference (spaceship-reference-01.png, crew).
```

O turnaround é **guia**, não spritesheet. Os quadros de animação são montados e limpos manualmente sobre a grade 96×128 (2x).

### 5.4 Exemplo de textura para tileset (Conjunto 1)

```
[STYLE block]
SUBJECT: seamless square floor texture of a spaceship corridor: one large metal-composite
floor plate in warm grey-beige #9a8f82 with subtle painted wear and a thin recessed seam on
the edges, viewed straight from above (floor only, no walls).
OUTPUT: 1024×1024, seamlessly tileable on all sides.
```

Depois: reduzir para 96×96 (2x), testar em mosaico 4×4, criar 3–4 variações de valor e montar o tileset.

---

## 6. Controle de qualidade (aprovar só se TUDO passar)

### 6.1 Checklist

| # | Verificação | Como |
|---|---|---|
| 1 | Direção de arte | Comparar lado a lado com refs e com assets aprovados do conjunto: perspectiva 3/4, luz noroeste, paleta (§4 de ART_DIRECTION), contorno colorido. Pixel art no padrão de ART_DIRECTION §0; nada de vetor chapado ou 3D. |
| 2 | Resolução | Dimensões **exatamente** iguais à ficha, nos dois arquivos (1x e 2x). Sem upscale de imagem pequena (bordas borradas = reprovado). |
| 3 | Formato real | Os bytes iniciais são `89 50 4E 47` (PNG). Extensão `.png` com JPEG dentro é reprovação. As referências do projeto têm exatamente esse defeito. |
| 4 | Transparência | Canal alpha presente. Fundo 100% transparente sem resíduo de cor (halo branco ou xadrez "fake" pintado). Bordas antialiasadas sem franja clara. |
| 5 | Nada cortado | Nenhum pixel opaco tocando a borda, com folga ≥ 2 px (1x) em sprites e objetos. Tiles são a exceção: **devem** tocar a borda. |
| 6 | Grade | Tileset: largura e altura múltiplas de 48 e encaixe sem costura em mosaico 3×3. Spritesheet: largura = colunas×48 e altura = 4×64, pé em y=60 e x=24 em todos os quadros. |
| 7 | Consistência | Escala do personagem versus porta (2 tiles) e versus mesa (cintura). Mesmo brilho e saturação dos vizinhos de cena. |
| 8 | Phaser-ready | Nome kebab-case ASCII, PNG RGBA, dimensões conferem com `frameWidth/frameHeight` ou `tileWidth/tileHeight`. Tileset extrudado se tiver costura com filtro linear (§7). |
| 9 | Catálogo | Ficha completa e campo "Fonte" preenchido. |

### 6.2 Como o Claude executa o QA

- **Visual:** abrir o PNG com a ferramenta Read e comparar com as referências e os aprovados. Para spritesheets, descrever cada quadro e checar o alinhamento.
- **Técnico:** script `tools/art/check-asset.mjs` com a dependência de desenvolvimento `sharp`, **a escrever quando a produção começar**. Ele deve checar o magic number, as dimensões contra a ficha, a presença de alpha, as bordas opacas e a bounding box por quadro (linha de base y=60). Até ele existir, declare no relatório que o QA técnico foi apenas visual.

### 6.3 Formato do relatório

```markdown
## QA — OBJ-201 obj-lab-containment-tank.png
| # | Item | Resultado | Nota |
|---|---|---|---|
| 1 | Direção de arte | ✅ | luz NO ok, contorno azul-escuro |
| 2 | Resolução | ✅ | 96×144 / 192×288 |
| 3 | Formato | ✅ | PNG RGBA |
| 4 | Transparência | ⚠️ | franja clara à direita da base, refazer recorte |
| 5 | Cortes | ✅ | folga 4 px |
| ... | | | |
**Veredito:** REPROVADO (item 4) → volta para "Em produção".
```

Na revisão de **conjunto**, monte uma cena de teste (mapa mais objetos mais personagem) e avalie o todo: a sala lembra a referência, o piso livre é ≥ 60% e a leitura funciona a 1x.

---

## 7. Regras técnicas para o Phaser (referência para a integração)

```ts
// Tileset extrudado (evita costuras com antialias): margin 1, spacing 2
this.load.image('ship-interior', 'assets/tilesets/ship-interior-extruded.png');
map.addTilesetImage('ship-interior', 'ship-interior', 48, 48, 1, 2);

// Personagem: grade 48×64, linhas = baixo, esquerda, direita, cima
this.load.spritesheet('kira-walk', 'assets/characters/kira-walk.png', { frameWidth: 48, frameHeight: 64 });
const WALK_COLS = 6;
const DIRS = ['down', 'left', 'right', 'up'] as const;
DIRS.forEach((dir, row) => {
  this.anims.create({
    key: `kira-walk-${dir}`,
    frames: this.anims.generateFrameNumbers('kira-walk', { start: row * WALK_COLS, end: row * WALK_COLS + WALK_COLS - 1 }),
    frameRate: 10,
    repeat: -1,
  });
});
sprite.setOrigin(0.5, 0.9375);
body.setSize(28, 16).setOffset(10, 46); // colisão só nos pés

// Objetos: origem na base, profundidade pela base (y-sort)
obj.setOrigin(0.5, 1).setDepth(obj.y);
```

- Tilesets: o master é montado sem espaçamento. O export final passa por extrusão (por exemplo, o pacote npm `tile-extruder`) gerando `*-extruded.png`, e esse arquivo é o registrado no catálogo.
- Muitos objetos pequenos podem ir para um **atlas** (`free-tex-packer` ou TexturePacker) com extrude de 2 px. Os PNGs individuais continuam como fonte.
- Efeitos luminosos: `setBlendMode(Phaser.BlendModes.ADD)`, pintados sobre fundo transparente sem preto.

---

## 8. Organização de pastas

```
assets/
  ASSET_CATALOG.md
  characters/   kira-walk.png, kira-idle.png, portrait-kira.png ...   _source/
  environments/ env-space-stars.png, env-hull-engines.png ...          _source/
  tilesets/     ship-interior.png, ship-interior-extruded.png          _source/
  tilemaps/     ship.json (Tiled), criado no Conjunto 1
  objects/      obj-<sala>-<nome>.png                                  _source/
  ui/           icon-<nome>.png, hud-<nome>.png                        _source/
  effects/      fx-<nome>.png                                          _source/
```

`_source/` guarda os masters 2x (`@2x`), os arquivos `.kra`/`.psd`, os prompts usados (`<id>.prompt.md`) e as gerações brutas aprovadas. Gerações descartadas não entram no repositório.

---

## 9. Ciclo de vida no catálogo

```
Pendente ──(ficha completa + brief)──► Em produção ──(QA §6 100%)──► Aprovado ──(carregado no Phaser/React e testado)──► Integrado
     ▲                                     │
     └──────────── reprovado no QA ◄───────┘
```

- Só o Claude (ou o revisor humano) muda o estado para **Aprovado**, sempre com relatório de QA.
- **Integrado** exige que o asset apareça no jogo em execução e que o teste de movimento e colisão da skill `game-qa-visual-testing` tenha passado.
- Ao mudar qualquer regra de ART_DIRECTION, marque como **"Em produção (revisão)"** todos os assets aprovados que ela afeta.

---

## 10. O que esta skill nunca faz

- Gerar imagem sem ferramenta conectada ou apresentar SVG/procedural como ilustração final.
- Usar emoji como asset (regra do CLAUDE.md), exceto placeholder marcado com TODO.
- Copiar personagens, logos ou arte de jogos existentes. As referências guiam estilo e layout, e todo asset é original.
- Pular conjuntos ou aprovar um conjunto sem revisão conjunta.
- Alterar tokens de cor, tipografia ou layout do HUD sem passar por `spaceship-game-design`.
