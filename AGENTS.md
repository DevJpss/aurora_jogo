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

## Navegação

- Antes de explorar, leia `PROJECT_MAP.md` (índice no topo: leia só a seção necessária).
- Prefira busca por símbolo (`Select-String`) a abrir arquivos inteiros.
- Ao delegar, informe a seção e a faixa de linhas do mapa.
- Se o mapa divergir do código, o código vence — e o mapa deve ser atualizado.
- Uma tarefa por branch; só agentes com `edit: allow` alteram arquivos.

## Fluxo de tarefa

1. Uma branch por assunto (tipo/nome, ex.: `docs/readme-zonas`).
2. Antes de editar: liste com `Select-String` o que vai mudar e mostre.
3. Mudança mínima. Commits separados quando o assunto for diferente.
4. Mostre `git diff --stat` e o diff. Para cada número ou afirmação, cite símbolo e linha do código que a sustenta.
5. Antes de pedir aprovação, rode a bateria: suba `python -m http.server 8123`, rode `node tests/run.js`, encerre o servidor e o Edge e mostre só o resumo por suíte (passou/falhou). Falha nova que não existia na linha de base: pare e investigue antes de seguir.
6. Confirme que a mudança está commitada na branch e que `git status` está limpo.
7. Pare e peça aprovação. Nunca faça merge nem apague branch sem aprovação.
8. Depois do OK: `git switch master`, merge, `git log --oneline -4` e apagar a branch.
9. Diffs com mais de 20 linhas: peça revisão ao `@qa`, que deve usar um modelo diferente do que escreveu o código.
