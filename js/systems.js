/* ==========================================================================
   SISTEMAS — personagem, itens, missões, criação, mercado, correio, save
   ========================================================================== */
(function (A) {
  'use strict';

  const S = {};

  S.toast = function () {};
  S.log = function () {};

  function rand(a, b) { return a + Math.random() * (b - a); }
  function randi(a, b) { return Math.floor(rand(a, b + 1)); }

  /* ------------------------------------------------------------------ */
  /* PERSONAGEM                                                          */
  /* ------------------------------------------------------------------ */
  S.xpNeed = (level) => Math.floor(50 + 28 * Math.pow(level, 1.32));

  S.blankCharacter = function (opts) {
    const cls = opts.cls;
    const def = A.CLASSES[cls];
    const p = {
      id: A.uid(),
      name: opts.name,
      cls,
      look: opts.look || {},
      server: opts.server || 'aurora',
      level: 1,
      xp: 0,
      gold: 120,
      points: 0,
      alloc: { for: 0, des: 0, int: 0, vit: 0 },
      hp: 100, mp: 30,
      stamina: 100, staminaMax: 100,
      bagCap: 100,
      inventory: [],
      bank: [],
      equipment: {},
      quests: {},
      mainIndex: 0,
      dailies: null,
      achievements: {},
      achStats: { kills: 0, boss: 0, crafts: 0, quests: 0, waypoints: 1, party: 0, guild: 0 },
      stats: {},
      waypoints: { vila: true },
      pos: { x: 73 * A.T + 16, y: 56 * A.T + 16 },
      map: 'overworld',
      playtime: 0,
      created: Date.now(),
      lastSeen: Date.now(),
      market: null,
      mail: null,
      guild: null,
      party: null,
      dungeonClears: 0,
      deaths: 0,
      settings: {},
      // Campos de campanha/endgame já nascem na v1 do personagem para evitar
      // uma segunda migração quando as fases seguintes forem ligadas.
      story: { chapter: 1, step: 0, flags: {} },
      unlocks: { talents: false, enchant: false, mount: false, guild: false, gems: false, sets: false, raid: false, arena: false, factions: false, season: false },
       npcRelations: {},
       npcMemory: {},
       npcKnowledge: {},
       eventState: {},
      endgame: {
        keys: 0,
        fragments: 0,
        relics: [],
        vault: null,
        pity: {},
        weekKey: '',
        season: null,
        arena: { rating: 1000, wins: 0, losses: 0 },
        best: {}
      }
    };

    const wBase = cls === 'warrior' ? 'sword' : cls === 'mage' ? 'staff' : cls === 'archer' ? 'bow' : 'mace';
    p.equipment.weapon = S.makeItem(wBase, 1, 'comum');
    p.equipment.chest = S.makeItem('chest', 2, 'comum');
    S.addItem(p, S.makeItem('helmet', 1, 'comum'));
    S.addItem(p, S.makeItem('boots', 1, 'comum'));
    S.addItem(p, S.makeStack('potion_hp', 5));
    S.addItem(p, S.makeStack('potion_mp', 3));

    S.initQuests(p);
    S.initMail(p);
    S.recalc(p);
    p.hp = p.maxHp; p.mp = p.maxMp;
    return p;
  };

  S.recalc = function (p) {
    const c = A.CLASSES[p.cls];
    const lvl = p.level;
    const at = {
      for: c.base.for + p.alloc.for + Math.floor(lvl / 3),
      des: c.base.des + p.alloc.des + Math.floor(lvl / 4),
      int: c.base.int + p.alloc.int + Math.floor(lvl / 3),
      vit: c.base.vit + p.alloc.vit + Math.floor(lvl / 3)
    };

    let gearAtk = 0, gearDef = 0, gearHp = 0, gearMp = 0, gearCrit = 0, gearSpeed = 0;
    Object.values(p.equipment).forEach(it => {
      if (!it) return;
      gearAtk += it.atk || 0;
      gearDef += it.def || 0;
      const st = it.stats || {};
      gearAtk += st.atk || 0;
      gearDef += st.def || 0;
      gearHp += st.hp || 0;
      gearMp += st.mp || 0;
      gearCrit += st.crit || 0;
      gearSpeed += st.speed || 0;
    });

    p.attrs = at;
    p.maxHp = Math.round((38 + at.vit * 8 + lvl * 9 + gearHp) * c.mult.hp);
    p.maxMp = Math.round((18 + at.int * 5 + lvl * 4 + gearMp) * c.mult.mp);
    p.atk = Math.round((7 + at.for * 2.1 + at.des * 0.7 + gearAtk) * c.mult.atk);
    p.def = Math.round((2 + at.vit * 0.75 + gearDef) * c.mult.def);
    p.crit = Math.min(55, 4 + at.des * 0.35 + gearCrit);
    p.speed = Math.round(148 + at.des * 0.9 + gearSpeed);
    p.magic = Math.round((6 + at.int * 2.6) * (c.mult.atk));
    p.hpRegen = 1 + at.vit * 0.35;
    p.mpRegen = 1 + at.int * 0.35;
    p.hp = Math.min(p.hp, p.maxHp);
    p.mp = Math.min(p.mp, p.maxMp);
    p.power = Math.round(p.atk * 2 + p.def * 1.4 + p.maxHp * 0.16 + p.maxMp * 0.08);
    return p;
  };

  S.gainXp = function (p, amount) {
    if (amount <= 0) return [];
    p.xp += Math.round(amount);
    const gained = [];
    let guard = 0;
    while (p.xp >= S.xpNeed(p.level) && p.level < 60 && guard++ < 20) {
      p.xp -= S.xpNeed(p.level);
      p.level++;
      p.points += 5;
      gained.push(p.level);
      p.hp = p.maxHp; p.mp = p.maxMp;
      S.recalc(p);
    }
    if (gained.length) S.syncCampaign(p, false);
    return gained;
  };

  S.allocate = function (p, stat, n) {
    n = n || 1;
    if (!p.alloc || !(stat in p.alloc) || p.points < n) return false;
    p.points -= n;
    p.alloc[stat] = (p.alloc[stat] || 0) + n;
    S.recalc(p);
    return true;
  };

  S.deallocate = function (p, stat, n) {
    n = n || 1;
    if (!p.alloc || !(stat in p.alloc)) return false;
    n = Math.min(n, p.alloc[stat] || 0);
    if (n <= 0) return false;
    p.alloc[stat] -= n;
    p.points += n;
    S.recalc(p);
    return true;
  };

  S.resetAlloc = function (p) {
    if (!p.alloc) return false;
    let refund = 0;
    ['for', 'des', 'int', 'vit'].forEach(k => {
      refund += p.alloc[k] || 0;
      p.alloc[k] = 0;
    });
    if (refund <= 0) return false;
    p.points += refund;
    S.recalc(p);
    return true;
  };

  /* ------------------------------------------------------------------ */
  /* ITENS                                                               */
  /* ------------------------------------------------------------------ */
  S.makeStack = function (id, qty) {
    if (A.MATERIALS[id]) {
      const m = A.MATERIALS[id];
      return { uid: A.uid(), kind: 'material', id, name: m.name, icon: m.icon, color: m.color, value: m.value, qty: qty || 1 };
    }
    const c = A.CONSUMABLES[id];
    if (c) {
      return { uid: A.uid(), kind: 'consumable', id, name: c.name, icon: c.icon, color: c.color, value: c.value, qty: qty || 1, use: c.kind };
    }
    // item avulso (recompensa antiga)
    return { uid: A.uid(), kind: 'material', id, name: id, icon: 'scroll', color: '#c9c4d6', value: 1, qty: qty || 1 };
  };

  S.rollRarity = function (bonus) {
    bonus = bonus || 0;
    const keys = Object.keys(A.RARITY);
    let total = 0;
    const weights = keys.map(k => {
      let w = A.RARITY[k].weight;
      if (k === 'raro') w *= 1 + bonus * 0.35;
      if (k === 'epico') w *= 1 + bonus * 0.7;
      if (k === 'lendario') w *= 1 + bonus * 1.2;
      total += w;
      return w;
    });
    let r = Math.random() * total;
    for (let i = 0; i < keys.length; i++) { r -= weights[i]; if (r <= 0) return keys[i]; }
    return 'comum';
  };

  S.rollLootRarity = function (bonus) {
    let r = S.rollRarity(bonus);
    // Materiais e equipamentos com raridade Comum não são re-rollados no loot;
    // o “Comum” fica reservado ao equipamento inicial do personagem.
    if (r === 'comum') r = S.rollRarity(Math.max(1, (bonus || 0) * 2));
    return r;
  };

  S.makeItem = function (baseKey, ilvl, rarityKey) {
    const base = A.ITEM_BASES[baseKey];
    if (!base) return null;
    const rarity = A.RARITY[rarityKey || 'comum'];
    ilvl = Math.max(1, Math.round(ilvl || 1));
    const scale = 1 + (ilvl - 1) * 0.11;
    const names = A.ITEM_NAMES[baseKey] || [base.label];
    const nameIdx = (ilvl + baseKey.length) % names.length;
    let name = names[nameIdx];

    const item = {
      uid: A.uid(), kind: 'gear', id: baseKey, base: baseKey, slot: base.slot,
      icon: base.icon, ilvl, rarity: rarityKey || 'comum',
      atk: Math.round(base.atk * scale * rarity.mult),
      def: Math.round(base.def * scale * rarity.mult),
      stats: {}, color: rarity.color, qty: 1
    };
    // afixos
    const pool = ['atk', 'def', 'hp', 'mp', 'crit', 'speed'];
    const used = new Set();
    const n = rarity.affixes;
    for (let i = 0; i < n; i++) {
      let key = pool[randi(0, pool.length - 1)];
      let guard = 0;
      while (used.has(key) && guard++ < 10) key = pool[randi(0, pool.length - 1)];
      if (used.has(key)) continue;
      used.add(key);
      let v;
      if (key === 'hp') v = Math.round((6 + ilvl * 3) * rarity.mult);
      else if (key === 'mp') v = Math.round((4 + ilvl * 2) * rarity.mult);
      else if (key === 'crit') v = Math.round((1 + ilvl * 0.15) * rarity.mult);
      else if (key === 'speed') v = Math.round((1 + ilvl * 0.12) * rarity.mult);
      else if (key === 'atk') v = Math.round((1 + ilvl * 0.4) * rarity.mult);
      else v = Math.round((1 + ilvl * 0.35) * rarity.mult);
      item.stats[key] = v;
      if (A.AFFIXES[key]) {
        const aff = A.AFFIXES[key][(ilvl + i) % A.AFFIXES[key].length];
        if (i === 0) name = name + ' ' + aff;
      }
    }
    item.name = name;
    item.stats = item.stats;
    item.value = Math.round((8 + ilvl * 4 + (item.atk + item.def) * 2) * rarity.mult);
    return item;
  };

  S.itemLabel = function (it) {
    if (!it) return '';
    const r = A.RARITY[it.rarity];
    return '<span style="color:' + (r ? r.color : '#ccc') + '">' + A.esc(it.name) + '</span>';
  };

  S.itemTooltip = function (it, compare) {
    if (!it) return '';
    const r = A.RARITY[it.rarity] || A.RARITY.comum;
    let html = '<div class="tt-name" style="color:' + r.color + '">' + A.esc(it.name) + '</div>';
    html += '<div class="tt-sub">' + r.name + (it.ilvl ? ' • Nível ' + it.ilvl : '') + '</div>';
    if (it.kind === 'gear') {
      html += '<div class="tt-sep"></div>';
      html += '<div class="tt-slot">' + (A.ITEM_BASES[it.base] ? A.ITEM_BASES[it.base].label : it.slot) + '</div>';
      if (it.atk) html += '<div class="tt-stat">+' + it.atk + ' Ataque</div>';
      if (it.def) html += '<div class="tt-stat">+' + it.def + ' Defesa</div>';
      const names = { atk: 'Ataque', def: 'Defesa', hp: 'Vida', mp: 'Mana', crit: 'Crítico %', speed: 'Velocidade' };
      Object.keys(it.stats || {}).forEach(k => {
        if (k === 'atk' || k === 'def') return;
        html += '<div class="tt-stat">+' + it.stats[k] + ' ' + (names[k] || k) + '</div>';
      });
      html += '<div class="tt-sep"></div>';
      html += '<div class="tt-gold">Valor: ' + A.fmt(it.value) + ' ouro</div>';
      if (compare) {
        const cur = compare;
        const diff = (it.atk + it.def) - ((cur.atk || 0) + (cur.def || 0));
        if (diff !== 0) html += '<div class="tt-' + (diff > 0 ? 'up' : 'down') + '">' + (diff > 0 ? '+' : '') + diff + ' poder em relação ao equipado</div>';
      }
    } else if (it.kind === 'consumable') {
      html += '<div class="tt-sep"></div>';
      if (it.use === 'hp') html += '<div class="tt-stat">Restaura 45% da vida</div>';
      if (it.use === 'mp') html += '<div class="tt-stat">Restaura 50% da mana</div>';
      if (it.use === 'elixir') html += '<div class="tt-stat">Restaura vida e mana por completo</div>';
      html += '<div class="tt-gold">Clique para usar</div>';
    } else if (it.kind === 'material') {
      html += '<div class="tt-sep"></div><div class="tt-stat">Material de criação</div><div class="tt-gold">Valor: ' + A.fmt(it.value) + ' ouro</div>';
    }
    return html;
  };

  /* ---------------------------- inventário ---------------------------- */
  S.bagCount = function (p) { return p.inventory.length; };
  S.addItem = function (p, item, qty) {
    if (!item) return false;
    qty = qty || item.qty || 1;
    const stackable = item.kind === 'material' || item.kind === 'consumable';
    if (stackable) {
      const ex = p.inventory.find(x => x.id === item.id && x.kind === item.kind);
      if (ex) { ex.qty += qty; S.onCollect(p, item.id, qty); return true; }
    }
    if (p.inventory.length >= p.bagCap) {
      S.toast('Mochila cheia!', 'erro', 'bag_full', 2500);
      return false;
    }
    const copy = Object.assign({}, item, { uid: item.uid || A.uid(), qty });
    p.inventory.push(copy);
    if (stackable) S.onCollect(p, item.id, qty);
    return true;
  };

  S.countItem = function (p, id) {
    return p.inventory.filter(x => x.id === id).reduce((s, x) => s + x.qty, 0);
  };
  S.removeById = function (p, id, qty) {
    let need = qty;
    for (let i = p.inventory.length - 1; i >= 0 && need > 0; i--) {
      const it = p.inventory[i];
      if (it.id !== id) continue;
      const take = Math.min(it.qty, need);
      it.qty -= take; need -= take;
      if (it.qty <= 0) p.inventory.splice(i, 1);
    }
    return need === 0;
  };
  S.removeUid = function (p, uid, qty) {
    const i = p.inventory.findIndex(x => x.uid === uid);
    if (i < 0) return false;
    const it = p.inventory[i];
    if (qty && qty < it.qty) { it.qty -= qty; return true; }
    p.inventory.splice(i, 1);
    return true;
  };
  S.getItem = function (p, uid) { return p.inventory.find(x => x.uid === uid); };

  S.equip = function (p, uid) {
    const i = p.inventory.findIndex(x => x.uid === uid);
    if (i < 0) return false;
    const it = p.inventory[i];
    if (it.kind !== 'gear') { S.toast('Esse item não pode ser equipado.', 'erro'); return false; }
    const old = p.equipment[it.slot];
    p.equipment[it.slot] = it;
    p.inventory.splice(i, 1);
    if (old) p.inventory.push(old);
    S.recalc(p);
    S.toast('Equipado: ' + it.name, 'ok');
    return true;
  };

  S.unequip = function (p, slot) {
    const it = p.equipment[slot];
    if (!it) return false;
    if (p.inventory.length >= p.bagCap) { S.toast('Mochila cheia!', 'erro', 'bag_full', 2500); return false; }
    p.equipment[slot] = null;
    p.inventory.push(it);
    S.recalc(p);
    return true;
  };

  S.useConsumable = function (p, uid) {
    const it = S.getItem(p, uid);
    if (!it || it.kind !== 'consumable') return null;
    let healed = 0, mana = 0;
    if (it.use === 'hp') healed = Math.round(p.maxHp * 0.45);
    else if (it.use === 'mp') mana = Math.round(p.maxMp * 0.5);
    else if (it.use === 'elixir') { healed = p.maxHp; mana = p.maxMp; }
    p.hp = Math.min(p.maxHp, p.hp + healed);
    p.mp = Math.min(p.maxMp, p.mp + mana);
    it.qty--;
    if (it.qty <= 0) p.inventory.splice(p.inventory.indexOf(it), 1);
    return { healed, mana };
  };

  S.sellItem = function (p, uid) {
    const it = S.getItem(p, uid);
    if (!it) return 0;
    const qty = it.qty || 1;
    const price = Math.max(1, Math.floor((it.value || 1) * (it.kind === 'material' ? 0.6 : 0.5) * qty));
    p.gold += price;
    S.removeUid(p, uid);
    return price;
  };

  /* ---------------------------- loot ---------------------------- */
  S.rollLoot = function (p, mtype, elite) {
    const mon = A.MONSTERS[mtype];
    if (!mon) return { gold: 0, items: [] };
    const gold = randi(mon.gold[0], mon.gold[1]) * (elite ? 3 : 1);
    const items = [];
    const boss = !!mon.boss;
    // materiais
    if (mon.drops && mon.drops.length) {
      const chance = boss ? 1 : elite ? 0.8 : 0.42;
      if (Math.random() < chance) {
        const id = mon.drops[randi(0, mon.drops.length - 1)];
        items.push({ item: S.makeStack(id, boss ? randi(3, 6) : elite ? 2 : 1) });
      }
    }
    // equipamento
    const gearChance = boss ? 1 : elite ? 0.38 : 0.09;
    if (Math.random() < gearChance) {
      // A arma sorteada precisa servir à classe; antes era possível cair um
      // cajado para guerreiro. Armaduras continuam livres para diversificar.
      const clsWeapon = (A.CLASSES[p.cls] && A.CLASSES[p.cls].weapon) || 'sword';
      const bases = Object.keys(A.ITEM_BASES).filter(k => A.ITEM_BASES[k].slot !== 'weapon' || k === clsWeapon);
      const base = bases[randi(0, bases.length - 1)];
      const ilvl = A.clamp(p.level + randi(-2, 3), 1, 60);
      const rarity = S.rollLootRarity(boss ? 3.5 : elite ? 1.5 : 0.2);
      items.push({ item: S.makeItem(base, ilvl, rarity) });
    }
    // poções
    if (Math.random() < (boss ? 0.9 : 0.10)) {
      items.push({ item: S.makeStack(Math.random() < 0.6 ? 'potion_hp' : 'potion_mp', boss ? 3 : 1) });
    }
    return { gold, items };
  };

  /* ------------------------------------------------------------------ */
  /* MISSÕES                                                             */
  /* ------------------------------------------------------------------ */
  S.questById = function (id) {
    return A.QUESTS.find(q => q.id === id) || A.SIDE_QUESTS.find(q => q.id === id) || (A.STORY_QUESTS || []).find(q => q.id === id);
  };

  // Missões podem ter etapas opcionais (`stages`). Missões antigas não têm.
  S.questStageIndex = function (p, id) {
    const q = S.questById(id);
    if (!q || !Array.isArray(q.stages) || !q.stages.length) return 0;
    const st = p && p.quests ? p.quests[id] : null;
    const idx = st ? (Number(st.stage) || 0) : 0;
    return Math.max(0, Math.min(q.stages.length - 1, idx));
  };

  // Retorna a missão com os campos da etapa atual mesclados (tipo, alvo, zona, desc, etc.).
  S.questCurrent = function (id, p) {
    const q = S.questById(id);
    if (!q) return null;
    if (!Array.isArray(q.stages) || !q.stages.length) return q;
    const idx = S.questStageIndex(p || {}, id);
    const stage = q.stages[idx] || q.stages[0];
    const merged = Object.assign({}, q, stage);
    merged._stageIndex = idx;
    merged._stageCount = q.stages.length;
    return merged;
  };

  S.chapterOf = function (id) {
    return A.CHAPTERS.find(ch => ch.quests.indexOf(id) >= 0) || null;
  };

  S.chapterProgress = function (p, ch) {
    let claimed = 0, active = 0, ready = 0;
    ch.quests.forEach(id => {
      const st = p.quests[id];
      if (!st) return;
      if (st.claimed) claimed++;
      else {
        active++;
        if (S.questProgress(p, id).done) ready++;
      }
    });
    return { claimed, active, ready, total: ch.quests.length, done: claimed >= ch.quests.length };
  };

  S.chapterUnlocked = function (p, ch) {
    if (!ch) return false;
    if (p.level < (ch.minLevel || 1)) return false;
    for (let i = 0; i < ch.n - 1; i++) {
      if (!S.chapterProgress(p, A.CHAPTERS[i]).done) return false;
    }
    return true;
  };

  S.applyUnlocks = function (p, notify) {
    if (!p.unlocks) p.unlocks = {};
    const u = p.unlocks;
    const chapter = (p.story && p.story.chapter) || 1;
    const rules = {
      talents: p.level >= 10,
      enchant: p.level >= 20,
      mount: chapter >= 3 || p.level >= 18,
      guild: p.level >= 30,
      gems: p.level >= 30,
      sets: p.level >= 36,
      raid: p.level >= 44 && chapter >= 6,
      arena: p.level >= 30,
      factions: p.level >= 50,
      season: p.level >= 55
    };
    const names = {
      talents: 'Talentos', enchant: 'Encantamento', mount: 'Montaria', guild: 'Guilda',
      gems: 'Gemas', sets: 'Conjuntos', raid: 'Raid da Cidadela', arena: 'Arena de Ecos',
      factions: 'Facções', season: 'Temporada'
    };
    const gained = [];
    Object.keys(rules).forEach(k => {
      if (rules[k] && !u[k]) { u[k] = true; gained.push(names[k]); }
    });
    if (notify && gained.length && S.toast) S.toast('Desbloqueado: ' + gained.join(', '), 'ach');
    return gained;
  };

  S.syncCampaign = function (p, quiet) {
    if (!p || !p.quests) return null;
    let next = null;
    let storyChapter = 1;
    for (let i = 0; i < A.CHAPTERS.length; i++) {
      const ch = A.CHAPTERS[i];
      const prevDone = i === 0 || S.chapterProgress(p, A.CHAPTERS[i - 1]).done;
      if (!prevDone) { storyChapter = ch.n; break; }
      if (p.level < (ch.minLevel || 1)) { storyChapter = ch.n; break; }
      let chapterDone = true;
      for (const id of ch.quests) {
        const st = p.quests[id];
        if (!st) {
          S.startQuest(p, id);
          if (!next) next = S.questById(id);
          chapterDone = false;
          break;
        }
        if (!st.claimed) { chapterDone = false; break; }
      }
      if (!chapterDone) { storyChapter = ch.n; break; }
      storyChapter = Math.min(8, ch.n + 1);
    }
    if (!p.story) p.story = { chapter: 1, step: 0, flags: {} };
    p.story.chapter = storyChapter;
    const activeCh = A.CHAPTERS[storyChapter - 1];
    p.story.step = activeCh ? S.chapterProgress(p, activeCh).claimed : 0;
    S.applyUnlocks(p, !quiet);
    return next;
  };

  S.initQuests = function (p) {
    p.quests = {};
    p.mainIndex = 0;
    p.quests.q1 = { progress: 0, done: false, claimed: false, stage: 0 };
    S.syncCampaign(p, true);
  };

  S.startQuest = function (p, id) {
    if (p.quests[id]) return;
    const q = S.questById(id);
    if (q && q.prereq && Array.isArray(q.prereq.quests)) {
      const ok = q.prereq.quests.every(pid => p.quests && p.quests[pid] && p.quests[pid].claimed);
      if (!ok) return false;
    }
    p.quests[id] = { progress: 0, done: false, claimed: false, stage: 0 };
  };

  S.activeQuests = function (p) {
    return Object.keys(p.quests)
      .map(id => ({ id, data: S.questCurrent(id, p), st: p.quests[id] }))
      .filter(q => q.data && !q.st.claimed);
  };

  S.questProgress = function (p, id) {
    const st = p.quests[id];
    const data = S.questCurrent(id, p);
    if (!st || !data) return { cur: 0, need: 1, done: false };
    let cur = st.progress;
    if (data.type === 'collect') cur = Math.max(cur, S.countItem(p, data.target));
    return { cur: Math.min(cur, data.need), need: data.need, done: st.progress >= data.need || (data.type === 'collect' && cur >= data.need) };
  };

  S.questEvent = function (p, type, target, amount) {
    amount = amount || 1;
    S.activeQuests(p).forEach(q => {
      const d = q.data, st = q.st;
      if (st.progress >= d.need) return;
      if (d.type !== type) return;
      if (d.target && d.target !== target) return;
      st.progress = Math.min(d.need, st.progress + amount);
      if (st.progress >= d.need) S.toast('Missão pronta: ' + d.title, 'quest');
    });
    // diárias
    if (type === 'kill' && p.dailies) {
      p.dailies.list.forEach(dl => {
        const d = A.SIDE_QUESTS.find(x => x.id === dl.id);
        if (!d || dl.claimed || d.target !== target) return;
        dl.progress = Math.min(d.need, dl.progress + amount);
      });
    }
  };

  S.onCollect = function (p, id, amount) {
    S.questEvent(p, 'collect', id, amount);
  };

  S.onKill = function (p, mtype, inDungeon) {
    p.achStats.kills++;
    const mon = A.MONSTERS[mtype] || {};
    if (mon.boss) p.achStats.boss++;
    S.questEvent(p, 'kill', mtype, 1);
    if (inDungeon) S.questEvent(p, 'dungeon', mtype, 1);
    if (mon.boss) S.questEvent(p, 'boss', mtype, 1);
    S.checkAchievements(p);
  };

  S.talkTo = function (p, npcId) {
    let changed = null;
    S.activeQuests(p).forEach(q => {
      const d = q.data;
      if (d.type === 'talk' && d.giver === npcId && q.st.progress < d.need) {
        q.st.progress = d.need;
        changed = d;
      }
    });
    return changed;
  };

  /* ------------------------------------------------------------------ */
  /* RELACIONAMENTOS, MEMÓRIA E CONHECIMENTO (Etapa 4)                   */
  /* ------------------------------------------------------------------ */
  function validNpc(id) { return !!A.NPCS.find(n => n.id === id); }
  function ensureObj(p, field) { if (!p[field] || typeof p[field] !== 'object') p[field] = {}; return p[field]; }

  S.relation = function (p, npcId) {
    if (!p) return 0;
    const rel = ensureObj(p, 'npcRelations');
    return Number(rel[npcId] || 0);
  };
  S.changeRelation = function (p, npcId, delta) {
    if (!p || !validNpc(npcId)) return false;
    delta = Number(delta) || 0;
    const rel = ensureObj(p, 'npcRelations');
    const cur = Number(rel[npcId] || 0) + delta;
    rel[npcId] = Math.max(-100, Math.min(100, Math.round(cur)));
    return rel[npcId];
  };
  S.setRelation = function (p, npcId, value) {
    if (!p || !validNpc(npcId)) return false;
    const rel = ensureObj(p, 'npcRelations');
    rel[npcId] = Math.max(-100, Math.min(100, Math.round(Number(value) || 0)));
    return rel[npcId];
  };

  S.hasMemory = function (p, npcId, memoryId) {
    if (!p || !npcId || !memoryId) return false;
    const mem = ensureObj(p, 'npcMemory');
    return !!(mem[npcId] && mem[npcId][memoryId]);
  };
  S.remember = function (p, npcId, memoryId, type, data) {
    if (!p || !validNpc(npcId) || !memoryId) return false;
    const mem = ensureObj(p, 'npcMemory');
    if (!mem[npcId] || typeof mem[npcId] !== 'object') mem[npcId] = {};
    if (mem[npcId][memoryId]) return false; // evita duplicação
    mem[npcId][memoryId] = {
      id: memoryId,
      type: type || 'evento',
      data: (data && typeof data === 'object') ? data : (data != null ? { value: data } : {}),
      at: Date.now()
    };
    return true;
  };
  S.forgetMemory = function (p, npcId, memoryId) {
    if (!p || !npcId || !memoryId) return false;
    const mem = ensureObj(p, 'npcMemory');
    if (mem[npcId] && mem[npcId][memoryId]) {
      delete mem[npcId][memoryId];
      return true;
    }
    return false;
  };

  S.hasKnowledge = function (p, npcId, knowledgeId) {
    if (!p || !npcId || !knowledgeId) return false;
    const kn = ensureObj(p, 'npcKnowledge');
    return !!(kn[npcId] && kn[npcId][knowledgeId]);
  };
  S.learn = function (p, npcId, knowledgeId, data) {
    if (!p || !validNpc(npcId) || !knowledgeId) return false;
    const kn = ensureObj(p, 'npcKnowledge');
    if (!kn[npcId] || typeof kn[npcId] !== 'object') kn[npcId] = {};
    if (kn[npcId][knowledgeId]) return false; // evita duplicação
    kn[npcId][knowledgeId] = (data && typeof data === 'object') ? data : (data != null ? { value: data } : { known: true });
    return true;
  };
  S.forgetKnowledge = function (p, npcId, knowledgeId) {
    if (!p || !npcId || !knowledgeId) return false;
    const kn = ensureObj(p, 'npcKnowledge');
    if (kn[npcId] && kn[npcId][knowledgeId]) {
      delete kn[npcId][knowledgeId];
      return true;
    }
    return false;
  };

  S.turnInQuest = function (p, id) {
    const base = S.questById(id), st = p.quests[id];
    if (!base || !st) return null;
    const d = S.questCurrent(id, p);
    const pr = S.questProgress(p, id);
    if (!pr.done || st.claimed) return null;

    const applyEffects = (eff) => {
      if (eff && A.dialogue && typeof A.dialogue.applyEffect === 'function') A.dialogue.applyEffect(eff, p);
      else if (eff && typeof eff === 'object') {
        // fallback mínimo: flags
        if (!p.story) p.story = { chapter: 1, step: 0, flags: {} };
        if (!p.story.flags) p.story.flags = {};
        Object.keys(eff).forEach(k => {
          if (k === 'setFlag' || k === 'flag') p.story.flags[eff[k === 'setFlag' ? 'setFlag' : 'flag']] = (eff.value === undefined ? true : eff.value);
          if (k === 'unsetFlag') delete p.story.flags[eff.unsetFlag];
        });
      }
    };

    const hasStages = Array.isArray(base.stages) && base.stages.length > 0;
    const stageIdx = hasStages ? (Number(st.stage) || 0) : 0;
    const isLast = !hasStages || stageIdx >= base.stages.length - 1;

    // Recompensa da etapa atual (se houver) ou da missão.
    const stageDef = hasStages ? (base.stages[stageIdx] || {}) : {};
    // Recompensa parcial apenas se a etapa definir a sua própria. A recompensa
    // geral da missão é dada apenas na conclusão final.
    let rw;
    if (!isLast) {
      rw = stageDef.reward || {};
    } else {
      rw = stageDef.reward || d.reward || d.rewards || base.reward || base.rewards || {};
    }

    // Efeitos ao concluir a etapa atual.
    if (stageDef.onComplete) applyEffects(stageDef.onComplete);
    if (stageDef.effects) applyEffects(stageDef.effects);

    if (!isLast) {
      // Avança para a próxima etapa, sem marcar como concluída.
      st.stage = stageIdx + 1;
      st.progress = 0;
      st.done = false;
      // Mantém o rastreamento sincronizado com a nova etapa.
      if (A.game && A.game.questTrack && A.game.questTrack.id === id) {
        const nq = S.questCurrent(id, p);
        A.game.questTrack.data = nq;
        A.game.questTrack.type = nq.type;
        A.game.questTrack.target = nq.target;
        A.game.questTrack.giver = nq.giver;
        if (typeof A.game.refreshQuestGoal === 'function') A.game.refreshQuestGoal(A.game.questTrack);
      }
      // Recompensa parcial da etapa, se definida.
      if (rw && (rw.gold || rw.xp || rw.items)) {
        p.gold += rw.gold || 0;
        const levels = S.gainXp(p, rw.xp || 0);
        const items = [];
        (rw.items || []).forEach(it => {
          const item = S.makeStack(it.id, it.qty);
          if (S.addItem(p, item, it.qty)) items.push(item);
        });
        S.checkAchievements(p);
        return { reward: rw, levels, items, nextStage: st.stage, advanced: true };
      }
      S.checkAchievements(p);
      return { reward: rw, levels: [], items: [], nextStage: st.stage, advanced: true };
    }

    // Última etapa (ou missão sem etapas): conclui de fato.
    st.claimed = true;
    st.done = true;
    if (hasStages) st.stage = base.stages.length - 1;

    p.gold += rw.gold || 0;
    const levels = S.gainXp(p, rw.xp || 0);
    const items = [];
    (rw.items || []).forEach(it => {
      const item = A.MATERIALS[it.id] || A.CONSUMABLES[it.id] ? S.makeStack(it.id, it.qty) : S.makeStack(it.id, it.qty);
      if (S.addItem(p, item, it.qty)) items.push(item);
    });

    // Efeitos de conclusão da missão.
    if (base.onComplete) applyEffects(base.onComplete);
    if (base.effects) applyEffects(base.effects);

    p.achStats.quests++;
    let next = null;
    if (base.id.startsWith('q')) {
      const idx = A.QUESTS.findIndex(q => q.id === base.id);
      p.mainIndex = Math.max(p.mainIndex || 0, idx + 1);
      next = S.syncCampaign(p, false);
    }
    S.checkAchievements(p);
    return { reward: rw, levels, items, next };
  };

  /* ---------------------------- diárias ---------------------------- */
  S.dayKey = function () {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  };

  S.initDailies = function (p) {
    const key = S.dayKey();
    if (p.dailies && p.dailies.date === key) return p.dailies;
    const seed = key.split('-').reduce((s, n) => s + parseInt(n, 10), 0);
    const pool = A.SIDE_QUESTS.slice();
    const list = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const idx = (seed * (i + 3) + i * 7) % pool.length;
      const d = pool.splice(idx, 1)[0];
      list.push({ id: d.id, progress: 0, claimed: false });
    }
    p.dailies = { date: key, list };
    return p.dailies;
  };

  S.claimDaily = function (p, id) {
    S.initDailies(p);
    const dl = p.dailies.list.find(x => x.id === id);
    const d = A.SIDE_QUESTS.find(x => x.id === id);
    if (!dl || !d || dl.claimed || dl.progress < d.need) return null;
    dl.claimed = true;
    p.gold += d.rewards.gold;
    const levels = S.gainXp(p, d.rewards.xp);
    p.achStats.quests++;
    S.checkAchievements(p);
    return { reward: d.rewards, levels };
  };

  /* ------------------------------------------------------------------ */
  /* CRIAÇÃO                                                             */
  /* ------------------------------------------------------------------ */
  S.canCraft = function (p, recipe) {
    if (p.level < recipe.level) return false;
    return Object.keys(recipe.mats).every(m => S.countItem(p, m) >= recipe.mats[m]);
  };

  S.craft = function (p, id) {
    const r = A.RECIPES.find(x => x.id === id);
    if (!r || !S.canCraft(p, r)) return null;
    Object.keys(r.mats).forEach(m => S.removeById(p, m, r.mats[m]));
    let item;
    if (r.out.gen) {
      item = S.makeItem(r.out.gen, Math.max(1, p.level), r.out.rarity);
    } else {
      item = S.makeStack(r.out.id, r.out.qty);
    }
    if (!S.addItem(p, item)) return null;
    p.achStats.crafts++;
    S.checkAchievements(p);
    return item;
  };

  /* ------------------------------------------------------------------ */
  /* MERCADO                                                             */
  /* ------------------------------------------------------------------ */
  S.refreshMarket = function (p, force) {
    if (!force && p.market && p.market.until > Date.now()) return p.market;
    const listings = [];
    const sellers = A.BOT_NAMES;
    const bases = Object.keys(A.ITEM_BASES);
    for (let i = 0; i < 14; i++) {
      const base = bases[randi(0, bases.length - 1)];
      const ilvl = A.clamp(p.level + randi(-3, 5), 1, 45);
      const rarity = S.rollRarity(0.35);
      const item = S.makeItem(base, ilvl, rarity);
      const price = Math.max(5, Math.round(item.value * rand(1.5, 2.4)));
      listings.push({ id: A.uid(), item, price, seller: sellers[randi(0, sellers.length - 1)] });
    }
    // materiais
    for (let i = 0; i < 6; i++) {
      const keys = Object.keys(A.MATERIALS);
      const id = keys[randi(0, keys.length - 1)];
      const qty = randi(2, 8);
      const item = S.makeStack(id, qty);
      const price = Math.max(3, Math.round(item.value * qty * rand(1.2, 1.7)));
      listings.push({ id: A.uid(), item, price, seller: sellers[randi(0, sellers.length - 1)] });
    }
    p.market = { listings, until: Date.now() + 5 * 60 * 1000 };
    return p.market;
  };

  S.buyMarket = function (p, listingId) {
    const m = S.refreshMarket(p);
    const l = m.listings.find(x => x.id === listingId);
    if (!l) return { ok: false, msg: 'Anúncio expirado.' };
    if (p.gold < l.price) return { ok: false, msg: 'Ouro insuficiente.' };
    p.gold -= l.price;
    if (!S.addItem(p, l.item, l.item.qty || 1)) { p.gold += l.price; return { ok: false, msg: 'Mochila cheia.' }; }
    m.listings = m.listings.filter(x => x.id !== listingId);
    return { ok: true, item: l.item };
  };

  /* ------------------------------------------------------------------ */
  /* CORREIO                                                             */
  /* ------------------------------------------------------------------ */
  S.initMail = function (p) {
    if (p.mail && p.mail.length) return;
    p.mail = [
      {
        id: 'welcome', from: 'Equipe de Aurora', subject: 'Bem-vindo(a) a Aurora!',
        body: 'Sua jornada começa agora. Fale com Mestre Aldric na praça para receber sua primeira missão. Use WASD para mover, o botão esquerdo para atacar na mira do cursor, o botão direito para mover por clique e 1-4 para habilidades. R liga a auto-caça.\n\nBoa sorte, aventureiro!',
        date: Date.now(), read: false,
        attach: { gold: 100, items: [{ id: 'potion_hp', qty: 3 }, { id: 'potion_mp', qty: 2 }] },
        claimed: false
      },
      {
        id: 'gift', from: 'Mercadora Orla', subject: 'Amostra grátis',
        body: 'Uma lembrança da loja para começar bem. Passe lá quando precisar de poções!',
        date: Date.now() - 3600000, read: false,
        attach: { gold: 0, items: [{ id: 'elixir', qty: 1 }] }, claimed: false
      }
    ];
  };

  S.mailUnread = function (p) { return (p.mail || []).filter(m => !m.read).length; };

  S.claimMail = function (p, id) {
    S.initMail(p);
    const m = p.mail.find(x => x.id === id);
    if (!m || m.claimed) return null;
    m.claimed = true;
    p.gold += (m.attach.gold || 0);
    (m.attach.items || []).forEach(it => {
      const item = A.MATERIALS[it.id] || A.CONSUMABLES[it.id] ? S.makeStack(it.id, it.qty) : S.makeStack(it.id, it.qty);
      S.addItem(p, item, it.qty);
    });
    return m.attach;
  };

  /* ------------------------------------------------------------------ */
  /* CONQUISTAS                                                          */
  /* ------------------------------------------------------------------ */
  S.checkAchievements = function (p) {
    const unlocked = [];
    A.ACHIEVEMENTS.forEach(a => {
      if (p.achievements[a.id]) return;
      let val = 0;
      if (a.stat === 'level') val = p.level;
      else if (a.stat === 'gold') val = p.gold;
      else if (a.stat === 'waypoints') val = Object.keys(p.waypoints).length;
      else if (a.stat === 'quests') val = p.achStats.quests;
      else if (a.stat === 'party') val = p.party ? 1 : 0;
      else if (a.stat === 'guild') val = p.guild ? 1 : 0;
      else val = p.achStats[a.stat] || 0;
      if (val >= a.goal) {
        p.achievements[a.id] = Date.now();
        unlocked.push(a);
        S.toast('Conquista: ' + a.name, 'ach');
      }
    });
    return unlocked;
  };

  /* ------------------------------------------------------------------ */
  /* BANCO                                                               */
  /* ------------------------------------------------------------------ */
  S.deposit = function (p, uid) {
    const it = S.getItem(p, uid);
    if (!it) return false;
    p.inventory.splice(p.inventory.indexOf(it), 1);
    const stackable = it.kind === 'material' || it.kind === 'consumable';
    if (stackable) {
      const ex = p.bank.find(x => x.id === it.id && x.kind === it.kind);
      if (ex) ex.qty += it.qty;
      else p.bank.push(it);
    } else p.bank.push(it);
    return true;
  };

  S.withdraw = function (p, uid) {
    const i = p.bank.findIndex(x => x.uid === uid);
    if (i < 0) return false;
    if (p.inventory.length >= p.bagCap) { S.toast('Mochila cheia!', 'erro', 'bag_full', 2500); return false; }
    const it = p.bank.splice(i, 1)[0];
    p.inventory.push(it);
    return true;
  };

  /* ------------------------------------------------------------------ */
  /* SAVE / LOAD                                                         */
  /* ------------------------------------------------------------------ */
  S.serialize = function (p) {
    const copy = Object.assign({}, p);
    delete copy._atkTimer; delete copy._invuln;
    copy.lastSeen = Date.now();
    return copy;
  };

  S.deserialize = function (data) {
    const p = Object.assign({}, data);
    p.level = A.clamp(Math.floor(Number(p.level) || 1), 1, 60);
    p.alloc = Object.assign({ for: 0, des: 0, int: 0, vit: 0 }, p.alloc || {});
    ['for', 'des', 'int', 'vit'].forEach(k => {
      p.alloc[k] = Math.max(0, Math.floor(Number(p.alloc[k]) || 0));
    });
    p.points = Math.max(0, Math.floor(Number(p.points) || 0));
    p.stats = p.stats || {};
    p.achStats = p.achStats || { kills: 0, boss: 0, crafts: 0, quests: 0, waypoints: 1, party: 0, guild: 0 };
    p.waypoints = p.waypoints || { vila: true };
    p.equipment = p.equipment || {};
    p.inventory = p.inventory || [];
    p.bank = p.bank || [];
    p.quests = p.quests || {};
    Object.keys(p.quests).forEach(id => {
      if (p.quests[id] && p.quests[id].stage == null) p.quests[id].stage = 0;
    });    p.achievements = p.achievements || {};
    p.look = p.look || {};
    p.pos = p.pos || { x: 73 * A.T + 16, y: 56 * A.T + 16 };

    // --- migração v2 → v4 ---
    p.staminaMax = Math.max(1, Math.floor(Number(p.staminaMax) || 100));
    p.stamina = p.stamina == null ? p.staminaMax : A.clamp(Number(p.stamina) || 0, 0, p.staminaMax);
    p.story = Object.assign({ chapter: 1, step: 0, flags: {} }, p.story || {});
    p.story.flags = p.story.flags || {};
    p.npcRelations = p.npcRelations || {};
    p.npcMemory = p.npcMemory || {};
    p.npcKnowledge = p.npcKnowledge || {};
    p.eventState = p.eventState || {};
    p.story.chapter = A.clamp(Math.floor(Number(p.story.chapter) || 1), 1, 8);
    p.story.step = Math.max(0, Math.floor(Number(p.story.step) || 0));
    const unlocks = { talents: false, enchant: false, mount: false, guild: false, gems: false, sets: false, raid: false, arena: false, factions: false, season: false };
    p.unlocks = Object.assign(unlocks, p.unlocks || {});
    const eg = {
      keys: 0, fragments: 0, relics: [], vault: null, pity: {}, weekKey: '',
      season: { level: 0, xp: 0, claimed: 0 }, arena: { rating: 1000, wins: 0, losses: 0 }, best: { rift: 0, raid: 0 }, faction: null, activities: 0, chestClaimed: 0, raidLocks: {}
    };
    p.endgame = Object.assign(eg, p.endgame || {});
    p.endgame.relics = Array.isArray(p.endgame.relics) ? p.endgame.relics : [];
    p.endgame.pity = p.endgame.pity || {};
    p.endgame.best = Object.assign({ rift: 0, raid: 0 }, p.endgame.best || {});
    p.endgame.arena = Object.assign({ rating: 1000, wins: 0, losses: 0 }, p.endgame.arena || {});
    p.endgame.season = Object.assign({ level: 0, xp: 0, claimed: 0 }, (typeof p.endgame.season === 'object' && p.endgame.season) || {});
    p.endgame.faction = p.endgame.faction || null;
    p.endgame.activities = Math.max(0, Math.floor(Number(p.endgame.activities) || 0));
    p.endgame.chestClaimed = Math.max(0, Math.floor(Number(p.endgame.chestClaimed) || 0));
    p.endgame.raidLocks = p.endgame.raidLocks || {};

    S.recalc(p);
    if (p.hp > p.maxHp) p.hp = p.maxHp;
    if (p.mp > p.maxMp) p.mp = p.maxMp;
    S.initMail(p);
    S.initDailies(p);
    S.syncCampaign(p, true);
    return p;
  };

  /* ------------------------------------------------------------------ */
  /* TEXTO DE AJUDA                                                      */
  /* ------------------------------------------------------------------ */
  S.classSummary = function (cls) {
    const c = A.CLASSES[cls];
    return '<div class="cls-role" style="color:' + c.color + '">' + c.role + '</div>' +
      '<p>' + c.desc + '</p>' +
      '<div class="cls-meta"><span>Dificuldade: <b>' + c.difficulty + '</b></span><span>Arma: <b>' + A.ITEM_BASES[c.weapon].label + '</b></span></div>';
  };

  /* ------------------------------------------------------------------ */
  /* ENDGAME — Fendas, Raid, Arena, Facções e Temporada                 */
  /* ------------------------------------------------------------------ */
  S.endgameWeek = function (p) {
    if (!p.endgame) return;
    const wk = S.weekKey();
    if (p.endgame.weekKey !== wk) {
      p.endgame.weekKey = wk;
      p.endgame.activities = 0;
      p.endgame.chestClaimed = 0;
      p.endgame.raidLocks = {};
    }
  };

  S.weekKey = function () {
    const d = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return d.getFullYear() + '-W' + week;
  };

  S.endgameActivity = function (p, n) {
    S.endgameWeek(p);
    p.endgame.activities = Math.min(8, p.endgame.activities + (n || 1));
    if (p.endgame.faction) p.endgame.rep = (p.endgame.rep || 0) + (n || 1) * 5;
    S.seasonProgress(p, (n || 1) * 15);
  };

  S.riftRun = function (p, level) {
    S.endgameWeek(p);
    if (!p.endgame) return { ok: false, msg: 'Sem dados de endgame.' };
    if ((p.endgame.keys || 0) <= 0) return { ok: false, msg: 'Sem chave de fenda. Derrote chefes da campanha.' };
    level = A.clamp(Math.floor(Number(level) || 0), 0, 15);
    const best = (p.endgame.best && p.endgame.best.rift) || 0;
    if (level > best + 1) level = best + 1;
    const needPower = 120 + level * 90;
    const roll = 0.5 + Math.random() * 0.6;
    const okRun = p.power >= needPower * roll;
    p.endgame.keys--;
    if (okRun) {
      const frags = 2 + level;
      p.endgame.fragments = (p.endgame.fragments || 0) + frags;
      p.endgame.best.rift = Math.max(best, level);
      S.endgameActivity(p, 1);
      const levels = S.gainXp(p, 260 + level * 100);
      p.gold += 180 + level * 90;
      if (p.endgame.faction) p.endgame.rep = (p.endgame.rep || 0) + 12;
      return { ok: true, level, frags, levels, msg: 'Fenda +' + level + ' concluída! +' + frags + ' fragmentos.' };
    }
    p.gold = Math.max(0, p.gold - 60);
    return { ok: false, level, msg: 'A fenda +' + level + ' foi além do seu poder. Tente novamente.' };
  };

  S.raidRun = function (p, diff) {
    S.endgameWeek(p);
    diff = ['normal', 'heroico', 'mitico'].indexOf(diff) >= 0 ? diff : 'normal';
    const mult = diff === 'normal' ? 1 : diff === 'heroico' ? 1.55 : 2.25;
    const needPower = Math.round(2600 * mult);
    const roll = 0.86 + Math.random() * 0.28;
    const success = p.power >= needPower * roll;
    const locked = !!(p.endgame.raidLocks && p.endgame.raidLocks[diff]);
    let loot = false;
    if (success) {
      p.endgame.best.raid = Math.max(p.endgame.best.raid || 0, diff === 'mitico' ? 3 : diff === 'heroico' ? 2 : 1);
      S.endgameActivity(p, 4);
      if (p.endgame.faction) p.endgame.rep = (p.endgame.rep || 0) + 30;
      const xp = Math.round((diff === 'normal' ? 1800 : diff === 'heroico' ? 3200 : 5200) * (locked ? 0.35 : 1));
      const gold = Math.round((diff === 'normal' ? 900 : diff === 'heroico' ? 1700 : 3000) * (locked ? 0.35 : 1));
      const levels = S.gainXp(p, xp);
      p.gold += gold;
      p.endgame.fragments = (p.endgame.fragments || 0) + (locked ? 1 : diff === 'mitico' ? 6 : diff === 'heroico' ? 4 : 2);
      if (!locked) {
        loot = true;
        p.endgame.raidLocks[diff] = true;
        if (diff === 'mitico' || diff === 'heroico') {
          const relic = 'reliquia_' + diff + '_' + (p.endgame.relics.length + 1);
          p.endgame.relics.push(relic);
        }
      }
      return { ok: true, diff, success: true, loot, locked, levels, msg: 'Raid ' + diff + ' concluída.' + (locked ? ' (loot já resgatado esta semana)' : ' Loot liberado!') };
    }
    p.gold = Math.max(0, p.gold - 120);
    return { ok: false, diff, success: false, msg: 'A raid ' + diff + ' falhou. Reúna mais poder.' };
  };

  S.arenaFight = function (p) {
    S.endgameWeek(p);
    const rating = (p.endgame.arena && p.endgame.arena.rating) || 1000;
    const enemyPower = Math.round(p.power * (0.75 + Math.random() * 0.55));
    const win = p.power * (0.9 + Math.random() * 0.25) >= enemyPower;
    p.endgame.arena = p.endgame.arena || { rating: 1000, wins: 0, losses: 0 };
    if (win) { p.endgame.arena.rating += 24; p.endgame.arena.wins++; }
    else { p.endgame.arena.rating = Math.max(0, p.endgame.arena.rating - 16); p.endgame.arena.losses++; }
    const rewardXp = win ? 320 : 120;
    const rewardGold = win ? 220 : 70;
    const levels = S.gainXp(p, rewardXp);
    p.gold += rewardGold;
    S.endgameActivity(p, 1);
    if (p.endgame.faction) p.endgame.rep = (p.endgame.rep || 0) + (win ? 8 : 2);
    return { ok: true, win, rating: p.endgame.arena.rating, levels, msg: win ? 'Vitória na Arena! +' + rewardGold + ' ouro.' : 'Derrota na Arena. +' + rewardGold + ' ouro de consolação.' };
  };

  S.factionJoin = function (p, id) {
    if (['aurora', 'eclipse', 'geada'].indexOf(id) < 0) return false;
    p.endgame = p.endgame || {};
    p.endgame.faction = id;
    p.endgame.rep = p.endgame.rep || 0;
    return true;
  };

  S.seasonProgress = function (p, amount) {
    if (!p.endgame) return;
    const s = p.endgame.season = Object.assign({ level: 0, xp: 0, claimed: 0 }, p.endgame.season || {});
    const cap = 1000;
    s.xp = Math.min(cap * 40, s.xp + (amount || 0));
    s.level = Math.floor(s.xp / cap);
    if (s.level > 40) s.level = 40;
  };

  S.seasonClaim = function (p) {
    const s = p.endgame && p.endgame.season;
    if (!s) return { ok: false, msg: 'Sem temporada ativa.' };
    if (s.level <= s.claimed) return { ok: false, msg: 'Nenhuma recompensa nova.' };
    const from = s.claimed + 1, to = s.level;
    s.claimed = s.level;
    p.gold += 150 * (to - from + 1);
    const levels = S.gainXp(p, 400 * (to - from + 1));
    p.endgame.fragments = (p.endgame.fragments || 0) + Math.floor((to - from + 1) / 2);
    return { ok: true, from, to, levels, msg: 'Recompensas da temporada resgatadas (níveis ' + from + '-' + to + ').' };
  };

  S.chestClaim = function (p, tier) {
    S.endgameWeek(p);
    tier = [2, 4, 8].indexOf(tier) >= 0 ? tier : 2;
    if ((p.endgame.activities || 0) < tier) return { ok: false, msg: 'Atividades insuficientes: ' + p.endgame.activities + '/' + tier + '.' };
    if ((p.endgame.chestClaimed || 0) >= tier) return { ok: false, msg: 'Baú deste nível já resgatado.' };
    p.endgame.chestClaimed = tier;
    const gold = tier === 2 ? 500 : tier === 4 ? 1500 : 4000;
    const xp = tier === 2 ? 1000 : tier === 4 ? 3000 : 8000;
    const levels = S.gainXp(p, xp);
    p.gold += gold;
    p.endgame.fragments = (p.endgame.fragments || 0) + (tier === 8 ? 4 : tier === 4 ? 2 : 1);
    if (tier === 8) p.inventory.push && S.addItem(p, S.makeStack('elixir', 2));
    return { ok: true, tier, gold, levels, msg: 'Baú de Aurora (atividades ' + tier + ') resgatado.' };
  };

  // Desbloqueio de chave de fenda ao atingir o endgame.
  const _oldSync = S.syncCampaign;
  S.syncCampaign = function (p, quiet) {
    const r = _oldSync(p, quiet);
    if (p && p.endgame && p.level >= 44 && !p.endgame._keyGranted) {
      p.endgame.keys = (p.endgame.keys || 0) + 1;
      p.endgame._keyGranted = true;
      if (!quiet) S.toast('Você recebeu uma Chave de Fenda.', 'ach');
    }
    if (p && p.level >= 44) S.applyUnlocks(p, false);
    return r;
  };

  S.disassemble = function (p, uid) {
    const it = S.getItem(p, uid);
    if (!it || it.kind !== 'gear') return false;
    const slotMat = { weapon: 'ore', chest: 'cloth', helmet: 'ore', boots: 'leather', ring: 'crystal', amulet: 'essence' };
    const mat = slotMat[it.slot] || 'ore';
    const mult = it.rarity === 'comum' ? 1 : it.rarity === 'incomum' ? 2 : it.rarity === 'raro' ? 3 : it.rarity === 'epico' ? 5 : 8;
    S.removeUid(p, uid);
    S.addItem(p, S.makeStack(mat, mult));
    p.gold += Math.max(1, Math.floor((it.value || 1) * 0.25));
    return true;
  };

  A.sys = S;
})(window.A);
