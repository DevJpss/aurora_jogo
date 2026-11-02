# Crônicas de Aurora — MMORPG de navegador

Um MMORPG 2D em HTML5 Canvas, com arte procedural e interface em português. O jogo roda direto no navegador, sem instalar nada e sem precisar de servidor.

## Como jogar

1. Dê um duplo clique em `Jogar.bat` **ou** abra `index.html` no navegador.
2. Escolha **Jogar**, informe um nome de conta e selecione um servidor.
3. Crie um personagem (Guerreiro, Mago, Arqueiro ou Clérigo) e entre no mundo.
4. Explore Aurora, aceite missões, enfrente monstros, colete recursos e evolua.

O progresso é salvo automaticamente no `localStorage` do navegador. Use **Configurações → Salvar agora / Exportar save** para guardar uma cópia.

> **Importante:** servidores, população, ping, jogadores bots, mercado, correio, grupo e guilda são **simulados localmente**. Não há backend, conta online ou interação real entre pessoas nesta versão.

## Controles

| Ação | Tecla / mouse |
|---|---|
| Mover | `W` `A` `S` `D` ou setas |
| Correr | `Shift` (enquanto se move) |
| Atacar na direção do cursor | Botão esquerdo |
| Mover por clique | Botão direito (contorna obstáculos) |
| Atacar o inimigo mais próximo | `Espaço` |
| Travar / selecionar o inimigo mais próximo | `Tab` |
| Auto-caça (alvo, perseguição, habilidades, poções e coleta) | `R` ou botão **AUTO** |
| Habilidades | `1` `2` `3` `4` |
| Poção de vida / mana | `5` / `6` |
| Interagir (NPC, portal, recurso, saída) | `E` |
| Personagem | `C` |
| Mochila | `I` |
| Missões | `J` |
| Mapa / viagem rápida | `M` |
| Social (grupo e guilda) | `O` |
| Conquistas | `K` |
| Endgame (fendas, raid, arena, temporada) | `E` (botão HUD) |
| Fechar a janela ativa / abrir configurações | `Esc` |
| Chat | `Enter` para focar; botão 💬 no celular |

### Combate

- **Ação manual:** o botão esquerdo ataca na direção do cursor. Corpo a corpo atinge um cone curto à frente; arqueiro e mago disparam projéteis livres na mira. Clicar em um monstro fora do alcance inicia a perseguição.
- **Automação estilo Mir4:** `R` ou o botão **AUTO** liga a auto-caça. O personagem escolhe alvos, persegue, usa habilidades e poções e recolhe itens próximos. A automação **para para desferir o ataque básico** e usa busca de caminho para **contornar árvores e obstáculos** em vez de ficar presa.
- **AUTO com menus abertos:** a automação continua caçando e andando enquanto a **Mochila**, o **Personagem** ou as **Missões** estão abertos. Você pode organizar itens e ler missões sem parar o personagem.
- **Rastreamento de missão:** clique no cartão de missão do **HUD** ou na **janela de Missões** para rastrear e ir até o objetivo. O personagem viaja para a região, entra na Cripta quando necessário (nível 18+), conversa com NPCs, coleta recursos e caça o alvo. Use o botão **Ir até** nos cartões, inclusive nas diárias.
- **Controle manual tem prioridade:** mover com WASD/joystick, atacar ou usar o botão direito desliga a auto-caça e o rastreamento na hora. O clique direito calcula uma rota e contorna paredes, árvores e construções; se o destino for inalcançável, o movimento é cancelado com um aviso.
- **Pacíficos x agressivos:** slimes, caranguejos, goblins, treants, golems e bruxas só revidam depois de serem atacados. Lobos, bandidos, aranhas, esqueletos, espectros, elites e o chefe iniciam o combate sozinhos. Ao mirar, o alvo mostra **Pacífico** ou **Agressivo**.
- Inimigos mantêm a perseguição depois de serem atacados, mas correm mais devagar que você. Monstros mais fortes dão **investidas curtas** para encurtar a distância. Use sprint, obstáculos, habilidades de controle ou volte para perto da vila para escapar.
- Use as habilidades mesmo em movimento, mas fique de olho na mana e nas recargas.

### Atributos

- Cada nível concede **5 pontos**. Abra o Personagem (`C`) e use `+` para distribuir.
- Use `−` para devolver **1 ponto** ou **Redistribuir** para devolver todos.
- **Segure** `+` ou `−` para distribuir vários pontos rapidamente.

### Janelas independentes

Os menus do jogo são janelas flutuantes e **não fecham umas às outras**:

- Abra o Personagem (`C`) e depois a Mochila (`I`): as duas ficam na tela.
- Clique em uma janela para trazê-la para frente.
- Arraste pelo cabeçalho para mover.
- Feche cada uma pelo `✕` do próprio cabeçalho.
- Ao abrir duas janelas principais em uma tela larga, elas são organizadas lado a lado automaticamente; depois você pode arrastá-las livremente.
- Em telas pequenas, as janelas se sobrepõem em cascata com os cabeçalhos visíveis; use o botão correspondente no HUD para alternar.

### Salvamento

- Autosave a cada 20 segundos e ao sair/voltar para a seleção de personagens.
- Conta e personagens ficam no navegador usado.
- **Configurações** permite salvar, exportar/importar o save em texto e ativar tela cheia.
- O botão **Sair** salva e volta para a seleção de personagens.

## Conteúdo implementado

- 4 classes com atributos, equipamentos e 4 habilidades próprias.
- 9 regiões (vila, campos, costa, floresta, ruínas, pântano, picos de gelo, cripta e cidadela) com dia/noite e clima.
- Combate action em tempo real, com mira pelo cursor, golpes em cone e projéteis livres.
- Auto-caça opcional: alvo, perseguição com desvio de obstáculos, habilidades, poções e coleta automáticos.
- Rastreamento de missões com clique no HUD ou na janela, viagem automática, entrada em masmorra e retorno para entrega.
- Distribuição de atributos com `+`, `−`, Redistribuir e repetição ao segurar.
- Monstros normais, elites, chefe, invocações e recompensas.
- Missões principais e diárias, conquistas, XP e progressão até o nível 60.
- Lojas, ferreiro/criação, banco, correio, leilão, grupo, guilda e viagem rápida.
- Coleta de ervas, minério e cristais; duas masmorras com chefe e saída.
- Chat com canais, bots simulados, ping/população, minimapa e tela cheia.
- Layout responsivo com joystick e botões de toque no celular.

## Arquivos

```
index.html          estrutura das telas, HUD e chat
css/style.css       visual, janelas flutuantes e layout mobile
js/data.js          classes, itens, monstros, missões, mapas e constantes
js/util.js          utilidades, armazenamento, áudio e matemática
js/art.js           arte procedural (tiles, atores, monstros, ícones)
js/world.js         geração do mundo, colisão, props e waypoints
js/systems.js       personagem, itens, quests, economia e save
js/ui.js            menus, janelas, HUD, chat e fluxo de telas
js/game.js          loop principal, combate, IA, câmera e persistência
Jogar.bat           atalho para abrir o jogo no Windows
PESQUISA_MMORPG.md  pesquisa e mapa das funcionalidades
```

## Requisitos

- Navegador moderno (Edge, Chrome, Firefox ou Safari).
- Teclado e mouse no desktop; toque no celular.
- Não é necessário Node.js, servidor local ou conexão com a internet para jogar.

## Solução de problemas

- **Tela preta ou jogo não abre:** confirme que a pasta foi extraída por completo e que `index.html` está ao lado das pastas `css` e `js`.
- **Progresso não aparece:** verifique se o navegador não está bloqueando `localStorage` ou se o save foi feito em outro navegador/perfil.
- **Sem áudio:** clique/toque na tela uma vez (navegadores exigem interação para liberar áudio) e confira os volumes em Configurações.
- **Janelas sobrepostas:** arraste pelo cabeçalho; o botão do HUD abre/fecha a janela correspondente.
- **Auto-caça parada:** confirme que `R`/AUTO está ligado. A automação continua funcionando com janelas abertas. Se um alvo ou item for inalcançável, ela abandona depois de alguns segundos e escolhe outro; use o mapa (`M`) para mudar de região.
- **Clique para andar não responde:** o clique direito contorna paredes e árvores. Destinos dentro de parede, água ou construção são recusados; clique em um piso livre próximo.
