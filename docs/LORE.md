# Crônicas de Aurora - Cânone (extraído do código)

Este documento lista apenas o que o código declara. Nada foi inventado. Cada afirmação
cita `arquivo:linha`. Fonte de verdade: o código; este arquivo apenas indexa.

---

## 1. Premissa e Eclipse

- Aldric: "Há mil anos, a Aurora selou o Eclipse. Agora o selo enfraquece."
  (`game.js` 3289).
- Capítulo 1 (intro): "A vila precisa de um novo guardião. Aprenda a lutar, colete recursos
  e descubra por que o Eclipse voltou." (`data.js` 379).
- Capítulo 3 (intro): "As ruínas guardam a primeira masmorra. O Rei Esquecido ainda
  carrega a coroa que selou o Eclipse." (`data.js` 385).
- Capítulo 6 (intro): "A fortaleza do Eclipse se revela. Seus salões são guardados por
  cavaleiros que já foram heróis." (`data.js` 394).
- Capítulo 8 (intro): "O Eclipse chegou. Reúna seus aliados e enfrenta o Arauto no topo da
  Cidadela." (`data.js` 400).
- q40: "Volte a Mestre Aldric e receba a benção de Aurora." (`data.js` 373).
- q36: "Volte a Aldric. A Cidadela abriu suas portas para o Eclipse." (`data.js` 361).

Aurora é tratada como entidade/força que selou o Eclipse há mil anos e concede benção
final (q40). O Eclipse se manifesta por criaturas (Cavaleiro/Mago do Eclipse, Arauto do
Eclipse) e masmorras (Cripta, Cidadela).

---

## 2. Zonas (A.ZONES, `data.js` 103-113)

| Chave | Nome | Nível | Segura | Masmorra |
|---|---|---|---|---|
| vila | Vila Aurora | Segura | sim | nao |
| campos | Campos Verdes | Nv 1-7 | nao | nao |
| costa | Costa Partida | Nv 5-12 | nao | nao |
| floresta | Floresta de Ébano | Nv 8-16 | nao | nao |
| ruinas | Ruínas de Solmar | Nv 16-24 | nao | nao |
| pantano | Pântano Cinzento | Nv 24-38 | nao | nao |
| picos | Picos de Gelo | Nv 38-58 | nao | nao |
| cripta | Cripta do Eclipse | Nv 18+ | nao | sim |
| cidadela | Cidadela do Eclipse | Nv 44+ | nao | sim |

---

## 3. NPCs (A.NPCS, `data.js` 214-224) e diálogos (`ui.js` 1882-1892)

| id | Nome | Papel | Posição (tiles) | Marker |
|---|---|---|---|---|
| aldric | Mestre Aldric | Mestre da Guilda | (68,47) | quest |
| orla | Mercadora Orla | Mercadora | (62,55) | shop |
| brann | Ferreiro Brann | Ferreiro | (81,47) | shop |
| elara | Mestra Elara | Treinadora | (76,57) | train |
| nara | Curandeira Nara | Curandeira | (64,45) | heal |
| banco | Banqueiro Ivo | Banco | (84,55) | bank |
| arauto | Arauto do Eclipse | Masmorra e Eventos | (70,60) | dungeon |
| sella | Vigia Sella | Guardiã dos Picos | (173,24) | quest |
| quadro | Quadro de Recompensas | Missões diárias | (74,43) | board (prop) |

Diálogos (greet):
- aldric: "Aurora precisa de você, {nome}. O Eclipse avança e os monstros ficam mais ousados a cada noite. Está pronto para escrever seu nome na história?" (`ui.js` 1883).
- orla: "Poções fresquinhas, ervas do campo e o melhor preço da vila! Não saia para a floresta sem uma poção de vida, querido." (`ui.js` 1884).
- brann: "Aç~o bom é aç~o quente. Traga minério e couro que eu forjo algo que aguente o tranco. Ou compre pronto, se tiver pressa." (`ui.js` 1885).
- elara: "Sua postura melhorou. Ainda há muito a aprender sobre o fluxo de mana e o timing dos golpes. Quer revisar suas habilidades?" (`ui.js` 1886).
- nara: "Sinto suas feridas daqui. Deixe-me cuidar de você - a luz de Aurora não abandona ninguém." (`ui.js` 1887).
- banco: "Segurança em primeiro lugar. Seus itens ficam guardados aqui, longe dos perigos do mundo." (`ui.js` 1888).
- arauto: "A Cripta e a Cidadela do Eclipse se abrem para os corajosos. Lá embaixo, antigos heróis guardam o selo. Diga-me: você está pronto para o nível 18?" (`ui.js` 1889).
- sella: "O frio não perdoa, mas a Vigília dos Picos resiste. Se precisar de missões ou de um ponto seguro, estou aqui." (`ui.js` 1890).
- quadro: "Recompensas diárias para quem mantém as estradas seguras. Confira os contratos de hoje." (`ui.js` 1891).

Sella é a única NPC fora da vila (Picos de Gelo, x=173,y=24) (`data.js` 222).

---

## 4. Capítulos e missões principais (A.QUESTS/A.CHAPTERS, `data.js` 239-402)

8 capítulos, 40 missões principais (q1-q40). Cada capítulo tem 5 missões.

| Cap | Título | Subtítulo (nível) | Região | Introdução (resumo) |
|---|---|---|---|---|
| 1 | O Despertar da Aurora | Campos Verdes - Nv 1-8 | campos | "A vila precisa de um novo guardião..." (`data.js` 379) |
| 2 | Sombras na Costa | Costa Partida e Floresta de Ébano - Nv 8-18 | floresta | "Contrabandistas e goblins se movem sob a copa das árvores. O primeiro selo de Aurora foi quebrado." (`data.js` 381-382) |
| 3 | O Selo de Solmar | Ruínas e Cripta do Eclipse - Nv 18-28 | ruinas | "As ruínas guardam a primeira masmorra..." (`data.js` 384-385) |
| 4 | Vozes do Pântano | Pântano Cinzento - Nv 28-38 | pantano | "A bruma sussurra nomes antigos. Bruxas e espectros mantêm o segundo selo sob o lodo." (`data.js` 387-388) |
| 5 | Os Picos de Gelo | Picos de Gelo - Nv 38-44 | picos | "A última estrada leva ao norte congelado. Algo antigo despertou sob a geleira." (`data.js` 390-391) |
| 6 | A Cidadela do Eclipse | Cidadela do Eclipse - Nv 44-52 | cidadela | "A fortaleza do Eclipse se revela..." (`data.js` 393-394) |
| 7 | A Coroa Partida | Geleiras e Cidadela - Nv 52-58 | picos | "A Rainha da Geada protege a coroa partida. Sem ela, o Arauto não pode ser derrotado." (`data.js` 396-397) |
| 8 | O Eclipse Eterno | Cidadela do Eclipse - Nv 58-60 | cidadela | "O Eclipse chegou. Reúna seus aliados e enfrenta o Arauto no topo da Cidadela." (`data.js` 399-400) |

Missões notáveis:
- q4 "O Caranguejo Ancião": boss crab_king na Costa Partida (`data.js` 250-252).
- q10 "O Coração de Ébano": boss boss_treant na Floresta (`data.js` 270-272).
- q13/q14: Cripta do Eclipse, 8 Esqueletos e boss_rei "O Rei Esquecido" (`data.js` 281-286).
- q20 "A Rainha do Lodo": boss boss_lodo no Pântano (`data.js` 304-306).
- q25 "O Rei do Gelo": boss boss_ice nos Picos (`data.js` 321-323).
- q29 "O Senhor da Cidadela": boss boss_cidadela na Cidadela (`data.js` 335-337).
- q35 "A Rainha da Geada": boss boss_rainha nos Picos (`data.js` 355-357).
- q39 "O Arauto do Eclipse": boss boss_eclipse na Cidadela (`data.js` 369-371).
- q40 "A Aurora Restaurada": talk com aldric, recompensa 10000 ouro + 10000 XP (`data.js` 372-374).

Givers principais: aldric (maioria), nara (q9, q18, q24, q30, q34), arauto (q13, q14, q27-29, q33, q37-39), sella (q22, q23, q25, q31, q32, q35).

---

## 5. Masmorras (A.DUNGEONS, `data.js` 404-409)

- cripta: "Cripta do Eclipse", nível 18, zona cripta, saída para ruinas. "A primeira masmorra. Esqueletos e o Rei Esquecido guardam o primeiro selo." (`data.js` 405-406).
- cidadela: "Cidadela do Eclipse", nível 44, zona cidadela, saída para picos. "A fortaleza final. Cavaleiros e magos do Eclipse protegem o Arauto." (`data.js` 407-408).

---

## 6. Chefs (bosses) (A.MONSTERS, `data.js` 130-146)

- boss_rei "O Rei Esquecido" (hp 2600, nível 22) (`data.js` 130).
- crab_king "Caranguejo Ancião" (hp 340, nível 8) (`data.js` 132).
- boss_treant "Coração de Ébano" (hp 980, nível 16) (`data.js` 133).
- boss_lodo "Rainha do Lodo" (hp 2200, nível 32) (`data.js` 134).
- boss_ice "Rei do Gelo" (hp 5200, nível 44) (`data.js` 140).
- boss_rainha "Rainha da Geada" (hp 7800, nível 55) (`data.js` 141).
- boss_cidadela "Senhor da Cidadela" (hp 9000, nível 50) (`data.js` 145).
- boss_eclipse "Arauto do Eclipse" (hp 18000, nível 60) (`data.js` 146).

---

## 7. Missões secundárias (A.SIDE_QUESTS, `data.js` 411-417)

5 caçadas (kill): Slimes (10), Lobos (8), Goblins (8), Esqueletos (8), Espectros (6).
Recompensas em ouro/XP pequenas.

---

## 8. Endgame (systems.js)

Desbloqueios por nível/capítulo (`S.applyUnlocks`, `systems.js` 468-495):
- Talents Nv 10; Encantamento Nv 20; Montaria capítulo >=3 ou Nv 18; Guilda/Gemas Nv 30;
  Conjuntos Nv 36; Raid da Cidadela Nv 44 e capítulo >=6; Arena de Ecos Nv 30;
  Facções Nv 50; Temporada Nv 55.

Atividades:
- Fendas (rift): consome chave de fenda, níveis 0-15, fragmentos do eclipse, XP 260+n*100 (`systems.js` 912-935).
- Raid: normal/heroico/mitico, needPower 2600*mult (`systems.js` 937-966).
- Arena: rating inicial 1000, +24/-16, XP e ouro (`systems.js` 969-983).
- Facções: aurora, eclipse, geada (`systems.js` 986-992).
- Temporada: cap 40 níveis, 1000 XP por nível (`systems.js` 994-1013).

---

## 9. Pontos de viagem (A.WAYPOINTS, `data.js` 226-234)

vila, campos, costa, floresta, ruinas, pantano, picos (7 pontos). Conquista "Explorador" exige 7 (`data.js` 442).

---

## 10. Classes (A.CLASSES, `data.js` 35-68)

4 classes: Guerreiro (espada, tanque), Mago (cajado, dano magico em area), Arqueiro (arco, precisao), Clerigo (maca, suporte). Atributos base e multiplicadores em `data.js` 36-67.

---

## 11. Notas de consistência

- README fala em 7 regiões, mas `data.js` tem 9 zonas (inclui Picos de Gelo e Cidadela do Eclipse) (`PROJECT_MAP.md` seção 11).
- `index.html` mostra v2.0.0, `A.VERSION` = 2.2.0 (`PROJECT_MAP.md` seção 1).
- Código é fonte de verdade; README pode ficar atrás.
