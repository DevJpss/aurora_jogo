# AGENTS.md — Crônicas de Aurora

## Identidade do projeto

Crônicas de Aurora é um MMORPG 2D de navegador em JavaScript vanilla, HTML, CSS e Canvas 2D, com DOM para interface, arte e áudio procedurais e salvamento local versionado.

O jogo possui fluxo de boot, menu, título, login, servidores simulados, seleção de personagem, criação, mundo, combate, progressão, campanha, endgame, automação, UI e saves.

## Arquitetura atual

- `index.html`: shell e telas.
- `css/style.css`: HUD, janelas, mobile, toasts, menus.
- `js/data.js`: dados de conteúdo.
- `js/util.js`: utilitários e áudio.
- `js/art.js`: arte procedural e VFX.
- `js/world.js`: mundo, biomas, masmorras, spawns, portais.
- `js/systems.js`: sistemas de jogo.
- `js/ui.js`: HUD, janelas, menus, mapas, chat, modais.
- `js/game.js`: loop, input, movimento, combate, IA, automação, save.

## Sistemas de gameplay

- Combate manual e automação.
- Esquiva, stamina, i-frames, telegrafia, status.
- Campanha até nível 60.
- Endgame E1–E4.
- Economia, XP, raridades, loot.

## Regras

- Não alterar o jogo durante a configuração do ambiente OpenCode.
- Não instalar dependências desnecessárias.
- Não trocar provedor Groq.
- Não implementar multiplayer real neste bloco.
- Manter UI em português brasileiro.
- Manter saves versionados e seguros.
- Rodar validações antes de entrega.
