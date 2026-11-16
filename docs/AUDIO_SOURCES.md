# Áudio: fontes e licença

Com exceção do alerta crítico legado, os sons são sintetizados em tempo real pelo navegador a partir de osciladores, ruído matemático, filtros e envelopes definidos em [`src/utils/sounds.ts`](../src/utils/sounds.ts).

O desenho sonoro procedural criado para o projeto é disponibilizado sob **CC0 1.0 (sem direitos reservados)**. O MP3 legado não faz parte dessa declaração.

## Lista completa

| Som | Como foi criado | Arquivo-fonte externo |
|---|---|---|
| Trilha da introdução | Acorde original em Ré menor, mais cheio, usado na transmissão e apresentação da tripulação | Nenhum |
| Ambiente da estação | Acorde original suspenso em Ré menor com nona e filtro passa-baixa | Nenhum |
| Alerta de missão crítica | MP3 original restaurado da primeira versão do projeto | `public/sounds/alert.mp3`; origem externa e licença desconhecidas |
| Passos do astronauta | Ruído filtrado curto + pulso grave, com pequenas variações | Nenhum |
| Movimento do AUR-1 | Ruído filtrado de pneus + impacto suave nas junções do piso, calibrado para celular/notebook; volume diminui com a distância | Nenhum |
| Saudação do AUR-1 | Três bipes eletrônicos ascendentes | Nenhum |
| Escolha da interface | Duas notas senoidais curtas e ascendentes | Nenhum |
| Abertura de missão | Duas notas suaves ascendentes | Nenhum |
| Resultado positivo | Três notas ascendentes | Nenhum |
| Resultado negativo | Duas notas descendentes em volume baixo | Nenhum |
| Início e fim do dia | Sequências curtas ascendentes/descendentes | Nenhum |
| Partida do AUR-1 | Ruído filtrado e tom ascendente de motor | Nenhum |
| Retorno do AUR-1 | Três notas com final diferente para sucesso ou falha | Nenhum |
| Medalha de exploração | Quatro notas ascendentes curtas | Nenhum |
| Digitação de mensagens | Ruído agudo de 12 ms, limitado a uma amostra a cada duas letras | Nenhum |

## Links para o documento do projeto

- Implementação de todos os sons: [`src/utils/sounds.ts`](../src/utils/sounds.ts)
- Tecnologia usada: [Web Audio API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- Osciladores que geram as notas: [OscillatorNode — MDN](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode)
- Controle de volume e envelopes: [GainNode — MDN](https://developer.mozilla.org/en-US/docs/Web/API/GainNode)
- Licença do desenho sonoro: [CC0 1.0 — Creative Commons](https://creativecommons.org/publicdomain/zero/1.0/)

## Referência musical não incorporada

- [Total War (Epic Action Cinematic Trailer Main), de AudioAtlant](https://pixabay.com/music/adventure-total-war-epic-action-cinematic-trailer-main-513668/) foi usada somente como referência de clima e transição.
- A faixa não está incluída no jogo: a página informa registro em Content ID e uso sob a licença de conteúdo do Pixabay. A trilha musical final continua sendo síntese original CC0.

## Comportamento de mixagem

- O ambiente para suavemente enquanto o alerta de missão toca e retorna depois.
- Música, sons do mundo e interface possuem controles separados, além do volume geral.
- Com narração automática ativada, toda a mixagem é reduzida; enquanto a voz fala, música e efeitos diminuem ainda mais para preservar a inteligibilidade.
- Passos têm intervalo mínimo de 310 ms e o robô, 420 ms. O alerta vermelho procura um vale natural entre 2,8 e 7 s do MP3, descansa 2,6 s e repete enquanto a emergência estiver pendente.
- O MP3 do alerta entra em 480 ms e termina com fade de pelo menos 720 ms no ponto de menor energia, evitando cortes secos entre os ciclos.
- A música e os passos receberam ganho maior após testes de audibilidade, mantendo margem contra distorção.
- O robô só é audível perto do jogador e os sons não são amplificados acima do volume projetado.
