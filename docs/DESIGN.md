# Crônicas de Aurora - Documento de Design

Fonte de verdade para decisões de design e arquitetura do jogo. As decisões do dono estão
listadas com identificador estável (`D1`..`D7`) para referência em código, commits e roadmap.
O código vence em caso de divergência; este documento deve ser atualizado quando uma decisão
mudar.

Companion: `docs/LORE.md` (cânone extraído do código) e `docs/ROADMAP.md` (plano de entrega).

---

## 1. Visão

MMORPG 2D de navegador em JavaScript vanilla, Canvas 2D e DOM, com arte e áudio procedurais
e salvamento local versionado. Jogável sozinho, com sistemas simulados (bots, chat, mercado,
servidores) - sem backend real neste bloco. Campanha principal de 8 capítulos (Nv 1-60)
com duas masmorras e endgame (fendas, raid, arena, faccões, temporada).

---

## 2. Decisões do dono

| ID | Decisão | Notas |
|---|---|---|
| D1 | ~20h até o nível 60, sustentado por mais história e missões secundárias. | Hoje a campanha tem 8 capítulos/40 missões; ver `ROADMAP.md` (frente B). Incluir contador de tempo de jogo (playtime/tempo até 60) como métrica de balanceamento. |
| D2 | Auto-hunt (tecla `R`) desbloqueado por marco da história; serve de grind de XP antes e depois do nível 60. | Hoje `R` está livre desde o nível 1 (`game.js` 1643/1675). |
| D3 | Depois do 60: um segundo nível de personagem (nome a definir) que continua subindo, com um pouco de status por nível; o XP excedente vai para ele. | `S.gainXp` (`systems.js` 131) hoje trava em `p.level < 60`. Implementar antes de D4 (frente E antes de D) para validar save/XP. |
| D4 | +3 classes: Ladino (adagas), Monge (punhos), Bardo (instrumento). | Hoje existem 4 classes (`data.js` 35-68). Monge usa manoplas no slot de arma; Bardo usa canções (buff + AoE); classes entregues de forma incremental (Ladino → Monge → Bardo). |
| D5 | Evolução nos níveis 20, 40 e 60, em eventos da história: no 20 o jogador escolhe 1 de 3 linhas; no 40 e no 60 avança em linha reta dentro dela (7 classes x 3 linhas x 3 estágios). | Hoje não há sistema de evolução de classe. |
| D6 | Saves atuais descartáveis (sem migração). | `A.SAVE_VERSION = 4` (`data.js` 18-21); saves antigos podem ser ignorados. |
| D7 | Missões com NPCs no local, que podem reaparecer em outras áreas por motivo narrativo. | Hoje a entrega exige voltar ao NPC giver (ver `ROADMAP.md`). Piloto em uma única missão de Campos Verdes (q2) antes de converter as demais. |

---

## 3. Impacto arquitetural por camada

| Camada | Arquivo(s) | Impacto esperado |
|---|---|---|
| Conteúdo | `js/data.js` | Classes (D4), skills, monstros, zonas, quests/capítulos (D1), NPCs (D7), unlocks (D2). |
| Mundo | `js/world.js` | NPCs podem reaparecer em outras zonas (D7); spawn de novos inimigos por classe (D4). |
| Sistemas | `js/systems.js` | `gainXp`/nível pós-60 (D3), evolução de classe (D5), quests no local (D7), `applyUnlocks` (D2), save/migração (D6). |
| UI | `js/ui.js` | Janela de NPC, missões, personagem, HUD; escolha de linha de evolução (D5); nível pós-60 (D3). |
| Loop/jogo | `js/game.js` | Auto-hunt gating (D2), rastreio/entrega de missão (D7), combate por classe (D4). |
| Arte | `js/art.js` | Sprites/ícones das novas classes e armas (adaga, punho, instrumento) (D4). |
| Util | `js/util.js` | Sem mudança estrutural esperada. |

Regra: manter separação conteúdo/mundo/sistemas/UI/loop. Nenhuma regra de gameplay deve viver em `ui.js` ou `data.js`; números de balanceamento não devem ser hardcoded em `game.js`.

---

## 4. Regras de save (D6)

- Saves atuais são descartáveis: não é necessário migrar de `v4` para a próxima versão.
- Ainda assim, manter backup rotativo (`G.writeSave`, `game.js` 222) e validação de schema
  em `S.deserialize` (`systems.js` 822) para não corromper dados novos.
- Ao introduzir nível pós-60 (D3) e evolução de classe (D5), bump de `A.SAVE_VERSION`
  e de `A.VERSION` de forma coordenada.

---

## 5. Em aberto

- Nome e curva do nível pós-60 (D3): limite máximo ou retornos decrescentes? Quanto de status por nível?
- Como o Bardo funciona em jogo solo (D4): resolvido — canções que dão bônus a si mesmo e efeito em área sobre inimigos (híbrido buff+dano), sem depender de grupo real.
- O que ocupa o slot de arma do Monge (D4): resolvido — manoplas no slot de arma (raridades, drops e bônus como nas outras classes).
- Em que capítulo ficam o desbloqueio do auto-hunt (D2) e as evoluções (D5) nos níveis 20, 40 e 60?
- Nome do segundo nível de personagem (D3).
- Se missões com NPCs no local (D7) exigem reescrita do rastreio ou só do ponto de entrega.

---

## 6. Referências

- `PROJECT_MAP.md` - áncoras e propriedade por agente.
- `docs/LORE.md` - cânone atual extraído do código.
- `docs/ROADMAP.md` - plano de entrega por frentes.
- `AGENTS.md` - fluxo de tarefa e validação.
