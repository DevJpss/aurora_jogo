# Pesquisa e implementação — Crônicas de Aurora

## 1. Objetivo

Transformar o protótipo original em um MMORPG de navegador jogável de ponta a ponta, com resolução maior, arte procedural, progressão, economia, interação social simulada e uma interface que se comporte como a de MMOs clássicos. O foco não foi criar apenas documentação: cada sistema abaixo tem uma implementação no código.

## 2. Referências de design

Foram usados padrões consolidados de MMOs 2D e 3D:

- **Fluxo de entrada:** título → login → seleção de servidor → seleção de personagem → criação → mundo.
- **Progressão:** XP, níveis, atributos distribuíveis, equipamentos por raridade e habilidades desbloqueadas.
- **Combate:** action com mira pelo cursor, ataques em cone/projéteis, alvo travado, auto-caça opcional, habilidades com custo/recarga, crítico, defesa, buffs, morte e renascimento.
- **IA:** estado de agressão, perseguição, alcance, recuo para o ponto de origem, elites, chefe e invocações.
- **Economia:** ouro, loja de poções, ferreiro, criação, banco, leilão e correio.
- **Social:** grupo, guilda, chat por canais, lista de jogadores simulados e presença/ping/população.
- **Mundo:** mapa aberto dividido em zonas, pontos de viagem, coleta, clima, ciclo dia/noite e masmorra.
- **Interface:** janelas não modais, arrastáveis e independentes; HUD compacto; tooltips; layout responsivo.

## 3. Arquitetura

O projeto usa **HTML5 Canvas + DOM** e scripts clássicos para funcionar também via `file://`:

- Canvas lógico do mundo: **1280 × 720** (`js/game.js`), com escala para a janela e `image-rendering: pixelated`. Isso elimina a sensação de resolução baixa do protótipo 480 × 320.
- Tiles de **32 × 32** e atores de **32 × 44**.
- HUD, janelas, chat, tooltips e modais em DOM, com CSS próprio.
- Estado do jogo em memória e persistência em `localStorage`.
- Sem assets externos: tiles, personagens, monstros, ícones, retratos e efeitos são desenhados proceduralmente (`js/art.js`).

## 4. Sistemas implementados

### 4.1 Entrada e personagens

- Boot animado, tela de título, login local, seleção de servidor com população/ping simulados.
- Até 3 personagens por servidor, com nome, classe, aparência e preview.
- Quatro classes: `warrior`, `mage`, `archer`, `cleric`, com atributos-base, funções e habilidades distintas.
- Criação com validação de nome, escolha de classe e aparência procedural.
- Exclusão de personagem e retorno ao menu.

### 4.2 Progressão

- Curva de XP em `js/systems.js`: `50 + 28 × nível^1.32`.
- XP de monstros e missões ajustado para que o nível 18 (requisito da Cripta) seja alcançável com a história principal e combates incidentais.
- Pontos de atributo, recálculo de ataque, defesa, vida, mana, crítico, velocidade e poder.
- Equipamentos por slot (`weapon`, `chest`, `helmet`, `boots`, `ring`, `amulet`), raridades, valores e tooltips comparativos.
- Mochila, banco compartilhado, venda, compra, criação e recompensas.

### 4.3 Combate e IA anti-kite

O combate foi convertido para ação com automação opcional, sem perder a proteção anti-kite:

- **Mira pelo cursor.** O botão esquerdo usa `G.actionAttack`: corpo a corpo golpeia em cone curto; arqueiro/mago disparam projéteis livres na direção do mouse. `G.mouse.wx/wy` é sincronizado com a câmera a cada frame (`G.syncMouse`).
- **Movimento separado do ataque.** Botão direito move por clique usando a mesma navegação A* da automação; WASD/setas e joystick continuam sendo o movimento principal.
- **Ataque manual em movimento.** O jogador pode atacar enquanto anda. O ataque automático/auto-caça continua bloqueado por `G.manualMoving`, então não existe mais o truque de correr e deixar o alvo morrer sozinho.
- **Auto-caça estilo Mir4.** `G.setAutoHunt` liga (`R` ou botão **AUTO**) alvo automático, perseguição, habilidades, poções e coleta. `G.actionAttack` e movimento manual desligam a automação; ela para para desferir o ataque básico. A automação **continua ativa com janelas abertas** (Personagem, Mochila, Missões), permitindo organizar itens enquanto o personagem caça.
- **Preferência de alvo.** `G.autoPickTarget` prioriza monstros que já estão atacando o jogador, evita chefes muito acima do nível e limita a busca a 860 px (2.200 px durante uma missão de caça). Alvos e itens inacessíveis são abandonados após alguns segundos.
- **Navegação com A\*.** `G.findPath` roda A\* no grid de tiles; `G.navTo` aplica suavização por linha de visão e cache. A auto-caça, o rastreio de missões, o clique direito e a coleta automática contornam árvores, construções e outros props em vez de empurrar a parede. O caminho direto só é usado quando `G.lineClear` confirma visão livre. Ao chegar perto de um waypoint, `G.navTo` só avança para o próximo se houver visão livre; isso evita cortar a curva e raspar em cantos de árvores e paredes.
- **Perseguição com velocidade relativa ao jogador.** A velocidade constante de perseguição usa a diferença de nível e a velocidade atual do jogador:
  `max(velocidadeBase × 1.15, velocidadeDoJogador × (0.66 + 0.20 × nívelRelativo))`,
  com `nívelRelativo = clamp((nívelDoMonstro − nívelDoJogador + 4) / 10, 0, 1)`.
  Monstros mais fortes ainda pressionam com **investidas curtas** (1,45× por 0,38 s, a cada 2,6–4,2 s) quando chegam perto. Assim o jogador consegue ler e reagir à perseguição em vez de enfrentar monstros permanentemente mais rápidos.
- **Pacíficos x agressivos.** A propriedade `aggressive` em `A.MONSTERS` define quem inicia combate por proximidade. Slimes, caranguejos, goblins, treants, golems e bruxas são pacíficos: só revidam após levar dano (`hurt`/`aggroT`). Lobos, bandidos, aranhas, esqueletos, espectros e o chefe são agressivos; elites também são sempre agressivas. A interface de alvo exibe a classificação **Pacífico/Agressivo**.
- **Memória de agressão.** Ao levar dano, o monstro recebe `aggroT` (10 s) e continua perseguindo mesmo se o jogador sair do raio de agressão inicial.
- **Leash/reset.** Se o monstro se afastar mais de 760 px do ponto de origem, ele é reposicionado no anchor, recupera a vida e encerra a perseguição. O reset acontece uma vez e teleporta o monstro; ele não fica curado a cada frame enquanto continua ao alcance do jogador.
- **Elites e chefe** recebem multiplicadores de vida, ataque, defesa e XP; o chefe tem onda de dano e invocação de esqueletos.
- **Respawn e viagem seguros.** `G.safeSpawn` procura uma célula livre próxima ao ponto de teleporte. `G.respawn`, `G.travel`, entrada/saída da masmorra e carregamento de personagem não colocam mais o jogador dentro do prop do waypoint.
- Projéteis para arqueiro/mago, efeitos, números de dano, tremor de tela, morte, perda de ouro e renascimento.

### 4.4 Mundo e exploração

- Sete zonas: `vila`, `campos`, `costa`, `floresta`, `ruinas`, `pantano`, `cripta`.
- Geração de mapa em `js/world.js`, colisão por tile e props decorativos/obstáculos.
- Câmera com suavização, minimapa, nomes de zona e transições com fade.
- Ciclo dia/noite e clima; iluminação desenhada no canvas.
- Waypoints com desbloqueio e viagem rápida; portais e masmorra.
- Nós de coleta (erva, minério, cristal) com respawn.
- Bots simulados andando pelo mundo para dar sensação de população.

### 4.5 Quests, conquistas e recompensas

- Missões principais e diárias com progresso por tipo de objetivo (matar, coletar, falar, viajar etc.).
- Rastreador de missão no HUD, quadro de missões, recompensas de XP/ouro/itens.
- **Rastreamento estilo Mir4:** clicar no HUD ou em um cartão da janela de Missões (`G.trackQuest`) calcula o objetivo (`G.questGoal`) e navega até ele. O sistema:
  - identifica a zona da missão e usa viagem rápida para a região;
  - entra automaticamente na Cripta do Eclipse em missões de esqueleto/chefe (nível 18+);
  - conversa com o NPC de entrega, coleta o recurso ativo mais próximo ou caça apenas a espécie-alvo;
  - ao concluir, vai até o NPC/Quadro e abre a janela de Missões para entregar;
  - ao sair da Cripta, volta para o mundo aberto e segue para a entrega;
  - funciona também para diárias (`data-daily="1"`), com progresso separado em `p.dailies`.
  Movimento manual, ataque, botão direito ou `R` cancelam o rastreamento. A HUD mostra a missão rastreada em vez da principal.
- Conquistas por marcos de nível, combate, exploração e sistemas.
- Correio com mensagem inicial, leitura, anexos e resgate; mercado com listagens geradas e renovação; banco.

### 4.6 Social e economia simulada

- Grupo com membros simulados e bônus de experiência.
- Guilda com nome, membros, cargos e chat.
- Chat com canais Geral, Comércio, Grupo, Guilda e Sistema.
- Mercado, correio, população, ping e jogadores online são **simulados localmente**; não existe servidor real nesta versão.

### 4.7 Interface com janelas independentes

O sistema antigo abria uma única janela modal. Agora `js/ui.js` mantém `U.wins` e `U.winOrder`:

- Cada menu é uma `.win` com `data-window`.
- Abrir Personagem e depois Mochila mantém as duas na tela.
- Clique traz a janela para frente (`z-index` e classe `active-win`).
- Arraste pelo cabeçalho; o listener fica no `.win`, então continua funcionando após qualquer refresh de conteúdo.
- Duas janelas principais são organizadas lado a lado quando cabem; caso contrário, entram em cascata com os cabeçalhos acessíveis.
- O conteúdo é atualizado por janela, com escopo de `querySelector`, evitando conflito de IDs como `#sheetPortrait`, `#mapCanvas` e `#npcCanvas`.
- Inputs e posição de scroll são preservados nos refreshes.
- A janela de Personagem tem `+`, `−`, **Redistribuir** e repetição ao segurar (`data-hold`). O ponto é devolvido por `S.deallocate`; `S.resetAlloc` devolve todos e recalcula os atributos.
- Em telas ≤ 900 px, as janelas ocupam a largura disponível e se empilham; o HUD mobile tem joystick, ações e botão de chat.
- A automação não é modal: janelas abertas não pausam `G.updateAutomation`, `G.updateMovement` nem o rastreio de missão.

## 5. Persistência

- Save versionado em `localStorage`, com conta, servidor, personagens, equipamentos, mochila, banco, quests, conquistas, correio, mercado, waypoints e configurações.
- Autosave, salvamento manual, exportação/importação em texto e compatibilidade com saves antigos por migração de campos.
- Sessão lembrada para reconectar ao personagem após recarregar.

## 6. Testes realizados

- Verificação de sintaxe com `node --check` em todos os JS.
- Testes automatizados com Playwright + Microsoft Edge cobrindo:
  - boot, login, servidor, criação e entrada no mundo;
  - janelas simultâneas, arraste, foco, refresh e fechamento individual;
  - larguras 1600, 1366, 1280, 1024, 844, 800 e 390 px;
  - combate action com clique real do mouse, ataque manual em movimento, bloqueio do ataque automático em movimento e perseguição de monstro nível 20;
  - quatro classes: ataque básico, quatro habilidades, recargas, mana, cura, buffs, projéteis e auto-habilidades;
  - auto-caça: alvo, perseguição, habilidades, poções manuais/automáticas sem travar o loop, coleta, override manual e abandono de alvos/itens inacessíveis;
  - AUTO continuando com Mochila/Personagem abertos, pathfinding ao redor de obstáculo e clique em missão do HUD e da janela;
  - atributos: `+`, `−`, segurar para repetir e Redistribuir;
  - IA: monstros pacíficos, espécies agressivas, revide após provocação e leash sem cura infinita;
  - respawn, viagem, saída de masmorra e save preso em waypoint, sempre com movimento imediato após o teleporte;
  - equipar, banco, mercado, diária, viagem, waypoint, chat, save/recarga e configurações;
  - masmorra, chefe, morte/renascimento;
  - layout mobile com botões AUTO, barra de ações e joystick sem sobreposição;
  - carregamento via `file://` sem servidor.
- Nenhum erro de console/página nas execuções finais.

## 7. Limitações conhecidas

- Multijogador, servidores, ping, mercado, correio, grupo e guilda são simulações locais.
- O áudio é sintetizado via Web Audio e depende de interação do usuário.
- A arte é procedural; não há sprites externos.
- A IA ainda usa perseguição direta para o monstro; o pathfinding A* é aplicado ao deslocamento do jogador na automação e no rastreio de missões, não ao corpo do monstro.
- O balanceamento foi ajustado para uma experiência single-player; pode ser refinado com mais testes de longo prazo.

## 8. Próximos passos possíveis

- Aplicar A* também à perseguição dos monstros em obstáculos complexos.
- Mais zonas, chefes e conjuntos de equipamento.
- Editor de mapa externo.
- Backend real com WebSocket para multijogador.
- Acessibilidade: remapeamento de teclas, escalas de UI e modo daltônico.
