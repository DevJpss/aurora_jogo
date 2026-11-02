# Crônicas de Aurora - Roadmap de entrega

Plano de entrega por frentes, com arquivos, riscos e testes que vão quebrar de propósito.
Complementa `docs/DESIGN.md` (decisões D1-D7) e `docs/LORE.md` (c@none).

---

## 1. Como missões e NPCs funcionam hoje

Fluxo atual (código):
- Missões principais em `A.QUESTS` (`data.js` 239-375), 8 capítulos em `A.CHAPTERS` (`data.js` 377-402).
- Estado por personagem: `p.quests[id] = {progress, done, claimed}` (`systems.js` 528-538).
- `S.syncCampaign` (`systems.js` 497-526) libera a próxima missão do capítulo quando a anterior é entregue, respeitando `minLevel` do capítulo e conclusão do capítulo anterior.
- Tipos de missão: talk, kill, boss, explore, collect, dungeon (`data.js` 241-374).
- Progresso: `S.questEvent` (`systems.js` 555-573) atualiza progresso em kill/collect/boss/dungeon.
- Entrega (turn-in): `S.turnInQuest` (`systems.js` 601-626) exige `pr.done && !claimed`; paga ouro/XP/itens, marca claimed, chama `syncCampaign` para a próxima.
- Conversa com NPC: `S.talkTo` (`systems.js` 589-599) completa missões `type: 'talk'` do giver.
- Rastreio: `G.trackQuest` (`game.js` 2042-2095) cria `G.questTrack`; `G.questGoal` (`game.js` 1899-2003) resolve o objetivo (NPC, portal, nó, espécie, waypoint); `G.updateQuestTrack` (`game.js` 2096-2216) move, viaja, interage.
- Ao concluir o objetivo, entra em fase `turnin` (`game.js` 2118-2125): cancela auto-hunt, abre janela de Missões e avisa "pronta para entregar".
- NPC é aberto via `G.openNpc` (`game.js` 3269-3280) que chama `S.talkTo` e abre janela `npc` (`ui.js` 1879-1911).
- Missões secundárias (diárias) no Quadro de Recompensas (npc `quadro`, `data.js` 223) com progresso separado em `p.dailies` (`systems.js` 628-662).

---

## 2. Entrega exige voltar a vila hoje?

Sim, parcialmente. O ponto de entrega (turn-in) é o NPC giver:
- Missões principais: giver pode ser `aldric` (vila), `nara` (vila), `arauto` (vila), ou `sella` (Picos de Gelo, `data.js` 222). A maioria dos givers está na vila.
- Missões `type: 'talk'` (q1, q26, q36, q40) exigem voltar ao NPC na vila.
- Missões secundárias são entregues no Quadro de Recompensas (vila).
- O rastreio, ao entrar em fase `turnin`, cancela o auto-hunt e abre a janela de Missões para o jogador clicar "Entregar" (`game.js` 2166-2182, 2118-2125). Não entrega automaticamente.
- Portanto, mesmo com NPCs no local (D7), hoje a entrega é manual e, para givers da vila, exige retorno.

D7 propõe NPCs no local que podem reaparecer em outras áreas por motivo narrativo. Isso exige:
- Permitir turn-in no NPC onde quer que ele esteja (já parcialmente, pois `turnInQuest` não checa posição).
- Atualizar `G.questGoal` para apontar para o NPC no local (em vez de sempre o giver original).
- Atualizar `S.talkTo` para considerar o NPC atual.
- Conteúdo: definir em quais áreas cada NPC reaparece e por que (narrativa).

---

## 3. Estimativa de tempo até o nível 60

Números do código:
- XP total necessário do nível 1 ao 60: 160.875 (`S.xpNeed`, `systems.js` 18: `50 + 28*level^1.32`).
- XP total das 40 missões principais: 191.890 (`data.js` 241-374).
- Missões secundárias: 5 caçadas, XP pequeno (1250 no total, `data.js` 411-417).
- Endgame (fendas) dá XP 260 + nivel*100 por run (`systems.js` 928), mas é pós-60 na prática.

Leitura:
- A campanha sozinha já fornece mais XP (191.890) do que o necessário (160.875). Ou seja, se o jogador fizer todas as missões na ordem e matar os monstros pedidos, chega ao 60 antes do fim da campanha ou com folga.
- O ritmo real depende de deslocamento, combate e gates de nível/capítulo (`S.chapterUnlocked`, `systems.js` 459-466): capítulo 2 exige Nv 8, capítulo 3 Nv 18, etc. O jogador precisa grindar entre capítulos se não tiver XP suficiente.
- Auto-hunt (R) acelera o grind (`game.js` 1643-1860), mas hoje é livre desde o nível 1 (D2 quer gating por história).
- Alvo do dono (D1): ~20h até o 60. Hoje, um jogador otimizado com auto-hunt pode terminar mais rápido. Para chegar a 20h, falta conteúdo (mais história e missões secundárias) e/ou ajuste de XP/monstros.

Estimativa de ajuste:
- 20h = 1200 min. XP/h necessário = 160875/20 = ~8044 XP/h.
- Hoje, com 40 missões + combate, o jogador provavelmente faz 8000-12000 XP/h em picos, mas com vales de grind entre capítulos.
- Frente B deve adicionar missões secundárias e capítulos intermediários para suavizar os vales e esticar para 20h.

---

## 4. Ordem sugerida das frentes

### Frente 0 - Documentação (esta entrega)
- Arquivos: `docs/DESIGN.md`, `docs/LORE.md`, `docs/ROADMAP.md`.
- Risco: baixo. Não toca jogo.

### Frente A - Entrega de missões com NPCs no local (D7)
- Objetivo: permitir turn-in onde o NPC estiver, reduzindo retorno a vila.
- Arquivos: `js/game.js` (questGoal, updateQuestTrack, openNpc), `js/systems.js` (talkTo, turnInQuest), `js/ui.js` (questCard, WINS.npc), `js/data.js` (NPCs e suas áreas).
- Riscos: rastreio pode apontar para NPC errado; auto-hunt pode interferir; missões `type: 'talk'` dependem de S.talkTo.
- Testes que vão quebrar de propósito: `tests/campaign.js` linhas 26-32 (turnInQuest q1 espera next q2), linhas 17-18 (contagens). `tests/navigation.js` se rastreio mudar.

### Frente B - Ritmo de 20h (D1)
- Objetivo: mais história e missões secundárias; suavizar vales de XP.
- Arquivos: `js/data.js` (QUESTS, CHAPTERS, SIDE_QUESTS, MONSTERS), `js/systems.js` (xpNeed, gainXp, chapterUnlocked), `js/game.js` (spawn, zoneLevel).
- Riscos: balanceamento; gates de nível; testes de contagem.
- Testes que vão quebrar de propósito: `tests/campaign.js` linhas 17-18 (`chapters === 8`, `quests === 40`), linha 20 (monstros >= 24). `tests/endgame.js` se XP mudar recompensas.

### Frente C - Auto-hunt desbloqueado por marco (D2)
- Objetivo: gating de R por história; servir de grind antes e depois do 60.
- Arquivos: `js/game.js` (setAutoHunt, toggleAutoHunt, hotkey R), `js/ui.js` (botáo AUTO, HUD), `js/systems.js` (applyUnlocks), `js/data.js` (unlocks).
- Riscos: jogadores acostumados com R livre; testes de AUTO.
- Testes que vão quebrar de propósito: `tests/navigation.js` (AUTO contorna taverna), `tests/combat.js` (AUTO usa esquiva), `tests/smoke.js` se HUD mudar.

### Frente D - Classes novas e evolução (D4, D5)
- Objetivo: Ladino, Monge, Bardo; evolução nos níveis 20/40/60 com 3 linhas.
- Arquivos: `js/data.js` (CLASSES, SKILLS, ITEM_BASES, A.ITEM_NAMES), `js/art.js` (sprites/icones), `js/systems.js` (blankCharacter, recalc, serialize/deserialize), `js/game.js` (combate, useSkill), `js/ui.js` (criação, personagem, skills).
- Riscos: alto; combate por classe; save schema.
- Testes que vão quebrar de propósito: `tests/smoke.js` (save v4, migração), `tests/campaign.js` (monstros), `tests/combat.js` (telegrafia/AUTO).

### Frente E - Nível pós-60 (D3)
- Objetivo: segundo nível que continua subindo com status; XP excedente.
- Arquivos: `js/systems.js` (gainXp, blankCharacter, serialize/deserialize), `js/ui.js` (HUD, personagem), `js/game.js` (onLevelUp), `js/data.js` (SAVE_VERSION).
- Riscos: save version bump; migração (D6 permite descartar).
- Testes que vão quebrar de propósito: `tests/smoke.js` ("personagem antigo migra para v4 com nível limitado a 60", "save marcado como versão 4").

### Frente F - Missões com NPCs no local (refino de A + narrativa)
- Depende de A e B. Define em quais áreas NPCs reaparecem e por quê.

---

## 5. Riscos transversais

- Save version: D3/D5 exigem bump; D6 permite descartar saves atuais, mas jogadores de teste perderão progresso.
- Testes com números fixos (8 capítulos, 40 missões, 25 monstros, save v4) vão falhar de propósito ao mudar conteúdo; atualizar asserts junto com a frente.
- Auto-hunt gating (D2) pode quebrar fluxo de testes que ligam R livremente.
- Classes novas (D4) exigem arte procedural (art.js) e ícones; caches (MON_CACHE, ICON_CACHE) precisam invalidação.

---

## 6. Ordem recomendada

0 (docs) -> A (entrega no local) -> B (ritmo 20h) -> C (auto-hunt gating) -> D (classes/evolução) -> E (nível pós-60) -> F (refino narrativo).

Justificativa: entrega no local (A) e ritmo (B) são conteúdo/design e destravam testes de campanha; auto-hunt gating (C) depende de marcos de história definidos em B; classes (D) e nível pós-60 (E) são mudanças estruturais de save/combate e devem vir depois do conteúdo base.
