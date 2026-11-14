# Aurora Station — Direção de Arte

> Documento normativo. **Todo asset novo deve obedecer a estas regras.** Quem aplica: a skill `starship-art-studio`. Quem complementa: `spaceship-game-design` (HUD, layout de salas, tipografia) e `docs/DESIGN_SYSTEM.md` (tokens de cor da UI).
>
> Este documento **não altera** a identidade existente: os tokens canônicos (`#0a0e27`, `#8b7b6b`, `#9a8f82`, `#706558`, acentos) continuam valendo. Ele acrescenta as **rampas de pintura**, as regras de luz e a escala técnica necessárias para produzir arte.

---

## 1. Leitura das referências

| Referência | O que tomar dela | O que NÃO tomar |
|---|---|---|
| `references/wireframe/spaceship-reference-01.png` (4 tripulantes, Marte ao fundo) | **Acabamento**: pintura suave, luz quente em poças, sombras azul-violeta, nebulosa, planeta, profundidade atmosférica. É a referência de *renderização*. | — |
| `references/wireframe/spaceship-reference-02.png` (exploração solo, **PRIMÁRIA**) | **Layout e escala**: disposição das salas, espessura de paredes, tamanho do personagem vs. piso, posição do HUD. É a referência de *estrutura*. | O acabamento com bordas duras e cara de pixel art HD. **O jogo não é pixel art.** |

> Atenção técnica: os dois arquivos são **JPEG com extensão `.png`** (1600×900). Assets do jogo nunca podem repetir esse erro (ver QA na skill).

**Frase-âncora do estilo** (usar em briefs e prompts):

> *Ilustração 2D pintada à mão, vista top-down em 3/4 (~30°), estação espacial aconchegante, personagens chibi, texturas pintadas com pincelada visível e suave, luz ambiente azul-violeta com poças de luz quente âmbar e brilhos ciano das telas, contornos suaves escuros (não pretos), acabamento de jogo indie premium.*

---

## 2. Escala e câmera (decidida antes de qualquer resolução)

A escala foi derivada da medição da referência 02 (1600×900): ladrilho de piso ≈ 60 px e personagem ≈ 70 px de altura. Convertendo para o canvas lógico do jogo (`GAME_WIDTH = 1280`, `GAME_HEIGHT = 720`, fator 0,8):

| Constante | Valor (1x, no jogo) | Master (2x, fonte) | Justificativa |
|---|---|---|---|
| `TILE_SIZE` | **48 px** | 96 px | 60 px × 0,8 ≈ 48. Divide 1280 e 720 por inteiros (26,67 × 15 tiles visíveis). |
| Altura visível do personagem | **~56 px** (1,17 tile) | ~112 px | 70 px × 0,8. Chibi 2,5 cabeças → cabeça ≈ 22 px. |
| Quadro de sprite de personagem | **48 × 64 px** | 96 × 128 px | 1 tile de largura; 8 px de folga acima da cabeça. |
| Mapa da nave (Tiled) | **32 × 18 tiles = 1536 × 864 px** | — | Casco ocupa ~30 × 16; câmera em zoom 1 vê ~83% da nave e rola um pouco, como na ref. 02. |
| Corredor | **3 tiles** (144 px) | — | ≥ 2 larguras de personagem (regra do `spaceship-game-design`). |
| Porta | **2 tiles** de largura | — | Passagem confortável para crianças com teclado. |
| Câmera | zoom **1.0**, follow com lerp 0.1, bounds = mapa | — | Sem zoom fracionário → sem reamostragem extra da arte. |

**Por que masters em 2x:** o jogo carrega arquivos **1x** (o canvas é 1280×720 com `Scale.FIT`). Os masters 2x permitem exportar 1x (48 px) hoje e 1,5x (72 px) se o canvas um dia subir para 1920×1080, sem repintar.

**Regra:** toda dimensão de asset de mundo é múltiplo de **24 px** (meio tile) em 1x. Tilesets são múltiplos exatos de 48.

---

## 3. Perspectiva

- **Top-down oblíquo 3/4, ortográfico.** Câmera a ~30° da vertical. Não existe ponto de fuga: linhas verticais do mundo continuam verticais na tela, linhas horizontais continuam horizontais.
- Todo objeto mostra **tampo (topo)** + **face frontal (sul)**. Faces laterais só aparecem como um chanfro de no máximo 4 px (1x). **Não é isométrico** (sem losangos 2:1).
- Altura da face frontal ≈ **0,6 × a altura real** do objeto, em unidades de tile: mesa = 0,5 tile, armário = 1,5 tile, tanque do laboratório = 2 tiles.
- Paredes: **topo de 1 tile de espessura** (camada `Walls`, colide) + **face frontal de 1 tile** nas paredes norte de cada sala (camada `WallFaces`, colide). Paredes leste/oeste mostram só o topo.
- Personagens: vê-se rosto, ombros e topo da cabeça. Mesma inclinação dos objetos.

---

## 4. Paleta cromática

### 4.1 Tokens canônicos (não mudar)
`bg-space #0a0e27` · `ship-hull #8b7b6b` · `ship-floor #9a8f82` · `ship-walls #706558` · `accent-blue #4dc9f6` · `accent-amber #f5a623` · `accent-red #e74c3c` · `accent-green #2ecc71` · `accent-purple #8b5cf6` · `text-light #f0ece4`

### 4.2 Rampas de pintura (sombra → luz)
As sombras puxam para **azul-violeta** e as luzes para **creme quente**. É assim que o casco bege convive com o clima azulado/violeta/ciano.

| Material | Sombra profunda | Sombra | Base (token) | Luz | Realce |
|---|---|---|---|---|---|
| Espaço | `#05071a` | `#0a0e27` | `#141b3d` | `#232a5c` | `#3d4a8a` |
| Nebulosa | `#2a1f52` | `#3d2b6b` | `#5b3f8f` | `#7d5cb8` | `#b39cff` |
| Casco | `#3e3a50` | `#5c5466` | `#8b7b6b` | `#b8aa98` | `#ddd2c0` |
| Piso | `#4a4558` | `#6e6672` | `#9a8f82` | `#b5ab9d` | `#cfc6b8` |
| Paredes internas | `#2e2b3d` | `#4a4452` | `#706558` | `#948876` | `#b3a794` |
| Metal escuro (consoles, molduras) | `#141826` | `#1f2638` | `#2e3850` | `#46546f` | `#6b7d9c` |
| Tela / holograma (ciano) | `#0d3550` | `#1e6f9a` | `#4dc9f6` | `#8fe3ff` | `#d6f7ff` |
| Luz quente (âmbar) | `#7a4a10` | `#b8730f` | `#f5a623` | `#ffc966` | `#fff0c9` |
| Ciência (violeta) | `#3b2470` | `#5a3cb0` | `#8b5cf6` | `#b39cff` | `#e2d8ff` |
| Madeira (mesa, caixotes) | `#4a2f22` | `#7a4f30` | `#a8744a` | `#c99766` | `#e6c193` |
| Tecido azul (camas) | `#1f2a52` | `#2f4180` | `#4a63b0` | `#7590d6` | `#b4c6f0` |
| Planta | `#1d3b2e` | `#2e5e40` | `#4a8a52` | `#78b86a` | `#b8e09a` |
| Alerta / cruz médica | `#6b1a14` | `#a8291f` | `#e74c3c` | `#ff7a6b` | `#ffc2ba` |

### 4.3 Regras de cor
1. **Nunca preto puro nem branco puro.** O escuro mínimo é `#05071a` e o claro máximo é `#fff0c9`/`#d6f7ff`.
2. Sombras de objetos e personagens: multiplicar `#2a2350` a 35–45%. Nunca cinza neutro.
3. **Vermelho é só para alerta, dano e a cruz médica.** Não há móveis vermelhos decorativos.
4. Saturação alta é reservada a fontes de luz (telas, lâmpadas, propulsores). Superfícies ficam em saturação média ou baixa.
5. Cada tripulante tem seu acento (`src/data/crew.ts`): Kira âmbar, Leo verde, Maya violeta, Comandante com cor escolhida pelo jogador (via tinta, ver §9).

---

## 5. Iluminação

- **Luz principal:** vem do **alto-esquerda** (noroeste). Tampos claros, faces frontais um degrau mais escuras e faces leste sombreadas.
- **Ambiente:** preenchimento azul-violeta frio (`#232a5c` a ~20%) em todo o interior.
- **Poças de luz locais** pintadas no piso, uma assinatura por sala:

| Sala | Luz local | Sensação |
|---|---|---|
| Ponte | ciano das telas + vista estelar | foco, tecnologia |
| Alojamento | âmbar quente, baixo | aconchego |
| Laboratório | ciano + violeta do tanque | mistério científico |
| Depósito | âmbar fraco, cantos escuros | guardado, empoeirado |
| Enfermaria | branco-creme `#fff0c9` uniforme + cruz vermelha | limpo, seguro |
| Sala comum | âmbar central sobre a mesa | convívio |
| Engenharia | laranja do reator + ciano de conduítes | potência |

- **Oclusão de contato:** toda base de objeto tem uma sombra suave embutida de 2–6 px (1x). Não há sombras projetadas longas.
- **Personagens não levam sombra pintada no spritesheet.** A sombra é um sprite separado (`fx-shadow-ellipse`) para manter consistência.
- **Emissivos** (telas, LEDs, propulsores) têm halo suave pintado. Brilhos animados vão para `assets/effects/` com blend ADD.

---

## 6. Materiais e texturas

| Material | Tratamento |
|---|---|
| Casco e painéis | Placas grandes com junções finas, rebites só nas bordas, desgaste leve nas arestas (lascas claras), pincelada seca visível. |
| Piso | Placas de 1 tile com junta sutil (1 px, sombra `#6e6672`), variação de valor ±4% entre placas, 3–4 variações para quebrar repetição. |
| Metal escuro | Gradiente suave do topo para baixo, reflexo ciano frio na aresta superior. |
| Vidro / tanque | Transparência pintada (não alpha real no corpo), reflexo diagonal branco-ciano e líquido luminoso. |
| Tecido | Dobras grandes e simples, sem padronagem miúda. |
| Madeira | Veios largos de 2–3 tons. É o material "aconchegante" da nave. |
| Plantas | Folhas grandes e arredondadas. Sempre em vaso. São o toque de vida da nave. |

**Densidade de detalhe:** na escala 1x, nenhum detalhe tem menos de 2 px. Textura pintada sim, ruído fino não, porque some ou vira cintilação no FIT scaling.

---

## 7. Proporções dos personagens

- **Chibi, 2,5 cabeças.** Em um quadro 48×64 (1x), altura total de ~56 px, cabeça de ~22 px de altura e ~24 px de largura, corpo de ~20 px e pernas de ~14 px.
- Olhos grandes (≥ 4 px de altura em 1x) com brilho, boca simples e nariz mínimo.
- Mãos e pés arredondados e levemente grandes. Membros sem cotovelos marcados.
- **Contorno:** 2 px (1x) na cor mais escura da rampa local (cabelo marrom → contorno marrom-escuro), nunca preto.
- **Silhueta única** por personagem, legível como sombra chapada:
  - **Comandante (jogador):** traje de bordo com ombreiras arredondadas e regiões de acento tintáveis.
  - **Kira (engenheira):** rabo de cavalo, cinto de ferramentas e luvas grossas, acento âmbar.
  - **Leo (médico):** jaleco curto, braçadeira com cruz e bolsa lateral, acento verde.
  - **Maya (cientista):** óculos de proteção na testa e tablet, acento violeta.
- Uniforme base comum: macacão azul-marinho `#2f4180` com detalhes creme, para unidade visual.

> Divergência a resolver: `spaceship-game-design` lista Capitão/Cientista/Médico/Engenheiro com cores diferentes das de `src/data/crew.ts`. Este documento segue **`crew.ts`** (fonte de verdade do jogo).

---

## 8. Linguagem visual dos objetos

- **Formas arredondadas**: cantos com raio ≥ 4 px (1x). Nada pontiagudo exceto o nariz da nave.
- **Leitura em 1 segundo**: cada objeto interativo tem um elemento-assinatura (tanque = líquido ciano, cama médica = cruz, console = 3 telas).
- **Interativos x decorativos**: interativos têm um ponto de luz (LED, tela) voltado para o jogador. Decorativos não têm.
- **Proporção ao personagem**: cadeira na altura do quadril, mesa na altura da cintura, armários até ~1,5 cabeça acima do personagem.
- **Família de design**: molduras de metal escuro + painéis creme + luz ciano ou âmbar. Todo equipamento parece fabricado pela mesma empresa.

---

## 9. Diretrizes para cenários

1. Cada sala é identificável sem rótulo (ver "Room Identity" em `spaceship-game-design`).
2. **Piso livre ≥ 60%** da área de cada sala. Móveis encostados nas paredes e centro aberto.
3. Contraste piso × parede × móvel: diferença de valor mínima de 15% entre piso e parede.
4. Exterior: casco com propulsores azuis à esquerda e nariz de vidro à direita (orientação das referências: **a nave aponta para leste**).
5. Fundo de espaço em 3 camadas de parallax: estrelas (scrollFactor 0,05), nebulosa (0,1) e Marte/asteroides (0,2).
6. Nada de texto legível pintado em cenários, porque a localização fica impossível. Use ícones.

---

## 10. Diretrizes para spritesheets

- Grade **sem espaçamento**: quadro 48×64 (1x), `margin 0`, `spacing 0`, origem do quadro no canto superior esquerdo.
- **Linhas = direções**, sempre nesta ordem: `0 baixo (sul)`, `1 esquerda (oeste)`, `2 direita (leste)`, `3 cima (norte)`.
- **Colunas = quadros** da animação, da esquerda para a direita.
- **Pé no mesmo pixel em todos os quadros:** linha de base em **y = 60** (1x) e centro em **x = 24**. Origem Phaser `(0.5, 0.9375)`.
- Folga de segurança: nenhum pixel opaco a menos de 2 px da borda do quadro.
- A direita **não** pode ser um espelho da esquerda quando o personagem é assimétrico (rabo de cavalo da Kira, bolsa do Leo). A luz vinda do noroeste também não espelha.
- Animações padrão por personagem:

| Arquivo | Quadros × direções | Tamanho 1x | FPS | Loop |
|---|---|---|---|---|
| `<id>-idle.png` | 4 × 4 | 192 × 256 | 6 | sim |
| `<id>-walk.png` | 6 × 4 | 288 × 256 | 10 | sim |
| `<id>-interact.png` | 4 × 4 | 192 × 256 | 8 | não |

- **Tinta do Comandante:** `commander-*-tint.png` tem exatamente a mesma grade que a folha base e contém só as regiões de acento em escala de cinza. O Phaser desenha a folha base e, por cima, a de tinta com `setTint(corEscolhida)`.

---

## 11. Formatos

| Tipo | Formato | Alpha |
|---|---|---|
| Sprites, objetos, tilesets, efeitos, UI | PNG-32 (RGBA, sRGB, sem perfil ICC estranho) | sim |
| Fundos opacos grandes (estrelas, nebulosa) | PNG-24 ou WebP q90 | não |
| Masters editáveis | `.kra` (Krita) ou `.psd`, em `_source/` | — |

Nome de arquivo: `kebab-case`, sem acentos ou espaços: `obj-lab-containment-tank.png`, `kira-walk.png`.
