/* ==========================================================================
   CRÔNICAS DE AURORA — dados do jogo
   Tudo aqui é conteúdo: classes, itens, monstros, missões, servidores, etc.
   ========================================================================== */
window.A = window.A || {};
(function (A) {
  'use strict';

  A.VERSION = '2.2.0';
  A.VW = 1280;            // resolução lógica do mundo
  A.VH = 720;
  A.T = 32;               // tamanho do tile em pixels
  A.MW = 190;             // largura do mundo em tiles (6080 px)
  A.MH = 100;             // altura do mundo em tiles (3200 px)

  // A chave continua "v2" de propósito: saves antigos são migrados em vez de
  // abandonados. A versão real do conteúdo fica dentro do JSON (saveData.version).
  A.SAVE_KEY = 'aurora.mmo.save.v2';
  A.SAVE_VERSION = 4;
  A.SETTINGS_KEY = 'aurora.mmo.settings.v2';

  /* ------------------------------------------------------------------ */
  /* SERVIDORES                                                          */
  /* ------------------------------------------------------------------ */
  A.SERVERS = [
    { id: 'aurora',  name: 'Aurora',   region: 'BR', tag: 'Recomendado', host: 'São Paulo', status: 'online',     pop: 1842, cap: 2500, ping: 24, channels: ['Aurora I', 'Aurora II'] },
    { id: 'lumina',  name: 'Lumina',   region: 'BR', tag: 'Novo',        host: 'São Paulo', status: 'online',     pop: 612,  cap: 2500, ping: 31, channels: ['Lumina I'] },
    { id: 'eventide',name: 'Eventide', region: 'NA', tag: '',            host: 'Miami',     status: 'online',     pop: 2210, cap: 2500, ping: 132, channels: ['Eventide I', 'Eventide II'] },
    { id: 'prime',   name: 'Prime',    region: 'EU', tag: '',            host: 'Frankfurt', status: 'manutencao', pop: 0,    cap: 2500, ping: 210, channels: ['Prime I'] }
  ];

  /* ------------------------------------------------------------------ */
  /* CLASSES                                                             */
  /* ------------------------------------------------------------------ */
  A.CLASSES = {
    warrior: {
      name: 'Guerreiro', role: 'Tanque • Corpo a corpo', color: '#e8a33d', icon: 'sword',
      desc: 'Segura a linha de frente com vida alta, defesa sólida e golpes em área. Perdoa erros e domina grupos de monstros.',
      weapon: 'sword', armor: 'heavy', difficulty: 'Fácil',
      base: { for: 9, des: 4, int: 2, vit: 9 },
      mult: { hp: 1.20, mp: 0.80, atk: 1.00, def: 1.25 },
      bars: { vida: 5, ataque: 3, defesa: 5, magia: 1, dificuldade: 1 }
    },
    mage: {
      name: 'Mago', role: 'Dano mágico • Área', color: '#7f8cff', icon: 'staff',
      desc: 'Converte mana em destruição. Dano em área altíssimo, mas frágil: posicionamento e distância são tudo.',
      weapon: 'staff', armor: 'cloth', difficulty: 'Difícil',
      base: { for: 2, des: 4, int: 11, vit: 5 },
      mult: { hp: 0.80, mp: 1.30, atk: 1.15, def: 0.85 },
      bars: { vida: 2, ataque: 4, defesa: 1, magia: 5, dificuldade: 4 }
    },
    archer: {
      name: 'Arqueiro', role: 'Dano físico • Precisão', color: '#6fcf7f', icon: 'bow',
      desc: 'Ataca de longe com críticos frequentes e controla o campo com armadilhas. Excelente para caçar sozinho.',
      weapon: 'bow', armor: 'light', difficulty: 'Médio',
      base: { for: 4, des: 11, int: 3, vit: 5 },
      mult: { hp: 0.90, mp: 1.00, atk: 1.10, def: 0.95 },
      bars: { vida: 3, ataque: 5, defesa: 2, magia: 2, dificuldade: 2 }
    },
    cleric: {
      name: 'Clérigo', role: 'Suporte • Sagrado', color: '#f2d06b', icon: 'mace',
      desc: 'Cura, protege e pune com luz. Sobrevive por muito tempo e é indispensável em grupo, mas mata devagar.',
      weapon: 'mace', armor: 'robe', difficulty: 'Médio',
      base: { for: 5, des: 4, int: 8, vit: 7 },
      mult: { hp: 1.00, mp: 1.15, atk: 0.95, def: 1.05 },
      bars: { vida: 4, ataque: 2, defesa: 3, magia: 4, dificuldade: 2 }
    }
  };

  /* ------------------------------------------------------------------ */
  /* HABILIDADES (1 a 4)                                                 */
  /* ------------------------------------------------------------------ */
  A.SKILLS = {
    warrior: [
      { id: 'giro',    name: 'Golpe Giratório', desc: 'Atinge todos os inimigos ao redor.',             mp: 12, cd: 6,  power: 1.45, radius: 112, kind: 'aoe' },
      { id: 'investida', name: 'Investida',     desc: 'Avança e atordoa o primeiro alvo por 1s.',       mp: 15, cd: 9,  power: 1.80, radius: 40,  kind: 'dash' },
      { id: 'grito',   name: 'Grito de Guerra', desc: '+30% de ataque por 8s.',                         mp: 20, cd: 18, power: 0,    radius: 0,   kind: 'buff', buff: 'atk' },
      { id: 'pele',    name: 'Pele de Ferro',   desc: 'Escudo que absorve 30% da vida máxima por 6s.',  mp: 18, cd: 20, power: 0,    radius: 0,   kind: 'buff', buff: 'shield' }
    ],
    mage: [
      { id: 'bolaFogo', name: 'Bola de Fogo',   desc: 'Projétil que explode causando dano em área.',    mp: 14, cd: 4,  power: 1.65, radius: 54,  kind: 'projectile' },
      { id: 'novaGelo', name: 'Nova de Gelo',   desc: 'Congela e desacelera todos ao redor.',           mp: 22, cd: 10, power: 1.15, radius: 128, kind: 'aoe', slow: 3 },
      { id: 'raio',     name: 'Raio em Cadeia', desc: 'Salta entre até 3 inimigos.',                    mp: 18, cd: 7,  power: 1.35, radius: 220, kind: 'chain' },
      { id: 'escudo',   name: 'Escudo Arcano',  desc: 'Barreira que absorve 25% da vida máxima.',       mp: 20, cd: 22, power: 0,    radius: 0,   kind: 'buff', buff: 'shield' }
    ],
    archer: [
      { id: 'tiro',     name: 'Tiro Certeiro',  desc: 'Flecha potente com +25% de crítico.',            mp: 10, cd: 5,  power: 2.05, radius: 0,   kind: 'projectile', crit: 25 },
      { id: 'chuva',    name: 'Chuva de Flechas', desc: 'Bombardeia uma área à distância.',             mp: 20, cd: 12, power: 1.55, radius: 96,  kind: 'ground' },
      { id: 'armadilha',name: 'Armadilha',      desc: 'Prende e fere quem pisar nela.',                  mp: 15, cd: 14, power: 1.10, radius: 44,  kind: 'trap' },
      { id: 'passo',    name: 'Passo Sombrio',  desc: 'Salta para trás e ganha +40% de velocidade.',    mp: 12, cd: 12, power: 0,    radius: 0,   kind: 'buff', buff: 'haste' }
    ],
    cleric: [
      { id: 'luz',      name: 'Luz Curativa',   desc: 'Recupera 25% da vida máxima.',                   mp: 14, cd: 6,  power: 0.25, radius: 0,   kind: 'heal' },
      { id: 'julgamento', name: 'Julgamento',   desc: 'Explosão sagrada ao redor.',                     mp: 18, cd: 8,  power: 1.35, radius: 118, kind: 'aoe' },
      { id: 'bencao',   name: 'Bênção',         desc: '+30% de defesa e regeneração por 8s.',           mp: 20, cd: 18, power: 0,    radius: 0,   kind: 'buff', buff: 'bless' },
      { id: 'renascer', name: 'Renascer',       desc: 'Cura 50% e concede escudo. Revive aliados caídos.', mp: 35, cd: 45, power: 0.50, radius: 0, kind: 'heal', shield: true }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* ZONAS                                                               */
  /* ------------------------------------------------------------------ */
  A.ZONES = {
    vila:     { name: 'Vila Aurora',        level: 'Segura',     safe: true,  color: '#f2b84b', music: 0 },
    campos:   { name: 'Campos Verdes',      level: 'Nv 1–7',     safe: false, color: '#8fcf6a', music: 1 },
    costa:    { name: 'Costa Partida',      level: 'Nv 5–12',    safe: false, color: '#6fd0d8', music: 1 },
    floresta: { name: 'Floresta de Ébano',  level: 'Nv 8–16',    safe: false, color: '#6fae72', music: 1 },
    ruinas:   { name: 'Ruínas de Solmar',   level: 'Nv 16–24',   safe: false, color: '#b9a38a', music: 1 },
    pantano:  { name: 'Pântano Cinzento',   level: 'Nv 24–38',   safe: false, color: '#8f9c7a', music: 1 },
    picos:    { name: 'Picos de Gelo',      level: 'Nv 38–58',   safe: false, color: '#bde8ff', music: 1 },
    cripta:   { name: 'Cripta do Eclipse',  level: 'Nv 18+',     safe: false, color: '#b07cff', music: 2, dungeon: true },
    cidadela: { name: 'Cidadela do Eclipse', level: 'Nv 44+',    safe: false, color: '#d08cff', music: 2, dungeon: true }
  };

  /* ------------------------------------------------------------------ */
  /* MONSTROS                                                            */
  /* ------------------------------------------------------------------ */
  A.MONSTERS = {
    slime:   { name: 'Slime',            hp: 34,  atk: 7,  def: 0,  xp: 33,  speed: 42, aggro: 150, reach: 34, r: 12, gold: [2, 6],   drops: ['herb'],            bar: '#63d35f' },
    wolf:    { name: 'Lobo Cinzento',    hp: 58,  atk: 12, def: 2,  xp: 60,  speed: 82, aggro: 210, reach: 38, r: 13, gold: [4, 10],  drops: ['leather'],         bar: '#9aa0b0', aggressive: true },
    crab:    { name: 'Caranguejo Coral', hp: 52,  atk: 11, def: 7,  xp: 66,  speed: 54, aggro: 160, reach: 36, r: 13, gold: [5, 12],  drops: ['leather'],         bar: '#e2715b' },
    bandit:  { name: 'Bandido da Costa', hp: 92,  atk: 17, def: 6,  xp: 126, speed: 68, aggro: 200, reach: 40, r: 13, gold: [12, 26], drops: ['cloth','ore'],     bar: '#d9a23f', aggressive: true },
    goblin:  { name: 'Goblin',           hp: 86,  atk: 16, def: 5,  xp: 114, speed: 66, aggro: 210, reach: 38, r: 13, gold: [8, 20],  drops: ['ore','cloth'],     bar: '#78ac45' },
    spider:  { name: 'Aranha de Ébano',  hp: 78,  atk: 18, def: 4,  xp: 108, speed: 88, aggro: 190, reach: 34, r: 12, gold: [6, 16],  drops: ['essence'],         bar: '#8f6fd0', aggressive: true },
    treant:  { name: 'Treant Antigo',    hp: 210, atk: 23, def: 12, xp: 246, speed: 38, aggro: 170, reach: 46, r: 18, gold: [18, 34], drops: ['herb','leather'],  bar: '#6fae72' },
    skeleton:{ name: 'Esqueleto',        hp: 148, atk: 25, def: 9,  xp: 204, speed: 60, aggro: 220, reach: 40, r: 13, gold: [14, 30], drops: ['bone'],            bar: '#d8d8e6', aggressive: true },
    wraith:  { name: 'Espectro',         hp: 132, atk: 31, def: 5,  xp: 276, speed: 74, aggro: 250, reach: 180,r: 13, gold: [18, 38], drops: ['essence'],         bar: '#a98cff', ranged: true, aggressive: true },
    golem:   { name: 'Golem de Pedra',   hp: 340, atk: 34, def: 22, xp: 450, speed: 34, aggro: 180, reach: 48, r: 20, gold: [30, 60], drops: ['ore','crystal'],   bar: '#a9a28c' },
    witch:   { name: 'Bruxa do Pântano', hp: 190, atk: 38, def: 7,  xp: 390, speed: 52, aggro: 260, reach: 220,r: 13, gold: [26, 52], drops: ['essence','crystal'],bar: '#b07cff', ranged: true },
    boss_rei:{ name: 'O Rei Esquecido',  hp: 2600,atk: 52, def: 24, xp: 6600,speed: 48, aggro: 420, reach: 64, r: 30, gold: [400, 700],drops: ['crystal','essence','bone'], bar: '#ff5a5a', boss: true, aggressive: true, level: 22 },

    crab_king:{ name: 'Caranguejo Ancião', hp: 340, atk: 18, def: 10, xp: 220, speed: 56, aggro: 250, reach: 44, r: 20, gold: [70, 120], drops: ['leather','crystal'], bar: '#f08a5d', boss: true, aggressive: true, level: 8 },
    boss_treant:{ name: 'Coração de Ébano', hp: 980, atk: 28, def: 16, xp: 800, speed: 42, aggro: 280, reach: 52, r: 24, gold: [180, 300], drops: ['herb','crystal','bone'], bar: '#8fd07a', boss: true, aggressive: true, level: 16 },
    boss_lodo:{ name: 'Rainha do Lodo', hp: 2200, atk: 42, def: 20, xp: 1600, speed: 58, aggro: 360, reach: 60, r: 28, gold: [320, 520], drops: ['essence','crystal'], bar: '#9fcf7a', boss: true, aggressive: true, level: 32 },

    frostwolf:{ name: 'Lobo Glacial', hp: 360, atk: 32, def: 14, xp: 620, speed: 92, aggro: 240, reach: 40, r: 14, gold: [26, 52], drops: ['leather','frost_core'], bar: '#9fdcff', aggressive: true },
    icegolem:{ name: 'Golem de Gelo', hp: 720, atk: 38, def: 30, xp: 760, speed: 34, aggro: 190, reach: 50, r: 21, gold: [34, 68], drops: ['ore','crystal','frost_core'], bar: '#bde8ff' },
    yeti:   { name: 'Yeti das Nevascas', hp: 980, atk: 47, def: 22, xp: 1020, speed: 64, aggro: 260, reach: 48, r: 20, gold: [44, 86], drops: ['leather','frost_core'], bar: '#e8f4ff', aggressive: true },
    frostwitch:{ name: 'Bruxa do Inverno', hp: 680, atk: 52, def: 16, xp: 940, speed: 52, aggro: 280, reach: 230, r: 13, gold: [40, 78], drops: ['essence','crystal','frost_core'], bar: '#a8e8ff', ranged: true },
    boss_ice:{ name: 'Rei do Gelo', hp: 5200, atk: 78, def: 40, xp: 2400, speed: 50, aggro: 430, reach: 70, r: 32, gold: [700, 1100], drops: ['crystal','frost_core'], bar: '#7fd0ff', boss: true, aggressive: true, level: 44 },
    boss_rainha:{ name: 'Rainha da Geada', hp: 7800, atk: 96, def: 48, xp: 3200, speed: 56, aggro: 460, reach: 76, r: 32, gold: [1000, 1600], drops: ['crystal','frost_core','essence'], bar: '#c8f4ff', boss: true, aggressive: true, level: 55 },

    eclipse_knight:{ name: 'Cavaleiro do Eclipse', hp: 1350, atk: 64, def: 38, xp: 1600, speed: 70, aggro: 260, reach: 44, r: 15, gold: [60, 110], drops: ['ore','eclipse_shard'], bar: '#b07cff', aggressive: true },
    eclipse_mage:{ name: 'Mago do Eclipse', hp: 1100, atk: 76, def: 26, xp: 1700, speed: 56, aggro: 300, reach: 240, r: 14, gold: [66, 120], drops: ['essence','eclipse_shard'], bar: '#e08cff', ranged: true, aggressive: true },
    boss_cidadela:{ name: 'Senhor da Cidadela', hp: 9000, atk: 112, def: 54, xp: 4000, speed: 58, aggro: 480, reach: 82, r: 34, gold: [1400, 2200], drops: ['crystal','eclipse_shard'], bar: '#d08cff', boss: true, aggressive: true, level: 50 },
    boss_eclipse:{ name: 'Arauto do Eclipse', hp: 18000, atk: 150, def: 70, xp: 6000, speed: 62, aggro: 520, reach: 88, r: 36, gold: [2600, 4200], drops: ['crystal','essence','eclipse_shard'], bar: '#ff5ad0', boss: true, aggressive: true, level: 60 }
  };

  /* ------------------------------------------------------------------ */
  /* ITENS                                                               */
  /* ------------------------------------------------------------------ */
  A.RARITY = {
    comum:    { name: 'Comum',    color: '#c9c4d6', mult: 1.00, affixes: 0, weight: 58 },
    incomum:  { name: 'Incomum',  color: '#6fcf7f', mult: 1.18, affixes: 1, weight: 24 },
    raro:     { name: 'Raro',     color: '#6fa8ff', mult: 1.42, affixes: 2, weight: 12 },
    epico:    { name: 'Épico',    color: '#c07cff', mult: 1.72, affixes: 3, weight: 5 },
    lendario: { name: 'Lendário', color: '#ffb347', mult: 2.10, affixes: 4, weight: 1 }
  };

  A.ITEM_BASES = {
    sword:  { slot: 'weapon', icon: 'sword',  label: 'Espada',  atk: 9,  def: 0,  stats: { atk: 1 } },
    staff:  { slot: 'weapon', icon: 'staff',  label: 'Cajado',  atk: 10, def: 0,  stats: { atk: 1, mp: 12 } },
    bow:    { slot: 'weapon', icon: 'bow',    label: 'Arco',    atk: 8,  def: 0,  stats: { atk: 1, crit: 2 } },
    mace:   { slot: 'weapon', icon: 'mace',   label: 'Maça',    atk: 8,  def: 1,  stats: { atk: 1, def: 1 } },
    chest:  { slot: 'chest',  icon: 'chest',  label: 'Peitoral',atk: 0,  def: 7,  stats: { def: 1, hp: 14 } },
    helmet: { slot: 'helmet', icon: 'helmet', label: 'Elmo',    atk: 0,  def: 4,  stats: { def: 1, hp: 8 } },
    boots:  { slot: 'boots',  icon: 'boots',  label: 'Botas',   atk: 0,  def: 3,  stats: { def: 1, speed: 3 } },
    ring:   { slot: 'ring',   icon: 'ring',   label: 'Anel',    atk: 2,  def: 1,  stats: { crit: 2, atk: 1 } },
    amulet: { slot: 'amulet', icon: 'amulet', label: 'Amuleto', atk: 1,  def: 1,  stats: { hp: 10, mp: 10 } }
  };

  A.ITEM_NAMES = {
    sword: ['Espada Curta', 'Espada Longa', 'Lâmina Serrilhada', 'Montante', 'Cimitarra'],
    staff: ['Cajado de Carvalho', 'Cetro Rúnico', 'Bastão de Cristal', 'Cajado do Eclipse'],
    bow:   ['Arco Curto', 'Arco Longo', 'Arco Élfico', 'Besta de Caça'],
    mace:  ['Maça de Ferro', 'Martelo de Guerra', 'Mangual Sagrado'],
    chest: ['Armadura de Couro', 'Peitoral de Aço', 'Cota de Malha', 'Túnica Rúnica'],
    helmet:['Elmo de Couro', 'Capuz Sombrio', 'Coroa Antiga', 'Elmo de Aço'],
    boots: ['Botas de Viajante', 'Grevas de Aço', 'Sandálias Élficas'],
    ring:  ['Anel de Cobre', 'Selo de Prata', 'Aliança de Aurora'],
    amulet:['Amuleto de Osso', 'Colar de Cristal', 'Talismã do Sol']
  };

  A.AFFIXES = {
    atk:  ['Afiado', 'Brutal', 'do Carrasco', 'de Guerra'],
    def:  ['Reforçado', 'do Guardião', 'de Ferro', 'Inquebrável'],
    hp:   ['Vital', 'do Urso', 'Robusto', 'Sanguíneo'],
    mp:   ['Arcano', 'do Sábio', 'Etéreo', 'de Cristal'],
    crit: ['Preciso', 'do Caçador', 'Mortal', 'da Sombra'],
    speed:['Ágil', 'do Vento', 'Ligeiro', 'Veloz']
  };

  A.MATERIALS = {
    herb:    { name: 'Erva Medicinal', icon: 'herb',    color: '#7cc255', value: 6 },
    ore:     { name: 'Minério de Ferro', icon: 'ore',   color: '#b9a38a', value: 9 },
    crystal: { name: 'Cristal de Mana', icon: 'crystal',color: '#7f8cff', value: 18 },
    leather: { name: 'Couro Curtido',  icon: 'leather', color: '#c48a5a', value: 8 },
    cloth:   { name: 'Tecido Rúnico',  icon: 'cloth',   color: '#d9c9ff', value: 12 },
    bone:    { name: 'Osso Antigo',    icon: 'bone',    color: '#e6e1cf', value: 14 },
    essence: { name: 'Essência Sombria', icon: 'essence', color: '#b07cff', value: 24 },
    frost_core:   { name: 'Núcleo Glacial', icon: 'crystal', color: '#9fdcff', value: 42 },
    eclipse_shard:{ name: 'Fragmento do Eclipse', icon: 'essence', color: '#e08cff', value: 58 }
  };

  A.CONSUMABLES = {
    potion_hp: { name: 'Poção de Vida',  icon: 'potion_hp', color: '#e05252', value: 24, kind: 'hp' },
    potion_mp: { name: 'Poção de Mana',  icon: 'potion_mp', color: '#4a8bea', value: 28, kind: 'mp' },
    elixir:    { name: 'Elixir de Aurora', icon: 'elixir',  color: '#f2b84b', value: 90, kind: 'elixir' }
  };

  /* ------------------------------------------------------------------ */
  /* NPCS DA VILA (posições em tiles)                                    */
  /* ------------------------------------------------------------------ */
  A.NPCS = [
    { id: 'aldric', name: 'Mestre Aldric', role: 'Mestre da Guilda', x: 68, y: 47, look: { outfit: '#6a4aa8', skin: '#f0c9a0', hair: '#e9e9f4', beard: '#f4f4fa', hat: '#5a3fa0' }, marker: 'quest' },
    { id: 'orla',   name: 'Mercadora Orla', role: 'Mercadora', x: 62, y: 55, look: { outfit: '#3f8f5a', skin: '#f2c9a0', hair: '#8a4a22', apron: true }, marker: 'shop', kind: 'merchant', dialogueId: 'orla',
  // Rotina simples de Etapa 1: alterna entre a loja (dia) e a praça (noite).
  // Campos opcionais: NPCs sem `schedule` continuam estáticos.
  schedule: [ { from: 6, to: 18, x: 62, y: 55 }, { from: 18, to: 6, x: 68, y: 55 } ] },
    { id: 'brann',  name: 'Ferreiro Brann', role: 'Ferreiro', x: 81, y: 47, look: { outfit: '#8a4a2a', skin: '#d9a077', hair: '#3a2a1a', beard: '#3a2a1a', apron: true }, marker: 'shop' },
    { id: 'elara',  name: 'Mestra Elara', role: 'Treinadora', x: 76, y: 57, look: { outfit: '#4a6fa8', skin: '#f0c9a0', hair: '#d9c27a', robe: true }, marker: 'train' },
    { id: 'nara',   name: 'Curandeira Nara', role: 'Curandeira', x: 64, y: 45, look: { outfit: '#e6e1cf', skin: '#f6d7b0', hair: '#c46a3a', robe: true }, marker: 'heal' },
    { id: 'banco',  name: 'Banqueiro Ivo', role: 'Banco', x: 84, y: 55, look: { outfit: '#2f3f6f', skin: '#c98f6a', hair: '#2a2a2a', hat: '#22283f' }, marker: 'bank' },
    { id: 'arauto', name: 'Arauto do Eclipse', role: 'Masmorra e Eventos', x: 70, y: 60, look: { outfit: '#3a2a55', skin: '#b8b0c8', hair: '#1a1020', hat: '#1a1020', robe: true }, marker: 'dungeon' },
    { id: 'sella', name: 'Vigia Sella', role: 'Guardiã dos Picos', x: 173, y: 24, look: { outfit: '#4a7a9a', skin: '#e8c8a8', hair: '#d8e8f4', hat: '#2a4a6a', robe: true }, marker: 'quest' },
    { id: 'quadro', name: 'Quadro de Recompensas', role: 'Missões diárias', x: 74, y: 43, look: { outfit: '#7a5a2a', skin: '#000000', hair: '#000000' }, marker: 'board', prop: true },

  // Habitantes de Vila Aurora (Etapa 5). Convivem com os NPCs de serviço.
  { id: 'helena', name: 'Helena', role: 'Comerciante', x: 60, y: 50, look: { outfit: '#c97b3d', skin: '#f2c9a0', hair: '#5a3a2a', apron: true }, marker: 'shop', kind: 'citizen',
    schedule: [ { from: 7, to: 19, x: 60, y: 50 }, { from: 19, to: 7, x: 58, y: 46 } ] },
  { id: 'dario', name: 'Dario', role: 'Ferreiro', x: 80, y: 44, look: { outfit: '#6a4a2a', skin: '#d9a077', hair: '#2a1a0a', beard: '#2a1a0a', apron: true }, marker: 'shop', kind: 'citizen',
    schedule: [ { from: 6, to: 18, x: 80, y: 44 }, { from: 18, to: 6, x: 78, y: 48 } ] },
  { id: 'liora', name: 'Liora', role: 'Curandeira', x: 66, y: 40, look: { outfit: '#7a9a6a', skin: '#f6d7b0', hair: '#c46a3a', robe: true }, marker: 'heal', kind: 'citizen',
    schedule: [ { from: 8, to: 20, x: 66, y: 40 }, { from: 20, to: 8, x: 64, y: 44 } ] },
  { id: 'tomas', name: 'Tomás', role: 'Agricultor', x: 56, y: 60, look: { outfit: '#8a7a4a', skin: '#c98f6a', hair: '#3a2a1a', hat: '#5a4a2a' }, marker: 'quest', kind: 'citizen',
    schedule: [ { from: 5, to: 17, x: 56, y: 60 }, { from: 17, to: 5, x: 58, y: 56 } ] },
  { id: 'nilo', name: 'Nilo', role: 'Mensageiro', x: 70, y: 52, look: { outfit: '#4a7a9a', skin: '#e8c8a8', hair: '#d8e8f4', hat: '#2a4a6a' }, marker: 'quest', kind: 'citizen',
    schedule: [ { from: 6, to: 12, x: 70, y: 52 }, { from: 12, to: 18, x: 76, y: 46 }, { from: 18, to: 6, x: 72, y: 54 } ] },
  { id: 'marta', name: 'Marta', role: 'Estalajadeira', x: 56, y: 39, look: { outfit: '#9a6a4a', skin: '#f0c9a0', hair: '#6a3a1a', apron: true }, marker: 'shop', kind: 'citizen',
    schedule: [ { from: 9, to: 22, x: 56, y: 39 }, { from: 22, to: 9, x: 58, y: 42 } ] },
  { id: 'breno', name: 'Breno', role: 'Carpinteiro', x: 88, y: 55, look: { outfit: '#7a5a3a', skin: '#d9a077', hair: '#3a2a1a', beard: '#3a2a1a' }, marker: 'train', kind: 'citizen',
    schedule: [ { from: 7, to: 17, x: 88, y: 55 }, { from: 17, to: 7, x: 86, y: 52 } ] },
  { id: 'irene', name: 'Irene', role: 'Parteira', x: 70, y: 48, look: { outfit: '#6a5a7a', skin: '#f6d7b0', hair: '#c4c4c4', robe: true }, marker: 'heal', kind: 'citizen' },
  { id: 'caio', name: 'Caio', role: 'Aprendiz', x: 82, y: 46, look: { outfit: '#5a4a3a', skin: '#e8c8a8', hair: '#2a1a0a' }, marker: 'train', kind: 'citizen',
    schedule: [ { from: 7, to: 17, x: 82, y: 46 }, { from: 17, to: 7, x: 80, y: 48 } ] },
  { id: 'rosa', name: 'Rosa', role: 'Curandeira', x: 65, y: 46, look: { outfit: '#a67a6a', skin: '#f2c9a0', hair: '#8a4a22', robe: true }, marker: 'heal', kind: 'citizen',
    schedule: [ { from: 8, to: 20, x: 65, y: 46 }, { from: 20, to: 8, x: 63, y: 44 } ] }
  ];

  A.ANIMALS = [
    { id: 'pingo', name: 'Pingo', species: 'gato', color: '#e8a33d', x: 63, y: 52, area: { x0: 58, y0: 48, x1: 70, y1: 56 }, kind: 'animal' },
    { id: 'brasa', name: 'Brasa', species: 'cachorro', color: '#8a4a2a', x: 82, y: 48, area: { x0: 78, y0: 44, x1: 86, y1: 52 }, kind: 'animal' },
    { id: 'estrela', name: 'Estrela', species: 'cabra', color: '#e8e8e8', x: 56, y: 62, area: { x0: 52, y0: 58, x1: 62, y1: 66 }, kind: 'animal' },
    { id: 'galinha1', name: 'Galinha', species: 'galinha', color: '#d9c9a0', x: 54, y: 61, area: { x0: 52, y0: 58, x1: 60, y1: 64 }, kind: 'animal' },
    { id: 'galinha2', name: 'Galinha', species: 'galinha', color: '#d9c9a0', x: 57, y: 63, area: { x0: 52, y0: 58, x1: 60, y1: 64 }, kind: 'animal' }
  ];

  A.WAYPOINTS = [
    { id: 'vila',     name: 'Vila Aurora',     x: 74, y: 61, zone: 'vila' },
    { id: 'campos',   name: 'Campos Verdes',   x: 74, y: 22, zone: 'campos' },
    { id: 'costa',    name: 'Costa Partida',   x: 26, y: 60, zone: 'costa' },
    { id: 'floresta', name: 'Floresta de Ébano', x: 118, y: 34, zone: 'floresta' },
    { id: 'ruinas',   name: 'Ruínas de Solmar', x: 76, y: 82, zone: 'ruinas' },
    { id: 'pantano',  name: 'Pântano Cinzento', x: 126, y: 78, zone: 'pantano' },
    { id: 'picos',    name: 'Picos de Gelo',    x: 170, y: 22, zone: 'picos' }
  ];

  /* ------------------------------------------------------------------ */
  /* MISSÕES PRINCIPAIS                                                  */
  /* ------------------------------------------------------------------ */
  A.QUESTS = [
    // Capítulo 1 — O Despertar da Aurora (Nv 1–8)
    { id: 'q1', chapter: 1, title: 'Bem-vindo a Aurora', giver: 'aldric', type: 'talk', need: 1, target: '', zone: 'vila',
      desc: 'Fale com Mestre Aldric na praça da vila.',
      reward: { gold: 30, xp: 60, items: [{ id: 'potion_hp', qty: 2 }] } },
    { id: 'q2', chapter: 1, title: 'Limpeza dos Campos', giver: 'aldric', type: 'kill', need: 6, target: 'slime', zone: 'campos',
      desc: 'Derrote 6 Slimes nos Campos Verdes, ao norte da vila.',
      reward: { gold: 60, xp: 180, items: [{ id: 'potion_hp', qty: 3 }] } },
    { id: 'q3', chapter: 1, title: 'Lobos Famintos', giver: 'aldric', type: 'kill', need: 5, target: 'wolf', zone: 'campos',
      desc: 'Derrote 5 Lobos Cinzentos que rondam os campos.',
      reward: { gold: 90, xp: 330, items: [{ id: 'leather', qty: 3 }] } },
    { id: 'q4', chapter: 1, title: 'O Caranguejo Ancião', giver: 'aldric', type: 'boss', need: 1, target: 'crab_king', zone: 'costa',
      desc: 'Enfrente o Caranguejo Ancião na Costa Partida, a oeste.',
      reward: { gold: 220, xp: 620, items: [{ id: 'potion_hp', qty: 4 }, { id: 'crystal', qty: 2 }] } },
    { id: 'q5', chapter: 1, title: 'Areia e Maré', giver: 'aldric', type: 'explore', need: 1, target: 'costa', zone: 'costa',
      desc: 'Chegue à Costa Partida e reconheça o ponto de viagem.',
      reward: { gold: 140, xp: 500, items: [{ id: 'potion_mp', qty: 3 }] } },

    // Capítulo 2 — Sombras na Costa (Nv 8–18)
    { id: 'q6', chapter: 2, title: 'Contrabando na Costa', giver: 'aldric', type: 'kill', need: 6, target: 'bandit', zone: 'costa',
      desc: 'Elimine 6 Bandidos da Costa que atacam viajantes.',
      reward: { gold: 260, xp: 900, items: [{ id: 'potion_hp', qty: 5 }] } },
    { id: 'q7', chapter: 2, title: 'O Caminho de Ébano', giver: 'aldric', type: 'explore', need: 1, target: 'floresta', zone: 'floresta',
      desc: 'Viaje até a Floresta de Ébano, a leste da vila.',
      reward: { gold: 220, xp: 800, items: [{ id: 'potion_mp', qty: 3 }] } },
    { id: 'q8', chapter: 2, title: 'O Acampamento Goblin', giver: 'aldric', type: 'kill', need: 8, target: 'goblin', zone: 'floresta',
      desc: 'Elimine 8 Goblins no acampamento da Floresta de Ébano.',
      reward: { gold: 340, xp: 1600, items: [{ id: 'ore', qty: 5 }] } },
    { id: 'q9', chapter: 2, title: 'Cristais sob as Folhas', giver: 'nara', type: 'collect', need: 4, target: 'crystal', zone: 'floresta',
      desc: 'Colete 4 Cristais de Mana nos nós da floresta.',
      reward: { gold: 300, xp: 1800, items: [{ id: 'essence', qty: 3 }] } },
    { id: 'q10', chapter: 2, title: 'O Coração de Ébano', giver: 'aldric', type: 'boss', need: 1, target: 'boss_treant', zone: 'floresta',
      desc: 'Derrube o Coração de Ébano, o treant ancestral da floresta.',
      reward: { gold: 620, xp: 5200, items: [{ id: 'crystal', qty: 5 }, { id: 'elixir', qty: 1 }] } },

    // Capítulo 3 — O Selo de Solmar (Nv 18–28)
    { id: 'q11', chapter: 3, title: 'As Ruínas de Solmar', giver: 'aldric', type: 'explore', need: 1, target: 'ruinas', zone: 'ruinas',
      desc: 'Desça até as Ruínas de Solmar, ao sul da vila.',
      reward: { gold: 400, xp: 1800, items: [{ id: 'potion_hp', qty: 5 }] } },
    { id: 'q12', chapter: 3, title: 'Pedra que Anda', giver: 'aldric', type: 'kill', need: 6, target: 'golem', zone: 'ruinas',
      desc: 'Destrua 6 Golems de Pedra que guardam as ruínas.',
      reward: { gold: 520, xp: 2400, items: [{ id: 'ore', qty: 8 }] } },
    { id: 'q13', chapter: 3, title: 'A Cripta de Solmar', giver: 'arauto', type: 'dungeon', need: 8, target: 'skeleton', zone: 'cripta', dungeon: 'cripta',
      desc: 'Entre na Cripta do Eclipse pelas Ruínas e derrote 8 Esqueletos.',
      reward: { gold: 640, xp: 3000, items: [{ id: 'potion_mp', qty: 5 }] } },
    { id: 'q14', chapter: 3, title: 'O Rei Esquecido', giver: 'arauto', type: 'boss', need: 1, target: 'boss_rei', zone: 'cripta', dungeon: 'cripta',
      desc: 'Enfrente O Rei Esquecido no fundo da Cripta do Eclipse.',
      reward: { gold: 1000, xp: 5800, items: [{ id: 'crystal', qty: 6 }, { id: 'elixir', qty: 1 }] } },
    { id: 'q15', chapter: 3, title: 'O Pântano Sussurrante', giver: 'aldric', type: 'explore', need: 1, target: 'pantano', zone: 'pantano',
      desc: 'Siga a estrada a sudeste até o Pântano Cinzento.',
      reward: { gold: 600, xp: 3000, items: [{ id: 'essence', qty: 4 }] } },

    // Capítulo 4 — Vozes do Pântano (Nv 28–38)
    { id: 'q16', chapter: 4, title: 'Espectros na Bruma', giver: 'aldric', type: 'kill', need: 8, target: 'wraith', zone: 'pantano',
      desc: 'Silencie 8 Espectros no Pântano Cinzento.',
      reward: { gold: 700, xp: 5000, items: [{ id: 'essence', qty: 5 }] } },
    { id: 'q17', chapter: 4, title: 'O Círculo das Bruxas', giver: 'aldric', type: 'kill', need: 5, target: 'witch', zone: 'pantano',
      desc: 'Interrompa o ritual derrotando 5 Bruxas do Pântano.',
      reward: { gold: 760, xp: 4400, items: [{ id: 'crystal', qty: 5 }] } },
    { id: 'q18', chapter: 4, title: 'Essência para o Selo', giver: 'nara', type: 'collect', need: 6, target: 'essence', zone: 'pantano',
      desc: 'Reúna 6 Essências Sombrias dos monstros do pântano.',
      reward: { gold: 720, xp: 4200, items: [{ id: 'potion_hp', qty: 8 }] } },
    { id: 'q19', chapter: 4, title: 'Ninhos de Ébano', giver: 'aldric', type: 'kill', need: 8, target: 'spider', zone: 'pantano',
      desc: 'Limpe 8 Aranhas de Ébano das margens do pântano.',
      reward: { gold: 820, xp: 5000, items: [{ id: 'leather', qty: 8 }] } },
    { id: 'q20', chapter: 4, title: 'A Rainha do Lodo', giver: 'aldric', type: 'boss', need: 1, target: 'boss_lodo', zone: 'pantano',
      desc: 'Enfrente a Rainha do Lodo no coração do pântano.',
      reward: { gold: 1600, xp: 9500, items: [{ id: 'crystal', qty: 8 }, { id: 'elixir', qty: 2 }] } },

    // Capítulo 5 — Os Picos de Gelo (Nv 38–44)
    { id: 'q21', chapter: 5, title: 'Além da Última Estrada', giver: 'aldric', type: 'explore', need: 1, target: 'picos', zone: 'picos',
      desc: 'Atravesse a passagem leste e chegue aos Picos de Gelo.',
      reward: { gold: 900, xp: 3600, items: [{ id: 'potion_hp', qty: 8 }] } },
    { id: 'q22', chapter: 5, title: 'Matilha Glacial', giver: 'sella', type: 'kill', need: 8, target: 'frostwolf', zone: 'picos',
      desc: 'Derrote 8 Lobos Glaciais nas encostas dos Picos.',
      reward: { gold: 1100, xp: 4300, items: [{ id: 'frost_core', qty: 2 }] } },
    { id: 'q23', chapter: 5, title: 'Gigantes de Gelo', giver: 'sella', type: 'kill', need: 6, target: 'icegolem', zone: 'picos',
      desc: 'Destrua 6 Golems de Gelo que bloqueiam a passagem.',
      reward: { gold: 1200, xp: 4600, items: [{ id: 'ore', qty: 10 }] } },
    { id: 'q24', chapter: 5, title: 'Cristais da Geada', giver: 'nara', type: 'collect', need: 6, target: 'crystal', zone: 'picos',
      desc: 'Colete 6 Cristais de Mana nas formações dos Picos.',
      reward: { gold: 1000, xp: 3800, items: [{ id: 'potion_mp', qty: 8 }] } },
    { id: 'q25', chapter: 5, title: 'O Rei do Gelo', giver: 'sella', type: 'boss', need: 1, target: 'boss_ice', zone: 'picos',
      desc: 'Enfrente o Rei do Gelo no alto dos Picos.',
      reward: { gold: 2200, xp: 6500, items: [{ id: 'frost_core', qty: 5 }, { id: 'elixir', qty: 2 }] } },

    // Capítulo 6 — A Cidadela do Eclipse (Nv 44–52)
    { id: 'q26', chapter: 6, title: 'O Selo se Rompe', giver: 'aldric', type: 'talk', need: 1, target: '', zone: 'vila',
      desc: 'Retorne a Mestre Aldric com o Núcleo Glacial.',
      onComplete: [{ setFlag: 'q26_base_done' }],
      stages: [
        { id: 'q26_s1', type: 'talk', need: 1, target: '', zone: 'vila', npc: 'aldric', desc: 'Fale com Mestre Aldric sobre o Núcleo Glacial.' },
        { id: 'q26_s2', type: 'explore', need: 1, target: 'vila', zone: 'vila', desc: 'Permaneça na praça da Vila Aurora e prepare-se para o selo.' },
        { id: 'q26_s3', type: 'talk', need: 1, target: '', zone: 'vila', npc: 'aldric', desc: 'Confirme a Aldric que está pronto para a Cidadela.',
          onComplete: [
            { setFlag: 'q26_selos_rompidos' },
            { remember: 'q26_ajudou_selos', type: 'missao', npc: 'aldric' },
            { learn: 'selo_rompido', npc: 'aldric' }
          ] }
      ],
      reward: { gold: 1400, xp: 5000, items: [{ id: 'potion_hp', qty: 10 }] } },
    { id: 'q27', chapter: 6, title: 'Portões da Cidadela', giver: 'arauto', type: 'dungeon', need: 8, target: 'eclipse_knight', zone: 'cidadela', dungeon: 'cidadela',
      desc: 'Entre na Cidadela do Eclipse pelos Picos e derrote 8 Cavaleiros.',
      reward: { gold: 1800, xp: 8000, items: [{ id: 'eclipse_shard', qty: 2 }] } },
    { id: 'q28', chapter: 6, title: 'Ecos do Arauto', giver: 'arauto', type: 'dungeon', need: 5, target: 'eclipse_mage', zone: 'cidadela', dungeon: 'cidadela',
      desc: 'Silencie 5 Magos do Eclipse nos salões da Cidadela.',
      reward: { gold: 1900, xp: 6500, items: [{ id: 'essence', qty: 8 }] } },
    { id: 'q29', chapter: 6, title: 'O Senhor da Cidadela', giver: 'arauto', type: 'boss', need: 1, target: 'boss_cidadela', zone: 'cidadela', dungeon: 'cidadela',
      desc: 'Derrote o Senhor da Cidadela no salão central.',
      reward: { gold: 3200, xp: 9500, items: [{ id: 'crystal', qty: 12 }, { id: 'elixir', qty: 2 }] } },
    { id: 'q30', chapter: 6, title: 'Fragmentos do Eclipse', giver: 'nara', type: 'collect', need: 6, target: 'eclipse_shard', zone: 'cidadela',
      desc: 'Reúna 6 Fragmentos do Eclipse dos soldados da Cidadela.',
      reward: { gold: 2000, xp: 8000, items: [{ id: 'potion_mp', qty: 10 }] } },

    // Capítulo 7 — A Coroa Partida (Nv 52–58)
    { id: 'q31', chapter: 7, title: 'A Fúria dos Yetis', giver: 'sella', type: 'kill', need: 8, target: 'yeti', zone: 'picos',
      desc: 'Contenha 8 Yetis das Nevascas nas geleiras altas.',
      reward: { gold: 2200, xp: 5600, items: [{ id: 'frost_core', qty: 3 }] } },
    { id: 'q32', chapter: 7, title: 'O Inverno Eterno', giver: 'sella', type: 'kill', need: 6, target: 'frostwitch', zone: 'picos',
      desc: 'Derrote 6 Bruxas do Inverno que mantêm a tempestade.',
      reward: { gold: 2300, xp: 5600, items: [{ id: 'essence', qty: 8 }] } },
    { id: 'q33', chapter: 7, title: 'Lâminas da Noite', giver: 'arauto', type: 'dungeon', need: 12, target: 'eclipse_knight', zone: 'cidadela', dungeon: 'cidadela',
      desc: 'Elimine 12 Cavaleiros do Eclipse nos corredores superiores.',
      reward: { gold: 2600, xp: 6400, items: [{ id: 'eclipse_shard', qty: 4 }] } },
    { id: 'q34', chapter: 7, title: 'Corações Congelados', giver: 'nara', type: 'collect', need: 8, target: 'frost_core', zone: 'picos',
      desc: 'Reúna 8 Núcleos Glaciais dos monstros dos Picos.',
      reward: { gold: 2400, xp: 5600, items: [{ id: 'potion_hp', qty: 12 }] } },
    { id: 'q35', chapter: 7, title: 'A Rainha da Geada', giver: 'sella', type: 'boss', need: 1, target: 'boss_rainha', zone: 'picos',
      desc: 'Enfrente a Rainha da Geada no trono de gelo.',
      reward: { gold: 4200, xp: 9000, items: [{ id: 'frost_core', qty: 8 }, { id: 'elixir', qty: 3 }] } },

    // Capítulo 8 — O Eclipse Eterno (Nv 58–60)
    { id: 'q36', chapter: 8, title: 'A Última Aurora', giver: 'aldric', type: 'talk', need: 1, target: '', zone: 'vila',
      desc: 'Volte a Aldric. A Cidadela abriu suas portas para o Eclipse.',
      reward: { gold: 3000, xp: 6000, items: [{ id: 'potion_hp', qty: 12 }, { id: 'potion_mp', qty: 12 }] } },
    { id: 'q37', chapter: 8, title: 'O Céu se Apaga', giver: 'arauto', type: 'dungeon', need: 10, target: 'eclipse_mage', zone: 'cidadela', dungeon: 'cidadela',
      desc: 'Derrote 10 Magos do Eclipse no último andar da Cidadela.',
      reward: { gold: 3400, xp: 7600, items: [{ id: 'eclipse_shard', qty: 5 }] } },
    { id: 'q38', chapter: 8, title: 'A Guarda Partida', giver: 'arauto', type: 'dungeon', need: 14, target: 'eclipse_knight', zone: 'cidadela', dungeon: 'cidadela',
      desc: 'Rompa a guarda derrotando 14 Cavaleiros do Eclipse.',
      reward: { gold: 3600, xp: 8200, items: [{ id: 'crystal', qty: 15 }] } },
    { id: 'q39', chapter: 8, title: 'O Arauto do Eclipse', giver: 'arauto', type: 'boss', need: 1, target: 'boss_eclipse', zone: 'cidadela', dungeon: 'cidadela',
      desc: 'Enfrente o Arauto do Eclipse no topo da Cidadela.',
      reward: { gold: 6000, xp: 12000, items: [{ id: 'elixir', qty: 5 }, { id: 'eclipse_shard', qty: 8 }] } },
    { id: 'q40', chapter: 8, title: 'A Aurora Restaurada', giver: 'aldric', type: 'talk', need: 1, target: '', zone: 'vila',
      desc: 'Volte a Mestre Aldric e receba a bênção de Aurora.',
      reward: { gold: 10000, xp: 10000, items: [{ id: 'elixir', qty: 8 }, { id: 'crystal', qty: 20 }] } }
  ];

  A.CHAPTERS = [
    { n: 1, id: 'cap1', title: 'O Despertar da Aurora', subtitle: 'Campos Verdes • Nv 1–8', minLevel: 1, region: 'campos',
      intro: 'A vila precisa de um novo guardião. Aprenda a lutar, colete recursos e descubra por que o Eclipse voltou.',
      quests: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    { n: 2, id: 'cap2', title: 'Sombras na Costa', subtitle: 'Costa Partida e Floresta de Ébano • Nv 8–18', minLevel: 8, region: 'floresta',
      intro: 'Contrabandistas e goblins se movem sob a copa das árvores. O primeiro selo de Aurora foi quebrado.',
      quests: ['q6', 'q7', 'q8', 'q9', 'q10'] },
    { n: 3, id: 'cap3', title: 'O Selo de Solmar', subtitle: 'Ruínas e Cripta do Eclipse • Nv 18–28', minLevel: 18, region: 'ruinas',
      intro: 'As ruínas guardam a primeira masmorra. O Rei Esquecido ainda carrega a coroa que selou o Eclipse.',
      quests: ['q11', 'q12', 'q13', 'q14', 'q15'] },
    { n: 4, id: 'cap4', title: 'Vozes do Pântano', subtitle: 'Pântano Cinzento • Nv 28–38', minLevel: 28, region: 'pantano',
      intro: 'A bruma sussurra nomes antigos. Bruxas e espectros mantêm o segundo selo sob o lodo.',
      quests: ['q16', 'q17', 'q18', 'q19', 'q20'] },
    { n: 5, id: 'cap5', title: 'Os Picos de Gelo', subtitle: 'Picos de Gelo • Nv 38–44', minLevel: 38, region: 'picos',
      intro: 'A última estrada leva ao norte congelado. Algo antigo despertou sob a geleira.',
      quests: ['q21', 'q22', 'q23', 'q24', 'q25'] },
    { n: 6, id: 'cap6', title: 'A Cidadela do Eclipse', subtitle: 'Cidadela do Eclipse • Nv 44–52', minLevel: 44, region: 'cidadela',
      intro: 'A fortaleza do Eclipse se revela. Seus salões são guardados por cavaleiros que já foram heróis.',
      quests: ['q26', 'q27', 'q28', 'q29', 'q30'] },
    { n: 7, id: 'cap7', title: 'A Coroa Partida', subtitle: 'Geleiras e Cidadela • Nv 52–58', minLevel: 52, region: 'picos',
      intro: 'A Rainha da Geada protege a coroa partida. Sem ela, o Arauto não pode ser derrotado.',
      quests: ['q31', 'q32', 'q33', 'q34', 'q35'] },
    { n: 8, id: 'cap8', title: 'O Eclipse Eterno', subtitle: 'Cidadela do Eclipse • Nv 58–60', minLevel: 58, region: 'cidadela',
      intro: 'O Eclipse chegou. Reúna seus aliados e enfrenta o Arauto no topo da Cidadela.',
      quests: ['q36', 'q37', 'q38', 'q39', 'q40'] }
  ];

  A.DUNGEONS = {
    cripta: { id: 'cripta', name: 'Cripta do Eclipse', level: 18, zone: 'cripta', exitZone: 'ruinas',
      desc: 'A primeira masmorra. Esqueletos e o Rei Esquecido guardam o primeiro selo.' },
    cidadela: { id: 'cidadela', name: 'Cidadela do Eclipse', level: 44, zone: 'cidadela', exitZone: 'picos',
      desc: 'A fortaleza final. Cavaleiros e magos do Eclipse protegem o Arauto.' }
  };

  A.SIDE_QUESTS = [
    { id: 's_slime',  title: 'Caçada: Slimes',   type: 'kill', target: 'slime',  need: 10, desc: 'Derrote 10 Slimes.', rewards: { gold: 80, xp: 70 } },
    { id: 's_wolf',   title: 'Caçada: Lobos',    type: 'kill', target: 'wolf',   need: 8,  desc: 'Derrote 8 Lobos.', rewards: { gold: 130, xp: 120 } },
    { id: 's_goblin', title: 'Caçada: Goblins',  type: 'kill', target: 'goblin', need: 8,  desc: 'Derrote 8 Goblins.', rewards: { gold: 190, xp: 220 } },
    { id: 's_skel',   title: 'Caçada: Esqueletos', type: 'kill', target: 'skeleton', need: 8, desc: 'Derrote 8 Esqueletos.', rewards: { gold: 260, xp: 340 } },
    { id: 's_wraith', title: 'Caçada: Espectros', type: 'kill', target: 'wraith', need: 6, desc: 'Derrote 6 Espectros.', rewards: { gold: 340, xp: 500 } }
  ];

  /* ------------------------------------------------------------------ */
  /* CRIAÇÃO                                                             */
  /* ------------------------------------------------------------------ */
  A.RECIPES = [
    { id: 'r_pothp', name: 'Poção de Vida', icon: 'potion_hp', out: { id: 'potion_hp', qty: 2 }, mats: { herb: 2, crystal: 1 }, level: 1 },
    { id: 'r_potmp', name: 'Poção de Mana', icon: 'potion_mp', out: { id: 'potion_mp', qty: 2 }, mats: { herb: 2, essence: 1 }, level: 3 },
    { id: 'r_sword', name: 'Espada de Aço', icon: 'sword', out: { gen: 'sword', ilvl: 0, rarity: 'raro' }, mats: { ore: 5, leather: 2 }, level: 5 },
    { id: 'r_chest', name: 'Peitoral de Aço', icon: 'chest', out: { gen: 'chest', ilvl: 0, rarity: 'raro' }, mats: { ore: 6, cloth: 2 }, level: 6 },
    { id: 'r_ring',  name: 'Anel Rúnico', icon: 'ring', out: { gen: 'ring', ilvl: 0, rarity: 'epico' }, mats: { crystal: 3, ore: 2 }, level: 8 },
    { id: 'r_elixir',name: 'Elixir de Aurora', icon: 'elixir', out: { id: 'elixir', qty: 1 }, mats: { herb: 3, crystal: 2, essence: 1 }, level: 10 }
  ];

  A.ACHIEVEMENTS = [
    { id: 'a_first',  name: 'Primeiro Sangue',  desc: 'Derrote seu primeiro monstro.',              goal: 1,   stat: 'kills', icon: 'sword' },
    { id: 'a_hunter', name: 'Caçador',          desc: 'Derrote 50 monstros.',                        goal: 50,  stat: 'kills', icon: 'bow' },
    { id: 'a_legend', name: 'Lenda de Aurora',  desc: 'Derrote 500 monstros.',                       goal: 500, stat: 'kills', icon: 'skull' },
    { id: 'a_lv10',   name: 'Veterano',         desc: 'Alcance o nível 10.',                         goal: 10,  stat: 'level', icon: 'star' },
    { id: 'a_lv20',   name: 'Herói',            desc: 'Alcance o nível 20.',                         goal: 20,  stat: 'level', icon: 'star' },
    { id: 'a_lv30',   name: 'Mito',             desc: 'Alcance o nível 30.',                         goal: 30,  stat: 'level', icon: 'star' },
    { id: 'a_lv45',   name: 'Lenda do Norte',   desc: 'Alcance o nível 45.',                         goal: 45,  stat: 'level', icon: 'star' },
    { id: 'a_lv60',   name: 'Aurora Eterna',    desc: 'Alcance o nível 60.',                         goal: 60,  stat: 'level', icon: 'crown' },
    { id: 'a_gold1k', name: 'Bolso Cheio',      desc: 'Acumule 1.000 de ouro.',                      goal: 1000,stat: 'gold',  icon: 'coin' },
    { id: 'a_gold10k',name: 'Magnata',          desc: 'Acumule 10.000 de ouro.',                     goal: 10000,stat:'gold', icon: 'coin' },
    { id: 'a_explore',name: 'Explorador',       desc: 'Desbloqueie todos os pontos de viagem.',      goal: 7,   stat: 'waypoints', icon: 'map' },
    { id: 'a_quests', name: 'Contador de Histórias', desc: 'Conclua 10 missões.',                    goal: 10,  stat: 'quests', icon: 'scroll' },
    { id: 'a_craft',  name: 'Artesão',           desc: 'Crie 5 itens.',                              goal: 5,   stat: 'crafts', icon: 'anvil' },
    { id: 'a_boss',   name: 'Ceifador de Reis',  desc: 'Derrote O Rei Esquecido.',                   goal: 1,   stat: 'boss', icon: 'crown' },
    { id: 'a_social', name: 'Bem Acompanhado',   desc: 'Entre em um grupo.',                         goal: 1,   stat: 'party', icon: 'users' },
    { id: 'a_guild',  name: 'Casa e Família',    desc: 'Funde ou entre em uma guilda.',              goal: 1,   stat: 'guild', icon: 'shield' }
  ];

  /* ------------------------------------------------------------------ */
  /* JOGADORES SIMULADOS E CHAT                                          */
  /* ------------------------------------------------------------------ */
  A.BOT_NAMES = [
    'Thalion', 'Mira', 'Kael', 'Sombra', 'Lyra', 'Dorian', 'Nyx', 'Bruma',
    'Aria', 'Vex', 'Rurik', 'Selene', 'Fenrir', 'Isolde', 'Corvo', 'Tara',
    'Orion', 'Valka', 'Eron', 'Maelis'
  ];

  A.CHAT_LINES = [
    'alguém para a Cripta? tô no nível 18',
    'vendo Cristal de Mana, 40g cada',
    'cuidado com o Golem no pântano, ele bate MUITO',
    'boa noite, Aurora!',
    'alguém viu o Rei Esquecido nascer hoje?',
    'guilda <Lua Negra> recrutando, chama no whisper',
    'que drop foi esse o.O',
    'onde compra poção de mana?',
    'tô voltando agora, me chamem para party',
    'esse slime dropou um anel épico kkkk',
    'quem quer trocar couro por minério?',
    'o servidor tá voando hoje, ping 24',
    'farmacia de ervas aberta na vila',
    'cheguei no nível 20!!!',
    'bardos, alguém toca uma música?',
    'a Costa Partida tá cheia de bandidos',
    'preciso de ajuda na missão do treant',
    'boa sorte na dungeon, pessoal'
  ];

  A.TIPS = [
    'Ataques manuais funcionam em movimento. A auto-caça para para golpear.',
    'Personagem e Mochila podem ficar abertos juntos. Arraste pelo cabeçalho.',
    'Clique no cartão de missão do HUD ou na janela de Missões para rastrear e ir até o objetivo.',
    'A AUTO continua caçando com a Mochila, o Personagem ou as Missões abertos.',
    'Segure + ou − nos atributos para distribuir vários pontos. Redistribuir devolve todos.',
    'Pressione TAB para mirar no inimigo mais próximo.',
    'Monstros ficam mais fortes quanto mais longe da vila.',
    'Slimes, caranguejos, goblins, treants, golems e bruxas são pacíficos até serem atacados. Lobos, bandidos, aranhas, esqueletos e espectros atacam primeiro.',
    'Equipe itens melhores: o dano sobe muito mais que subindo de nível.',
    'Venda materiais no mercado ou use na criação de itens.',
    'A vida regenera dentro da Vila Aurora. Aproveite para descansar.',
    'Botão esquerdo ataca na mira do cursor; botão direito move por clique e contorna obstáculos.',
    'Use as teclas 1 a 4 para habilidades. Cada classe tem quatro.',
    'R liga a auto-caça: alvo, perseguição, habilidades, poções e coleta.',
    'Pontos de atributo são ganhos a cada nível. Pressione C.',
    'A Cripta do Eclipse libera no nível 18. A Cidadela do Eclipse libera no nível 44.',
    'A campanha tem 8 capítulos. Cada capítulo exige nível e o término do anterior.',
    'Os Picos de Gelo ficam a leste do Pântano. A passagem abre no nível 38.',
    'Missões diárias pagam bem. Confira o Quadro de Recompensas.',
    'Você pode viajar entre pontos desbloqueados pelo mapa (M).',
    'Poções podem ser usadas na tecla 5 e 6.'
  ];

  A.GUILD_NAMES = ['Lua Negra', 'Guardiões de Aurora', 'Ordem do Eclipse', 'Filhos da Tempestade'];
  A.GUILD_MEMBERS = ['Thalion', 'Mira', 'Kael', 'Selene', 'Rurik', 'Nyx'];

  A.EVENTS = [
    { id: 'caixa_quebrada', name: 'Caixa quebrada na praça', startHour: 10, endHour: 12, flag: 'evento_caixa_quebrada', npc: 'marta', memory: 'caixa_quebrada_vista' }
  ];

  A.AUDIO = {
    // notas MIDI-ish para o synth procedural
    scale: [0, 2, 3, 5, 7, 9, 10, 12],
    root: 220
  };

})(window.A);
