# PROJECT_MAP — Crônicas de Aurora

Mapa de navegação do código para agentes e pessoas. A ideia é abrir o arquivo certo
e ir direto ao trecho, em vez de ler arquivos inteiros.

- **Commit de referência:** `31a8be0` (estado inicial antes dos agentes), conferido em 02/11/2026.
- **Linhas são âncoras aproximadas.** O nome do símbolo (`A.MONSTERS`, `G.useSkill`,
  `WINS.inventory`) é a referência estável. Se o número não bater, busque pelo símbolo.
- **Idioma:** interface e textos em português brasileiro.
- **Regra do bloco:** não implementar multiplayer real; servidores, bots, chat e ping são simulados.

**Atalhos — leia só a seção de que precisar:**

| Preciso de | Seção | Início |
|---|---|---:|
| Regras e restrições | 1 — Regras do projeto | 34 |
| Ordem de carga, dependências | 2 — Carregamento | 52 |
| Papel de cada arquivo | 3 — Visão geral | 73 |
| Linha de um símbolo | 4 — Âncoras por arquivo | 92 |
| Onde mexer numa tarefa | 5 — Roteamento | 321 |
| Save, migração, backup | 6 — Save e persistência | 342 |
| Variáveis de estado | 7 — Estado em memória | 390 |
| Fluxo de execução | 8 — Fluxos principais | 411 |
| Quem pode editar o quê | 9 — Propriedade por agente | 450 |
| Rodar testes | 10 — Testes e validação | 470 |
| Bugs e armadilhas | 11 — Armadilhas | 514 |
| Manter o mapa | 12 — Manutenção | 539 |

Ao delegar para um agente, informe a seção e a faixa de linhas (ex.: "seção 5, linhas
321–339") em vez de pedir para abrir o arquivo inteiro.

---

## 1. Regras do projeto

- JavaScript clássico, HTML e CSS. **Sem** frameworks, bundlers, transpiladores ou ES modules.
- Cada arquivo JS é um IIFE: `(function (A) { 'use strict'; ... })(window.A);`
- Tudo vive no namespace global `window.A`:
  - `A.game` → `G` (loop, input, combate, IA, render, save)
  - `A.sys` → `S` (regras de personagem, itens, loot, quests, economia, save)
  - `A.ui` → `U` (telas, HUD, janelas, modais, toasts)
  - `A.world` → mundo ativo, biomas, masmorras e utilidades de mapa
- Canvas do mundo: resolução lógica **1280×720**, tile **32 px**, mapa aberto **190×100 tiles**.
- Versões atuais: `index.html` mostra `v2.0.0`; `A.VERSION = '2.2.0'`; `A.SAVE_VERSION = 4`.
  A chave de save continua `...v2` de propósito (migração, não reset).
- Saves são versionados e com backup rotativo. Nunca apagar dados sem migração.
- Validar após mudanças (sintaxe e, quando possível, suítes de navegador).
- Durante a configuração do ambiente OpenCode, **não alterar o jogo**.

---

## 2. Carregamento e dependências

Ordem dos `<script>` no fim de `index.html` (linhas 302–308):

```
data.js → util.js → art.js → world.js → systems.js → ui.js → game.js
```

- `data.js` define conteúdo e constantes (`A.*`).
- `util.js` define helpers, `A.store` (localStorage) e `A.audio` (WebAudio procedural).
- `art.js` depende de `A.shade` (util) e é consumido por `world.js` (`A.art.TT`).
- `world.js` gera mapas na carga e usa arte procedural.
- `systems.js` usa dados e helpers; não conhece DOM.
- `ui.js` usa `A.art`, `A.sys` e o objeto do jogo injetado em `U.init(G)`.
- `game.js` amarra tudo: cria `A.game`, chama `A.ui.init`, inicia loop e save.

Telas do `index.html`: `#boot` → `#title` → `#login` → `#servers` → `#chars` →
`#create` → `#game`. A troca é feita por `A.ui.show(id)` e pelos `data-act`.

---

## 3. Visão geral dos arquivos

| Arquivo | Linhas | Papel | Dono primário | Apoio |
|---|---:|---|---|---|
| `index.html` | 311 | Shell, telas, HUD, canvas, ordem dos scripts | world-ui | architect |
| `css/style.css` | 955 | Todos os estilos: telas, HUD, janelas, modais, mobile | world-ui | performance |
| `js/data.js` | 515 | Conteúdo: servidores, classes, skills, zonas, monstros, itens, quests, endgame | balance | gameplay, architect |
| `js/util.js` | 229 | Math/random, DOM, storage JSON, áudio procedural | build | architect |
| `js/art.js` | 1452 | Arte procedural: tiles, props, atores, monstros, ícones, minimapa | world-ui | performance |
| `js/world.js` | 681 | Geração do mundo, Cripta, Cidadela, zonas, pontos de viagem | world-ui | performance |
| `js/systems.js` | 1057 | Regras: personagem, itens, loot, quests, economia, save, endgame | gameplay | balance, save-data |
| `js/ui.js` | 2032 | Telas, HUD, janelas arrastáveis, chat, mapa, modais | world-ui | gameplay, qa |
| `js/game.js` | 4336 | Loop, input, movimento, navegação, combate, IA, automação, render, save | gameplay | performance, save-data |
| `tests/*.js` | — | Regressão de navegador (Playwright + Edge headless) | qa | build |

Arquivos de ambiente (não são jogo): `.opencode/`, `.opencode-backup/`, `.agents/`, `opencode.json`.

---

## 4. Âncoras por arquivo

### 4.1 `index.html` (311 linhas)

| Linha | Bloco |
|---:|---|
| 13 | `#boot` — tela de boot e barra de progresso |
| 27 | `#title` — menu principal (`data-act="title-play"` etc.) |
| 54 | `#login` — conta local (`#loginName`, `do-login`) |
| 77 | `#servers` — lista de servidores (`#serverList`) |
| 102 | `#chars` — personagens por servidor (`#charList`) |
| 118 | `#create` — classe, aparência e nome (`#createCanvas`, `create-char`) |
| 162 | `#game` — `#world` (canvas), `#hud`, `#windows`, `#toasts`, `#tooltip` |
| 166 | HUD: vida/mana/vigor/XP, ouro, poder, buffs, relógio, ping |
| 200 | Botões de janelas (`data-win="character|inventory|quests|skills"`) |
| 212 | Minimapa + botão do mapa (`data-win="map"`) |
| 219 | Chat (`#chatPanel`, `#chatTabs`, `#chatList`, `#chatInput`) |
| 240 | Barra de ação: AUTO, skills 1–4, poções 5/6, esquiva `V` |
| 270 | Dica de interação (`E`) e banner de zona |
| 274 | `#windows` + `#toasts` + `#tooltip` |
| 278 | Overlay de morte (`respawn`) |
| 290 | Controles mobile (joystick e botões) |
| 302 | Ordem dos scripts (ver seção 2) |

### 4.2 `css/style.css` (955 linhas)

| Linha | Bloco |
|---:|---|
| 43 | telas |
| 54 | boot |
| 94 | título |
| 128 | botões |
| 159 | painéis |
| 169 | login |
| 206 | topo de páginas |
| 220 | servidores |
| 271 | personagens |
| 307 | criação |
| 365 | HUD |
| 583 | janelas |
| 623 | janela de personagem |
| 658 | inventário |
| 683 | missões |
| 701 | mapa |
| 712 | social |
| 724 | conquistas / skills |
| 744 | mercado / banco / craft / correio |
| 778 | configurações |
| 787 | NPC / loja |
| 801 | tooltip |
| 817 | toasts |
| 832 | morte |
| 845 | mobile |
| 884 | modais / extras |
| 899 | layout compacto para telas móveis |

### 4.3 `js/data.js` (515 linhas)

| Linha | Conteúdo |
|---:|---|
| 9–14 | `A.VERSION`, `A.VW/VH`, `A.T`, `A.MW/MH` |
| 18–21 | chaves e versão de save/session/settings |
| 26 | `A.SERVERS` — 4 servidores simulados |
| 36 | `A.CLASSES` — guerreiro, mago, arqueiro, clérigo |
| 74 | `A.SKILLS` — habilidades 1–4 por classe |
| 104 | `A.ZONES` — 9 zonas (inclui `cripta` e `cidadela` como dungeon) |
| 119 | `A.MONSTERS` — 25 monstros |
| 153 | `A.RARITY` — 5 raridades |
| 161 | `A.ITEM_BASES`, 173 `A.ITEM_NAMES`, 185 `A.AFFIXES` |
| 194 | `A.MATERIALS`, 206 `A.CONSUMABLES` |
| 215 | `A.NPCS` — 9 NPCs da vila |
| 227 | `A.WAYPOINTS` — 7 pontos de viagem |
| 240 | `A.QUESTS` — 40 missões principais |
| 241–360 | capítulos 1 a 8 (comentários por faixa de nível) |
| 378 | `A.CHAPTERS` — 8 capítulos |
| 405 | `A.DUNGEONS` — `cripta` (Nv 18) e `cidadela` (Nv 44) |
| 412 | `A.SIDE_QUESTS` — 5 caçadas |
| 423 | `A.RECIPES` — 6 receitas |
| 432 | `A.ACHIEVEMENTS` — 16 conquistas |
| 454 | `A.BOT_NAMES`, 460 `A.CHAT_LINES`, 481 `A.TIPS` |
| 505–506 | nomes e membros de guildas simuladas |
| 508 | `A.AUDIO` — escala e raiz do synth |

### 4.4 `js/util.js` (229 linhas)

| Linha | Símbolo |
|---:|---|
| 7–14 | `clamp`, `lerp`, `rand`, `randi`, `pick`, `chance`, `dist`, `uid` |
| 16–26 | `fmt`, `fmtTime` |
| 28 | `mulberry` (RNG determinístico), 37 `hash` |
| 42 | `shade` (cor), 49 `canvas`, 57 `spr`, 63 `A.$`/`A.$$`, 65 `el`, 71 `esc` |
| 75 | `A.store` — `get`, `raw`, `setRaw`, `set`, `del` (JSON em localStorage, nunca lança) |
| 95 | `A.audio` — synth procedural: `resume` 115, `setVolumes` 120, `tone` 127, `noise` 142, `play` 158, `startMusic` 183, `stopMusic` 221 |

### 4.5 `js/art.js` (1452 linhas)

| Linha | Bloco |
|---:|---|
| 12 | `TT` — tipos de tile; 18 `SOLID` |
| 34 | tiles procedurais; 223 `buildTiles` |
| 285 | props; 636 `buildProps` |
| 673 | personagens; 679 `A.LOOKS`; 681 `actorSprite`; 848 `portrait` |
| 861 | monstros; 864 `mons` (cache `MON_CACHE`) |
| 1190 | ícones; 1193 `iconCanvas`; 1403 `iconURL` (cache de data URL) |
| 1410 | minimapa; 1411 `buildMinimap` |
| 1422 | `A.art` exportado: `TT`, `SOLID`, `TILES`, `PROPS`, `init`, `tile`, `prop`, `actor`, `portrait`, `monster`, `icon`, `iconURL`, `buildMinimap`, `white` |
| 1450 | `A.art.init()` na carga |

Caches importantes: `ACTOR_CACHE`, `MON_CACHE`, `ICON_CACHE`, `ICON_URL`, `TILES`, `PROPS`.
Mudanças de arte devem invalidar o cache correspondente.

### 4.6 `js/world.js` (681 linhas)

| Linha | Símbolo |
|---:|---|
| 11 | `Z` — limites de zona; 16 `MINI` — cores do minimapa |
| 30–100 | `idx`, `vnoise`, `createMap`, `town`, `road`, `scatter` |
| 116 | `generateOverworld` (Picos de Gelo em 132; chefes de mundo em 417) |
| 458 | `generateDungeon` — Cripta do Eclipse (48×38) |
| 536 | `generateCitadel` — Cidadela do Eclipse (54×42) |
| 608 | `zoneAt`, 618 `tileCenter`, 620 `randomWalkable` |
| 634 | `A.world` exportado |
| 636 | mapas `overworld`, `dungeon`, `citadel`, `dungeons`; `active` |
| 644–658 | `enter`, `enterDungeon`, `isDungeon`, `isDungeonId`, `getDungeon`, `getMap` |
| 661 | `travelPoints` — vila, campos, costa, floresta, ruinas, pantano, picos |
| 670–671 | `dungeonSpawn`, `dungeonExitSpot` |
| 675 | bloqueia colisão dos NPCs no mapa aberto |

### 4.7 `js/systems.js` (1057 linhas)

| Linha | Bloco / símbolo |
|---:|---|
| 7–10 | `S`, stubs `toast`/`log` (a UI injeta depois) |
| 18 | `xpNeed(level)` |
| 20 | `blankCharacter` — personagem inicial, equipamento e itens |
| 91 | `recalc`, 131 `gainXp`, 148 `allocate`, 157 `deallocate`, 168 `resetAlloc` |
| 184 | `makeStack`, 197 `rollRarity`, 214 `rollLootRarity`, 222 `makeItem` |
| 268 | `itemLabel`, 274 `itemTooltip` |
| 308 | inventário: `bagCount` 309, `addItem` 310, `countItem` 328, `removeById` 331, `removeUid` 342, `getItem` 350, `equip` 352, `unequip` 366, `useConsumable` 376, `sellItem` 390 |
| 401 | `rollLoot` — loot por tipo/elite, arma compatível com a classe |
| 435 | quests: `questById` 437, `chapterOf` 441, `chapterProgress` 445, `chapterUnlocked` 459, `applyUnlocks` 468, `syncCampaign` 497, `initQuests` 528, `startQuest` 535, `activeQuests` 540, `questProgress` 546, `questEvent` 555, `onCollect` 575, `onKill` 579, `talkTo` 589, `turnInQuest` 601 |
| 628 | diárias: `dayKey` 629, `initDailies` 634, `claimDaily` 649 |
| 663 | criação: `canCraft` 665, `craft` 670 |
| 687 | mercado: `refreshMarket` 689, `buyMarket` 715 |
| 727 | correio: `initMail` 729, `mailUnread` 748, `claimMail` 750 |
| 764 | `checkAchievements` 766 |
| 788 | banco: `deposit` 790, `withdraw` 803 |
| 813 | **save/load**: `serialize` 815, `deserialize` 822 (migração v2→v4, nível 1–60) |
| 875 | `classSummary` 877 |
| 885 | endgame: `endgameWeek` 887, `weekKey` 898, `endgameActivity` 905, `riftRun` 912, `raidRun` 937, `arenaFight` 969, `factionJoin` 986, `seasonProgress` 994, `seasonClaim` 1003, `chestClaim` 1015 |
| 1032 | `syncCampaign` redefinido: chave de fenda no Nv 44+ e `applyUnlocks` |
| 1043 | `disassemble` |
| 1055 | `A.sys = S` |

### 4.8 `js/ui.js` (2032 linhas)

| Linha | Bloco / símbolo |
|---:|---|
| 7 | `U` — objeto da interface |
| 28 | `SKILL_ICONS`; 35–36 geradores de nome; 38 canais de chat |
| 48 | `U.init(game)` — injeta o jogo e faz o binding |
| 63 | `injectIcons`, 71 `bind`, 111 `bindHoldActions`, 169 `updateAttrNumbers` |
| 188 | `onClick` (delegação), 203 `action(act, d, btn)` — **roteador de `data-act`** |
| 510–536 | `onHover`, `onMove`, `onOut`, `onInput` |
| 550 | `show(id)` — troca de telas |
| 561–584 | `setBoot`, `bootDone`, `updateTitleClock`, `loginError`, `setAccount` |
| 590 | `renderServers`; 614 `renderChars` |
| 655 | `renderLookSwatches`, 679 `markSwatches`, 689 `renderCreate`, 723 `startPreview`, 730 `stopPreview`, 735 `drawPreview`, 764 `tryCreate` |
| 783 | `enterGame(p)`; 808 `buildSkillBar`; 830 `updateHUD`; 955 `updateAutoHunt` |
| 965 | `tick(dt)`; 974 `renderMinimap`; 1020 `zoneBanner`; 1029 `levelUpFx`; 1038 `showDeath` |
| 1050 | `clearChat`, 1055 `addChat`, 1061 `renderChat`, 1073 `setChannel` |
| 1084 | `winHTML`, 1091 `inputKey`, 1099 `captureWinState`, 1116 `restoreWinState` |
| 1135–1167 | `winNameFromEl`, `isWinOpen`, `focusWin`, `applyWinZ`, `toggleWin`, `closeWin` |
| 1186–1236 | `closeAllWins`, `wins`, `winOrder`, `openWin`, `refreshWin` |
| 1254–1376 | `placeNewWin`, `layoutWins`, `constrainWin`, `bindDrag`, `postRender` |
| 1409–1449 | helpers: `itemCell`, `equipCell`, `goldHtml`, `emptyCells`, `progressBar` |
| 1454 | **`WINS`** — registro das janelas |
| 1456–1913 | `character`, `inventory`, `quests`, `endgame`, `map`, `social`, `achievements`, `skills`, `market`, `bank`, `craft`, `mail`, `settings`, `help`, `npc`, `shop` |
| 1584 | `questCard`; 1655 `drawWorldMap` |
| 1951 | `modal`; 1963 `showMenuGroup`; 1978 `showHelpModal`; 1983 `showCredits`; 1992 `showQuickSettings` |
| 2005 | `toast(msg, type, key, cooldown)` |
| 2023 | `A.ui = U` |

Novas janelas: adicionar em `WINS` e registrar o botão/atalho; não criar HTML solto fora
do padrão `winHTML`/`openWin`.

### 4.9 `js/game.js` (4336 linhas)

| Linha | Bloco / símbolo |
|---:|---|
| 7–57 | `G`, `A.game = G`, constantes, hotkeys e **estado em memória** (seção 6) |
| 106–114 | sprites especiais (`ruinBlock`, `cryptWall`) |
| 119 | **`G.init`** — canvas, settings, save, UI, input, mobile, loop, boot |
| 158 | `buildSpecials`; 180 `bootSequence` |
| 204 | **save/conta**: `parseSaveData` 206, `writeSave` 222, `loadSave` 233 |
| 251 | `loadSettings`, 257 `saveSettings`, 260 `hotkey`, 272 `applySettings`, 279 `setSetting` |
| 291 | `login`, 312 `charsFor`, 318 `openServer`, 328 `backToServers`, 334 `backToChars` |
| 340 | `openCreate`, 345 `createCharacter`, 358 `deleteCharacter`, 369 **`enterCharacter`** |
| 439 | `logout`, 448 `stopGame` |
| 462 | `save`, 480 `exportSave`, 485 `importSave`, 497 `resetAll` |
| 506 | `refreshServers`, 515 `allocate`, 525 `deallocate`, 535 `resetAttributes` |
| 548 | **loop** (`startLoop`): rAF, `dt` máximo 0,08 s, `update` → `render` → `ui.tick` |
| 597 | input: `bindInput`, 705 `typing`, 717 `updateMouse`, 730 `syncMouse`, 736 `buildMobile`, 774 `resizeAll` |
| 791 | **`update(dt)`** — ordem do frame (ver seção 8) |
| 1008 | navegação automática: `resetNav` 1012, `lineClear` 1020, `walkableTile` 1030, `nearestWalkableTile` 1036, **`findPath` 1058 (A\*)**, `navTo` 1172, `safeSpawn` 1201 |
| 1236 | `resetControlState`, 1266 `teleportPlayer`, 1277 `updateCamera`, 1299 `updateRegen`, 1312 `updateBuffs` |
| 1336 | **vigor/esquiva/status**: `G.DODGE` 1338, `tryDodge` 1402, `startDodge` 1442, `updateDodge` 1466, `autoDodge` 1499, `updateCooldowns` 1528 |
| 1533 | **telegrafia**: `castTelegraph` 1556, `resolveTelegraph` 1570, `updateTelegraphs` 1582, `drawTelegraphs` 1592 |
| 1641 | **automação**: `setAutoHunt` 1643, `toggleAutoHunt` 1675, `autoPickTarget` 1681, `autoUseSkills` 1705, `updateAutoPotions` 1738, `updateAutomation` 1756, `updateAutoTarget` 1849 |
| 1863 | **rastreio de missões**: `trackQuest` 2045, `questGoal` 1899, `questTravel` 2023, `updateQuestTrack` 2096 |
| 2222 | dia/noite/clima: `hour` 2224, `isNight` 2225, `updateWeather` 2233 |
| 2261 | chat simulado/ping: `updateChatSim` 2263, `sendChat` 2298, `updatePing` 2321 |
| 2334 | **monstros**: `spawnMonsters` 2336, `zoneLevel` 2346, `makeMonster` 2355, `updateMonsters` 2387, `monsterAttack` 2518, `damagePlayer` 2534, `bossWave` 2570, `eliteSlam` 2588, `summonSkeletons` 2609, `killMonster` 2618 |
| 2675 | **combate do jogador**: `attackRange` 2679, `findAimTarget` 2693, `actionAttack` 2713, `basicAttack` 2774, `hitMonster` 2834, **`useSkill` 2847**, `nearestMonster` 2965, `usePotion` 2997, `onLevelUp` 3012 |
| 3027 | projéteis/efeitos/armadilhas/loot: 3029, 3096, 3110, 3136, `floatText` 3166 |
| 3172 | nós/NPCs/portais/waypoints: `updateNodes` 3174, `updateInteractables` 3185, `interact` 3240, `harvest` 3254, `openNpc` 3272, `npcAction` 3285, `startDungeon` 3320, `leaveDungeon` 3348, `die` 3375, `respawn` 3391 |
| 3419 | `travel` 3421 |
| 3442 | party: `createParty` 3444, `inviteParty` 3463, `leaveParty` 3477; guilda: 3493–3531 |
| 3533 | loja: `generateShopStock` 3535, `buyShop` 3551 |
| 3582 | bots: `spawnBots` 3584, `updateBots` 3617 |
| 3646 | **render**: `render` 3648, `renderMenuScene` 3657, `renderWorld` 3795 |
| 4131–4252 | `drawAim`, `drawMonster`, `drawTargetUI`, `drawBossBar`, `drawNight` |
| 4291 | `buildDecor` 4293 |
| 4315 | hook: `spawnMonsters` envolvido para também chamar `buildDecor` (4317) |
| 4324 | stubs de UI de título/login |
| 4332 | boot: `DOMContentLoaded` → `G.init()` |

---

## 5. Onde mexer por tipo de tarefa

| Tarefa | Arquivos e âncoras | Dono |
|---|---|---|
| Dano, XP, ouro, raridade, dificuldade | `data.js` (números) + `systems.js` 131/197/401 + `game.js` 2834 | balance |
| Nova habilidade | `data.js` 74 + `game.js` 2847 + `ui.js` 808 | gameplay |
| Novo item/afixo/receita | `data.js` 161/185/423 + `systems.js` 222/670 | balance + gameplay |
| Nova missão/capítulo | `data.js` 240/378/412 + `systems.js` 555/601 + `ui.js` 1538/1584 | gameplay + balance |
| Novo monstro/chefe | `data.js` 119 + `game.js` 2355/2387 + `art.js` 864 | gameplay + world-ui |
| Novo bioma/mapa | `world.js` 116 + `art.js` 34 + `world.js` 608/661 | world-ui |
| HUD, janela, CSS | `ui.js` `WINS` 1454 + `css/style.css` 365/583 | world-ui |
| Save, migração, backup | `systems.js` 815/822 + `game.js` 206–249/462 | save-data |
| Combate, esquiva, telegrafia | `game.js` 1336–1638 e 2675–3025 | gameplay |
| Automação / auto-caça | `game.js` 1641–1860 (AUTO e falhas) | gameplay |
| Rastreio de missão | `game.js` 1863–2220 | gameplay |
| Pathfinding / colisão | `game.js` 1008–1233 e `world.js` | gameplay |
| Render / FPS / memória | `game.js` 3646–4290 + `art.js` (caches) | performance |
| Testes e regressão | `tests/*.js` + `tests/helpers.js` | qa |

---

## 6. Save e persistência

Chaves em `localStorage` (definidas em `data.js` 18–21):

| Chave | Conteúdo | Gravada em |
|---|---|---|
| `aurora.mmo.save.v2` | save completo (JSON) | `G.writeSave` 222 |
| `aurora.mmo.save.v2.bak` | última versão válida anterior | `G.writeSave` 228 |
| `aurora.mmo.session.v2` | `{ account, server, char }` | `openServer` 322 / `enterCharacter` 432 |
| `aurora.mmo.settings.v2` | `G.settings` (áudio, hotkeys, auto-poção) | `saveSettings` 258 |
| `aurora.account` | último nome de conta (preenche o login) | `login` 304 |

Formato do save:

```js
{
  version: 4,
  accounts: {
    "nome_em_minusculo": {
      name: "Nome",
      chars: { aurora: [/* personagens */], lumina: [], ... },
      created: 0
    }
  },
  last: "Nome"
}
```

- `systems.serialize` (815) remove campos transitórios (`_atkTimer`, `_invuln`) e grava `lastSeen`.
- `systems.deserialize` (822) valida nível 1–60, atributos, equipamento, inventário, quests,
  `story`, `unlocks`, `endgame` e roda `recalc`, `initMail`, `initDailies`, `syncCampaign`.
  A migração v2→v4 acontece aqui.
- `G.loadSave` (233) tenta o save principal; se o JSON falhar, restaura `.bak` e avisa no HUD.
- `G.exportSave`/`importSave` (480/485) exportam/importam o JSON completo.
- `G.resetAll` (497) apaga save, backup, sessão, settings e a conta lembrada.
- O personagem é salvo automaticamente a cada 20 s (`G.update` 867) e em logout/troca de tela.
- Observação: `aurora.mmo.session.v2` é gravada, mas **não há leitura de retomada automática**
  no código atual; o login sempre começa pela tela de conta.

Campos principais do personagem (`blankCharacter` 20 + `enterCharacter` 369):
`id`, `name`, `cls`, `look`, `server`, `level`, `xp`, `gold`, `points`, `alloc`,
`hp/maxHp`, `mp/maxMp`, `stamina/staminaMax`, `bagCap`, `inventory`, `bank`,
`equipment`, `quests`, `mainIndex`, `dailies`, `achievements`, `achStats`, `stats`,
`waypoints`, `pos`, `x`, `y`, `map`, `story`, `unlocks`, `endgame`, `market`, `mail`,
`guild`, `party`, `playtime`, `created`, `lastSeen`.

---

## 7. Estado em memória (`A.game`)

Arrays e objetos reiniciados na entrada do personagem (`enterCharacter` 369–437):

- Entidades: `monsters`, `bots`, `loot`, `projectiles`, `effects` (`effectPool`), `floaters`,
  `traps`, `telegraphs`, `decor`.
- Combate: `target`, `skillCooldowns`, `buffs`, `statuses`, `staminaDelay`, `dodgeT`,
  `dodgeCd`, `invulnT`, `combat`, `attackTimer`, `attackAnim`.
- Automação: `autoHunt`, `autoChase`, `autoSkillTimer`, `autoPotionTimer`, `autoLoot`,
  `autoLootT`, `autoLootSkip`, `autoChaseT`, `autoChasePos`.
- Missões: `questTrack`, `questFocus`, `lastZone`.
- Mundo/tempo: `worldClock`, `dayLen` (900 s), `weather`, `cam`, `trans`, `fade`, `shake`.
- Input: `keys`, `touch`, `mouse`.
- Persistência: `saveData`, `accounts`, `account`, `currentServer`, `player`, `saveTimer`
  (autosave a cada 20 s).

Configurações padrão (`DEFAULTS` 21): música, SFX, números de dano, tremor de tela, FPS,
minimapa, tecla de esquiva, hotkeys e auto-poção de HP/MP com percentuais.

---

## 8. Fluxos principais

**Entrada:** `DOMContentLoaded` → `G.init` → `loadSettings`/`loadSave` → `ui.init` →
`startLoop` → `bootSequence` → título. Jogar → login → servidor → personagem (3 por
servidor) → criação → `enterCharacter` → `ui.enterGame`.

**Frame (`G.update` 791):**
1. timers do jogador, relógio do mundo e cooldowns;
2. transição, buffs, status, telegrafias, clima, chat, ping, auto-poção;
3. se vivo e sem transição: automação (com try/catch), esquiva, movimento (bloqueado com
   janela aberta, exceto AUTO/rastreio), evento de explorar zona;
4. câmera, mouse, monstros, bots, projéteis, efeitos, armadilhas, loot, nós, interações,
   rastreio de missão, regeneração, alvo automático;
5. autosave a cada 20 s.

Erros no loop não congelam o jogo: o `catch` do `startLoop` (568) registra e desliga AUTO e
rastreio para evitar repetição.

**Combate:** `actionAttack` 2713 → `basicAttack` 2774 → `hitMonster` 2834. Habilidades em
`useSkill` 2847. Inimigos usam `castTelegraph` 1556 e resolvem no fim do windup (1570).
Esquiva: `tryDodge` 1402 → `startDodge` 1442 → i-frames em `updateDodge` 1466.
`G.DODGE` (1338): custo 25, duração 0,18 s, i-frames 0,22 s, recarga 0,90 s.

**Automação:** `setAutoHunt` 1643 liga o modo; `updateAutomation` 1756 escolhe alvo
(`autoPickTarget` 1681), persegue com `navTo` 1172, usa habilidades (`autoUseSkills` 1705),
coleta loot e aciona `autoDodge` 1499. `toggleAutoHunt` 1675 (tecla R) também cancela o
rastreio de missão.

**Missões:** `trackQuest` 2045 define `G.questTrack`; `questGoal` 1899 resolve o objetivo
(NPC, portal, nó, espécie); `questTravel` 2023 viaja/entra na dungeon; `updateQuestTrack`
2096 move e interage. Conclusão passa por `questEvent`/`turnInQuest` em `systems.js`.

**Masmorras:** `startDungeon` 3320 → `A.world.enterDungeon` 648; `leaveDungeon` 3348
restaura a posição anterior. Cripta Nv 18 e Cidadela Nv 44 (`data.js` 405).

**Morte:** `die` 3375 (perde 10% do ouro) → overlay → `respawn` 3391.

---

## 9. Propriedade por agente

| Agente | Escopo principal | Pode editar |
|---|---|---|
| `build` | Implementação integrada, correções e validação final | sim (primário) |
| `architect` | Arquitetura, modularidade, planejamento de impacto | não |
| `gameplay` | Combate, automação, skills, progressão, inventário, quests | sim |
| `world-ui` | Mundo, Canvas 2D, arte procedural, DOM/CSS, HUD e janelas | sim |
| `balance` | XP, economia, raridades, loot, dificuldade, progressão | não |
| `save-data` | Save versionado, migração, backup, integridade | sim |
| `qa` | Testes, regressões, bugs, validação | não |
| `performance` | Canvas, renderização, memória, otimização | não |
| `online-architecture` | Arquitetura multiplayer futura (sem implementar) | não |

Regra prática: mudança de número/economia → `balance`; de regra → `gameplay`; de
mundo/arte/UI → `world-ui`; de persistência → `save-data`; validação → `qa`.
`build` integra e entrega.

---

## 10. Testes e validação

Suítes em `tests/` (Playwright + Edge headless, servidor estático em `127.0.0.1:8123`):

| Arquivo | Cobre |
|---|---|
| `smoke.js` | boot, login, criação, HUD, vigor, esquiva, save v4 e backup |
| `combat.js` | telegrafia circular, dano no fim do windup, i-frames, AUTO |
| `navigation.js` | WASD/clique/AUTO contornando construções; esquiva não atravessa parede |
| `campaign.js` | 8 capítulos, 40 missões, zonas, 2 masmorras, progressão de quest |
| `dungeon2.js` | abre Cripta (Nv 18) e Cidadela (Nv 44), spawn e saída |
| `endgame.js` | fendas, chaves, fragmentos, baús e atividades |
| `run.js` | executa todas as suítes em sequência |

Pré-requisitos atuais (conferir antes de rodar):

- `playwright-core` declarado em `tests/package.json` (devDependency) — **não está instalado**
  em `tests/node_modules` no momento.
- Edge em `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
  (ou definir `EDGE_PATH`).
- Servidor estático em `http://127.0.0.1:8123/` (ou definir `AURORA_URL`).

Comandos úteis (PowerShell):

```powershell
# Sintaxe de todos os scripts clássicos
Get-ChildItem js\*.js | ForEach-Object { node --check $_.FullName }

# Servidor estático (Python disponível)
python -m http.server 8123

# Dependência das suítes (quando for rodar de verdade)
npm --prefix tests install

# Todas as suítes / uma suíte
node tests/run.js
node tests/smoke.js
```

Validação mínima para mudanças apenas de documentação: `node --check` nos JS e conferência
de que nenhum arquivo de jogo foi alterado (`git status --short`).

---

## 11. Armadilhas conhecidas

- **Redefinições tardias:** `S.syncCampaign` é definido em 497 e redefinido em 1032 (o de
  1032 vence e concede a Chave de Fenda no Nv 44+). `G.spawnMonsters` é envolvido em 4317
  para também chamar `buildDecor`. Busque pelo símbolo, não só pela primeira ocorrência.
- **Stub morto:** `G.updateBuff` (1311) é vazio; o real é `G.updateBuffs` (1312).
- **Linhas mudam:** qualquer edição desloca as âncoras. Prefira o nome do símbolo e
  `grep`/`Select-String`.
- **Versões divergentes:** `index.html` mostra `v2.0.0`, mas `A.VERSION` é `2.2.0`.
  Não “corrija” um sem o outro de forma deliberada.
- **Sessão não retomada:** `A.SESSION_KEY` é gravada, mas não lida para reentrar sozinho.
- **UI acoplada ao DOM:** `ui.js` assume IDs do `index.html`; renomear ID exige atualizar
  `ui.js`, `game.js` e `style.css` juntos.
- **Arte em cache:** `ICON_CACHE`, `MON_CACHE`, `ACTOR_CACHE` e `ICON_URL` não se invalidam
  sozinhos; mudanças de arte precisam limpar o cache certo.
- **Testes dependem de ambiente:** sem Edge/servidor/`playwright-core`, as suítes falham por
  infraestrutura, não por regressão do jogo.
- **Conteúdo simulado:** bots, chat, ping, mercado e servidores são locais. Não tratar como
  rede real nem introduzir multiplayer neste bloco.
- **README pode ficar atrás do código:** a lista de conteúdo fala em 7 regiões, mas
  `data.js` já tem 9 zonas (incluindo Picos de Gelo e Cidadela do Eclipse). Use o código
  como fonte de verdade e atualize o README quando a entrega mudar o conteúdo.

---

## 12. Manutenção deste mapa

Atualizar quando:

- uma nova seção/arquivo for criado;
- um símbolo importante mudar de lugar;
- contagens de conteúdo mudarem (capítulos, quests, monstros, dungeons, zonas);
- o formato de save ou as chaves mudarem;
- um agente ganhar ou perder escopo.

Manter curto: âncoras + responsabilidades. O detalhe fica no código; o mapa serve para
chegar rápido ao trecho certo.
