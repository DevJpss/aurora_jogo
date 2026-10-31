/* ==========================================================================
   JOGO — loop, entrada, combate, IA, masmorra, clima, save
   ========================================================================== */
(function (A) {
  'use strict';

  const G = {};
  A.game = G;

  const T = A.T, VW = A.VW, VH = A.VH;
  const UI = () => A.ui;
  const S = () => A.sys;

  const DEFAULT_HOTKEYS = {
    moveUp: ['w', 'arrowup'], moveDown: ['s', 'arrowdown'], moveLeft: ['a', 'arrowleft'], moveRight: ['d', 'arrowright'],
    run: ['shift'], attack: [' '], attackNearest: ['tab'], autoToggle: ['r'], dodge: ['v'], interact: ['e'],
    skill1: ['1'], skill2: ['2'], skill3: ['3'], skill4: ['4'], potionHp: ['5'], potionMp: ['6'],
    openCharacter: ['c'], openInventory: ['i'], openQuests: ['j'], openMap: ['m'], openSocial: ['o'],
    openAchievements: ['k'], toggleChat: ['enter']
  };
  const DEFAULTS = {
    music: 0.35, sfx: 0.55, damageNumbers: true, screenShake: true,
    showFps: false, minimap: true, keyDodge: 'v', hotkeys: DEFAULT_HOTKEYS,
    autoPotionHp: true, autoPotionMp: true, autoPotionHpPct: 50, autoPotionMpPct: 30
  };

  G.time = 0;
  G.worldClock = 8 * 3600;
  G.dayLen = 900;
  G.settings = Object.assign({}, DEFAULTS);
  G.accounts = {};
  G.saveData = { accounts: {}, last: '' };
  G.account = null;
  G.currentServer = 'aurora';
  G.player = null;
  G.monsters = [];
  G.bots = [];
  G.loot = [];
  G.projectiles = [];
  G.effects = [];
  G.effectPool = [];
  G.floaters = [];
  G.traps = [];
  G.telegraphs = [];
  G.statuses = {};
  G.dodgeT = 0;
  G.dodgeCd = 0;
  G.invulnT = 0;
  G.staminaDelay = 0;
  G.dodgeDir = { x: 0, y: 1 };
  G.decor = [];
  G.skillCooldowns = [0, 0, 0, 0];
  G.buffs = {};
  G.cam = { x: 0, y: 0 };
  G.keys = {};
  G.touch = { x: 0, y: 0 };
  G.mouse = { x: VW / 2, y: VH / 2, wx: 0, wy: 0, active: false };
  G.target = null;
  G.autoChase = false;
  G.autoHunt = false;
  G.autoSkillTimer = 0;
  G.autoPotionTimer = 0;
  G.autoLoot = null;
  G.autoLootT = 0;
  G.autoLootSkip = null;
  G.autoChaseT = 0;
  G.autoChasePos = null;
  G.moveTo = null;
  G.manualMoving = false;
  G.nav = { path: [], goal: null, t: -99, nextTry: 0 };
  G.questTrack = null;
  G.questFocus = null;
  G.lastZone = null;
  G.dead = false;
  G.nearNpc = null;
  G.nearNode = null;
  G.nearPortal = null;
  G.nearExit = null;
  G.shopStock = [];
  G.ping = 24;
  G.online = 1842;
  G.weather = { type: 'limpo', t: 120 };
  G.trans = null;
  G.shake = 0;
  G.spawnEffect = function (e) {
    const o = (G.effectPool && G.effectPool.pop()) || {};
    if (e) Object.assign(o, e);
    G.effects.push(o);
    return o;
  };
  G.combat = 0;
  G.saveTimer = 0;
  G.attackTimer = 0;
  G.attackAnim = 0;
  G.walkAnim = 0;
  G.dir = 0;
  G.playerLevelSeen = 1;
  G.fade = 0;
  G.frameCount = 0;
  G.fps = 60;
  G.fpsTimer = 0;
  G.chatTimer = 0;
  G.pingTimer = 0;
  G.weatherTimer = 0;
  G.respawnUsed = false;
  G.ruinBlock = null;
  G.cryptWall = null;
  G.whiteCache = new Map();
  G.rain = [];
  G.paused = false;
  G._loopStarted = false;
  G._titleTime = 0;
  G._audioStarted = false;
  G._last = 0;

  /* ================================================================== */
  /* INICIALIZAÇÃO                                                       */
  /* ================================================================== */
  G.init = function () {
    const cv = A.$('#world');
    cv.width = VW; cv.height = VH;
    G.ctx = cv.getContext('2d');
    G.ctx.imageSmoothingEnabled = false;

    G.loadSettings();
    G.loadSave();
    A.ui.init(G);
    A.sys.toast = (msg, type, key, cooldown) => A.ui.toast(msg, type, key, cooldown);

    G.buildSpecials();
    G.bindInput();
    G.buildMobile();
    G.startLoop();
    G.bootSequence();

    // FPS
    G.fpsEl = A.el('div', 'fps-display');
    G.fpsEl.id = 'fpsDisplay';
    document.body.appendChild(G.fpsEl);

    // áudio só após interação
    const kick = () => {
      if (G._audioStarted) return;
      G._audioStarted = true;
      A.audio.resume();
      A.audio.play('click');
      if (G.settings.music > 0.01) A.audio.startMusic();
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
    };
    window.addEventListener('pointerdown', kick);
    window.addEventListener('keydown', kick);

    window.addEventListener('resize', G.resizeAll);
    G.resizeAll();
  };

  G.buildSpecials = function () {
    G.ruinBlock = A.spr(32, 46, (g) => {
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(2, 40, 28, 5);
      g.fillStyle = '#3a3644'; g.fillRect(1, 8, 30, 37);
      g.fillStyle = '#6f6a7d'; g.fillRect(2, 6, 28, 34);
      g.fillStyle = '#8a8499'; g.fillRect(3, 7, 26, 4);
      g.fillStyle = '#575266'; g.fillRect(4, 14, 24, 3); g.fillRect(4, 24, 24, 3); g.fillRect(4, 34, 24, 3);
      g.fillStyle = '#4a4555'; g.fillRect(10, 10, 3, 6); g.fillRect(20, 28, 4, 8);
      g.fillStyle = '#2f2b3a'; g.fillRect(2, 38, 28, 2);
    });
    G.cryptWall = A.spr(32, 32, (g) => {
      g.fillStyle = '#171320'; g.fillRect(0, 0, 32, 32);
      g.fillStyle = '#2a2536'; g.fillRect(1, 1, 30, 30);
      g.fillStyle = '#332d42'; g.fillRect(2, 2, 13, 8); g.fillRect(17, 2, 13, 8);
      g.fillStyle = '#2d2739'; g.fillRect(2, 12, 8, 8); g.fillRect(12, 12, 18, 8);
      g.fillStyle = '#241f30'; g.fillRect(2, 22, 18, 8); g.fillRect(22, 22, 8, 8);
      g.fillStyle = '#4a4158'; g.fillRect(4, 3, 9, 2); g.fillRect(19, 13, 8, 2);
      g.fillStyle = '#1a1624'; g.fillRect(0, 29, 32, 3);
      g.fillStyle = 'rgba(120,100,180,.12)'; g.fillRect(5, 18, 2, 9);
    });
  };

  G.bootSequence = function () {
    const steps = [
      ['Acordando os servidores…', 12],
      ['Carregando o mundo de Aurora…', 28],
      ['Desenhando a Vila Aurora…', 44],
      ['Acordando os monstros…', 58],
      ['Afinando os bardos…', 72],
      ['Abrindo os portões…', 88],
      ['Pronto para a aventura.', 100]
    ];
    let i = 0;
    const tick = () => {
      if (i < steps.length) {
        A.ui.setBoot(steps[i][1], steps[i][0]);
        i++;
        setTimeout(tick, 230 + Math.random() * 120);
      } else {
        setTimeout(() => A.ui.bootDone(), 350);
      }
    };
    setTimeout(tick, 350);
  };

  /* ================================================================== */
  /* SAVE / CONTA                                                        */
  /* ================================================================== */
  G.parseSaveData = function (raw) {
    if (!raw) return null;
    let d;
    try { d = JSON.parse(raw); } catch (e) { return null; }
    if (!d || typeof d !== 'object') return null;
    if (d.accounts && typeof d.accounts === 'object') return d;
    // Formato antigo: um único personagem/conta salvo no topo do JSON.
    if (d.name && d.chars) {
      return { accounts: { [String(d.name).toLowerCase()]: d }, last: d.name };
    }
    return null;
  };

  // Grava o save e mantém a última versão válida como backup rotativo. Se o
  // JSON principal for corrompido, o jogo volta para o backup em vez de perder
  // todos os personagens.
  G.writeSave = function (data) {
    if (!data || typeof data !== 'object') return false;
    data.version = A.SAVE_VERSION;
    const prev = A.store.raw(A.SAVE_KEY);
    const ok = A.store.set(A.SAVE_KEY, data);
    if (ok && prev && G.parseSaveData(prev)) {
      A.store.setRaw(A.SAVE_KEY + '.bak', prev);
    }
    return ok;
  };

  G.loadSave = function () {
    let d = G.parseSaveData(A.store.raw(A.SAVE_KEY));
    if (!d) {
      const backup = A.store.raw(A.SAVE_KEY + '.bak');
      d = G.parseSaveData(backup);
      if (d) {
        A.store.setRaw(A.SAVE_KEY, backup);
        G._saveRestored = true;
        console.warn('[Aurora] save principal inválido; backup restaurado.');
      }
    }
    if (!d) d = { accounts: {}, last: '' };
    d.version = A.SAVE_VERSION;
    d.accounts = d.accounts || {};
    G.saveData = d;
    G.accounts = G.saveData.accounts;
  };

  G.loadSettings = function () {
    const s = A.store.get(A.SETTINGS_KEY, {});
    G.settings = Object.assign({}, DEFAULTS, s || {});
    G.settings.hotkeys = Object.assign({}, DEFAULT_HOTKEYS, (s && s.hotkeys) || {});
    A.audio.setVolumes(G.settings.music, G.settings.sfx);
  };
  G.saveSettings = function () {
    A.store.set(A.SETTINGS_KEY, G.settings);
  };
  G.hotkey = function (action) {
    const h = G.settings && G.settings.hotkeys ? G.settings.hotkeys[action] : null;
    return Array.isArray(h) && h.length ? h : (DEFAULT_HOTKEYS[action] || []);
  };
  G.isHotkey = function (action, key) {
    const k = String(key || '').toLowerCase();
    return G.hotkey(action).some(x => String(x).toLowerCase() === k);
  };
  G.movementKeys = function () {
    return ['moveUp', 'moveDown', 'moveLeft', 'moveRight'].reduce((a, act) => a.concat(G.hotkey(act)), []);
  };

  G.applySettings = function () {
    A.audio.setVolumes(G.settings.music, G.settings.sfx);
    const mini = A.$('.hud-map');
    if (mini) mini.style.display = G.settings.minimap ? '' : 'none';
    if (G.fpsEl) G.fpsEl.style.display = G.settings.showFps ? 'block' : 'none';
  };

  G.setSetting = function (k, v) {
    if (k === 'music' || k === 'sfx') {
      G.settings[k] = A.clamp(v / 100, 0, 1);
      A.audio.setVolumes(G.settings.music, G.settings.sfx);
      if (k === 'music' && G.settings.music > 0.01 && !A.audio.musicOn && G._audioStarted) A.audio.startMusic();
    } else {
      G.settings[k] = v;
    }
    A.store.set(A.SETTINGS_KEY, G.settings);
    G.applySettings();
  };

  G.login = function (name) {
    name = (name || '').trim();
    if (name.length < 2) { A.ui.loginError('Digite um nome de conta com pelo menos 2 letras.'); return; }
    if (name.length > 18) { A.ui.loginError('O nome da conta pode ter no máximo 18 caracteres.'); return; }
    if (!/^[A-Za-zÀ-ÿ0-9 _-]+$/.test(name)) { A.ui.loginError('Use apenas letras, números, espaço, _ ou -.'); return; }
    const key = name.toLowerCase();
    if (!G.saveData.accounts[key]) {
      G.saveData.accounts[key] = { name, chars: {}, created: Date.now() };
    }
    G.account = G.saveData.accounts[key];
    G.account.chars = G.account.chars || {};
    G.saveData.last = name;
    G.writeSave(G.saveData);
    A.store.set('aurora.account', name);
    A.ui.loginError('');
    A.ui.setAccount(G.account.name);
    A.audio.play('click');
    A.ui.show('servers');
    A.ui.renderServers();
  };

  G.charsFor = function (serverId) {
    if (!G.account) return [];
    G.account.chars = G.account.chars || {};
    return G.account.chars[serverId] || [];
  };

  G.openServer = function (id) {
    const s = A.SERVERS.find(x => x.id === id);
    if (!s || s.status !== 'online') { A.ui.toast('Servidor em manutenção.', 'erro'); return; }
    G.currentServer = id;
    A.store.set(A.SESSION_KEY, { account: G.account.name, server: id });
    A.audio.play('open');
    A.ui.show('chars');
    A.ui.renderChars();
  };

  G.backToServers = function () {
    if (G.player) { G.save(); G.stopGame(); }
    A.ui.show('servers');
    A.ui.renderServers();
  };

  G.backToChars = function () {
    if (G.player) { G.save(); G.stopGame(); }
    A.ui.show('chars');
    A.ui.renderChars();
  };

  G.openCreate = function () {
    if (G.charsFor(G.currentServer).length >= 3) { A.ui.toast('Limite de 3 personagens neste servidor.', 'erro'); return; }
    A.ui.show('create');
  };

  G.createCharacter = function (opts) {
    const p = A.sys.blankCharacter({
      name: opts.name, cls: opts.cls, look: opts.look, server: G.currentServer
    });
    G.account.chars[G.currentServer] = G.charsFor(G.currentServer);
    G.account.chars[G.currentServer].push(p);
    G.saveData.accounts[G.account.name.toLowerCase()] = G.account;
    G.writeSave(G.saveData);
    A.audio.play('level');
    A.ui.toast('Personagem criado! Bem-vindo(a), ' + p.name + '.', 'ok');
    G.enterCharacter(p.id);
  };

  G.deleteCharacter = function (id) {
    const arr = G.charsFor(G.currentServer);
    const c = arr.find(x => x.id === id);
    if (!c) return;
    if (!confirm('Excluir permanentemente o personagem "' + c.name + '"? Essa ação não pode ser desfeita.')) return;
    G.account.chars[G.currentServer] = arr.filter(x => x.id !== id);
    G.writeSave(G.saveData);
    A.ui.renderChars();
    A.ui.toast('Personagem excluído.', 'ok');
  };

  G.enterCharacter = function (id) {
    const data = G.charsFor(G.currentServer).find(x => x.id === id);
    if (!data) { A.ui.toast('Personagem não encontrado.', 'erro'); return; }
    const p = A.sys.deserialize(JSON.parse(JSON.stringify(data)));
    p.server = G.currentServer;
    if (p.x == null) { p.x = p.pos ? p.pos.x : 73 * T + 16; p.y = p.pos ? p.pos.y : 56 * T + 16; }
    p.map = data.map || 'overworld';
    if (p.hp <= 0) { p.hp = p.maxHp; p.mp = p.maxMp; }
    G.player = p;
    G.playerLevelSeen = p.level;
    G.dead = false;
    G.autoHunt = false;
    G.target = null;
    G.autoChase = false;
    G.autoChaseT = 0;
    G.autoChasePos = null;
    G.autoLoot = null;
    G.autoLootT = 0;
    G.autoLootSkip = null;
    G.moveTo = null;
    G.manualMoving = false;
    G.keys = {};
    G.touch.x = 0;
    G.touch.y = 0;
    G.mouse.active = false;
    G.buffs = {};
    G.statuses = {};
    G.telegraphs = [];
    G.dodgeT = 0;
    G.dodgeCd = 0;
    G.invulnT = 0;
    G.staminaDelay = 0;
    G.skillCooldowns = [0, 0, 0, 0];
    G.loot = []; G.projectiles = []; G.effects = []; G.floaters = []; G.traps = [];
    G.weather = { type: 'limpo', t: 100 };
    G.worldClock = 8 * 3600;
    G.combat = 0;
    G.nearNpc = null; G.nearNode = null; G.nearPortal = null; G.nearExit = null;

    if (p.map === 'cripta') {
      A.world.enter(A.world.dungeon);
      p.x = A.world.dungeonSpawn.x; p.y = A.world.dungeonSpawn.y;
    } else if (p.map === 'cidadela') {
      const d = A.world.getDungeon('cidadela');
      A.world.enter(d || A.world.overworld);
      if (d && d.spawn) { p.x = d.spawn.x; p.y = d.spawn.y; }
    } else {
      A.world.enter(A.world.overworld);
    }
    if (!G.canStand(p.x, p.y, 8)) G.teleportPlayer(p.x, p.y);
    else G.snapCamera();
    G.lastZone = A.world.isDungeon() ? (A.world.activeDungeonId || p.map || 'cripta') : A.world.zoneAt(Math.floor(p.x / A.T), Math.floor(p.y / A.T));
    G.spawnMonsters();
    G.spawnBots();
    A.ui.enterGame(p);
    if (G._saveRestored) {
      G._saveRestored = false;
      A.ui.toast('O save principal estava corrompido. Backup restaurado.', 'erro');
    }
    A.ui.setChannel('todos');
    A.ui.updateHUD(true);
    A.audio.resume();
    if (G.settings.music > 0.01) A.audio.startMusic();
    A.store.set(A.SESSION_KEY, { account: G.account.name, server: G.currentServer, char: p.id });
    G.saveTimer = 0;
    G.applySettings();
    G.chatTimer = 4;
    G.pingTimer = 3;
  };

  G.logout = function () {
    if (!G.player) { A.ui.show('chars'); return; }
    G.save();
    G.stopGame();
    A.ui.show('chars');
    A.ui.renderChars();
    A.ui.toast('Progresso salvo. Até logo!', 'ok');
  };

  G.stopGame = function () {
    G.player = null;
    G.monsters = []; G.bots = []; G.loot = []; G.projectiles = [];
    G.effects = [];
  G.effectPool = []; G.floaters = []; G.traps = [];
    G.target = null; G.buffs = {}; G.dead = false;
    G.autoHunt = false; G.autoChase = false; G.autoChaseT = 0; G.autoChasePos = null;
    G.moveTo = null; G.autoLoot = null; G.autoLootT = 0; G.autoLootSkip = null;
    G.keys = {}; G.touch.x = 0; G.touch.y = 0; G.mouse.active = false;
    A.world.enter(A.world.overworld);
    A.ui.closeAllWins();
    A.ui.hideDeath();
  };

  G.save = function () {
    if (!G.player || !G.account) return false;
    const p = G.player;
    p.map = A.world.isDungeon() ? 'cripta' : 'overworld';
    p.pos = { x: p.x, y: p.y };
    p.lastSeen = Date.now();
    const data = A.sys.serialize(p);
    const arr = G.account.chars[G.currentServer] || [];
    const i = arr.findIndex(c => c.id === p.id);
    if (i >= 0) arr[i] = data; else arr.push(data);
    G.account.chars[G.currentServer] = arr;
    G.saveData.accounts[G.account.name.toLowerCase()] = G.account;
    G.saveData.last = G.account.name;
    const ok = G.writeSave(G.saveData);
    if (!ok) A.ui.toast('Falha ao salvar (armazenamento cheio?).', 'erro');
    return ok;
  };

  G.exportSave = function () {
    if (G.player) G.save();
    return JSON.stringify(G.saveData);
  };

  G.importSave = function (text) {
    try {
      const d = JSON.parse(text);
      if (!d || !d.accounts || typeof d.accounts !== 'object') throw new Error('formato');
      G.writeSave(d);
      A.ui.toast('Save importado. Recarregando…', 'ok');
      setTimeout(() => location.reload(), 700);
    } catch (e) {
      A.ui.toast('Save inválido. Verifique o código colado.', 'erro');
    }
  };

  G.resetAll = function () {
    A.store.del(A.SAVE_KEY);
    A.store.del(A.SAVE_KEY + '.bak');
    A.store.del(A.SESSION_KEY);
    A.store.del(A.SETTINGS_KEY);
    A.store.del('aurora.account');
    location.reload();
  };

  G.refreshServers = function () {
    A.SERVERS.forEach(s => {
      if (s.status !== 'online') return;
      s.pop = A.clamp(s.pop + A.randi(-40, 40), 300, s.cap - 40);
      s.ping = A.clamp(s.ping + A.randi(-3, 3), 12, 240);
    });
    A.ui.renderServers();
  };

  G.allocate = function (stat, quiet) {
    if (!G.player) return false;
    if (!A.sys.allocate(G.player, stat)) return false;
    if (!quiet) A.audio.play('click');
    if (quiet) G.saveTimer = Math.max(G.saveTimer, 15);
    else G.save();
    A.ui.updateHUD(true);
    return true;
  };

  G.deallocate = function (stat, quiet) {
    if (!G.player) return false;
    if (!A.sys.deallocate(G.player, stat)) return false;
    if (!quiet) A.audio.play('click');
    if (quiet) G.saveTimer = Math.max(G.saveTimer, 15);
    else G.save();
    A.ui.updateHUD(true);
    return true;
  };

  G.resetAttributes = function () {
    if (!G.player) return false;
    if (!A.sys.resetAlloc(G.player)) return false;
    A.audio.play('click');
    G.save();
    A.ui.updateHUD(true);
    A.ui.toast('Pontos de atributo redistribuídos.', 'ok');
    return true;
  };

  /* ================================================================== */
  /* LOOP                                                                */
  /* ================================================================== */
  G.startLoop = function () {
    if (G._loopStarted) return;
    G._loopStarted = true;
    G._last = performance.now();
    const frame = (now) => {
      // Agenda o próximo frame antes de atualizar. Assim um erro isolado não
      // congela para sempre o jogador, os monstros e o mundo.
      requestAnimationFrame(frame);
      let dt = (now - G._last) / 1000;
      G._last = now;
      if (dt > 0.08) dt = 0.08;
      if (dt < 0) dt = 0;
      G.time += dt;
      G.frameCount++;
      G.fpsTimer += dt;
      if (G.fpsTimer >= 0.5) {
        G.fps = Math.round(G.frameCount / G.fpsTimer);
        G.frameCount = 0; G.fpsTimer = 0;
        G.updateFps();
      }
      try {
        if (G.player) G.update(dt);
        G.render(dt);
        A.ui.tick(dt);
      } catch (err) {
        G.frameErrors = (G.frameErrors || 0) + 1;
        if (G.frameErrors <= 3 || G.frameErrors % 300 === 0) {
          console.error('[Aurora] erro no loop do jogo:', err);
        }
        // Se o erro veio da automação/rastreio, encerra os dois para não
        // repetir a mesma falha a cada frame e voltar a ligar a AUTO sozinha.
        try {
          if (G.questTrack) G.cancelQuestTrack(true, false);
          if (G.autoHunt) G.setAutoHunt(false, true);
        } catch (_) { /* o loop continua mesmo se a limpeza falhar */ }
      }
    };
    requestAnimationFrame(frame);
  };

  G.updateFps = function () {
    if (!G.fpsEl) return;
    G.fpsEl.style.display = G.settings.showFps && G.player ? 'block' : 'none';
    G.fpsEl.textContent = G.fps + ' FPS • ' + Math.round(A.world.active.w * T) + '×' + Math.round(A.world.active.h * T) + ' px';
  };

  /* ================================================================== */
  /* INPUT                                                               */
  /* ================================================================== */
  G.bindInput = function () {
    const cv = A.$('#world');
    cv.addEventListener('mousemove', (e) => {
      G.updateMouse(e);
      G.mouse.active = true;
      if (!G.player) return;
      const m = G.monsterAt(G.mouse.wx, G.mouse.wy);
      const n = !m && G.npcAt(G.mouse.wx, G.mouse.wy);
      cv.style.cursor = (m || n) ? 'pointer' : 'crosshair';
    });
    cv.addEventListener('mousedown', (e) => {
      if (!G.player || G.dead || G.trans) return;
      if (A.ui.currentWin) return;
      G.updateMouse(e);
      G.mouse.active = true;
      if (e.button === 2) {
        // Movimento por clique: o combate básico fica no botão esquerdo.
        // Cliques rentes a uma parede são ajustados para o tile livre mais
        // próximo. Clicar dentro de uma parede/prédio não prende o destino.
        let dest = { x: G.mouse.wx, y: G.mouse.wy };
        if (!G.canStand(dest.x, dest.y, 8)) {
          const nt = G.nearestWalkableTile(Math.floor(dest.x / A.T), Math.floor(dest.y / A.T), 1);
          if (!nt) {
            A.ui.toast('Destino bloqueado.', 'erro');
            return;
          }
          dest = { x: nt.x * A.T + A.T / 2, y: nt.y * A.T + A.T / 2 };
          if (!G.canStand(dest.x, dest.y, 8)) {
            A.ui.toast('Destino bloqueado.', 'erro');
            return;
          }
        }
        if (G.questTrack) G.cancelQuestTrack(true, false);
        G.setAutoHunt(false, true);
        G.target = null;
        G.autoChase = false;
        G.resetNav();
        G.moveTo = dest;
        A.audio.play('click');
        return;
      }
      if (e.button !== 0) return;
      const npc = G.npcAt(G.mouse.wx, G.mouse.wy);
      if (npc) { G.openNpc(npc); return; }
      G.actionAttack(false);
    });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      if (G.typing()) return;
      const k = e.key.toLowerCase();
      if (G._rebindingAction) {
        G.settings.hotkeys[G._rebindingAction] = [k];
        G._rebindingAction = null;
        G.saveSettings();
        A.ui.toast('Tecla configurada.', 'ok');
        if (A.ui.currentWin === 'settings') A.ui.refreshWin('settings');
        return;
      }
      if (k === 'tab' || k === ' ' || k === 'spacebar') e.preventDefault();
      if (G.player && !G.dead) {
        if (G.movementKeys().includes(k)) {
          if (!G.keys[k]) {
            if (G.questTrack) G.cancelQuestTrack(true, false);
            if (G.autoHunt) G.setAutoHunt(false, true);
          }
          G.keys[k] = true;
          G.autoChase = false;
          G.moveTo = null;
        }
        if (G.isHotkey('run', k)) G.keys.shift = true;
      }
      if (k === 'escape') {
        if (A.ui.currentWin) A.ui.closeWin();
        else A.ui.openWin('settings');
        return;
      }
      if (!G.player) return;
      if (G.isHotkey('interact', k)) G.interact();
      if (G.isHotkey('dodge', k) && !e.repeat) G.tryDodge();
      if (G.isHotkey('attack', k)) G.actionAttack(!G.mouse.active);
      if (G.isHotkey('attackNearest', k)) G.attackNearest(false);
      if (G.isHotkey('autoToggle', k)) G.toggleAutoHunt();
      if (G.isHotkey('skill1', k)) G.useSkill(0);
      if (G.isHotkey('skill2', k)) G.useSkill(1);
      if (G.isHotkey('skill3', k)) G.useSkill(2);
      if (G.isHotkey('skill4', k)) G.useSkill(3);
      if (G.isHotkey('potionHp', k)) G.usePotion('potion_hp');
      if (G.isHotkey('potionMp', k)) G.usePotion('potion_mp');
      if (G.isHotkey('openCharacter', k)) G.toggleWin('character');
      if (G.isHotkey('openInventory', k)) G.toggleWin('inventory');
      if (G.isHotkey('openQuests', k)) G.toggleWin('quests');
      if (G.isHotkey('openMap', k)) G.toggleWin('map');
      if (G.isHotkey('openSocial', k)) G.toggleWin('social');
      if (G.isHotkey('openAchievements', k)) G.toggleWin('achievements');
      if (G.isHotkey('toggleChat', k)) {
        const ci = A.$('#chatInput');
        if (ci) { ci.focus(); }
      }
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (G.isHotkey('run', k)) G.keys.shift = false;
      if (G.movementKeys().includes(k)) G.keys[k] = false;
    });
    window.addEventListener('blur', () => { G.keys = {}; });
  };

  G.typing = function () {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  };

  G.toggleWin = function (name) {
    if (A.ui.isWinOpen(name)) A.ui.closeWin(name);
    else A.ui.openWin(name);
  };

  G.updateMouse = function (e) {
    const cv = A.$('#world');
    const r = cv.getBoundingClientRect();
    const scale = Math.min(r.width / VW, r.height / VH);
    const ox = (r.width - VW * scale) / 2;
    const oy = (r.height - VH * scale) / 2;
    G.mouse.x = (e.clientX - r.left - ox) / scale;
    G.mouse.y = (e.clientY - r.top - oy) / scale;
    G.mouse.wx = G.mouse.x + G.cam.x;
    G.mouse.wy = G.mouse.y + G.cam.y;
  };

  // Mantém a mira presa ao cursor mesmo quando a câmera se move.
  G.syncMouse = function () {
    if (!G.mouse.active) return;
    G.mouse.wx = G.mouse.x + G.cam.x;
    G.mouse.wy = G.mouse.y + G.cam.y;
  };

  G.buildMobile = function () {
    const joy = A.$('#joystick'), stick = A.$('#stick');
    if (!joy) return;
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      const mob = A.$('#mobile');
      if (mob) mob.classList.add('active');
    }
    let active = false, id = null, cx = 0, cy = 0;
    const start = (e) => {
      const t = e.changedTouches ? e.changedTouches[0] : e;
      active = true; id = t.identifier;
      const r = joy.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      move(e);
    };
    const move = (e) => {
      if (!active) return;
      let t = e.changedTouches ? e.changedTouches[0] : e;
      if (!t) t = e.touches && e.touches[0];
      if (!t) return;
      let dx = t.clientX - cx, dy = t.clientY - cy;
      const max = 40, d = Math.hypot(dx, dy);
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      stick.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      G.touch.x = dx / max; G.touch.y = dy / max;
      if (Math.hypot(G.touch.x, G.touch.y) > 0.2) {
        if (G.questTrack) G.cancelQuestTrack(true, false);
        if (G.autoHunt) G.setAutoHunt(false, true);
      }
      e.preventDefault();
    };
    const end = () => { active = false; G.touch.x = 0; G.touch.y = 0; stick.style.transform = ''; };
    joy.addEventListener('touchstart', start, { passive: false });
    joy.addEventListener('touchmove', move, { passive: false });
    joy.addEventListener('touchend', end);
    joy.addEventListener('mousedown', (e) => { e.preventDefault(); start(e); window.addEventListener('mousemove', move); window.addEventListener('mouseup', function up() { end(); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); }); });
  };

  G.resizeAll = function () {
    G.resizeMenu(A.$('#titleCanvas'));
    G.resizeMenu(A.$('#loginCanvas'));
  };

  G.resizeMenu = function (cv) {
    if (!cv) return;
    const w = cv.clientWidth || window.innerWidth;
    const h = cv.clientHeight || window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const nw = Math.round(w * dpr), nh = Math.round(h * dpr);
    if (cv.width !== nw || cv.height !== nh) { cv.width = nw; cv.height = nh; }
  };

  /* ================================================================== */
  /* UPDATE                                                              */
  /* ================================================================== */
  G.update = function (dt) {
    const p = G.player;
    if (!p) return;

    p.playtime = (p.playtime || 0) + dt;
    G.worldClock += dt * (24 * 3600 / G.dayLen);
    if (G.worldClock >= 24 * 3600) G.worldClock -= 24 * 3600;

    G.combat = Math.max(0, G.combat - dt);
    G.shake = Math.max(0, G.shake - dt * 30);
    G.attackTimer = Math.max(0, G.attackTimer - dt);
    G.attackAnim = Math.max(0, G.attackAnim - dt);
    G.saveTimer += dt;
    G.chatTimer -= dt;
    G.pingTimer -= dt;
    G.weatherTimer += dt;

    G.updateTrans(dt);
    G.updateBuffs(dt);
    G.updateStatuses(dt);
    G.updateTelegraphs(dt);
    G.updateCooldowns(dt);
    G.updateWeather(dt);
    G.updateChatSim(dt);
    G.updatePing(dt);
    G.updateAutoPotions(dt);

    if (!G.dead && !G.trans) {
      // A automação continua rodando mesmo com uma janela aberta. O jogador
      // pode organizar a mochila ou ler missões enquanto o personagem caça.
      try {
        G.updateAutomation(dt);
      } catch (err) {
        // Uma falha na automação nunca deve travar o jogador nem os monstros.
        console.error('[Aurora] erro na auto-caça:', err);
        if (G.questTrack) G.cancelQuestTrack(true, false);
        G.setAutoHunt(false, true);
        A.ui.toast('Auto-caça desativada por um erro interno.', 'erro');
      }
      const uiOpen = !!A.ui.currentWin;
      G.updateDodge(dt);
      if (!uiOpen || G.autoHunt || G.autoChase || G.questTrack) G.updateMovement(dt);
      else {
        G.manualMoving = false;
        G.moving = false;
        G.walkAnim = 0;
      }
      if (G.player) {
        const cz = A.world.isDungeon() ? (A.world.activeDungeonId || G.player.map || 'cripta') : A.world.zoneAt(Math.floor(G.player.x / A.T), Math.floor(G.player.y / A.T));
        if (G.lastZone !== cz) {
          G.lastZone = cz;
          A.sys.questEvent(G.player, 'explore', cz, 1);
        }
      }
    } else {
      G.dodgeT = 0;
      G.invulnT = 0;
      G.manualMoving = false;
      G.moving = false;
      if (G.dead) G.walkAnim = 0;
    }

    G.updateCamera(dt);
    G.syncMouse();
    G.updateMonsters(dt);
    G.updateBots(dt);
    G.updateProjectiles(dt);
    G.updateEffects(dt);
    G.updateTraps(dt);
    G.updateLoot(dt);
    G.updateNodes(dt);
    G.updateInteractables();
    G.updateQuestTrack(dt);
    G.updateRegen(dt);
    G.updateAutoTarget(dt);

    if (G.saveTimer >= 20) { G.saveTimer = 0; G.save(); }
  };

  G.updateTrans = function (dt) {
    if (!G.trans) { G.fade = Math.max(0, G.fade - dt * 3); return; }
    if (G.trans.dir === 1) {
      G.fade = Math.min(1, G.fade + dt * 4);
      if (G.fade >= 1) {
        G.trans.dir = -1;
        const cb = G.trans.cb;
        G.trans.cb = null;
        if (cb) cb();
      }
    } else {
      G.fade = Math.max(0, G.fade - dt * 4);
      if (G.fade <= 0) G.trans = null;
    }
  };

  G.transition = function (cb) {
    if (G.trans) { cb(); return; }
    G.trans = { dir: 1, cb };
  };

  G.updateMovement = function (dt) {
    const p = G.player;
    if (G.dodgeT > 0) {
      G.moving = true;
      G.manualMoving = true;
      return;
    }
    let dx = 0, dy = 0;
    if (G.keys.w || G.keys.arrowup) dy -= 1;
    if (G.keys.s || G.keys.arrowdown) dy += 1;
    if (G.keys.a || G.keys.arrowleft) dx -= 1;
    if (G.keys.d || G.keys.arrowright) dx += 1;
    dx += G.touch.x; dy += G.touch.y;
    const mag = Math.hypot(dx, dy);
    let moving = mag > 0.08;
    let manualMoving = moving;
    if (moving) {
      dx /= mag; dy /= mag;
      G.moveTo = null;
    } else if (G.moveTo) {
      const mdx = G.moveTo.x - p.x, mdy = G.moveTo.y - p.y;
      const md = Math.hypot(mdx, mdy);
      if (md > 10) {
        // Clique para andar também contorna paredes e árvores. Antes ele
        // seguia em linha reta e ficava preso no primeiro obstáculo.
        let wp = G.navTo(G.moveTo.x, G.moveTo.y, false);
        if (!wp) {
          // navTo pode estar no intervalo de nova tentativa. Confirma se
          // realmente não existe rota antes de cancelar o destino.
          const path = G.findPath(p.x, p.y, G.moveTo.x, G.moveTo.y);
          if (path && path.length) {
            G.nav.path = path;
            G.nav.goal = { x: G.moveTo.x, y: G.moveTo.y };
            G.nav.t = G.time;
            G.nav.nextTry = 0;
            wp = path[0];
          }
        }
        if (wp) {
          const wd = Math.hypot(wp.x - p.x, wp.y - p.y);
          if (wd > 1) { dx = (wp.x - p.x) / wd; dy = (wp.y - p.y) / wd; moving = true; manualMoving = true; }
        } else {
          G.moveTo = null;
          A.ui.toast('Não há caminho até esse ponto.', 'erro');
        }
      } else {
        G.moveTo = null;
      }
    } else if (G.autoHunt && G.autoLoot) {
      const ld = Math.hypot(G.autoLoot.x - p.x, G.autoLoot.y - p.y);
      if (ld > 28) {
        const wp = G.navTo(G.autoLoot.x, G.autoLoot.y, false);
        if (wp) {
          const wd = Math.hypot(wp.x - p.x, wp.y - p.y);
          if (wd > 1) { dx = (wp.x - p.x) / wd; dy = (wp.y - p.y) / wd; moving = true; }
        }
      }
    } else if (G.target && G.autoChase && G.target.hp > 0) {
      const d = G.distTo(G.target);
      if (d > G.attackRange() - 4) {
        const wp = G.navTo(G.target.x, G.target.y, true);
        if (wp) {
          const wd = Math.hypot(wp.x - p.x, wp.y - p.y);
          if (wd > 1) { dx = (wp.x - p.x) / wd; dy = (wp.y - p.y) / wd; moving = true; }
        } else if (G.lineClear(p.x, p.y, G.target.x, G.target.y, 7)) {
          // Fallback seguro: só anda em linha reta se houver visão livre.
          dx = (G.target.x - p.x) / d;
          dy = (G.target.y - p.y) / d;
          moving = true;
        }
        if (d > 1200) { G.autoChase = false; }
      }
    } else if (G.questTrack && G.questTrack.x != null && G.questTrack.y != null) {
      const qd = Math.hypot(G.questTrack.x - p.x, G.questTrack.y - p.y);
      if (qd > 22) {
        const wp = G.navTo(G.questTrack.x, G.questTrack.y, false);
        if (wp) {
          const wd = Math.hypot(wp.x - p.x, wp.y - p.y);
          if (wd > 1) { dx = (wp.x - p.x) / wd; dy = (wp.y - p.y) / wd; moving = true; }
        }
      }
    }
    if (moving) {
      let spd = p.speed;
      if (G.keys.shift) spd *= 1.42;
      if (G.buffs.haste) spd *= 1.4;
      if (G.buffs.bless) spd *= 1.05;
      spd *= G.moveSpeedMult();
      const nx = p.x + dx * spd * dt;
      const ny = p.y + dy * spd * dt;
      if (G.canStand(nx, p.y)) p.x = nx;
      if (G.canStand(p.x, ny)) p.y = ny;
      p.x = A.clamp(p.x, 12, A.world.active.w * T - 12);
      p.y = A.clamp(p.y, 12, A.world.active.h * T - 12);
      if (Math.abs(dx) > Math.abs(dy)) G.dir = dx > 0 ? 2 : 3;
      else G.dir = dy > 0 ? 0 : 1;
      G.walkAnim += dt * (spd / 26);
    } else {
      G.walkAnim = 0;
    }
    G.moving = moving;
    G.manualMoving = manualMoving;
  };

  G.canStand = function (x, y, half) {
    half = half || 7;
    const map = A.world.active;
    const pts = [[-half, -7], [half, -7], [-half, -2], [half, -2], [0, 0]];
    for (let i = 0; i < pts.length; i++) {
      const tx = Math.floor((x + pts[i][0]) / T);
      const ty = Math.floor((y + pts[i][1]) / T);
      if (map.solidTile(tx, ty)) return false;
    }
    return true;
  };

  /* ------------------------------------------------------------------ */
  /* NAVEGAÇÃO AUTOMÁTICA                                                */
  /* ------------------------------------------------------------------ */
  // A auto-caça antiga andava em linha reta e ficava presa em árvores.
  // Agora ela usa A* no grid do mapa e uma suavização por linha de visão.
  G.resetNav = function () {
    if (!G.nav) G.nav = { path: [], goal: null, t: -99, nextTry: 0 };
    G.nav.path = [];
    G.nav.goal = null;
    G.nav.t = -99;
    G.nav.nextTry = 0;
  };

  G.lineClear = function (x0, y0, x1, y1, half) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(d / 10));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      if (!G.canStand(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, half == null ? 7 : half)) return false;
    }
    return true;
  };

  G.walkableTile = function (tx, ty) {
    const map = A.world.active;
    if (tx < 1 || ty < 1 || tx >= map.w - 1 || ty >= map.h - 1) return false;
    return !map.solidTile(tx, ty);
  };

  G.nearestWalkableTile = function (tx, ty, maxR) {
    const map = A.world.active;
    tx = A.clamp(tx, 0, map.w - 1);
    ty = A.clamp(ty, 0, map.h - 1);
    if (G.walkableTile(tx, ty)) return { x: tx, y: ty };
    maxR = maxR || 10;
    for (let r = 1; r <= maxR; r++) {
      let best = null, bd = 1e9;
      for (let oy = -r; oy <= r; oy++) {
        for (let ox = -r; ox <= r; ox++) {
          if (Math.max(Math.abs(ox), Math.abs(oy)) !== r) continue;
          const nx = tx + ox, ny = ty + oy;
          if (!G.walkableTile(nx, ny)) continue;
          const dd = ox * ox + oy * oy;
          if (dd < bd) { bd = dd; best = { x: nx, y: ny }; }
        }
      }
      if (best) return best;
    }
    return null;
  };

  G.findPath = function (sx, sy, tx, ty) {
    const map = A.world.active, W = map.w, H = map.h;
    // Caminho direto é sempre o melhor quando não há obstáculo.
    if (G.lineClear(sx, sy, tx, ty, 7)) return [{ x: tx, y: ty }];

    const start = G.nearestWalkableTile(Math.floor(sx / T), Math.floor(sy / T), 6);
    const goal = G.nearestWalkableTile(Math.floor(tx / T), Math.floor(ty / T), 8);
    if (!start || !goal) return null;
    if (start.x === goal.x && start.y === goal.y) {
      return [{ x: goal.x * T + T / 2, y: goal.y * T + T / 2 }];
    }

    const N = W * H;
    const gScore = new Float32Array(N);
    gScore.fill(1e9);
    const fScore = new Float32Array(N);
    fScore.fill(1e9);
    const came = new Int32Array(N);
    came.fill(-1);
    const closed = new Uint8Array(N);
    const heap = [];
    const gx = goal.x, gy = goal.y;
    const h = (idx) => {
      const x = idx % W, y = (idx / W) | 0;
      const dx = Math.abs(x - gx), dy = Math.abs(y - gy);
      return Math.max(dx, dy) + 0.41421356 * Math.min(dx, dy);
    };
    const push = (idx) => {
      heap.push(idx);
      let c = heap.length - 1;
      while (c > 0) {
        const p = (c - 1) >> 1;
        if (fScore[heap[p]] <= fScore[heap[c]]) break;
        const tmp = heap[p]; heap[p] = heap[c]; heap[c] = tmp;
        c = p;
      }
    };
    const pop = () => {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let p = 0;
        for (;;) {
          const l = p * 2 + 1, r = l + 1;
          let best = p;
          if (l < heap.length && fScore[heap[l]] < fScore[heap[best]]) best = l;
          if (r < heap.length && fScore[heap[r]] < fScore[heap[best]]) best = r;
          if (best === p) break;
          const tmp = heap[p]; heap[p] = heap[best]; heap[best] = tmp;
          p = best;
        }
      }
      return top;
    };

    const sIdx = start.y * W + start.x, gIdx = gy * W + gx;
    gScore[sIdx] = 0;
    fScore[sIdx] = h(sIdx);
    push(sIdx);
    let found = false, guard = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    while (heap.length && guard++ < N * 4) {
      const cur = pop();
      if (closed[cur]) continue;
      if (cur === gIdx) { found = true; break; }
      closed[cur] = 1;
      const cx = cur % W, cy = (cur / W) | 0;
      for (let i = 0; i < dirs.length; i++) {
        const dx = dirs[i][0], dy = dirs[i][1];
        const nx = cx + dx, ny = cy + dy;
        if (!G.walkableTile(nx, ny)) continue;
        // Não corta quinas de obstáculos na diagonal.
        if (dx && dy && (!G.walkableTile(cx + dx, cy) || !G.walkableTile(cx, cy + dy))) continue;
        const ni = ny * W + nx;
        if (closed[ni]) continue;
        const ng = gScore[cur] + (dx && dy ? 1.41421356 : 1);
        if (ng >= gScore[ni]) continue;
        gScore[ni] = ng;
        fScore[ni] = ng + h(ni);
        came[ni] = cur;
        push(ni);
      }
    }
    if (!found) return null;

    const tiles = [];
    let idx = gIdx;
    while (idx !== -1) {
      tiles.push(idx);
      if (idx === sIdx) break;
      idx = came[idx];
    }
    tiles.reverse();
    const pts = tiles.map(i => ({ x: (i % W) * T + T / 2, y: ((i / W) | 0) * T + T / 2 }));

    // Remove pontos redundantes mantendo apenas os que precisam de curva.
    const out = [];
    let cur = { x: sx, y: sy };
    let i = 0;
    while (i < pts.length) {
      let j = pts.length - 1;
      while (j > i && !G.lineClear(cur.x, cur.y, pts[j].x, pts[j].y, 7)) j--;
      const next = pts[j];
      out.push(next);
      cur = next;
      i = j + 1;
    }
    if (out.length && G.lineClear(out[out.length - 1].x, out[out.length - 1].y, tx, ty, 7)) {
      out.push({ x: tx, y: ty });
    }
    return out.length ? out : null;
  };

  G.navTo = function (x, y, dynamic) {
    const p = G.player;
    if (!p) return null;
    if (!G.nav) G.nav = { path: [], goal: null, t: -99, nextTry: 0 };
    const nav = G.nav, now = G.time;
    if (!nav.path.length && nav.nextTry && now < nav.nextTry) return null;
    const goalMoved = !nav.goal || Math.hypot(x - nav.goal.x, y - nav.goal.y) > (dynamic ? 44 : 16);
    const expired = now - nav.t > (dynamic ? 0.65 : 1.8);
    if (goalMoved || expired || !nav.path.length) {
      nav.path = G.findPath(p.x, p.y, x, y) || [];
      nav.goal = { x, y };
      nav.t = now;
      nav.nextTry = nav.path.length ? 0 : now + 0.9;
    }
    while (nav.path.length && Math.hypot(p.x - nav.path[0].x, p.y - nav.path[0].y) < 12) {
      // Não corte a curva antes de contornar o obstáculo. Se o próximo
      // waypoint ainda não tem visão livre, o personagem precisa passar pelo
      // centro do waypoint atual para não raspar em árvores/paredes.
      if (nav.path.length > 1) {
        const d = Math.hypot(p.x - nav.path[0].x, p.y - nav.path[0].y);
        if (d >= 4 && !G.lineClear(p.x, p.y, nav.path[1].x, nav.path[1].y, 7)) break;
      }
      nav.path.shift();
    }
    return nav.path.length ? nav.path[0] : null;
  };

  // Encontra uma célula livre perto de um teleporte. Isso evita renascer
  // dentro de waypoints, baús, estátuas ou qualquer prop com colisão.
  G.safeSpawn = function (x, y, maxRadius) {
    const map = A.world.active;
    const pad = 18;
    const bx = A.clamp(x, pad, map.w * T - pad);
    const by = A.clamp(y, pad, map.h * T - pad);
    if (G.canStand(bx, by, 8)) return { x: bx, y: by };

    const tx = Math.floor(bx / T), ty = Math.floor(by / T);
    const max = maxRadius || 10;
    for (let r = 1; r <= max; r++) {
      const ring = [];
      for (let oy = -r; oy <= r; oy++) {
        for (let ox = -r; ox <= r; ox++) {
          if (Math.max(Math.abs(ox), Math.abs(oy)) !== r) continue;
          // Prioriza a saída sul (mais visível) e depois os eixos cardeais.
          let score = Math.abs(ox) + Math.abs(oy);
          if (oy > 0) score -= 1.2;
          if (ox === 0) score -= 0.4;
          if (oy > 0 && ox === 0) score -= 0.3;
          ring.push({ ox, oy, score });
        }
      }
      ring.sort((a, b) => a.score - b.score);
      for (const c of ring) {
        const nx = (tx + c.ox) * T + T / 2;
        const ny = (ty + c.oy) * T + T / 2;
        if (nx < pad || ny < pad || nx > map.w * T - pad || ny > map.h * T - pad) continue;
        if (G.canStand(nx, ny, 8)) return { x: nx, y: ny };
      }
    }
    // Último recurso: continua válido para não travar o fluxo do jogo.
    return { x: bx, y: by };
  };

  // Limpa entradas e estados de deslocamento após morte/teleporte.
  G.resetControlState = function () {
    G.keys = {};
    G.touch.x = 0;
    G.touch.y = 0;
    G.moving = false;
    G.manualMoving = false;
    G.moveTo = null;
    G.autoChase = false;
    G.autoLoot = null;
    G.autoLootT = 0;
    G.autoLootSkip = null;
    G.autoChaseT = 0;
    G.autoChasePos = null;
    G.resetNav();
    G.walkAnim = 0;
    G.attackAnim = 0;
    G.attackTimer = 0;
    G.target = null;
    G.dodgeT = 0;
    G.dodgeCd = 0;
    G.invulnT = 0;
    G.staminaDelay = 0;
    G.telegraphs = [];
    G.statuses = {};
    G.statusRecent = {};
    if (G.autoHunt && G.setAutoHunt) G.setAutoHunt(false, true);
    const stick = A.$('#stick');
    if (stick) stick.style.transform = '';
  };

  G.teleportPlayer = function (x, y) {
    const p = G.player;
    if (!p) return null;
    const spot = G.safeSpawn(x, y);
    p.x = spot.x;
    p.y = spot.y;
    G.resetControlState();
    G.snapCamera();
    return spot;
  };

  G.updateCamera = function (dt) {
    const p = G.player;
    const map = A.world.active;
    const mw = map.w * T, mh = map.h * T;
    let tx = p.x - VW / 2, ty = p.y - VH / 2;
    tx = A.clamp(tx, 0, Math.max(0, mw - VW));
    ty = A.clamp(ty, 0, Math.max(0, mh - VH));
    const k = Math.min(1, dt * 7);
    G.cam.x += (tx - G.cam.x) * k;
    G.cam.y += (ty - G.cam.y) * k;
    if (Math.abs(G.cam.x - tx) < 0.6) G.cam.x = tx;
    if (Math.abs(G.cam.y - ty) < 0.6) G.cam.y = ty;
  };

  G.snapCamera = function () {
    const p = G.player;
    if (!p) return;
    const map = A.world.active;
    G.cam.x = A.clamp(p.x - VW / 2, 0, Math.max(0, map.w * T - VW));
    G.cam.y = A.clamp(p.y - VH / 2, 0, Math.max(0, map.h * T - VH));
  };

  G.updateRegen = function (dt) {
    const p = G.player;
    if (G.dead) return;
    const zone = A.world.isDungeon() ? 'cripta' : A.world.zoneAt(Math.floor(p.x / T), Math.floor(p.y / T));
    const safe = A.ZONES[zone] && A.ZONES[zone].safe;
    if (G.combat <= 0) {
      if (safe) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.035 * dt);
      else p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.004 * dt);
      p.mp = Math.min(p.maxMp, p.mp + p.maxMp * (safe ? 0.03 : 0.012) * dt);
    }
  };

  G.updateBuff = function () {};
  G.updateBuffs = function (dt) {
    Object.keys(G.buffs).forEach(k => {
      const b = G.buffs[k];
      b.t -= dt;
      if (b.t <= 0) delete G.buffs[k];
    });
    if (G.buffs.shield && G.buffs.shield.absorb == null) G.buffs.shield.absorb = G.player.maxHp * 0.3;
  };

  G.getBuffs = function () {
    const icons = { atk: '⚔', shield: '🛡', haste: '💨', bless: '✨' };
    const buffs = Object.keys(G.buffs).map(k => ({
      key: k, icon: icons[k] || '✦', label: G.buffs[k].label || k, t: G.buffs[k].t
    })).filter(b => b.t > 0);
    const badIcons = { slow: '🐌', burn: '🔥', poison: '☠', weaken: '🔻' };
    const badNames = { slow: 'Lentidão', burn: 'Queimadura', poison: 'Veneno', weaken: 'Fraqueza' };
    const bad = Object.keys(G.statuses || {}).map(k => ({
      key: k, icon: badIcons[k] || '⚠', label: badNames[k] || k,
      t: G.statuses[k].t, bad: true
    })).filter(b => b.t > 0);
    return buffs.concat(bad);
  };

  /* ------------------------------------------------------------------ */
  /* VIGOR, ESQUIVA E STATUS                                             */
  /* ------------------------------------------------------------------ */
  G.DODGE = { cost: 25, dur: 0.18, speed: 660, cd: 0.90, iframes: 0.22, regen: 28, regenDelay: 0.70 };

  G.staminaMax = function (p) {
    p = p || G.player;
    return Math.max(1, (p && p.staminaMax) || 100);
  };

  G.moveSpeedMult = function () {
    const slow = G.statuses && G.statuses.slow;
    if (!slow || slow.t <= 0) return 1;
    return A.clamp(1 - (slow.power || 0.35), 0.35, 1);
  };

  G.applyPlayerStatus = function (kind, dur, power, label) {
    const p = G.player;
    if (!p || G.dead) return false;
    G.statusRecent = G.statusRecent || {};
    // Retorno decrescente: reaplicar o mesmo controle em sequência dura menos,
    // em vez de permitir lentidão permanente.
    let finalDur = dur;
    if (G.statuses[kind]) finalDur = Math.max(G.statuses[kind].t || 0, dur) * 0.65;
    else if ((G.statusRecent[kind] || 0) > G.time) finalDur = dur * 0.6;
    G.statusRecent[kind] = G.time + 6;
    const cur = G.statuses[kind] || {};
    G.statuses[kind] = {
      t: Math.max(cur.t || 0, finalDur),
      power: Math.max(cur.power || 0, power || 0),
      dmg: Math.max(cur.dmg || 0, power && kind !== 'slow' ? power : 0),
      tick: cur.tick == null ? 1 : cur.tick
    };
    const names = { slow: 'Lentidão', burn: 'Queimadura', poison: 'Veneno', weaken: 'Fraqueza' };
    G.floatText(p.x, p.y - 58, label || names[kind] || kind, '#ffb36b');
    A.audio.play('status');
    return true;
  };

  G.statusDamage = function (amount, color, label) {
    const p = G.player;
    if (!p || G.dead) return;
    const dmg = Math.max(1, Math.round(amount));
    p.hp -= dmg;
    G.floatText(p.x + A.rand(-6, 6), p.y - 44, (label ? label + ' ' : '') + '−' + dmg, color || '#ff9b5a');
    if (p.hp <= 0) { p.hp = 0; G.die(); }
  };

  G.updateStatuses = function (dt) {
    const p = G.player;
    if (!p) return;
    Object.keys(G.statuses).forEach(k => {
      const s = G.statuses[k];
      s.t -= dt;
      if (k === 'burn' || k === 'poison') {
        s.tick -= dt;
        if (s.tick <= 0) {
          s.tick += 1;
          const base = k === 'burn' ? Math.max(2, p.maxHp * 0.012) : Math.max(1, p.maxHp * 0.008);
          G.statusDamage(base * (s.dmg || 1), k === 'burn' ? '#ff9b5a' : '#9be36f', k === 'burn' ? '🔥' : '☠');
          if (p.hp <= 0) return;
        }
      }
      if (s.t <= 0) delete G.statuses[k];
    });
  };

  G.tryDodge = function () {
    const p = G.player;
    if (!p || G.dead || G.trans) return false;
    if (G.dodgeT > 0) return false;
    if (G.dodgeCd > 0) { A.audio.play('error'); return false; }
    if (p.stamina < G.DODGE.cost) {
      A.ui.toast('Vigor insuficiente para esquivar.', 'erro');
      A.audio.play('error');
      return false;
    }
    let dx = 0, dy = 0;
    if (G.keys.w || G.keys.arrowup) dy -= 1;
    if (G.keys.s || G.keys.arrowdown) dy += 1;
    if (G.keys.a || G.keys.arrowleft) dx -= 1;
    if (G.keys.d || G.keys.arrowright) dx += 1;
    dx += G.touch.x; dy += G.touch.y;
    let mag = Math.hypot(dx, dy);
    if (mag < 0.15 && G.mouse.active) {
      dx = G.mouse.wx - p.x;
      dy = G.mouse.wy - p.y;
      mag = Math.hypot(dx, dy);
    }
    if (mag < 0.15) {
      const face = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }][G.dir] || { x: 0, y: 1 };
      dx = face.x; dy = face.y; mag = 1;
    }
    const dirs = [
      { x: dx / mag, y: dy / mag },
      { x: dy / mag, y: -dx / mag },
      { x: -dy / mag, y: dx / mag }
    ];
    const safe = dirs.find(d => G.canStand(p.x + d.x * 14, p.y + d.y * 14, 7));
    if (!safe) {
      A.ui.toast('Sem espaço para esquivar.', 'erro');
      A.audio.play('error');
      return false;
    }
    return G.startDodge(safe.x, safe.y, false);
  };

  G.startDodge = function (dx, dy, auto) {
    const p = G.player;
    if (!p || G.dead || G.trans) return false;
    if (G.dodgeT > 0 || G.dodgeCd > 0 || p.stamina < G.DODGE.cost) return false;
    const mag = Math.hypot(dx, dy) || 1;
    G.dodgeDir = { x: dx / mag, y: dy / mag };
    p.stamina = Math.max(0, p.stamina - G.DODGE.cost);
    G.staminaDelay = G.DODGE.regenDelay;
    G.dodgeT = G.DODGE.dur;
    G.dodgeCd = G.DODGE.cd;
    G.invulnT = G.DODGE.iframes;
    G.attackTimer = Math.max(G.attackTimer, 0.08);
    if (!auto) {
      if (G.questTrack) G.cancelQuestTrack(true, false);
      if (G.autoHunt) G.setAutoHunt(false, true);
      G.moveTo = null;
      G.autoChase = false;
      G.resetNav();
    }
    G.spawnEffect({ kind: 'ring', x: p.x, y: p.y, r: 8, maxR: 44, t: 0, dur: 0.3, color: '#9fe8ff' });
    A.audio.play('dodge');
    return true;
  };

  G.updateDodge = function (dt) {
    const p = G.player;
    if (!p) return;
    G.dodgeCd = Math.max(0, G.dodgeCd - dt);
    G.invulnT = Math.max(0, G.invulnT - dt);
    if (G.dodgeT > 0) {
      G.dodgeT = Math.max(0, G.dodgeT - dt);
      const step = G.DODGE.speed * dt;
      const nx = p.x + G.dodgeDir.x * step;
      const ny = p.y + G.dodgeDir.y * step;
      let moved = false;
      if (G.canStand(nx, ny, 7)) { p.x = nx; p.y = ny; moved = true; }
      else {
        // Desliza no eixo livre em vez de atravessar a parede ou travar.
        if (G.canStand(nx, p.y, 7)) { p.x = nx; moved = true; }
        if (G.canStand(p.x, ny, 7)) { p.y = ny; moved = true; }
      }
      p.x = A.clamp(p.x, 12, A.world.active.w * T - 12);
      p.y = A.clamp(p.y, 12, A.world.active.h * T - 12);
      if (!moved) G.dodgeT = 0;
      if (Math.random() < 0.55) {
        G.spawnEffect({ kind: 'spark', x: p.x + A.rand(-6, 6), y: p.y - A.rand(6, 26), t: 0, dur: 0.25, color: '#9fe8ff' });
      }
      G.moving = true;
      G.manualMoving = true;
    } else {
      G.staminaDelay = Math.max(0, G.staminaDelay - dt);
      if (G.staminaDelay <= 0 && p.stamina < G.staminaMax(p)) {
        p.stamina = Math.min(G.staminaMax(p), p.stamina + G.DODGE.regen * dt);
      }
    }
  };

  G.autoDodge = function () {
    const p = G.player;
    if (!p || G.dead || G.trans || G.dodgeT > 0 || G.dodgeCd > 0) return false;
    if (p.stamina < G.DODGE.cost) return false;
    let danger = null, soonest = 1e9;
    (G.telegraphs || []).forEach(tg => {
      if (tg.source !== 'enemy') return;
      const left = tg.windup - tg.t;
      if (left < 0 || left > 0.3) return;
      if (!G.pointInTelegraph(tg, p.x, p.y - 10)) return;
      if (left < soonest) { soonest = left; danger = tg; }
    });
    if (!danger) return false;
    let ax = p.x - danger.x, ay = p.y - danger.y;
    let mag = Math.hypot(ax, ay);
    if (mag < 1) {
      ax = -G.dodgeDir.y; ay = G.dodgeDir.x; mag = 1;
    }
    // Se a fuga óbvia estiver bloqueada, tenta as perpendiculares.
    const dirs = [
      { x: ax / mag, y: ay / mag },
      { x: ay / mag, y: -ax / mag },
      { x: -ay / mag, y: ax / mag }
    ];
    const safe = dirs.find(d => G.canStand(p.x + d.x * 16, p.y + d.y * 16, 7));
    if (!safe) return false;
    return G.startDodge(safe.x, safe.y, true);
  };

  G.updateCooldowns = function (dt) {
    for (let i = 0; i < G.skillCooldowns.length; i++) G.skillCooldowns[i] = Math.max(0, G.skillCooldowns[i] - dt);
  };

  /* ------------------------------------------------------------------ */
  /* TELEGRAFIA DE ATAQUES (círculo, cone e linha)                      */
  /* ------------------------------------------------------------------ */
  G.pointInTelegraph = function (tg, x, y) {
    const dx = x - tg.x, dy = y - tg.y;
    const d = Math.hypot(dx, dy);
    if (tg.shape === 'circle') return d <= tg.r && d >= (tg.inner || 0);
    if (tg.shape === 'cone') {
      if (d > tg.len || d < (tg.inner || 0)) return false;
      if (d < 1) return true;
      const ang = Math.atan2(dy, dx);
      const diff = Math.abs(Math.atan2(Math.sin(ang - tg.ang), Math.cos(ang - tg.ang)));
      return diff <= (tg.spread || 1.2) / 2;
    }
    if (tg.shape === 'line') {
      const ux = Math.cos(tg.ang), uy = Math.sin(tg.ang);
      const proj = dx * ux + dy * uy;
      if (proj < 0 || proj > tg.len) return false;
      const perp = Math.abs(dx * -uy + dy * ux);
      return perp <= (tg.width || 40) / 2;
    }
    return false;
  };

  G.castTelegraph = function (opts) {
    const tg = Object.assign({
      shape: 'circle', x: 0, y: 0, r: 90, inner: 0,
      ang: 0, spread: 1.2, len: 120, width: 40,
      windup: 0.8, color: '#ff5a5a', label: '',
      source: 'enemy', atk: 0, mult: 1, status: null,
      sound: true, t: 0, onResolve: null
    }, opts || {});
    tg.t = 0;
    G.telegraphs.push(tg);
    if (tg.sound) A.audio.play('warn');
    return tg;
  };

  G.resolveTelegraph = function (tg) {
    const p = G.player;
    const hit = !!(p && !G.dead && G.pointInTelegraph(tg, p.x, p.y - 10));
    if (hit) {
      if (tg.atk > 0) G.damagePlayer(tg.atk, tg.mult || 1, tg);
      if (tg.status && p && !G.dead && p.hp > 0) {
        G.applyPlayerStatus(tg.status.kind, tg.status.dur, tg.status.power, tg.status.label);
      }
    }
    if (tg.onResolve) tg.onResolve(tg, hit);
  };

  G.updateTelegraphs = function (dt) {
    for (let i = G.telegraphs.length - 1; i >= 0; i--) {
      const tg = G.telegraphs[i];
      tg.t += dt;
      if (tg.t < tg.windup) continue;
      G.telegraphs.splice(i, 1);
      G.resolveTelegraph(tg);
    }
  };

  G.drawTelegraphs = function (ctx) {
    (G.telegraphs || []).forEach(tg => {
      const k = A.clamp(tg.t / Math.max(0.001, tg.windup), 0, 1);
      const pulse = 0.10 + k * 0.14 + 0.035 * Math.sin(tg.t * 22);
      ctx.save();
      ctx.fillStyle = tg.color;
      ctx.strokeStyle = tg.color;
      if (tg.shape === 'circle') {
        ctx.globalAlpha = pulse;
        ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 0.6 + k * 0.3;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r, 0, 6.283); ctx.stroke();
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r, -1.5708, -1.5708 + 6.283 * k); ctx.stroke();
      } else if (tg.shape === 'cone') {
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.moveTo(tg.x, tg.y);
        ctx.arc(tg.x, tg.y, tg.len, tg.ang - tg.spread / 2, tg.ang + tg.spread / 2);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 0.6 + k * 0.3;
        ctx.lineWidth = 2; ctx.stroke();
      } else if (tg.shape === 'line') {
        ctx.translate(tg.x, tg.y);
        ctx.rotate(tg.ang);
        ctx.globalAlpha = pulse;
        ctx.fillRect(0, -tg.width / 2, tg.len, tg.width);
        ctx.globalAlpha = 0.6 + k * 0.3;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, -tg.width / 2, tg.len, tg.width);
      }
      ctx.globalAlpha = 1;
      if (tg.label && k > 0.12) {
        ctx.font = 'bold 11px Segoe UI';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,.85)';
        ctx.fillStyle = tg.color;
        const ly = tg.shape === 'circle' ? tg.y - tg.r - 8 : tg.y - 14;
        ctx.strokeText(tg.label, tg.x, ly);
        ctx.fillText(tg.label, tg.x, ly);
      }
      ctx.restore();
    });
  };

  /* ------------------------------------------------------------------ */
  /* AUTOMAÇÃO (estilo Mir4: auto-caça, auto-habilidade e auto-coleta)   */
  /* ------------------------------------------------------------------ */
  G.setAutoHunt = function (on, silent) {
    const p = G.player;
    if (on && (!p || G.dead || G.trans)) return;
    const next = !!on;
    if (G.autoHunt === next) {
      if (A.ui.updateAutoHunt) A.ui.updateAutoHunt();
      return;
    }
    G.autoHunt = next;
    G.autoChase = false;
    G.autoLoot = null;
    G.autoLootT = 0;
    G.autoLootSkip = null;
    G.autoChaseT = 0;
    G.autoChasePos = null;
    G.autoSkillTimer = 0.65;
    G.autoPotionTimer = 0;
    G.resetNav();
    if (next) {
      G.moveTo = null;
      if (!silent) {
        A.ui.toast('Auto-caça ativada. R desliga.', 'ok');
        A.ui.addChat('sistema', null, 'Automação ativada: alvo, perseguição, habilidades e coleta automáticos.', 'good');
      }
    } else if (!silent) {
      A.ui.toast('Auto-caça desligada.', 'ok');
      A.ui.addChat('sistema', null, 'Automação desativada. Controle manual restaurado.', null);
    }
    if (A.ui.updateAutoHunt) A.ui.updateAutoHunt();
    A.ui.updateHUD(true);
  };

  G.toggleAutoHunt = function () {
    // R também encerra o rastreamento de missão em andamento.
    if (G.questTrack) G.cancelQuestTrack(true, false);
    G.setAutoHunt(!G.autoHunt);
  };

  G.autoPickTarget = function (rad) {
    const p = G.player;
    if (!p) return null;
    let best = null, bs = 1e9;
    G.monsters.forEach(m => {
      if (m.dead || m.hp <= 0) return;
      if (m.autoSkipUntil && G.time < m.autoSkipUntil) return;
      const d = Math.hypot(m.x - p.x, m.y - p.y);
      if (d > rad) return;
      if (G.questFocus && G.questFocus.type && m.type !== G.questFocus.type) {
        // Durante uma missão de caça, não sai perseguindo outra espécie.
        // Ainda revida contra quem já está atacando corpo a corpo.
        if (!(m.aggroT > 0 && d < 260)) return;
      }
      // Prioriza quem já está atacando e evita chefes muito acima do nível.
      let score = d + Math.max(0, m.level - p.level) * 24;
      if (m.aggroT > 0) score -= 90;
      if (G.questFocus && m.type === G.questFocus.type) score -= 700;
      if (m.boss && m.level > p.level + 3) score += 500;
      if (score < bs) { bs = score; best = m; }
    });
    return best;
  };

  G.autoUseSkills = function () {
    const p = G.player;
    if (!p || !G.autoHunt || G.autoSkillTimer > 0) return;
    const t = (G.target && !G.target.dead && G.target.hp > 0) ? G.target : null;
    const dist = t ? G.distTo(t) : 1e9;
    const hpPct = p.hp / Math.max(1, p.maxHp);
    const skills = A.SKILLS[p.cls] || [];
    for (let i = 0; i < skills.length; i++) {
      const s = skills[i];
      if (G.skillCooldowns[i] > 0 || p.mp < s.mp) continue;
      let use = false;
      if (s.kind === 'heal') {
        use = hpPct < (s.shield ? 0.55 : 0.7);
      } else if (s.kind === 'buff') {
        if (!t || G.buffs[s.buff]) continue;
        if (s.buff === 'haste') use = hpPct < 0.55;
        else use = true;
      } else if (t) {
        if (s.kind === 'aoe') use = dist <= (s.radius || 100) + 12;
        else if (s.kind === 'dash') use = dist > 70 && dist < 260;
        else if (s.kind === 'chain') use = dist <= (s.radius || 220);
        else if (s.kind === 'ground' || s.kind === 'trap') use = dist <= Math.max(G.attackRange() + 80, 220);
        else if (s.kind === 'projectile') use = dist <= Math.max(G.attackRange() + 60, 240);
        else use = dist <= G.attackRange() + 40;
      }
      if (use) {
        G.useSkill(i);
        G.autoSkillTimer = 0.95;
        break;
      }
    }
  };

  G.updateAutoPotions = function (dt) {
    const p = G.player;
    if (!p || G.dead || G.trans) return;
    const hpOn = !!G.settings.autoPotionHp;
    const mpOn = !!G.settings.autoPotionMp;
    const hpPct = G.settings.autoPotionHpPct;
    const mpPct = G.settings.autoPotionMpPct;
    if (!hpOn && !mpOn) return;
    const hpReady = hpOn && A.sys.countItem(p, 'potion_hp') > 0 && (p.hp / p.maxHp) <= (hpPct / 100);
    const mpReady = mpOn && A.sys.countItem(p, 'potion_mp') > 0 && (p.mp / p.maxMp) <= (mpPct / 100);
    G.autoPotionTimer = Math.max(0, G.autoPotionTimer - dt);
    if (!hpReady && !mpReady) return;
    if (G.autoPotionTimer > 0) return;
    G.autoPotionTimer = 2.2;
    if (hpReady) G.usePotion('potion_hp');
    else if (mpReady) G.usePotion('potion_mp');
  };

  G.updateAutomation = function (dt) {
    if (!G.autoHunt) return;
    const p = G.player;
    if (!p || G.dead || G.trans) return;
    G.autoSkillTimer = Math.max(0, G.autoSkillTimer - dt);

    // AUTO também usa a esquiva quando uma telegrafia vermelha vai acertar.
    G.autoDodge();

    let t = G.target;
    if (t && (t.dead || t.hp <= 0)) { G.target = null; G.autoChase = false; t = null; }

    if (!t) {
      if (p.inventory.length >= p.bagCap) {
        G.autoLoot = null; G.autoLootSkip = null; G.moveTo = null;
        return;
      }
      let loot = null, ld = 1e9;
      G.loot.forEach(l => {
        if (l === G.autoLootSkip) return;
        if (G.time - l.t < 0.45) return;
        const d = Math.hypot(p.x - l.x, p.y - l.y);
        if (d < ld && d < 360) { ld = d; loot = l; }
      });
      if (loot) {
        if (G.autoLoot !== loot) { G.autoLoot = loot; G.autoLootT = 0; }
        G.autoLootT += dt;
        // Mesmo com pathfinding, um item inalcançável (ou mochila cheia) não
        // pode prender a automação para sempre. Abandona depois de 5 s.
        if (G.autoLootT > 5 || (ld <= 28 && G.autoLootT > 1.5)) {
          G.autoLootSkip = loot;
          G.autoLoot = null;
          G.autoLootT = 0;
          G.moveTo = null;
          return;
        }
        G.autoChase = false;
        G.moveTo = null;
        return;
      }
      G.autoLoot = null;
      const m = G.autoPickTarget(G.questFocus ? 2200 : 860);
      if (m) {
        G.target = m;
        G.autoChase = true;
        G.autoChaseT = 0;
        G.autoChasePos = { x: p.x, y: p.y };
        G.moveTo = null;
      } else {
        G.autoChase = false;
        G.autoChaseT = 0;
        G.autoChasePos = null;
        G.moveTo = null;
      }
      return;
    }

    const d = G.distTo(t);
    if (d > 920) {
      G.target = null;
      G.autoChase = false;
      G.autoChaseT = 0;
      G.autoChasePos = null;
      return;
    }
    const chasing = d > G.attackRange() - 4;
    if (chasing) {
      if (!G.autoChasePos || Math.hypot(p.x - G.autoChasePos.x, p.y - G.autoChasePos.y) > 10) {
        G.autoChasePos = { x: p.x, y: p.y };
        G.autoChaseT = 0;
      } else {
        G.autoChaseT += dt;
        // Sem pathfinding: se o alvo ficar atrás de um obstáculo, abandona
        // depois de alguns segundos em vez de empurrar a parede para sempre.
        if (G.autoChaseT > 3.2) {
          t.autoSkipUntil = G.time + 10;
          G.target = null;
          G.autoChase = false;
          G.autoChaseT = 0;
          G.autoChasePos = null;
          G.moveTo = null;
          return;
        }
      }
    } else {
      G.autoChaseT = 0;
      G.autoChasePos = null;
    }
    G.autoChase = chasing;
    G.moveTo = null;
    G.autoUseSkills();
  };

  G.updateAutoTarget = function (dt) {
    const p = G.player;
    if (!p || G.dead || G.trans) return;
    const t = G.target;
    if (!t) return;
    if (t.dead || t.hp <= 0) { G.target = null; G.autoChase = false; return; }
    if (!G.autoHunt && !G.autoChase) return;
    const d = G.distTo(t);
    if (d <= G.attackRange() + 18) {
      if (G.attackTimer <= 0) G.basicAttack(t, false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* RASTREIO DE MISSÕES (estilo Mir4: clicar e ir até o objetivo)      */
  /* ------------------------------------------------------------------ */
  G.questZoneFor = function (q) {
    if (!q) return null;
    if (q.zone) return q.zone;
    if (q.dungeon) return q.dungeon;
    const byTarget = {
      slime: 'campos', wolf: 'campos', crab: 'costa', bandit: 'costa',
      crab_king: 'costa', goblin: 'floresta', treant: 'floresta', boss_treant: 'floresta',
      spider: 'floresta', skeleton: 'cripta', golem: 'ruinas', wraith: 'pantano',
      witch: 'pantano', boss_lodo: 'pantano', herb: 'campos', ore: 'ruinas', crystal: 'ruinas',
      boss_rei: 'cripta', frostwolf: 'picos', icegolem: 'picos', yeti: 'picos',
      frostwitch: 'picos', boss_ice: 'picos', boss_rainha: 'picos',
      eclipse_knight: 'cidadela', eclipse_mage: 'cidadela',
      boss_cidadela: 'cidadela', boss_eclipse: 'cidadela'
    };
    return byTarget[q.target] || null;
  };

  G.questNpcPoint = function (id) {
    const npc = A.NPCS.find(n => n.id === id) || A.NPCS.find(n => n.id === 'aldric');
    if (!npc) return null;
    return { x: npc.x * T + 16, y: npc.y * T + 18, kind: 'npc', npc, zone: 'vila' };
  };

  G.questPortalPoint = function (dungeonId) {
    const id = dungeonId || 'cripta';
    const portal = (A.world.overworld.props || []).find(p => p.portal === id);
    if (portal) {
      const def = A.DUNGEONS[id] || {};
      return { x: portal.px, y: portal.py, kind: 'portal', zone: def.exitZone || 'ruinas', dungeon: id };
    }
    if (id === 'cidadela') return { x: 182 * T + 16, y: 73 * T + 16, kind: 'portal', zone: 'picos', dungeon: id };
    return { x: 75 * T + 16, y: 86 * T + 24, kind: 'portal', zone: 'ruinas', dungeon: 'cripta' };
  };

  G.questGoal = function (track) {
    const p = G.player, q = track && track.data;
    if (!p || !q) return null;
    if (track.phase === 'turnin' || q.type === 'talk') {
      // Missões secundárias são entregues no Quadro de Recompensas.
      const giver = q.giver || (q.id && q.id.startsWith('s_') ? 'quadro' : 'aldric');
      return G.questNpcPoint(giver);
    }

    const map = A.world.active;
    const inDungeon = A.world.isDungeon();
    const fixedZone = G.questZoneFor(q);

    if (q.type === 'explore') {
      const w = A.WAYPOINTS.find(wp => wp.id === q.target || wp.zone === q.target);
      if (w) return { x: w.x * T + 16, y: w.y * T + 16, kind: 'waypoint', zone: w.zone };
      return { x: Math.floor(A.MW / 2) * T, y: Math.floor(A.MH / 2) * T, kind: 'explore', zone: q.target };
    }

    if (q.type === 'collect') {
      // Materiais que só caem de monstros (Núcleo Glacial, Fragmento do
      // Eclipse) apontam para a espécie que os dropa, não para um nó do mapa.
      const dropTypes = Object.keys(A.MONSTERS).filter(k =>
        (A.MONSTERS[k].drops || []).indexOf(q.target) >= 0);
      if (dropTypes.length) {
        let dm = null, dd = 1e9;
        G.monsters.forEach(m => {
          if (m.dead || m.hp <= 0 || dropTypes.indexOf(m.type) < 0) return;
          const d = Math.hypot(m.x - p.x, m.y - p.y);
          if (d < dd) { dd = d; dm = m; }
        });
        if (dm) return { x: dm.x, y: dm.y, kind: 'monster', monster: dm, zone: fixedZone };
      }
      const pick = (arr) => {
        let best = null, bd = 1e9;
        arr.forEach(n => {
          const d = Math.hypot(p.x - (n.x * T + 16), p.y - (n.y * T + 22));
          if (d < bd) { bd = d; best = n; }
        });
        return best;
      };
      let nodes = (map.nodes || []).filter(n => n.type === q.target);
      if (!inDungeon && fixedZone) {
        const z = nodes.filter(n => n.zone === fixedZone);
        if (z.length) nodes = z;
      }
      // Prefere qualquer nó ativo; nós inativos do zone alvo são só o último
      // recurso (eles renascem). Sem isso o rastreio podia parar ao lado de
      // uma erva já colhida enquanto havia outra disponível na região vizinha.
      let best = pick(nodes.filter(n => n.active));
      if (!best && !inDungeon) best = pick((map.nodes || []).filter(n => n.type === q.target && n.active));
      if (!best) best = pick(nodes);
      if (best) return { x: best.x * T + 16, y: best.y * T + 22, kind: 'node', node: best, zone: best.zone || fixedZone };
      if (inDungeon) {
        let all = (A.world.overworld.nodes || []).filter(n => n.type === q.target);
        if (fixedZone) {
          const z = all.filter(n => n.zone === fixedZone);
          if (z.length) all = z;
        }
        const fallback = pick(all.filter(n => n.active)) || pick(all);
        if (fallback) return { x: fallback.x * T + 16, y: fallback.y * T + 22, kind: 'node', node: fallback, zone: fallback.zone || fixedZone };
      }
      return null;
    }

    // Caçadas, masmorra e chefe.
    const dungeonId = q.dungeon || (A.MONSTERS[q.target] && (A.DUNGEONS[q.target] ? q.target : null));
    const isDungeonTarget = !!q.dungeon || q.target === 'skeleton' || q.target === 'boss_rei' ||
      q.target === 'eclipse_knight' || q.target === 'eclipse_mage' || q.target === 'boss_cidadela' || q.target === 'boss_eclipse';
    const activeDungeonId = A.world.activeDungeonId || (A.world.isDungeon() ? A.world.active.id : null);
    if (!inDungeon && isDungeonTarget) {
      return G.questPortalPoint(q.dungeon || (q.target === 'eclipse_knight' || q.target === 'eclipse_mage' || q.target === 'boss_cidadela' || q.target === 'boss_eclipse' ? 'cidadela' : 'cripta'));
    }
    if (inDungeon && q.dungeon && activeDungeonId !== q.dungeon) {
      G.leaveDungeon(true);
      return G.questPortalPoint(q.dungeon);
    }

    let bestM = null, md = 1e9;
    G.monsters.forEach(m => {
      if (m.dead || m.hp <= 0 || m.type !== q.target) return;
      const d = Math.hypot(m.x - p.x, m.y - p.y);
      if (d < md) { md = d; bestM = m; }
    });
    if (bestM) {
      const mzone = inDungeon ? (activeDungeonId || 'cripta') : A.world.zoneAt(Math.floor(bestM.x / T), Math.floor(bestM.y / T));
      if (inDungeon || !fixedZone || mzone === fixedZone) {
        return { x: bestM.x, y: bestM.y, kind: 'monster', monster: bestM, zone: mzone };
      }
    }

    let spots = (map.spots || []).filter(s => s.type === q.target);
    if (!spots.length && inDungeon) spots = (A.world.overworld.spots || []).filter(s => s.type === q.target);
    if (!inDungeon && fixedZone) {
      const z = spots.filter(s => s.zone === fixedZone);
      if (z.length) spots = z;
    }
    let bestS = null, sd = 1e9;
    spots.forEach(s => {
      const x = s.x * T + T / 2, y = s.y * T + T / 2;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < sd) { sd = d; bestS = s; }
    });
    if (bestS) {
      return { x: bestS.x * T + T / 2, y: bestS.y * T + T / 2, kind: 'spot', spot: bestS, zone: bestS.zone };
    }
    return null;
  };

  G.refreshQuestGoal = function (track) {
    track = track || G.questTrack;
    if (!track) return null;
    const goal = G.questGoal(track);
    track.goal = goal;
    track.goalT = G.time;
    if (!goal) {
      track.x = null; track.y = null; track.kind = null;
      return null;
    }
    track.x = goal.x; track.y = goal.y; track.kind = goal.kind; track.zone = goal.zone || null;
    track.node = goal.node || null; track.monster = goal.monster || null;
    return goal;
  };

  G.questTravel = function (track, zone) {
    const p = G.player;
    if (!track || !zone || !p || G.trans || A.world.isDungeon() || zone === 'cripta') return false;
    if (!p.waypoints || !p.waypoints[zone]) return false;
    const cur = A.world.zoneAt(Math.floor(p.x / T), Math.floor(p.y / T));
    if (cur === zone) return false;
    track.traveled = track.traveled || {};
    if (track.traveled[zone]) return false;
    track.traveled[zone] = true;
    G.travel(zone);
    return true;
  };

  G.cancelQuestTrack = function (silent, stopAuto) {
    if (!G.questTrack) return;
    G.questTrack = null;
    G.questFocus = null;
    G.resetNav();
    if (stopAuto && G.autoHunt) G.setAutoHunt(false, true);
    if (!silent) A.ui.toast('Rastreamento encerrado.', 'ok');
  };

  G.trackQuest = function (id, daily) {
    const p = G.player;
    if (!p) return;
    const q = A.sys.questById(id);
    const dl = p.dailies && p.dailies.list ? p.dailies.list.find(x => x.id === id) : null;
    const st = p.quests[id];
    // O mesmo id pode existir como missão do Quadro e como diária. O botão
    // "Ir até" da diária passa daily=true para rastrear o progresso correto.
    const wantDaily = daily === true;
    const useDaily = !!(dl && (wantDaily || !st));
    if (wantDaily && !dl) {
      A.ui.openWin('quests');
      return;
    }
    if (!q || (useDaily ? (!dl || dl.claimed) : (!st || st.claimed))) {
      A.ui.openWin('quests');
      return;
    }
    if (A.ui.isWinOpen('quests')) A.ui.closeWin('quests');
    const pr = useDaily
      ? { cur: dl.progress, need: q.need, done: dl.progress >= q.need }
      : A.sys.questProgress(p, id);
    if (useDaily && pr.done) {
      A.ui.openWin('quests');
      A.ui.toast('Diária pronta para resgatar: ' + q.title, 'quest');
      return;
    }
    const combat = !pr.done && (q.type === 'kill' || q.type === 'dungeon' || q.type === 'boss');
    G.questFocus = combat ? { type: q.target, id } : null;
    G.questTrack = {
      id, data: q, daily: useDaily, phase: useDaily ? 'travel' : (pr.done ? 'turnin' : 'travel'),
      type: q.type, target: q.target, giver: q.giver, traveled: {}, goal: null,
      x: null, y: null, goalT: 0, spotWait: 0
    };
    G.target = null;
    G.autoChase = false;
    G.autoLoot = null;
    G.autoLootT = 0;
    G.moveTo = null;
    G.resetNav();
    if (combat) G.setAutoHunt(true, true);
    else G.setAutoHunt(false, true);
    G.refreshQuestGoal(G.questTrack);
    if (G.questTrack && G.questTrack.goal && G.questTrack.goal.zone) {
      G.questTravel(G.questTrack, G.questTrack.goal.zone);
    }
    A.ui.updateHUD(true);
    A.ui.toast('Rastreando: ' + q.title, 'quest');
    A.ui.addChat('sistema', null, 'Rastreamento ativado: ' + q.title + '.', null);
  };

  G.updateQuestTrack = function (dt) {
    const tr = G.questTrack, p = G.player;
    if (!tr || !p || G.dead || G.trans) return;
    const st = p.quests[tr.id];
    const dl = tr.daily && p.dailies && p.dailies.list
      ? p.dailies.list.find(x => x.id === tr.id) : null;
    if (!tr.data || (tr.daily ? (!dl || dl.claimed) : (!st || st.claimed))) {
      G.cancelQuestTrack(true, true);
      return;
    }

    const pr = tr.daily
      ? { cur: dl.progress, need: tr.data.need, done: dl.progress >= tr.data.need }
      : A.sys.questProgress(p, tr.id);
    if (pr.done && tr.phase !== 'turnin') {
      if (tr.daily) {
        G.cancelQuestTrack(true, true);
        // Caçadas diárias de esqueleto acontecem na Cripta; ao concluir,
        // devolve o jogador ao mundo aberto para não ficar parado lá dentro.
        if (A.world.isDungeon()) G.leaveDungeon(true);
        A.ui.toast('Diária pronta: ' + tr.data.title + ' — resgate em Missões.', 'quest');
        A.ui.openWin('quests');
        A.ui.updateHUD(true);
        return;
      }
      tr.phase = 'turnin';
      tr.goal = null;
      G.questFocus = null;
      if (G.autoHunt) G.setAutoHunt(false, true);
      G.refreshQuestGoal(tr);
      A.ui.toast('Missão pronta: ' + tr.data.title, 'quest');
      A.ui.updateHUD(true);
    }

    const combat = !pr.done && (tr.type === 'kill' || tr.type === 'dungeon' || tr.type === 'boss');
    const hasLiveTarget = G.monsters.some(m => !m.dead && m.hp > 0 && m.type === tr.target);
    if (combat && !hasLiveTarget) {
      // Sem alvo vivo: para o personagem e aguarda o spawn em vez de vaguear.
      G.setAutoHunt(false, true);
      G.moveTo = null; G.manualMoving = false; G.autoChase = false; G.autoChaseT = 0;
      if (!tr.spotWait) tr.spotWait = G.time + 2.2;
      else if (G.time >= tr.spotWait) {
        tr.spotWait = 0;
        G.refreshQuestGoal(tr);
      }
      return;
    }
    if (combat && !G.autoHunt && !G.dead) G.setAutoHunt(true, true);

    // Se a missão é fora da Cripta, sai automaticamente da masmorra. Ao
    // concluir uma caçada na Cripta, a fase de entrega também manda sair.
    if (A.world.isDungeon()) {
      const activeId = A.world.activeDungeonId || A.world.active.id;
      const needsDungeon = tr.phase !== 'turnin' && (
        tr.dungeon === activeId || tr.type === 'dungeon' || tr.type === 'boss' ||
        tr.target === 'skeleton' || tr.target === 'boss_rei' || tr.target === 'eclipse_knight' ||
        tr.target === 'eclipse_mage' || tr.target === 'boss_cidadela' || tr.target === 'boss_eclipse'
      );
      if (!needsDungeon) { G.leaveDungeon(); return; }
      if (tr.dungeon && tr.dungeon !== activeId) { G.leaveDungeon(true); return; }
    }

    if (!tr.goal || G.time - (tr.goalT || 0) > 1) G.refreshQuestGoal(tr);
    if (!tr.goal) return;

    if (tr.goal.zone && !A.world.isDungeon()) {
      const cur = A.world.zoneAt(Math.floor(p.x / T), Math.floor(p.y / T));
      if (tr.goal.zone !== cur && G.questTravel(tr, tr.goal.zone)) return;
    }

    const g = tr.goal;
    const dist = Math.hypot(p.x - g.x, p.y - g.y);

    if (g.kind === 'npc' && dist < 62) {
      const npc = g.npc || A.NPCS.find(n => n.id === tr.giver);
      if (!npc) { G.cancelQuestTrack(true, true); return; }
      if (tr.phase === 'turnin') {
        G.cancelQuestTrack(true, true);
        A.ui.openWin('quests');
        A.ui.toast('Missão pronta para entregar: ' + tr.data.title, 'quest');
      } else {
        const changed = A.sys.talkTo(p, npc.id);
        G.cancelQuestTrack(true, true);
        if (changed) {
          A.ui.openWin('quests');
          A.ui.toast('Missão pronta: ' + changed.title, 'quest');
        } else G.openNpc(npc);
      }
      return;
    }

    if (g.kind === 'node' && dist < 58 && g.node && g.node.active) {
      G.harvest(g.node);
      tr.goal = null;
      G.refreshQuestGoal(tr);
      return;
    }

    if (g.kind === 'portal' && dist < 68) {
      const dg = g.dungeon || 'cripta';
      const def = A.DUNGEONS[dg] || {};
      if (p.level < (def.level || 18)) {
        A.ui.toast((def.name || 'A masmorra') + ' exige nível ' + (def.level || 18) + '.', 'erro');
        G.cancelQuestTrack(true, true);
        return;
      }
      G.startDungeon(dg);
      return;
    }

    if (g.kind === 'spot' && dist < 38) {
      const near = G.monsters.some(m => !m.dead && m.hp > 0 && m.type === tr.target &&
        Math.hypot(m.x - p.x, m.y - p.y) < 520);
      if (near) tr.spotWait = 0;
      else {
        if (!tr.spotWait) tr.spotWait = G.time + 2.5;
        else if (G.time >= tr.spotWait) {
          tr.spotWait = 0;
          tr.goal = null;
          G.refreshQuestGoal(tr);
        }
      }
    }
  };

  /* ================================================================== */
  /* DIA / NOITE / CLIMA                                                 */
  /* ================================================================== */
  G.hour = function () { return (G.worldClock / 3600) % 24; };
  G.isNight = function () { const h = G.hour(); return h < 6 || h >= 19.5; };
  G.isDungeon = function () { return A.world.isDungeon(); };
  G.clockString = function () {
    const h = Math.floor(G.hour());
    const m = Math.floor((G.worldClock % 3600) / 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  };

  G.updateWeather = function (dt) {
    G.weather.t -= dt;
    if (G.weather.t <= 0) {
      const r = Math.random();
      let type = 'limpo';
      if (r < 0.26) type = 'chuva';
      else if (r < 0.38) type = 'neblina';
      if (type !== G.weather.type) {
        G.weather.type = type;
        G.weather.t = A.rand(90, 190);
        if (type === 'chuva') A.ui.addChat('sistema', null, 'Uma chuva fina começa a cair sobre Aurora.', 'warn');
        else if (type === 'neblina') A.ui.addChat('sistema', null, 'Uma névoa densa cobre a região.', 'warn');
        else A.ui.addChat('sistema', null, 'O céu se abre novamente.', null);
      } else G.weather.t = A.rand(60, 120);
    }
    if (G.weather.type === 'chuva') {
      if (G.rain.length < 140) {
        for (let i = G.rain.length; i < 140; i++) G.rain.push({ x: Math.random() * VW, y: Math.random() * VH, s: A.rand(420, 780), l: A.rand(10, 20) });
      }
      G.rain.forEach(d => {
        d.y += d.s * dt; d.x += d.s * 0.12 * dt;
        if (d.y > VH + 20) { d.y = -20; d.x = Math.random() * VW; }
        if (d.x > VW + 20) d.x = -20;
      });
    }
  };

  /* ================================================================== */
  /* CHAT SIMULADO / PING                                                */
  /* ================================================================== */
  G.updateChatSim = function (dt) {
    if (G.chatTimer > 0) return;
    G.chatTimer = A.rand(7, 16);
    if (!G.player) return;
    const p = G.player;
    if (p.party && Math.random() < 0.3) {
      const m = A.pick(p.party.members.filter(x => x.name !== p.name));
      if (m) {
        A.ui.addChat('grupo', m.name, A.pick(['vou puxar o próximo', 'cuidado, tem elite aqui', 'bora pra cripta?', 'tô sem mana, segura aí', 'boa!']));
        return;
      }
    }
    if (p.guild && Math.random() < 0.22) {
      A.ui.addChat('guilda', A.pick(A.GUILD_MEMBERS), A.pick(['alguém pra dungeon?', 'guilda tá crescendo!', 'boa sorte no boss', 'quem tem cristal pra vender?']));
      return;
    }
    const r = Math.random();
    if (r < 0.16) {
      const events = [
        ['Um comerciante chegou à Vila Aurora com novas mercadorias.', 'warn'],
        ['Dizem que o Rei Esquecido está mais forte esta noite…', 'warn'],
        ['A população do servidor aumentou.', null],
        ['Um baú raro foi visto nas Ruínas de Solmar.', 'warn']
      ];
      const e = A.pick(events);
      A.ui.addChat('sistema', null, e[0], e[1]);
      return;
    }
    const ch = Math.random() < 0.22 ? 'comercio' : 'geral';
    const name = A.pick(A.BOT_NAMES);
    let line = A.pick(A.CHAT_LINES);
    if (ch === 'comercio' && !/vend|compro|troco|ouro|g cada/i.test(line)) line = A.pick(['vendo Cristal de Mana, 40g cada', 'compro Couro Curtido, 12g', 'troco minério por essência', 'poções de vida à venda na vila']);
    A.ui.addChat(ch, name, line);
  };

  G.sendChat = function (text, channel) {
    const p = G.player;
    if (!p) return;
    text = text.slice(0, 120);
    A.ui.addChat(channel, p.name, text);
    if (channel === 'geral' || channel === 'comercio') {
      if (Math.random() < 0.55) {
        setTimeout(() => {
          if (!G.player) return;
          const lines = channel === 'comercio'
            ? ['chama no whisper', 'tenho 3 aqui, te vendo', 'fechado!', 'qual seu nick?', 'tô na vila, vem']
            : ['kkkk', 'verdade', 'bora!', 'alguém me ajuda na cripta?', 'boa sorte!', 'tô subindo agora', 'esse boss é osso'];
          A.ui.addChat(channel, A.pick(A.BOT_NAMES), A.pick(lines));
        }, A.rand(900, 2600));
      }
    } else if (channel === 'guilda' && p.guild) {
      setTimeout(() => {
        if (!G.player || !G.player.guild) return;
        A.ui.addChat('guilda', A.pick(p.guild.members.filter(m => m.name !== G.player.name)).name || A.pick(A.GUILD_MEMBERS), A.pick(['boa!', 'vamos nessa', 'tô indo', 'chama no grupo']));
      }, A.rand(1200, 3000));
    }
  };

  G.updatePing = function (dt) {
    if (G.pingTimer > 0) return;
    G.pingTimer = A.rand(3, 7);
    const s = A.SERVERS.find(x => x.id === G.currentServer) || A.SERVERS[0];
    G.ping = Math.max(9, s.ping + A.randi(-6, 9));
  };

  G.onlineCount = function () {
    const s = A.SERVERS.find(x => x.id === G.currentServer) || A.SERVERS[0];
    return s.pop + (G.time | 0) % 37 - 18;
  };

  /* ================================================================== */
  /* MONSTROS                                                            */
  /* ================================================================== */
  G.spawnMonsters = function () {
    G.monsters = [];
    const map = A.world.active;
    (map.spots || []).forEach(s => {
      const m = G.makeMonster(s);
      if (m) G.monsters.push(m);
    });
    G.target = null;
  };

  G.zoneLevel = function (zone) {
    const ranges = {
      campos: [1, 6], costa: [5, 11], floresta: [9, 16],
      ruinas: [16, 23], pantano: [24, 37], picos: [38, 56],
      cripta: [18, 22], cidadela: [44, 58]
    };
    return ranges[zone] || [1, 6];
  };

  G.makeMonster = function (spot) {
    const base = A.MONSTERS[spot.type];
    if (!base) return null;
    const lvlRange = G.zoneLevel(spot.zone);
    let level = A.randi(lvlRange[0], lvlRange[1]);
    if (base.boss) level = base.level || Math.min(60, lvlRange[1] + 2);
    const elite = !base.boss && Math.random() < 0.07;
    const hpMul = (1 + (level - 1) * 0.095) * (elite ? 1.75 : 1) * (base.boss ? 1.15 : 1);
    const atkMul = (1 + (level - 1) * 0.07) * (elite ? 1.3 : 1);
    const defMul = (1 + (level - 1) * 0.055) * (elite ? 1.2 : 1);
    const xpMul = (1 + (level - 1) * 0.11) * (elite ? 2.1 : 1);
    const hp = Math.round(base.hp * hpMul);
    return {
      type: spot.type, name: base.name + (elite ? ' Elite' : ''), base,
      x: spot.x * T + T / 2, y: spot.y * T + T / 2,
      ax: spot.x * T + T / 2, ay: spot.y * T + T / 2,
      hp, maxHp: hp, level,
      atk: base.atk * atkMul, def: base.def * defMul,
      xp: Math.round(base.xp * xpMul),
      goldMul: 1 + (level - 1) * 0.08,
      speed: base.speed, aggro: base.aggro, reach: base.reach, r: base.r,
      boss: !!base.boss, elite, ranged: !!base.ranged,
      aggressive: !!base.aggressive || !!base.boss || elite,
      dir: A.randi(0, 3), frame: 0, anim: Math.random() * 2,
      dead: false, respawnAt: 0, atkCd: A.rand(0.4, 1.6),
      wanderT: A.rand(1, 5), wtx: spot.x * T + T / 2, wty: spot.y * T + T / 2,
      stun: 0, hurt: 0, aggroT: 0, special: 4, summoned: false, aliveT: 0,
      lungeT: 0, lungeCd: A.rand(1.2, 3.2),
      zone: spot.zone
    };
  };

  G.updateMonsters = function (dt) {
    const p = G.player;
    const now = G.time;
    for (let i = 0; i < G.monsters.length; i++) {
      const m = G.monsters[i];
      if (m.dead) {
        if (now >= m.respawnAt) {
          m.dead = false;
          m.hp = m.maxHp;
          m.x = m.ax; m.y = m.ay;
          m.atkCd = 1;
          m.special = 5;
          m.summoned = false;
          m.aggroT = 0;
          m.enraged = false;
          m.lungeT = 0;
          m.lungeCd = A.rand(1.2, 3.2);
        }
        continue;
      }
      m.aliveT += dt;
      m.hurt = Math.max(0, m.hurt - dt);
      m.aggroT = Math.max(0, m.aggroT - dt);
      const dx = p.x - m.x, dy = p.y - m.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1700) { m.atkCd = Math.max(m.atkCd, 0.5); continue; }
      m.atkCd = Math.max(0, m.atkCd - dt);
      m.stun = Math.max(0, m.stun - dt);
      m.lungeT = Math.max(0, m.lungeT - dt);
      m.lungeCd = Math.max(0, m.lungeCd - dt);
      if (m.stun > 0) continue;
      // Leash: ao se afastar demais do ponto de origem, o monstro volta para
      // casa em vez de ficar curado a cada frame enquanto continua lutando.
      if (Math.hypot(m.x - m.ax, m.y - m.ay) > 760) {
        m.x = m.ax; m.y = m.ay;
        m.hp = m.maxHp;
        m.aggroT = 0;
        m.hurt = 0;
        m.enraged = false;
        m.lungeT = 0;
        m.lungeCd = A.rand(1.2, 3.2);
        m.atkCd = 1;
        m.wtx = m.ax; m.wty = m.ay;
        m.wanderT = A.rand(1, 3);
        continue;
      }
      // Monstros pacíficos só revidam depois de serem atacados. Apenas as
      // espécies marcadas como agressivas (e elites/chefes) iniciam combate.
      const provoked = m.hurt > 0 || m.aggroT > 0;
      const aggro = !G.dead && (provoked || (m.aggressive && dist < m.aggro));
      let moving = false;
      if (aggro) {
        m.enraged = true;
        if (dist > m.reach) {
          // Perseguição constante mais lenta que o jogador; inimigos de nível
          // mais alto compensam com investidas curtas (lunge) em vez de correr
          // o tempo todo numa velocidade impossível de acompanhar.
          const chaseTier = A.clamp((m.level - p.level + 4) / 10, 0, 1);
          // Monstros mais fortes compensam a velocidade maior do jogador com
          // perseguição proporcional ao nível; o piso evita que inimigos altos
          // fiquem eternamente fora de alcance enquanto o jogador só anda.
          let sp = Math.max(m.speed * 1.15, p.speed * (0.80 + 0.18 * chaseTier));
          if (m.elite) sp *= 1.04;
          if (m.boss) sp *= 0.94;
          if (m.lungeCd <= 0 && dist < m.reach + 88) {
            m.lungeT = 0.38;
            m.lungeCd = A.rand(2.6, 4.2);
          }
          if (m.lungeT > 0) sp *= 1.45;
          if (G.manualMoving) sp *= 1.04;
          const nx = m.x + (dx / dist) * sp * dt;
          const ny = m.y + (dy / dist) * sp * dt;
          if (G.canStand(nx, m.y, 5)) m.x = nx;
          if (G.canStand(m.x, ny, 5)) m.y = ny;
          moving = true;
          m.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 3) : (dy > 0 ? 0 : 1);
          // Ameaça crescente: quando o monstro está em desvantagem, acelera a
          // perseguição para não deixar o jogador repetir a mesma rota de kiting.
          if (m.hp < m.maxHp * 0.35) sp *= 1.18;
        } else if (m.atkCd <= 0) {
          m.atkCd = m.ranged ? A.rand(1.8, 2.4) : A.rand(1.05, 1.5);
          m.aggroT = Math.max(m.aggroT, 6);
          G.monsterAttack(m);
          m.frame = 1;
        }
      } else {
        m.wanderT -= dt;
        if (m.wanderT <= 0) {
          m.wanderT = A.rand(2.5, 6.5);
          const ang = Math.random() * 6.283, rr = A.rand(20, 150);
          m.wtx = A.clamp(m.ax + Math.cos(ang) * rr, 20, A.world.active.w * T - 20);
          m.wty = A.clamp(m.ay + Math.sin(ang) * rr, 20, A.world.active.h * T - 20);
        }
        const wdx = m.wtx - m.x, wdy = m.wty - m.y, wd = Math.hypot(wdx, wdy);
        if (wd > 6) {
          const sp = m.speed * 0.42;
          const nx = m.x + (wdx / wd) * sp * dt, ny = m.y + (wdy / wd) * sp * dt;
          if (G.canStand(nx, m.y, 5)) m.x = nx;
          if (G.canStand(m.x, ny, 5)) m.y = ny;
          if (wd > 150) m.wanderT = 0;
          m.dir = Math.abs(wdx) > Math.abs(wdy) ? (wdx > 0 ? 2 : 3) : (wdy > 0 ? 0 : 1);
          moving = true;
        }
      }
      if (moving) m.anim += dt * (m.speed / 28);
      m.frame = moving ? (Math.floor(m.anim * 2) % 2) : 0;
      if (m.hurt > 0) m.frame = 0;

      // habilidades do boss
      if (m.boss && !G.dead) {
        m.special -= dt;
        if (m.special <= 0) {
          m.special = A.rand(4.5, 6.5);
          if (dist < 240) {
            G.bossWave(m);
          }
        }
        if (!m.summoned && m.hp < m.maxHp * 0.55) {
          m.summoned = true;
          G.summonSkeletons(m);
        }
      } else if (m.elite && !G.dead) {
        m.special -= dt;
        if (m.special <= 0) {
          m.special = A.rand(7.5, 10.5);
          if (dist < 330) G.eliteSlam(m);
        }
      }
    }
  };

  G.monsterAttack = function (m) {
    const p = G.player;
    if (!p || G.dead) return;
    if (m.ranged) {
      const ang = Math.atan2(p.y - m.y, p.x - m.x);
      G.projectiles.push({
        x: m.x, y: m.y - 20, vx: Math.cos(ang) * 240, vy: Math.sin(ang) * 240,
        dmg: m.atk, friendly: false, life: 2.4, color: m.type === 'witch' ? '#c07cff' : '#9d8cff',
        size: 5, kind: 'enemy', target: p, homing: false
      });
      A.audio.play('skill');
    } else {
      G.playerHit(m);
    }
  };

  G.damagePlayer = function (atk, mult, opts) {
    const p = G.player;
    if (!p || G.dead) return 0;
    opts = opts || {};
    if (G.invulnT > 0) {
      G.floatText(p.x, p.y - 52, 'Esquiva!', '#9fe8ff');
      return 0;
    }
    let dmg = atk * (mult || 1) * A.rand(0.9, 1.12) * 100 / (100 + p.def * 2.0);
    if (G.buffs.bless) dmg *= 0.8;
    if (G.statuses.weaken) dmg *= 1 + (G.statuses.weaken.power || 0.15);
    dmg = Math.max(1, Math.round(dmg));
    if (G.buffs.shield) {
      const b = G.buffs.shield;
      if (b.absorb == null) b.absorb = p.maxHp * 0.3;
      const abs = Math.min(b.absorb, dmg);
      b.absorb -= abs;
      dmg -= abs;
      if (abs > 0) G.floatText(p.x, p.y - 46, '−' + abs + ' 🛡', '#8fd0ff');
      if (b.absorb <= 0) delete G.buffs.shield;
    }
    if (dmg > 0) {
      p.hp -= dmg;
      G.floatText(p.x + A.rand(-8, 8), p.y - 46, '−' + dmg, '#ff7a7a');
      A.audio.play('hurt');
      if (G.settings.screenShake) G.shake = Math.min(7, G.shake + (opts.heavy ? 4.5 : 3.2));
    }
    G.combat = 5;
    if (p.hp <= 0) { p.hp = 0; G.die(); }
    return dmg;
  };

  G.playerHit = function (m) {
    return G.damagePlayer(m.atk, 1, { heavy: !!m.boss });
  };

  G.bossWave = function (m) {
    G.castTelegraph({
      shape: 'circle', x: m.x, y: m.y, r: 205,
      windup: 0.92, color: '#b07cff', label: 'Onda Sombria',
      source: 'enemy', atk: m.atk, mult: 1.35,
      onResolve: (tg, hit) => {
        G.spawnEffect({ kind: 'ring', x: tg.x, y: tg.y, r: 20, maxR: tg.r, t: 0, dur: 0.5, color: '#c07cff' });
        if (hit) {
          A.ui.addChat('sistema', null, 'O Rei Esquecido libera uma onda sombria!', 'bad');
          if (G.settings.screenShake) G.shake = 9;
        }
      }
    });
    A.audio.play('skill');
  };

  // Elites usam um golpe telegrafado: cone para corpo a corpo e círculo
  // marcado no chão para inimigos à distância. Dá tempo de usar a esquiva.
  G.eliteSlam = function (m) {
    const p = G.player;
    if (!p) return;
    if (m.ranged) {
      G.castTelegraph({
        shape: 'circle', x: p.x, y: p.y, r: 78,
        windup: 0.85, color: '#ff9b4a', label: 'Golpe pesado',
        source: 'enemy', atk: m.atk, mult: 1.4,
        status: { kind: 'burn', dur: 4, power: 1 }
      });
    } else {
      const ang = Math.atan2(p.y - m.y, p.x - m.x);
      G.castTelegraph({
        shape: 'cone', x: m.x, y: m.y, ang, spread: 1.15, len: 148,
        windup: 0.78, color: '#ff7a4a', label: 'Investida',
        source: 'enemy', atk: m.atk, mult: 1.45,
        status: { kind: 'slow', dur: 2.2, power: 0.32 }
      });
    }
  };

  G.summonSkeletons = function (m) {
    A.ui.addChat('sistema', null, 'O Rei Esquecido invoca seus servos!', 'bad');
    for (let i = 0; i < 2; i++) {
      const spot = { type: 'skeleton', x: Math.floor(m.x / T) + (i ? 3 : -3), y: Math.floor(m.y / T) + 2, zone: 'cripta' };
      const sk = G.makeMonster(spot);
      if (sk) { sk.level = 19; sk.maxHp = Math.round(sk.maxHp * 0.8); sk.hp = sk.maxHp; G.monsters.push(sk); }
    }
  };

  G.killMonster = function (m) {
    if (m.dead) return;
    const p = G.player;
    m.dead = true;
    m.hp = 0;
    m.respawnAt = G.time + (m.boss ? 180 : A.rand(13, 24));
    m.enraged = false;
    const inDungeon = A.world.isDungeon();
    let xp = m.xp;
    if (p.party && p.party.members.length > 1) xp = Math.round(xp * 1.1);
    const levels = A.sys.gainXp(p, xp);
    if (levels.length) G.onLevelUp(levels);
    A.sys.onKill(p, m.type, inDungeon);
    const loot = A.sys.rollLoot(p, m.type, m.elite);
    const gold = Math.round(loot.gold * m.goldMul);
    const items = loot.items.map(x => x.item);
    G.loot.push({
      x: m.x + A.rand(-10, 10), y: m.y + A.rand(-4, 8),
      gold, items, t: G.time, ttl: 70, boss: m.boss
    });
    G.floatText(m.x, m.y - 40, '+' + xp + ' XP', '#b9efc3');
    A.audio.play('coin');
    if (m.boss) {
      p.dungeonClears = (p.dungeonClears || 0) + 1;
      p.gold += m.boss ? 300 : 0;
      A.ui.addChat('sistema', null, m.name + ' foi derrotado! O caminho se abre.', 'good');
      A.ui.zoneBanner('CHEFE DERROTADO', m.name + ' caiu');
      A.audio.play('level');
      A.sys.checkAchievements(p);
      G.save();
    }
    if (G.target === m) { G.target = null; G.autoChase = false; }
    // efeito
    G.spawnEffect({ kind: 'burst', x: m.x, y: m.y - 20, t: 0, dur: 0.5, color: m.boss ? '#ff5a5a' : '#ffd978' });
  };

  G.monsterAt = function (wx, wy) {
    for (let i = G.monsters.length - 1; i >= 0; i--) {
      const m = G.monsters[i];
      if (m.dead || m.hp <= 0) continue;
      const spr = A.art.monster(m.type, 0);
      const sc = m.elite ? 1.3 : 1;
      const w = spr.width * sc, h = spr.height * sc;
      if (wx > m.x - w / 2 - 4 && wx < m.x + w / 2 + 4 && wy > m.y - h - 4 && wy < m.y + 8) return m;
    }
    return null;
  };

  G.npcAt = function (wx, wy) {
    for (const n of A.NPCS) {
      if (n.prop) continue;
      if (Math.abs(wx - (n.x * T + 16)) < 26 && Math.abs(wy - (n.y * T + 18)) < 34) return n;
    }
    return null;
  };

  /* ================================================================== */
  /* COMBATE DO JOGADOR                                                  */
  /* ================================================================== */
  G.distTo = function (m) { return Math.hypot(m.x - G.player.x, m.y - G.player.y); };

  G.attackRange = function () {
    const p = G.player;
    if (!p) return 46;
    if (p.cls === 'archer') return 235;
    if (p.cls === 'mage') return 215;
    if (p.cls === 'cleric') return 60;
    return 48;
  };

  G.faceAngle = function (ang) {
    const c = Math.cos(ang), s = Math.sin(ang);
    G.dir = Math.abs(c) > Math.abs(s) ? (c > 0 ? 2 : 3) : (s > 0 ? 0 : 1);
  };

  G.findAimTarget = function (x, y, range, cone) {
    const p = G.player;
    if (!p) return null;
    const ang = Math.atan2(y - (p.y - 20), x - p.x);
    let best = null, bs = 1e9;
    G.monsters.forEach(m => {
      if (m.dead || m.hp <= 0) return;
      const d = Math.hypot(m.x - p.x, (m.y - 18) - (p.y - 20));
      if (d > range) return;
      const a = Math.atan2((m.y - 18) - (p.y - 20), m.x - p.x);
      const diff = Math.abs(Math.atan2(Math.sin(a - ang), Math.cos(a - ang)));
      if (diff > cone) return;
      const score = d + diff * 70;
      if (score < bs) { bs = score; best = m; }
    });
    return best;
  };

  // Ataque action: mira no cursor (mouse) ou no alvo/inimigo mais próximo
  // (teclado, toque e automação). Não exige manter um alvo travado.
  G.actionAttack = function (nearestIfNoAim) {
    const p = G.player;
    if (!p || G.dead || G.trans || A.ui.currentWin) return false;
    // Ataque manual assume o controle e encerra a automação e o rastreio.
    if (G.questTrack) G.cancelQuestTrack(true, false);
    if (G.autoHunt) G.setAutoHunt(false, true);
    const useMouse = G.mouse.active && !nearestIfNoAim;
    let aimX = G.mouse.wx, aimY = G.mouse.wy;

    if (!useMouse) {
      const t = (G.target && !G.target.dead) ? G.target : null;
      const n = t || G.nearestMonster(Math.max(G.attackRange() + 24, 260));
      if (n) { aimX = n.x; aimY = n.y - 18; }
      else {
        const a = G.dirToAngle();
        aimX = p.x + Math.cos(a) * 70;
        aimY = p.y - 20 + Math.sin(a) * 70;
      }
    }

    const ang = Math.atan2(aimY - (p.y - 20), aimX - p.x);
    G.faceAngle(ang);

    let m = useMouse ? G.monsterAt(aimX, aimY) : null;
    if (!m) m = G.findAimTarget(aimX, aimY, G.attackRange() + 24, nearestIfNoAim ? 2.9 : 1.05);
    if (!m && nearestIfNoAim) m = G.nearestMonster(G.attackRange() + 24);

    if (!m) {
      if (!nearestIfNoAim && G.mouse.active) { G.target = null; G.autoChase = false; }
      // Golpe no vazio: ainda conta como ação e dispara projétil no caso de
      // arqueiro/mago, permitindo mirar livremente pelo cursor.
      G.basicAttack(null, true, aimX, aimY);
      return false;
    }

    G.target = m;
    G.moveTo = null;
    if (G.distTo(m) > G.attackRange() + 24) {
      G.autoChase = true;
      G.basicAttack(null, true, aimX, aimY);
      return false;
    }
    G.autoChase = false;
    return G.basicAttack(m, true, aimX, aimY);
  };

  G.attackNearest = function (attack) {
    const p = G.player;
    if (!p || G.dead) return;
    let best = null, bd = 620;
    G.monsters.forEach(m => {
      if (m.dead || m.hp <= 0) return;
      const d = Math.hypot(m.x - p.x, m.y - p.y);
      if (d < bd) { bd = d; best = m; }
    });
    if (!best) { A.ui.toast('Nenhum inimigo por perto.', 'erro'); return; }
    G.target = best;
    G.autoChase = true;
    if (attack && bd <= G.attackRange() + 24) G.basicAttack(best, true, best.x, best.y - 18);
  };

  G.basicAttack = function (m, manual, aimX, aimY) {
    const p = G.player;
    if (!p || G.dead) return false;
    if (!manual && G.manualMoving) return false;
    if (m && (m.dead || m.hp <= 0)) m = null;
    if (!m && !manual) return false;
    if (G.attackTimer > 0) return false;
    if (m && G.distTo(m) > G.attackRange() + 24) return false;

    const ax = aimX == null ? (m ? m.x : G.mouse.wx) : aimX;
    const ay = aimY == null ? (m ? m.y - 18 : G.mouse.wy) : aimY;
    const ang = Math.atan2(ay - (p.y - 20), ax - p.x);
    if (m || manual) G.faceAngle(ang);

    const base = p.cls === 'archer' ? 0.62 : p.cls === 'warrior' ? 0.8 : 0.88;
    G.attackTimer = base;
    G.attackAnim = 0.2;
    const crit = Math.random() * 100 < p.crit;
    let power = p.atk * (crit ? 1.85 : 1) * A.rand(0.92, 1.08);
    if (G.buffs.atk) power *= 1.3;

    if (p.cls === 'archer' || p.cls === 'mage') {
      const pa = Math.atan2(ay - (p.y - 26), ax - p.x);
      G.projectiles.push({
        x: p.x, y: p.y - 26, vx: Math.cos(pa) * 540, vy: Math.sin(pa) * 540,
        dmg: power, crit, friendly: true, life: 1.6, color: p.cls === 'mage' ? '#8f8cff' : '#d9e0a0',
        size: p.cls === 'mage' ? 5 : 3, kind: 'basic', target: m, homing: !!m
      });
      G.spawnEffect({ kind: 'spark', x: p.x + Math.cos(pa) * 22, y: p.y - 26 + Math.sin(pa) * 22, t: 0, dur: 0.15, color: p.cls === 'mage' ? '#b7a8ff' : '#e8f0b0', r: 5 });
      A.audio.play('skill');
      return true;
    }

    G.spawnEffect({
      kind: 'arc', x: p.x, y: p.y - 16, ang,
      r: G.attackRange(), t: 0, dur: 0.2,
      color: p.cls === 'cleric' ? '#ffe58a' : '#ffd978'
    });
    if (m) {
      G.hitMonster(m, power, crit, '#ffe0a0');
      // Golpe manual em arco: atinge também inimigos próximos na direção.
      if (manual) {
        G.monsters.forEach(other => {
          if (other === m || other.dead || other.hp <= 0) return;
          const d = Math.hypot(other.x - p.x, other.y - p.y);
          if (d > G.attackRange() + 18) return;
          const a = Math.atan2(other.y - 18 - (p.y - 20), other.x - p.x);
          const diff = Math.abs(Math.atan2(Math.sin(a - ang), Math.cos(a - ang)));
          if (diff > 1.1) return;
          const offPower = p.atk * A.rand(0.8, 1.0) * (G.buffs.atk ? 1.3 : 1) * 0.45;
          G.hitMonster(other, offPower, Math.random() * 100 < p.crit, '#ffd0a0');
        });
      }
      A.audio.play(crit ? 'crit' : 'hit');
    } else {
      A.audio.play('click');
    }
    return true;
  };

  G.hitMonster = function (m, power, crit, color) {
    if (!m || m.dead) return;
    let dmg = power * 100 / (100 + m.def * 2.0);
    dmg = Math.max(1, Math.round(dmg));
    m.hp -= dmg;
    m.hurt = 0.13;
    m.aggroT = Math.max(m.aggroT || 0, 10);
    G.floatText(m.x + A.rand(-6, 6), m.y - A.art.monster(m.type, 0).height * 0.8, (crit ? '✦' : '') + dmg, crit ? '#ffd23f' : (color || '#ffffff'));
    if (crit) A.audio.play('crit');
    if (m.hp <= 0) G.killMonster(m);
    G.combat = 5;
  };

  G.useSkill = function (i) {
    const p = G.player;
    if (!p || G.dead || G.trans) return;
    const skill = A.SKILLS[p.cls][i];
    if (!skill) return;
    if (G.skillCooldowns[i] > 0) { A.ui.toast('Habilidade em recarga.', 'erro'); return; }
    if (p.mp < skill.mp) { A.ui.toast('Mana insuficiente.', 'erro'); return; }
    const target = (G.target && !G.target.dead) ? G.target : G.nearestMonster(300);
    p.mp -= skill.mp;
    G.skillCooldowns[i] = skill.cd;
    G.attackAnim = 0.25;
    A.audio.play(skill.kind === 'heal' ? 'heal' : 'skill');
    G.combat = 5;

    const aimX = target ? target.x : G.mouse.wx;
    const aimY = target ? target.y : G.mouse.wy;
    const dmgBase = (p.cls === 'mage' || p.cls === 'cleric') ? p.magic : p.atk;

    switch (skill.kind) {
      case 'aoe': {
        G.spawnEffect({ kind: 'ring', x: p.x, y: p.y - 14, r: 18, maxR: skill.radius || 110, t: 0, dur: 0.45, color: p.cls === 'cleric' ? '#ffe58a' : '#ffb15a' });
        G.monsters.forEach(m => {
          if (m.dead) return;
          if (Math.hypot(m.x - p.x, m.y - p.y) <= (skill.radius || 110)) {
            G.hitMonster(m, dmgBase * skill.power, Math.random() * 100 < p.crit, '#ffcf7a');
          }
        });
        G.shakeIt(2);
        break;
      }
      case 'projectile': {
        const ang = Math.atan2(aimY - (p.y - 24), aimX - p.x);
        G.projectiles.push({
          x: p.x, y: p.y - 24, vx: Math.cos(ang) * 430, vy: Math.sin(ang) * 430,
          dmg: dmgBase * skill.power, crit: Math.random() * 100 < p.crit + (skill.crit || 0),
          friendly: true, life: 2, color: p.cls === 'mage' ? '#ff9a3d' : '#e8d77a', size: 7,
          kind: 'skill', target, explode: skill.radius || 0, homing: !!target
        });
        break;
      }
      case 'chain': {
        const targets = G.nearestMonsters(skill.radius || 220, 3);
        if (!targets.length) { A.ui.addChat('sistema', null, 'Nenhum alvo para o Raio em Cadeia.', 'warn'); break; }
        let last = { x: p.x, y: p.y - 26 };
        targets.forEach((m, idx) => {
          G.spawnEffect({ kind: 'beam', x1: last.x, y1: last.y, x2: m.x, y2: m.y - 18, t: 0, dur: 0.28, color: '#9d8cff' });
          G.hitMonster(m, dmgBase * skill.power * (idx === 0 ? 1 : 0.72), Math.random() * 100 < p.crit, '#b9a8ff');
          last = { x: m.x, y: m.y - 18 };
        });
        break;
      }
      case 'heal': {
        const amount = Math.round(p.maxHp * skill.power);
        p.hp = Math.min(p.maxHp, p.hp + amount);
        G.floatText(p.x, p.y - 46, '+' + amount, '#7dff9a');
        G.spawnEffect({ kind: 'ring', x: p.x, y: p.y - 12, r: 10, maxR: 90, t: 0, dur: 0.6, color: '#8fffb0' });
        if (skill.shield) {
          G.buffs.shield = { t: 8, max: 8, label: 'Escudo Sagrado', absorb: p.maxHp * 0.3 };
          G.floatText(p.x, p.y - 60, 'Escudo!', '#8fd0ff');
        }
        break;
      }
      case 'buff': {
        const b = skill.buff;
        if (b === 'atk') G.buffs.atk = { t: 8, max: 8, label: 'Grito de Guerra' };
        if (b === 'shield') G.buffs.shield = { t: 6, max: 6, label: 'Pele de Ferro', absorb: p.maxHp * 0.3 };
        if (b === 'haste') { G.buffs.haste = { t: 6, max: 6, label: 'Passo Sombrio' }; if (target) G.moveAway(target, 110); }
        if (b === 'bless') G.buffs.bless = { t: 8, max: 8, label: 'Bênção' };
        G.spawnEffect({ kind: 'ring', x: p.x, y: p.y - 12, r: 12, maxR: 80, t: 0, dur: 0.5, color: b === 'bless' ? '#ffe58a' : '#8fd0ff' });
        G.floatText(p.x, p.y - 58, skill.name, '#f2b84b');
        break;
      }
      case 'dash': {
        if (!target) { A.ui.toast('Selecione um alvo para a Investida.', 'erro'); p.mp += skill.mp; G.skillCooldowns[i] = 0; return; }
        const d = G.distTo(target);
        const dx = (target.x - p.x) / (d || 1), dy = (target.y - p.y) / (d || 1);
        const dist = Math.min(d - G.attackRange() + 10, 170);
        for (let s = 0; s < Math.abs(dist); s += 6) {
          const nx = p.x + dx * 6, ny = p.y + dy * 6;
          if (!G.canStand(nx, ny)) break;
          p.x = nx; p.y = ny;
          if (Math.hypot(target.x - p.x, target.y - p.y) < G.attackRange() + 10) break;
        }
        target.stun = 1.2;
        G.hitMonster(target, p.atk * skill.power, Math.random() * 100 < p.crit, '#ffcf7a');
        G.spawnEffect({ kind: 'beam', x1: p.x - dx * 40, y1: p.y - 12 - dy * 40, x2: p.x, y2: p.y - 12, t: 0, dur: 0.2, color: '#ffd978' });
        G.shakeIt(3);
        break;
      }
      case 'ground': {
        const tx = target ? target.x : aimX, ty = target ? target.y : aimY;
        G.spawnEffect({ kind: 'telegraph', x: tx, y: ty, r: 10, maxR: skill.radius, t: 0, dur: 0.55, color: '#e8c14a' });
        setTimeout(() => {
          if (!G.player) return;
          G.spawnEffect({ kind: 'ring', x: tx, y: ty, r: 15, maxR: skill.radius, t: 0, dur: 0.4, color: '#e8c14a' });
          G.monsters.forEach(m => {
            if (!m.dead && Math.hypot(m.x - tx, m.y - ty) < skill.radius) G.hitMonster(m, dmgBase * skill.power, Math.random() * 100 < p.crit, '#ffe0a0');
          });
          A.audio.play('hit');
        }, 520);
        break;
      }
      case 'trap': {
        const tx = target ? target.x : (p.x + Math.cos(G.dirToAngle()) * 60);
        const ty = target ? target.y : (p.y + Math.sin(G.dirToAngle()) * 60);
        G.traps.push({ x: tx, y: ty, t: 0, arm: 0.8, ttl: 14, radius: skill.radius || 46, dmg: dmgBase * skill.power });
        G.spawnEffect({ kind: 'ring', x: tx, y: ty, r: 6, maxR: 40, t: 0, dur: 0.3, color: '#9d8c5a' });
        break;
      }
    }
    A.ui.updateHUD(true);
    G.saveTimer = Math.max(G.saveTimer, 8);
  };

  G.dirToAngle = function () {
    return G.dir === 2 ? 0 : G.dir === 3 ? Math.PI : G.dir === 1 ? -Math.PI / 2 : Math.PI / 2;
  };

  G.nearestMonster = function (rad) {
    const p = G.player;
    let best = null, bd = rad || 300;
    G.monsters.forEach(m => {
      if (m.dead) return;
      const d = Math.hypot(m.x - p.x, m.y - p.y);
      if (d < bd) { bd = d; best = m; }
    });
    return best;
  };

  G.nearestMonsters = function (rad, count) {
    const p = G.player;
    return G.monsters.filter(m => !m.dead && Math.hypot(m.x - p.x, m.y - p.y) < rad)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))
      .slice(0, count || 3);
  };

  G.moveAway = function (from, dist) {
    const p = G.player;
    const dx = p.x - from.x, dy = p.y - from.y, d = Math.hypot(dx, dy) || 1;
    for (let s = 0; s < dist; s += 8) {
      const nx = p.x + (dx / d) * 8, ny = p.y + (dy / d) * 8;
      if (!G.canStand(nx, ny)) break;
      p.x = nx; p.y = ny;
    }
  };

  G.shakeIt = function (mag) {
    if (G.settings.screenShake) G.shake = Math.min(10, G.shake + mag);
  };

  G.usePotion = function (id) {
    const p = G.player;
    if (!p || G.dead) return;
    const it = p.inventory.find(x => x.id === id && x.kind === 'consumable');
    if (!it) { A.ui.toast('Você não tem ' + (A.CONSUMABLES[id] ? A.CONSUMABLES[id].name : 'essa poção') + '.', 'erro'); return; }
    const r = A.sys.useConsumable(p, it.uid);
    if (r) {
      if (r.healed) G.floatText(p.x, p.y - 46, '+' + r.healed, '#7dff9a');
      if (r.mana) G.floatText(p.x, p.y - 58, '+' + r.mana, '#8fb8ff');
      A.audio.play('heal');
      A.ui.updateHUD(true);
      G.saveTimer = Math.max(G.saveTimer, 15);
    }
  };

  G.onLevelUp = function (levels) {
    const lvl = levels[levels.length - 1];
    const p = G.player;
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    p.stamina = G.staminaMax(p);
    G.statuses = {};
    A.audio.play('level');
    A.ui.levelUpFx(lvl);
    A.ui.addChat('sistema', null, 'Você alcançou o nível ' + lvl + '! +5 pontos de atributo.', 'good');
    A.ui.updateHUD(true);
    G.save();
  };

  /* ================================================================== */
  /* PROJÉTEIS / EFEITOS / ARMADILHAS / LOOT                             */
  /* ================================================================== */
  G.updateProjectiles = function (dt) {
    const p = G.player;
    for (let i = G.projectiles.length - 1; i >= 0; i--) {
      const pr = G.projectiles[i];
      pr.life -= dt;
      if (pr.life <= 0) { G.projectiles.splice(i, 1); continue; }
      if (pr.homing && pr.target && !pr.target.dead) {
        const ang = Math.atan2(pr.target.y - 18 - pr.y, pr.target.x - pr.x);
        const sp = Math.hypot(pr.vx, pr.vy);
        pr.vx = Math.cos(ang) * sp;
        pr.vy = Math.sin(ang) * sp;
      }
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      // trilha
      if (Math.random() < 0.6) G.spawnEffect({ kind: 'spark', x: pr.x, y: pr.y, t: 0, dur: 0.22, color: pr.color, r: pr.size });
      if (pr.friendly) {
        let hit = false;
        if (pr.target && !pr.target.dead) {
          if (Math.hypot(pr.target.x - pr.x, pr.target.y - 18 - pr.y) < 20) {
            if (pr.explode) {
              G.spawnEffect({ kind: 'ring', x: pr.target.x, y: pr.target.y - 14, r: 10, maxR: pr.explode, t: 0, dur: 0.38, color: pr.color });
              G.monsters.forEach(m => {
                if (!m.dead && Math.hypot(m.x - pr.target.x, m.y - pr.target.y) < pr.explode) {
                  G.hitMonster(m, pr.dmg * (m === pr.target ? 1 : 0.75), pr.crit, pr.color);
                }
              });
              A.audio.play('hit');
            } else {
              G.hitMonster(pr.target, pr.dmg, pr.crit, pr.color);
            }
            hit = true;
          }
        } else {
          G.monsters.forEach(m => {
            if (hit || m.dead) return;
            if (Math.hypot(m.x - pr.x, m.y - 18 - pr.y) < 18) {
              G.hitMonster(m, pr.dmg, pr.crit, pr.color);
              hit = true;
            }
          });
        }
        if (hit) G.projectiles.splice(i, 1);
      } else {
        if (p && !G.dead && Math.hypot(p.x - pr.x, p.y - 24 - pr.y) < 18) {
          let dmg = pr.dmg * 100 / (100 + p.def * 2.0);
          if (G.buffs.bless) dmg *= 0.8;
          if (G.buffs.shield) {
            const b = G.buffs.shield;
            if (b.absorb == null) b.absorb = p.maxHp * 0.3;
            const abs = Math.min(b.absorb, dmg); b.absorb -= abs; dmg -= abs;
            if (b.absorb <= 0) delete G.buffs.shield;
          }
          dmg = Math.max(1, Math.round(dmg));
          if (dmg > 0) {
            p.hp -= dmg;
            G.floatText(p.x, p.y - 46, '−' + dmg, '#c07cff');
            A.audio.play('hurt');
          }
          G.combat = 5;
          if (p.hp <= 0) { p.hp = 0; G.die(); }
          G.projectiles.splice(i, 1);
        }
      }
    }
  };

  G.updateEffects = function (dt) {
    for (let i = G.effects.length - 1; i >= 0; i--) {
      const e = G.effects[i];
      e.t += dt;
      if (e.t >= e.dur) { if (G.effectPool) G.effectPool.push(e); G.effects.splice(i, 1); }
    }
    for (let i = G.floaters.length - 1; i >= 0; i--) {
      const f = G.floaters[i];
      f.t += dt;
      f.y -= dt * 34;
      if (f.t >= f.dur) G.floaters.splice(i, 1);
    }
  };

  G.updateTraps = function (dt) {
    for (let i = G.traps.length - 1; i >= 0; i--) {
      const t = G.traps[i];
      t.t += dt;
      t.arm -= dt;
      t.ttl -= dt;
      if (t.ttl <= 0) { G.traps.splice(i, 1); continue; }
      if (t.arm > 0) continue;
      for (const m of G.monsters) {
        if (m.dead) continue;
        if (Math.hypot(m.x - t.x, m.y - t.y) < 26) {
          G.monsters.forEach(mm => {
            if (!mm.dead && Math.hypot(mm.x - t.x, mm.y - t.y) < t.radius) {
              mm.stun = Math.max(mm.stun, 1.6);
              G.hitMonster(mm, t.dmg, Math.random() * 100 < G.player.crit, '#d9c08a');
            }
          });
          G.spawnEffect({ kind: 'ring', x: t.x, y: t.y, r: 6, maxR: t.radius, t: 0, dur: 0.35, color: '#d9c08a' });
          A.audio.play('hit');
          G.traps.splice(i, 1);
          break;
        }
      }
    }
  };

  G.updateLoot = function (dt) {
    const p = G.player;
    for (let i = G.loot.length - 1; i >= 0; i--) {
      const l = G.loot[i];
      const age = G.time - l.t;
      if (age > l.ttl) { G.loot.splice(i, 1); continue; }
      if (age < 0.45) continue;
      if (Math.hypot(p.x - l.x, p.y - l.y) < 48) {
        let ok = true;
        if (l.gold) {
          p.gold += l.gold;
          G.floatText(p.x, p.y - 52, '+' + l.gold + ' ouro', '#f2b84b');
          l.gold = 0;
        }
        if (p.inventory.length >= p.bagCap && l.items.length) continue;
        for (let k = l.items.length - 1; k >= 0; k--) {
          const it = l.items[k];
          if (A.sys.addItem(p, it, it.qty || 1)) {
            if (it.kind === 'gear') A.ui.toast('Item: ' + it.name, 'ok');
            l.items.splice(k, 1);
          } else { ok = false; }
        }
        A.audio.play('coin');
        A.ui.updateHUD(true);
        if (l.gold === 0 && l.items.length === 0) { G.loot.splice(i, 1); G.saveTimer = Math.max(G.saveTimer, 15); }
        else if (!ok) break;
      }
    }
  };

  G.floatText = function (x, y, text, color) {
    if (!G.settings.damageNumbers) return;
    G.floaters.push({ x, y, text, color, t: 0, dur: 1.0 + Math.random() * 0.3 });
  };

  /* ================================================================== */
  /* NÓS, NPCS, PORTAIS, WAYPOINTS                                       */
  /* ================================================================== */
  G.updateNodes = function (dt) {
    const map = A.world.active;
    if (!map.nodes) return;
    map.nodes.forEach(n => {
      if (!n.active) {
        n.timer -= dt;
        if (n.timer <= 0) n.active = true;
      }
    });
  };

  G.updateInteractables = function () {
    const p = G.player;
    if (!p) return;
    G.nearNode = null; G.nearNpc = null; G.nearPortal = null; G.nearExit = null;
    const map = A.world.active;
    let best = 62;
    (map.nodes || []).forEach(n => {
      if (!n.active) return;
      const d = Math.hypot(p.x - (n.x * T + 16), p.y - (n.y * T + 22));
      if (d < best) { best = d; G.nearNode = n; }
    });
    best = 64;
    A.NPCS.forEach(n => {
      if (n.prop) return;
      const d = Math.hypot(p.x - (n.x * T + 16), p.y - (n.y * T + 18));
      if (d < best) { best = d; G.nearNpc = n; }
    });
    if (A.world.isDungeon()) {
      const ex = map.exit;
      if (ex && Math.hypot(p.x - ex.px, p.y - ex.py) < 70) G.nearExit = ex;
    } else {
      map.props.forEach(pr => {
        if (!pr.portal) return;
        if (Math.hypot(p.x - pr.px, p.y - pr.py) < 68) G.nearPortal = pr;
      });
      // desbloqueia waypoints ao chegar perto
      A.WAYPOINTS.forEach(w => {
        if (p.waypoints[w.id]) return;
        const wx = w.x * T + 16, wy = w.y * T + 16;
        if (Math.hypot(p.x - wx, p.y - wy) < 80) {
          p.waypoints[w.id] = true;
          A.ui.toast('Ponto de viagem desbloqueado: ' + w.name, 'ach');
          A.ui.addChat('sistema', null, 'Você desbloqueou a viagem para ' + w.name + '.', 'good');
          A.audio.play('level');
          A.sys.checkAchievements(p);
          G.save();
        }
      });
    }
    // hint
    const hint = A.$('#interactHint'), txt = A.$('#interactText');
    if (!hint || !txt) return;
    let label = null;
    if (G.nearExit) label = 'Sair da masmorra';
    else if (G.nearPortal) label = G.nearPortal.portal === 'cidadela' ? 'Entrar na Cidadela do Eclipse' : 'Entrar na Cripta do Eclipse';
    else if (G.nearNode) label = 'Coletar ' + ({ herb: 'Erva Medicinal', ore: 'Minério', crystal: 'Cristal' }[G.nearNode.type] || 'recurso');
    else if (G.nearNpc) label = 'Falar com ' + G.nearNpc.name;
    else if (!A.world.isDungeon()) {
      const w = A.WAYPOINTS.find(wp => Math.hypot(p.x - (wp.x * T + 16), p.y - (wp.y * T + 16)) < 62);
      if (w) label = 'Abrir mapa de viagem';
    }
    if (label) { hint.classList.remove('hidden'); txt.textContent = label; }
    else hint.classList.add('hidden');
  };

  G.interact = function () {
    if (!G.player || G.dead) return;
    if (G.nearExit) { G.leaveDungeon(); return; }
    if (G.nearNode) { G.harvest(G.nearNode); return; }
    if (G.nearPortal) { G.startDungeon(G.nearPortal.portal || 'cripta'); return; }
    if (G.nearNpc) { G.openNpc(G.nearNpc); return; }
    if (!A.world.isDungeon()) {
      const p = G.player;
      const w = A.WAYPOINTS.find(wp => Math.hypot(p.x - (wp.x * T + 16), p.y - (wp.y * T + 16)) < 62);
      if (w) { A.ui.openWin('map'); return; }
    }
    A.ui.toast('Nada por perto. Explore um pouco mais.', 'erro');
  };

  G.harvest = function (n) {
    if (!n.active) return;
    n.active = false;
    n.timer = 45;
    const qty = A.randi(1, 2);
    const item = A.sys.makeStack(n.type === 'herb' ? 'herb' : n.type === 'ore' ? 'ore' : 'crystal', qty);
    if (A.sys.addItem(G.player, item, qty)) {
      A.ui.toast('Coletou: ' + item.name + ' x' + qty, 'ok');
      A.ui.addChat('sistema', null, 'Você coletou ' + item.name + ' x' + qty + '.', null);
      A.sys.gainXp(G.player, 3);
      A.audio.play('coin');
      G.floatText(n.x * T + 16, n.y * T, '+' + qty + ' ' + item.name, '#b9efc3');
      G.spawnEffect({ kind: 'burst', x: n.x * T + 16, y: n.y * T + 14, t: 0, dur: 0.5, color: '#9dd67a' });
      A.ui.updateHUD(true);
      G.saveTimer = Math.max(G.saveTimer, 15);
    }
  };

  G.openNpc = function (npc) {
    if (npc.prop) {
      A.ui.openWin('quests');
      A.sys.talkTo(G.player, npc.id);
      return;
    }
    const changed = A.sys.talkTo(G.player, npc.id);
    if (changed) A.ui.toast('Missão pronta: ' + changed.title, 'quest');
    A.ui.openWin('npc', { npc: npc.id });
    A.audio.play('open');
    if (A.sys.questProgress(G.player, 'q1').done) A.ui.updateHUD(true);
  };

  G.npcAction = function (npcId, opt) {
    const p = G.player;
    if (!p) return;
    switch (opt) {
      case 'quests': A.ui.closeWin('npc'); A.ui.openWin('quests'); break;
      case 'guild': A.ui.closeWin('npc'); A.ui.tabs.social = 'guilda'; A.ui.openWin('social'); break;
      case 'lore':
        A.ui.addChat('sistema', null, 'Aldric: “Há mil anos, a Aurora selou o Eclipse. Agora o selo enfraquece.”', null);
        A.ui.toast('Você ouviu a história de Aurora.', 'ok');
        break;
      case 'shop_potion': G.generateShopStock(); A.ui.closeWin('npc'); A.ui.tabs.shop = 'potion'; A.ui.openWin('shop', { type: 'potion' }); break;
      case 'shop_gear': G.generateShopStock(); A.ui.closeWin('npc'); A.ui.tabs.shop = 'gear'; A.ui.openWin('shop', { type: 'gear' }); break;
      case 'sell': A.ui.closeWin('npc'); A.ui.openWin('shop', { type: 'sell' }); break;
      case 'craft': A.ui.closeWin('npc'); A.ui.openWin('craft'); break;
      case 'skills': A.ui.closeWin('npc'); A.ui.openWin('skills'); break;
      case 'help': A.ui.showHelpModal(); break;
      case 'bank': A.ui.closeWin('npc'); A.ui.openWin('bank'); break;
      case 'heal': {
        if (p.gold < p.level * 2) { A.ui.toast('Você precisa de ' + (p.level * 2) + ' ouro para a cura.', 'erro'); break; }
        p.gold -= p.level * 2;
        p.hp = p.maxHp; p.mp = p.maxMp;
        A.ui.toast('Vida e mana restauradas. A luz de Aurora agradece.', 'ok');
        A.ui.addChat('sistema', null, 'Nara canaliza a luz e restaura você por completo.', 'good');
        A.audio.play('heal');
        G.floatText(p.x, p.y - 50, 'Cura completa', '#7dff9a');
        A.ui.updateHUD(true); G.save();
        break;
      }
      case 'dungeon': A.ui.closeWin('npc'); G.startDungeon('cripta'); break;
      case 'dungeon2': A.ui.closeWin('npc'); G.startDungeon('cidadela'); break;
      case 'progress': A.ui.closeWin('npc'); A.ui.openWin('achievements'); break;
      case 'close': A.ui.closeWin('npc'); break;
    }
  };

  G.startDungeon = function (id) {
    const p = G.player;
    if (!p || G.trans) return;
    if (A.world.isDungeon()) return;
    id = id || 'cripta';
    const def = A.DUNGEONS[id] || A.DUNGEONS.cripta;
    const dungeonMap = A.world.getDungeon(id);
    if (!dungeonMap) return;
    if (p.level < (def.level || 18)) {
      A.ui.toast((def.name || 'A masmorra') + ' exige nível ' + (def.level || 18) + '. Volte mais forte.', 'erro');
      return;
    }
    A.ui.closeAllWins();
    G.transition(() => {
      A.world.enterDungeon(id);
      p.map = id;
      G.teleportPlayer(dungeonMap.spawn.x, dungeonMap.spawn.y);
      G.spawnMonsters();
      G.bots = [];
      G.loot = []; G.projectiles = []; G.effects = []; G.traps = []; G.target = null;
      G.snapCamera();
      A.ui.zoneBanner(def.name, 'Masmorra • Nível ' + (def.level || 18) + '+');
      A.ui.addChat('sistema', null, 'Você entra em ' + def.name + '. O ar fica pesado.', 'warn');
      A.audio.play('dungeon');
      G.save();
    });
  };

  G.leaveDungeon = function (silent) {
    const p = G.player;
    if (!p) return;
    const was = A.world.activeDungeonId || p.map || 'cripta';
    const go = () => {
      const ret = A.world.dungeonReturn;
      A.world.dungeonReturn = null;
      A.world.enter(A.world.overworld);
      p.map = 'overworld';
      let x = A.world.dungeonExitSpot.x, y = A.world.dungeonExitSpot.y;
      if (was === 'cidadela') { x = 182 * T + T / 2; y = 73 * T + T / 2; }
      if (ret && ret.x != null) { x = ret.x; y = ret.y; }
      G.teleportPlayer(x, y);
      G.spawnMonsters();
      G.spawnBots();
      G.loot = []; G.projectiles = []; G.effects = []; G.traps = []; G.target = null;
      G.snapCamera();
      if (!silent) {
        const name = was === 'cidadela' ? 'Picos de Gelo' : 'Ruínas de Solmar';
        A.ui.zoneBanner(name, 'Aurora');
        A.ui.addChat('sistema', null, 'Você deixa a masmorra para trás.', null);
      }
      G.save();
    };
    if (silent) go(); else G.transition(go);
  };

  G.die = function () {
    if (G.dead) return;
    const p = G.player;
    G.dead = true;
    p.deaths = (p.deaths || 0) + 1;
    const lost = Math.floor(p.gold * 0.1);
    p.gold -= lost;
    p.hp = 0;
    G.cancelQuestTrack(true, false);
    G.resetControlState();
    A.audio.play('death');
    A.ui.showDeath(lost);
    A.ui.addChat('sistema', null, 'Você foi derrotado. Perdeu ' + A.fmt(lost) + ' de ouro.', 'bad');
    G.save();
  };

  G.respawn = function () {
    const p = G.player;
    if (!p) return;
    A.ui.hideDeath();
    G.dead = false;
    if (A.world.isDungeon()) G.leaveDungeon(true);
    G.resetControlState();
    let best = A.WAYPOINTS[0], bd = 1e9;
    A.WAYPOINTS.forEach(w => {
      if (!p.waypoints[w.id]) return;
      const d = Math.hypot(p.x - (w.x * T), p.y - (w.y * T));
      if (d < bd) { bd = d; best = w; }
    });
    const tp = A.world.travelPoints[best.id];
    G.teleportPlayer(tp ? tp.x : best.x * T + 16, tp ? tp.y : best.y * T + 16);
    p.hp = p.maxHp; p.mp = p.maxMp;
    p.stamina = G.staminaMax(p);
    G.buffs = {};
    G.statuses = {};
    G.spawnMonsters();
    G.snapCamera();
    A.ui.updateHUD(true);
    A.ui.zoneBanner(A.ZONES[best.zone] ? A.ZONES[best.zone].name : 'Aurora', 'Renascido');
    A.audio.play('heal');
    G.save();
  };

  /* ================================================================== */
  /* VIAGEM                                                              */
  /* ================================================================== */
  G.travel = function (zone) {
    const p = G.player;
    if (!p || G.trans) return;
    if (A.world.isDungeon()) { A.ui.toast('Saia da Cripta para viajar.', 'erro'); return; }
    const w = A.WAYPOINTS.find(x => x.id === zone);
    if (!w) return;
    if (!p.waypoints[zone]) { A.ui.toast('Ponto de viagem não desbloqueado.', 'erro'); return; }
    if (zone === 'vila' && Math.hypot(p.x - (w.x * T), p.y - (w.y * T)) < 80) { A.ui.toast('Você já está aqui.', 'erro'); return; }
    A.ui.closeWin('map');
    G.transition(() => {
      const tp = A.world.travelPoints[zone];
      G.teleportPlayer(tp ? tp.x : w.x * T + 16, tp ? tp.y : w.y * T + 16);
      G.spawnMonsters();
      G.spawnBots();
      A.ui.zoneBanner(A.ZONES[w.zone].name, 'Viagem concluída');
      A.audio.play('open');
      G.save();
    });
  };

  /* ================================================================== */
  /* PARTY / GUILDA                                                      */
  /* ================================================================== */
  G.createParty = function () {
    const p = G.player;
    if (!p) return;
    if (p.party) { A.ui.toast('Você já está em um grupo.', 'erro'); return; }
    const bot = G.randomBotPartner();
    p.party = {
      leader: p.name,
      members: [
        { name: p.name, level: p.level, cls: p.cls, hpPct: 100, isPlayer: true },
        { name: bot.name, level: bot.level, cls: bot.cls, hpPct: A.randi(65, 100), isPlayer: false }
      ]
    };
    A.ui.toast('Grupo criado com ' + bot.name + '.', 'ok');
    A.ui.addChat('sistema', null, bot.name + ' entrou no grupo.', 'good');
    A.audio.play('level');
    A.sys.checkAchievements(p);
    G.save();
  };

  G.inviteParty = function () {
    const p = G.player;
    if (!p) return;
    if (!p.party) { G.createParty(); return; }
    if (p.party.members.length >= 4) { A.ui.toast('O grupo está cheio (4).', 'erro'); return; }
    const bot = G.randomBotPartner();
    if (p.party.members.some(m => m.name === bot.name)) return;
    p.party.members.push({ name: bot.name, level: bot.level, cls: bot.cls, hpPct: A.randi(60, 100), isPlayer: false });
    A.ui.toast(bot.name + ' entrou no grupo.', 'ok');
    A.ui.addChat('grupo', bot.name, A.pick(['valeu pelo convite!', 'bora!', 'tô pronto']));
    A.audio.play('open');
    G.save();
  };

  G.leaveParty = function () {
    const p = G.player;
    if (!p || !p.party) return;
    p.party = null;
    A.ui.toast('Você saiu do grupo.', 'ok');
    A.ui.addChat('sistema', null, 'Você não está mais em um grupo.', null);
    G.save();
  };

  G.randomBotPartner = function () {
    const names = A.BOT_NAMES.filter(n => !G.bots.some(b => b.name === n));
    const name = names.length ? A.pick(names) : A.pick(A.BOT_NAMES);
    const cls = A.pick(Object.keys(A.CLASSES));
    return { name, level: A.clamp(G.player.level + A.randi(-2, 4), 1, 40), cls };
  };

  G.createGuild = function (name) {
    const p = G.player;
    if (!p) return;
    if (p.guild) { A.ui.toast('Você já está em uma guilda.', 'erro'); return; }
    if (p.gold < 500) { A.ui.toast('Fundar uma guilda custa 500 ouro.', 'erro'); return; }
    p.gold -= 500;
    const members = [{ name: p.name, rank: 'Líder', level: p.level }];
    A.GUILD_MEMBERS.slice(0, 4).forEach(n => members.push({ name: n, rank: 'Membro', level: A.randi(8, 30) }));
    p.guild = { name, created: Date.now(), rank: 'Líder', members };
    A.ui.toast('Guilda "' + name + '" fundada!', 'ok');
    A.ui.addChat('sistema', null, 'Você fundou a guilda ' + name + '.', 'good');
    A.audio.play('level');
    A.sys.checkAchievements(p);
    G.save();
  };

  G.joinGuild = function (name) {
    const p = G.player;
    if (!p) return;
    if (p.guild) { A.ui.toast('Você já está em uma guilda.', 'erro'); return; }
    const members = [{ name: p.name, rank: 'Membro', level: p.level }];
    A.GUILD_MEMBERS.slice(0, 5).forEach(n => members.push({ name: n, rank: n === A.GUILD_MEMBERS[0] ? 'Líder' : 'Membro', level: A.randi(8, 30) }));
    p.guild = { name, created: Date.now() - 86400000 * 12, rank: 'Membro', members };
    A.ui.toast('Você entrou na guilda ' + name + '.', 'ok');
    A.ui.addChat('guilda', A.GUILD_MEMBERS[0], 'Bem-vindo à ' + name + ', ' + p.name + '!');
    A.audio.play('level');
    A.sys.checkAchievements(p);
    G.save();
  };

  G.leaveGuild = function () {
    const p = G.player;
    if (!p || !p.guild) return;
    if (!confirm('Sair da guilda "' + p.guild.name + '"?')) return;
    p.guild = null;
    A.ui.toast('Você saiu da guilda.', 'ok');
    G.save();
  };

  /* ================================================================== */
  /* LOJA                                                                */
  /* ================================================================== */
  G.generateShopStock = function () {
    const p = G.player;
    if (!p) return;
    const bases = ['sword', 'staff', 'bow', 'mace', 'chest', 'helmet', 'boots', 'ring', 'amulet'];
    G.shopStock = [];
    for (let i = 0; i < 6; i++) {
      const base = A.pick(bases);
      const ilvl = A.clamp(p.level + A.randi(-1, 3), 1, 45);
      const r = Math.random();
      const rarity = r < 0.5 ? 'incomum' : r < 0.85 ? 'raro' : 'epico';
      const it = A.sys.makeItem(base, ilvl, rarity);
      it.shopPrice = Math.round(it.value * 2.3);
      G.shopStock.push(it);
    }
  };

  G.buyShop = function (d) {
    const p = G.player;
    if (!p) return;
    let item, price;
    if (d.kind === 'gear') {
      const idx = G.shopStock.findIndex(x => x.uid === d.uid);
      if (idx < 0) return;
      item = G.shopStock[idx];
      price = item.shopPrice;
    } else if (d.kind === 'consumable' && A.CONSUMABLES[d.id]) {
      const c = A.CONSUMABLES[d.id];
      item = A.sys.makeStack(d.id, 1);
      price = c.value;
    } else if (d.kind === 'material' && A.MATERIALS[d.id]) {
      const m = A.MATERIALS[d.id];
      item = A.sys.makeStack(d.id, 1);
      price = m.value * 2;
    } else return;
    if (p.gold < price) { A.ui.toast('Ouro insuficiente.', 'erro'); A.audio.play('error'); return; }
    if (A.sys.bagCount(p) >= p.bagCap && item.kind === 'gear') { A.ui.toast('Mochila cheia.', 'erro'); return; }
    const copy = Object.assign({}, item);
    p.gold -= price;
    if (!A.sys.addItem(p, copy, copy.qty || 1)) { p.gold += price; return; }
    if (d.kind === 'gear') G.shopStock.splice(G.shopStock.findIndex(x => x.uid === d.uid), 1);
    A.ui.toast('Comprou: ' + item.name, 'ok');
    A.audio.play('buy');
    A.ui.updateHUD(true);
    G.save();
  };

  /* ================================================================== */
  /* BOTS                                                                */
  /* ================================================================== */
  G.spawnBots = function () {
    G.bots = [];
    if (A.world.isDungeon()) return;
    const p = G.player;
    if (!p) return;
    const count = 14;
    const used = new Set();
    for (let i = 0; i < count; i++) {
      let name = A.pick(A.BOT_NAMES);
      let guard = 0;
      while (used.has(name) && guard++ < 20) name = A.pick(A.BOT_NAMES);
      used.add(name);
      const cls = A.pick(Object.keys(A.CLASSES));
      const look = {
        skin: A.pick(A.LOOKS.SKINS), hair: A.pick(A.LOOKS.HAIRS),
        hairStyle: A.randi(0, 3), outfit: A.pick(A.LOOKS.OUTFITS),
        accent: A.CLASSES[cls].color
      };
      let x, y, guard2 = 0;
      do {
        x = p.x + A.rand(-460, 460);
        y = p.y + A.rand(-360, 360);
        guard2++;
      } while (!G.canStand(x, y, 6) && guard2 < 40);
      G.bots.push({
        name, cls, look, x, y, ax: x, ay: y,
        level: A.clamp(p.level + A.randi(-4, 6), 1, 40),
        dir: A.randi(0, 3), anim: Math.random() * 2, moving: false,
        t: A.rand(0.5, 4), tx: x, ty: y, hpPct: A.randi(55, 100)
      });
    }
  };

  G.updateBots = function (dt) {
    if (A.world.isDungeon()) return;
    G.bots.forEach(b => {
      b.t -= dt;
      if (b.t <= 0) {
        b.t = A.rand(2, 6);
        const ang = Math.random() * 6.283, rr = A.rand(40, 180);
        b.tx = A.clamp(b.ax + Math.cos(ang) * rr, 20, A.world.active.w * T - 20);
        b.ty = A.clamp(b.ay + Math.sin(ang) * rr, 20, A.world.active.h * T - 20);
      }
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
      b.moving = d > 5;
      if (b.moving) {
        const sp = 45;
        const nx = b.x + (dx / d) * sp * dt, ny = b.y + (dy / d) * sp * dt;
        if (G.canStand(nx, b.y, 6)) b.x = nx;
        if (G.canStand(b.x, ny, 6)) b.y = ny;
        b.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 3) : (dy > 0 ? 0 : 1);
        b.anim += dt * 3;
      }
      // party members hp visual
      if (G.player && G.player.party) {
        const mem = G.player.party.members.find(m => m.name === b.name);
        if (mem && !mem.isPlayer) mem.hpPct = A.clamp(mem.hpPct + A.rand(-0.4, 0.4), 25, 100);
      }
    });
  };

  /* ================================================================== */
  /* RENDER                                                              */
  /* ================================================================== */
  G.render = function (dt) {
    const title = A.$('#title');
    const login = A.$('#login');
    if (title && title.classList.contains('active')) G.renderMenuScene('titleCanvas');
    if (login && login.classList.contains('active')) G.renderMenuScene('loginCanvas');
    const game = A.$('#game');
    if (game && game.classList.contains('active') && G.player) G.renderWorld(dt);
  };

  G.renderMenuScene = function (id) {
    const cv = A.$(id);
    if (!cv) return;
    G.resizeMenu(cv);
    const g = cv.getContext('2d');
    const W = cv.clientWidth || window.innerWidth;
    const H = cv.clientHeight || window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const scale = Math.max(W / VW, H / VH);
    g.setTransform(dpr * scale, 0, 0, dpr * scale, (W - VW * scale) / 2 * dpr, (H - VH * scale) / 2 * dpr);
    const t = G.time;
    const login = id === 'loginCanvas';

    // céu
    const sky = g.createLinearGradient(0, 0, 0, VH);
    if (login) {
      sky.addColorStop(0, '#120b20'); sky.addColorStop(0.45, '#251541'); sky.addColorStop(1, '#0a0712');
    } else {
      sky.addColorStop(0, '#1a1030'); sky.addColorStop(0.42, '#4a2a5e'); sky.addColorStop(0.62, '#9a5a6a'); sky.addColorStop(0.78, '#d78a5a'); sky.addColorStop(1, '#2a1a2a');
    }
    g.fillStyle = sky; g.fillRect(0, 0, VW, VH);

    // estrelas
    for (let i = 0; i < 110; i++) {
      const x = (A.hash(i, 7) * VW) | 0, y = (A.hash(i, 13) * VH * 0.55) | 0;
      const tw = 0.25 + 0.75 * Math.abs(Math.sin(t * 0.7 + i));
      g.globalAlpha = tw * (login ? 0.7 : 0.9);
      g.fillStyle = i % 7 === 0 ? '#ffd978' : '#e8e0ff';
      g.fillRect(x, y, 1.5, 1.5);
    }
    g.globalAlpha = 1;

    // lua
    const mx = 970, my = 132;
    const mg = g.createRadialGradient(mx, my, 10, mx, my, 170);
    mg.addColorStop(0, 'rgba(255,240,200,.4)'); mg.addColorStop(0.25, 'rgba(255,220,160,.12)'); mg.addColorStop(1, 'rgba(255,220,160,0)');
    g.fillStyle = mg; g.beginPath(); g.arc(mx, my, 170, 0, 6.283); g.fill();
    g.fillStyle = '#f6ecd2'; g.beginPath(); g.arc(mx, my, 44, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(190,170,150,.35)'; g.beginPath(); g.arc(mx - 12, my - 8, 8, 0, 6.283); g.fill();
    g.beginPath(); g.arc(mx + 14, my + 12, 5, 0, 6.283); g.fill();

    // nuvens
    for (let i = 0; i < 5; i++) {
      const x = ((i * 330 + t * (7 + i * 2)) % (VW + 400)) - 200;
      const y = 120 + i * 46;
      g.fillStyle = 'rgba(60,40,80,' + (0.18 + i * 0.03) + ')';
      g.beginPath();
      g.ellipse(x, y, 130, 20, 0, 0, 6.283);
      g.ellipse(x + 80, y + 6, 90, 15, 0, 0, 6.283);
      g.fill();
    }

    // montanhas
    const ranges = [
      { c: '#2a1c3a', y: 470, amp: 120, w: 260, off: 0 },
      { c: '#21152f', y: 530, amp: 90, w: 200, off: 120 },
      { c: '#171022', y: 590, amp: 60, w: 160, off: 60 }
    ];
    ranges.forEach((rg, ri) => {
      g.fillStyle = rg.c;
      g.beginPath();
      g.moveTo(0, VH);
      g.lineTo(0, rg.y);
      for (let x = 0; x <= VW + rg.w; x += rg.w) {
        const h = rg.y - rg.amp * (0.55 + A.hash(x + ri * 97, ri) * 0.45);
        g.lineTo(x + rg.off, h);
        g.lineTo(x + rg.off + rg.w / 2, rg.y + 10);
      }
      g.lineTo(VW, VH);
      g.closePath(); g.fill();
    });

    // cidade ao longe
    g.fillStyle = '#120c1c';
    const baseY = 604;
    for (let i = 0; i < 24; i++) {
      const x = i * 58 - 20;
      const h = 30 + A.hash(i, 3) * 90;
      g.fillRect(x, baseY - h, 34 + A.hash(i, 4) * 18, h);
    }
    // torre e telhados
    g.fillRect(510, baseY - 180, 34, 180);
    g.beginPath(); g.moveTo(502, baseY - 180); g.lineTo(527, baseY - 214); g.lineTo(552, baseY - 180); g.closePath(); g.fill();
    for (let i = 0; i < 7; i++) {
      const x = 100 + i * 160;
      g.beginPath(); g.moveTo(x, baseY - 70); g.lineTo(x + 40, baseY - 110); g.lineTo(x + 80, baseY - 70); g.closePath(); g.fill();
    }
    // janelas
    g.fillStyle = 'rgba(255,190,90,.65)';
    for (let i = 0; i < 26; i++) {
      const x = (A.hash(i, 9) * 1120 + 40) | 0;
      const y = baseY - 20 - (A.hash(i, 11) * 90) | 0;
      g.globalAlpha = 0.35 + A.hash(i, 12) * 0.5;
      g.fillRect(x, y, 3, 5);
    }
    g.globalAlpha = 1;

    // chão
    const gr = g.createLinearGradient(0, baseY, 0, VH);
    gr.addColorStop(0, '#1d1428'); gr.addColorStop(1, '#08050e');
    g.fillStyle = gr; g.fillRect(0, baseY, VW, VH - baseY);

    // árvores em silhueta
    for (let i = 0; i < 12; i++) {
      const x = i * 118 + 30;
      const h = 90 + A.hash(i, 21) * 90;
      g.fillStyle = '#0c0814';
      g.fillRect(x - 4, baseY - h * 0.35, 8, h * 0.35);
      g.beginPath();
      g.moveTo(x, baseY - h);
      g.lineTo(x - 30, baseY - h * 0.3);
      g.lineTo(x + 30, baseY - h * 0.3);
      g.closePath(); g.fill();
    }

    // vaga-lumes
    for (let i = 0; i < 26; i++) {
      const x = (A.hash(i, 31) * VW + Math.sin(t * 0.4 + i) * 18) % VW;
      const y = baseY + 10 + A.hash(i, 33) * (VH - baseY - 20) + Math.cos(t * 0.6 + i) * 10;
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.4 + i));
      g.globalAlpha = a;
      g.fillStyle = i % 3 === 0 ? '#ffd978' : '#c07cff';
      g.beginPath(); g.arc(x, y, 1.6, 0, 6.283); g.fill();
    }
    g.globalAlpha = 1;

    // névoa
    const fog = g.createLinearGradient(0, baseY - 80, 0, baseY + 90);
    fog.addColorStop(0, 'rgba(120,90,160,0)');
    fog.addColorStop(0.5, 'rgba(120,90,160,.1)');
    fog.addColorStop(1, 'rgba(120,90,160,0)');
    g.fillStyle = fog; g.fillRect(0, baseY - 80, VW, 170);

    if (login) {
      g.fillStyle = 'rgba(7,5,12,.45)'; g.fillRect(0, 0, VW, VH);
    }
  };

  G.renderWorld = function (dt) {
    const ctx = G.ctx;
    const p = G.player;
    const map = A.world.active;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, VW, VH);
    ctx.imageSmoothingEnabled = false;

    let shX = 0, shY = 0;
    if (G.shake > 0.1) {
      shX = A.rand(-G.shake, G.shake);
      shY = A.rand(-G.shake, G.shake);
    }
    const camX = Math.round(G.cam.x + shX), camY = Math.round(G.cam.y + shY);

    ctx.save();
    ctx.translate(-camX, -camY);

    // ---- chão ----
    const x0 = Math.max(0, Math.floor(camX / T) - 1);
    const y0 = Math.max(0, Math.floor(camY / T) - 1);
    const x1 = Math.min(map.w - 1, Math.ceil((camX + VW) / T) + 1);
    const y1 = Math.min(map.h - 1, Math.ceil((camY + VH) / T) + 1);
    const wf = Math.floor(G.time * 2.2) % 3;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const id = map.map[ty * map.w + tx];
        let img;
        if (map.id === 'cripta' && id === A.art.TT.WALL) img = G.cryptWall;
        else img = A.art.tile(id, tx, ty, wf);
        ctx.drawImage(img, tx * T, ty * T);
      }
    }

    // ---- props de chão ----
    map.props.forEach(pr => {
      if (!pr.ground) return;
      if (pr.px < camX - 80 || pr.px > camX + VW + 80 || pr.py < camY - 80 || pr.py > camY + VH + 160) return;
      ctx.drawImage(pr.spr, Math.round(pr.px - pr.spr.width / 2), Math.round(pr.py - pr.spr.height));
    });

    // ---- telegrafias de ataques (ficam no chão, abaixo dos atores) ----
    G.drawTelegraphs(ctx);

    // ---- nós de coleta ----
    (map.nodes || []).forEach(n => {
      if (!n.active) return;
      const nx = n.x * T + 16, ny = n.y * T + 16;
      if (nx < camX - 40 || nx > camX + VW + 40 || ny < camY - 40 || ny > camY + VH + 40) return;
      const mat = n.type === 'herb' ? 'herb' : n.type === 'ore' ? 'ore' : 'crystal';
      const matData = A.MATERIALS[mat];
      const pulse = 0.55 + Math.sin(G.time * 3 + n.x) * 0.25;
      const rg = ctx.createRadialGradient(nx, ny - 6, 2, nx, ny - 6, 26);
      rg.addColorStop(0, 'rgba(255,255,255,' + (0.22 * pulse) + ')');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(nx - 28, ny - 34, 56, 56);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(A.art.icon(matData.icon), nx - 11, ny - 24, 22, 22);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.ellipse(nx, ny + 3, 10, 4, 0, 0, 6.283); ctx.fill();
    });

    // ---- camada ordenada ----
    const drawables = [];
    const addD = (y, fn) => { if (y > camY - 200 && y < camY + VH + 240) drawables.push({ y, fn }); };

    // decoração do mapa (árvores/rochas/pilares)
    for (let i = 0; i < G.decor.length; i++) {
      const d = G.decor[i];
      if (d.x < camX - 100 || d.x > camX + VW + 100 || d.y < camY - 100 || d.y > camY + VH + 180) continue;
      addD(d.y, () => ctx.drawImage(d.spr, Math.round(d.x - d.spr.width / 2), Math.round(d.y - d.spr.height)));
    }

    // props altos
    map.props.forEach(pr => {
      if (pr.ground) return;
      addD(pr.py, () => ctx.drawImage(pr.spr, Math.round(pr.px - pr.spr.width / 2), Math.round(pr.py - pr.spr.height)));
    });

    // npcs
    A.NPCS.forEach(n => {
      if (n.prop) return;
      const nx = n.x * T + 16, ny = n.y * T + 30;
      const cls = n.id === 'aldric' ? 'mage' : n.id === 'brann' ? 'warrior' : n.id === 'orla' ? 'mage' : n.id === 'elara' ? 'archer' : n.id === 'nara' ? 'cleric' : n.id === 'banco' ? 'mage' : n.id === 'arauto' ? 'cleric' : 'mage';
      const spr = A.art.actor(n.look, cls, 0, 0);
      addD(ny, () => {
        ctx.fillStyle = 'rgba(0,0,0,.22)';
        ctx.beginPath(); ctx.ellipse(nx, ny + 1, 12, 5, 0, 0, 6.283); ctx.fill();
        ctx.drawImage(spr, nx - 16, ny - 44);
        const bob = Math.sin(G.time * 2 + n.x) * 2;
        const mark = n.marker === 'quest' ? '!' : n.marker === 'shop' ? '⚖' : n.marker === 'heal' ? '✚' : n.marker === 'bank' ? '⛁' : n.marker === 'dungeon' ? '☠' : n.marker === 'board' ? '📋' : '✦';
        ctx.font = 'bold 15px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillStyle = n.marker === 'dungeon' ? '#c07cff' : '#f2b84b';
        ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 3;
        ctx.strokeText(mark, nx, ny - 56 + bob);
        ctx.fillText(mark, nx, ny - 56 + bob);
        const nd = Math.hypot(G.player.x - nx, G.player.y - ny);
        if (nd < 150) {
          ctx.font = '10px Segoe UI';
          ctx.fillStyle = '#f0e8dc';
          ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.lineWidth = 3;
          ctx.strokeText(n.name, nx, ny - 68 + bob);
          ctx.fillText(n.name, nx, ny - 68 + bob);
        }
      });
    });

    // bots
    G.bots.forEach(b => {
      const spr = A.art.actor(b.look, b.cls, b.dir, b.moving ? (Math.floor(b.anim * 2) % 2) + 1 : 0);
      addD(b.y, () => {
        ctx.fillStyle = 'rgba(0,0,0,.22)';
        ctx.beginPath(); ctx.ellipse(b.x, b.y + 1, 11, 4, 0, 0, 6.283); ctx.fill();
        ctx.drawImage(spr, b.x - 16, b.y - 44);
        ctx.font = '9.5px Segoe UI'; ctx.textAlign = 'center';
        ctx.fillStyle = '#8fb8ff'; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.lineWidth = 3;
        ctx.strokeText(b.name, b.x, b.y - 50);
        ctx.fillText(b.name, b.x, b.y - 50);
      });
    });

    // monstros
    G.monsters.forEach(m => {
      if (m.dead) return;
      if (m.x < camX - 120 || m.x > camX + VW + 120 || m.y < camY - 140 || m.y > camY + VH + 140) return;
      addD(m.y, () => G.drawMonster(ctx, m));
    });

    // loot
    G.loot.forEach(l => {
      addD(l.y, () => {
        const bob = Math.sin(G.time * 4 + l.x) * 2;
        const rg = ctx.createRadialGradient(l.x, l.y - 6, 2, l.x, l.y - 6, 24);
        rg.addColorStop(0, l.boss ? 'rgba(255,90,90,.5)' : 'rgba(255,220,120,.45)');
        rg.addColorStop(1, 'rgba(255,220,120,0)');
        ctx.fillStyle = rg; ctx.fillRect(l.x - 26, l.y - 32, 52, 52);
        ctx.drawImage(A.art.icon('coin'), l.x - 9, l.y - 18 + bob, 18, 18);
        if (l.items.some(i => i.kind === 'gear')) {
          ctx.globalAlpha = .8;
          ctx.drawImage(A.art.icon('chest'), l.x + 4, l.y - 12 + bob, 12, 12);
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = 'rgba(0,0,0,.2)';
        ctx.beginPath(); ctx.ellipse(l.x, l.y + 1, 9, 3, 0, 0, 6.283); ctx.fill();
      });
    });

    // armadilhas
    G.traps.forEach(t => {
      addD(t.y, () => {
        ctx.save(); ctx.translate(t.x, t.y);
        ctx.strokeStyle = 'rgba(220,200,140,.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, 6.283); ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * 6.283 + G.time;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); ctx.stroke();
        }
        ctx.restore();
      });
    });

    // jogador
    const pFrame = G.attackAnim > 0 ? 3 : (G.moving ? (Math.floor(G.walkAnim * 2) % 2) + 1 : 0);
    const pSpr = A.art.actor(G.player.look, G.player.cls, G.dir, pFrame);
    addD(G.player.y, () => {
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.beginPath(); ctx.ellipse(G.player.x, G.player.y + 1, 13, 5, 0, 0, 6.283); ctx.fill();
      if (!G.dead) {
        ctx.globalAlpha = .18;
        ctx.fillStyle = A.CLASSES[G.player.cls].color;
        ctx.beginPath(); ctx.ellipse(G.player.x, G.player.y, 20, 8, 0, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(pSpr, G.player.x - 16, G.player.y - 44);
      ctx.font = '10px Segoe UI'; ctx.textAlign = 'center';
      ctx.fillStyle = '#f2dca0'; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 3;
      ctx.strokeText(G.player.name, G.player.x, G.player.y - 51);
      ctx.fillText(G.player.name, G.player.x, G.player.y - 51);
    });

    drawables.sort((a, b) => a.y - b.y);
    drawables.forEach(d => d.fn());

    // projéteis
    G.projectiles.forEach(pr => {
      ctx.save();
      const rg = ctx.createRadialGradient(pr.x, pr.y, 1, pr.x, pr.y, 16);
      rg.addColorStop(0, 'rgba(255,255,255,.9)');
      rg.addColorStop(0.3, pr.color);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(pr.x, pr.y, 15, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.size * 0.5, 0, 6.283); ctx.fill();
      ctx.restore();
    });

    // efeitos
    G.effects.forEach(e => {
      const k = Math.min(1, e.t / e.dur);
      if (e.kind === 'ring') {
        const r = A.lerp(e.r, e.maxR, k);
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = e.color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, 6.283); ctx.stroke();
        ctx.globalAlpha = (1 - k) * 0.25; ctx.fillStyle = e.color;
        ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (e.kind === 'arc') {
        const spread = 0.95 - k * 0.25;
        ctx.globalAlpha = (1 - k) * 0.9;
        ctx.strokeStyle = e.color; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(e.x, e.y, A.lerp(e.r * 0.35, e.r, k), e.ang - spread, e.ang + spread);
        ctx.stroke();
        ctx.globalAlpha = (1 - k) * 0.18;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.arc(e.x, e.y, A.lerp(e.r * 0.35, e.r, k), e.ang - spread, e.ang + spread);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (e.kind === 'telegraph') {
        const r = A.lerp(e.r, e.maxR, k);
        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(k * 20);
        ctx.fillStyle = e.color;
        ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = e.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, 6.283); ctx.stroke();
      } else if (e.kind === 'beam') {
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = e.color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(e.x1, e.y1);
        const seg = 6;
        for (let i = 1; i <= seg; i++) {
          const tt = i / seg;
          ctx.lineTo(A.lerp(e.x1, e.x2, tt) + (i < seg ? A.rand(-5, 5) : 0), A.lerp(e.y1, e.y2, tt) + (i < seg ? A.rand(-5, 5) : 0));
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (e.kind === 'burst') {
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * 6.283;
          const r = k * 40;
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = e.color;
          ctx.fillRect(e.x + Math.cos(a) * r - 2, e.y + Math.sin(a) * r - 2, 4, 4);
        }
        ctx.globalAlpha = 1;
      } else if (e.kind === 'spark') {
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x - 1, e.y - 1, 3, 3);
        ctx.globalAlpha = 1;
      }
    });

    // textos flutuantes
    G.floaters.forEach(f => {
      const k = f.t / f.dur;
      ctx.globalAlpha = 1 - k * k;
      ctx.font = 'bold 15px Segoe UI';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.lineWidth = 4;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    });

    ctx.restore();

    // ---- vinheta/atmosfera por bioma ----
    (function () {
      if (!p) return;
      const zoneKey = A.world.isDungeon() ? (A.world.activeDungeonId || 'cripta') : A.world.zoneAt(Math.floor(p.x / T), Math.floor(p.y / T));
      const tint = { picos: 'rgba(120,200,255,.10)', pantano: 'rgba(90,120,70,.10)', floresta: 'rgba(60,120,70,.08)', ruinas: 'rgba(150,130,100,.08)', costa: 'rgba(220,200,140,.06)', cidadela: 'rgba(170,100,220,.12)', cripta: 'rgba(140,110,200,.10)' }[zoneKey];
      if (tint) {
        const vg = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.25, VW / 2, VH / 2, VH * 0.85);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, tint);
        ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
      }
    })();

    // ---- noite / luzes ----
    G.drawNight(ctx, camX, camY);

    // ---- clima ----
    if (G.weather.type === 'chuva') {
      ctx.save();
      ctx.strokeStyle = 'rgba(170,200,255,.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      G.rain.forEach(d => { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 3, d.y + d.l); });
      ctx.stroke();
      ctx.fillStyle = 'rgba(20,30,60,.14)'; ctx.fillRect(0, 0, VW, VH);
      ctx.restore();
    } else if (G.weather.type === 'neblina') {
      const fg = ctx.createLinearGradient(0, 0, 0, VH);
      fg.addColorStop(0, 'rgba(160,170,190,.05)');
      fg.addColorStop(0.5, 'rgba(160,170,190,.16)');
      fg.addColorStop(1, 'rgba(160,170,190,.06)');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, VW, VH);
    }

    // ---- mira action + alvo ----
    G.drawAim(ctx, camX, camY, p);
    const tg = G.target;
    if (tg && !tg.dead) G.drawTargetUI(ctx, tg, camX, camY);

    // ---- boss bar ----
    const boss = G.monsters.find(m => m.boss && !m.dead && Math.hypot(m.x - p.x, m.y - p.y) < 900);
    if (boss) G.drawBossBar(ctx, boss);

    // ---- fade ----
    if (G.fade > 0) {
      ctx.fillStyle = 'rgba(4,2,8,' + G.fade + ')';
      ctx.fillRect(0, 0, VW, VH);
    }

    // dica de controles no começo
    if (G.player && G.player.playtime < 25) {
      ctx.save();
      ctx.globalAlpha = A.clamp(1 - G.player.playtime / 25, 0, 1);
      ctx.font = '11px Segoe UI'; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(240,232,220,.75)';
      ctx.fillText('WASD mover • botão esq. atacar na mira • botão dir. mover • R auto-caça', VW / 2, VH - 146);
      ctx.restore();
    }
  };

  G.drawAim = function (ctx, camX, camY, p) {
    if (!G.mouse.active || G.dead || G.trans || A.ui.currentWin) return;
    if (G.mouse.x < 0 || G.mouse.y < 0 || G.mouse.x > VW || G.mouse.y > VH) return;
    const ang = Math.atan2(G.mouse.wy - (p.y - 20), G.mouse.wx - p.x);
    const sx = p.x - camX, sy = p.y - camY - 20;
    const range = Math.min(G.attackRange(), 290);
    const over = G.monsterAt(G.mouse.wx, G.mouse.wy);
    const col = over ? '255,138,110' : '242,184,75';
    ctx.save();
    // linha de mira curta
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = 'rgba(' + col + ',.9)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(ang) * 22, sy + Math.sin(ang) * 22);
    ctx.lineTo(sx + Math.cos(ang) * range, sy + Math.sin(ang) * range);
    ctx.stroke();
    ctx.setLineDash([]);
    // retículo no cursor
    const mx = G.mouse.x, my = G.mouse.y;
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = 'rgba(' + col + ',1)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mx, my, over ? 10 : 7, 0, 6.283);
    ctx.moveTo(mx - 13, my); ctx.lineTo(mx - 5, my);
    ctx.moveTo(mx + 5, my); ctx.lineTo(mx + 13, my);
    ctx.moveTo(mx, my - 13); ctx.lineTo(mx, my - 5);
    ctx.moveTo(mx, my + 5); ctx.lineTo(mx, my + 13);
    ctx.stroke();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'rgba(' + col + ',1)';
    ctx.fillRect(mx - 1, my - 1, 2, 2);
    ctx.restore();
  };

  G.drawMonster = function (ctx, m) {
    const spr = A.art.monster(m.type, m.frame);
    const sc = m.elite ? 1.3 : 1;
    const w = spr.width * sc, h = spr.height * sc;
    const x = m.x, y = m.y;
    ctx.fillStyle = 'rgba(0,0,0,.26)';
    ctx.beginPath(); ctx.ellipse(x, y + 1, w * 0.3, 5, 0, 0, 6.283); ctx.fill();
    if (m.boss) {
      const rg = ctx.createRadialGradient(x, y - h / 2, 10, x, y - h / 2, w);
      rg.addColorStop(0, 'rgba(180,60,255,.22)'); rg.addColorStop(1, 'rgba(180,60,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(x - w, y - h * 1.3, w * 2, h * 1.6);
    } else if (m.elite) {
      ctx.strokeStyle = 'rgba(255,180,60,.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, w * 0.4, 9, 0, 0, 6.283); ctx.stroke();
    }
    ctx.drawImage(spr, x - w / 2, y - h, w, h);
    if (m.hurt > 0) {
      const wc = G.whiteOf(spr);
      ctx.globalAlpha = 0.65;
      ctx.drawImage(wc, x - w / 2, y - h, w, h);
      ctx.globalAlpha = 1;
    }
    if (m.stun > 0) {
      ctx.font = '12px Segoe UI'; ctx.textAlign = 'center';
      ctx.fillStyle = '#8fd0ff';
      ctx.fillText('✦', x, y - h - 8);
    }
    const showBar = m.hp < m.maxHp || m.boss || m.elite || m === G.target;
    if (showBar) {
      const bw = m.boss ? 90 : 40;
      const bx = x - bw / 2, by = y - h - 10;
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
      ctx.fillStyle = '#5a2020'; ctx.fillRect(bx, by, bw, 4);
      ctx.fillStyle = m.boss ? '#ff5a5a' : m.elite ? '#f2b84b' : '#e07a5a';
      ctx.fillRect(bx, by, bw * A.clamp(m.hp / m.maxHp, 0, 1), 4);
      ctx.font = '9px Segoe UI'; ctx.textAlign = 'center';
      ctx.fillStyle = m.boss ? '#ffb3b3' : m.elite ? '#ffe2a8' : '#e8e0f0';
      ctx.fillText(m.name + ' • Nv ' + m.level, x, by - 4);
    }
  };

  G.whiteOf = function (spr) {
    let w = G.whiteCache.get(spr);
    if (!w) { w = A.art.white(spr); G.whiteCache.set(spr, w); }
    return w;
  };

  G.drawTargetUI = function (ctx, m, camX, camY) {
    const sx = m.x - camX, sy = m.y - camY;
    const pulse = 0.6 + Math.sin(G.time * 5) * 0.25;
    ctx.strokeStyle = 'rgba(255,120,90,' + pulse + ')';
    ctx.lineWidth = 2;
    const spr = A.art.monster(m.type, 0);
    const rw = Math.max(18, spr.width * 0.35);
    ctx.beginPath(); ctx.ellipse(sx, sy, rw, rw * 0.38, 0, 0, 6.283); ctx.stroke();
    ctx.font = '10px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillStyle = '#ffb3b3';
    ctx.fillText(m.name + ' • Nv ' + m.level, sx, sy - spr.height - 26);
    ctx.font = '9px Segoe UI';
    ctx.fillStyle = m.aggressive ? '#ff8c8c' : '#9fd59f';
    ctx.fillText(m.aggressive ? 'Agressivo' : 'Pacífico', sx, sy - spr.height - 15);
  };

  G.drawBossBar = function (ctx, m) {
    const w = 520, x = (VW - w) / 2, y = 82;
    ctx.save();
    ctx.fillStyle = 'rgba(8,5,14,.88)';
    ctx.strokeStyle = 'rgba(180,90,255,.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, w, 34, 8); ctx.fill(); ctx.stroke();
    ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center';
    ctx.fillStyle = '#e8d8ff';
    ctx.fillText(m.name + ' • Nível ' + m.level, VW / 2, y + 14);
    const bw = w - 20, bh = 8;
    ctx.fillStyle = '#2a0f1a'; ctx.fillRect(x + 10, y + 20, bw, bh);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, '#6a1b3a'); g.addColorStop(0.5, '#c03a5a'); g.addColorStop(1, '#ff5a5a');
    ctx.fillStyle = g;
    ctx.fillRect(x + 10, y + 20, bw * A.clamp(m.hp / m.maxHp, 0, 1), bh);
    ctx.fillStyle = '#ffb3b3'; ctx.font = '9px Segoe UI';
    ctx.fillText(Math.ceil(m.hp) + ' / ' + m.maxHp, VW / 2, y + 19);
    ctx.restore();
  };

  G.drawNight = function (ctx, camX, camY) {
    const h = G.hour();
    let a = 0;
    if (h >= 20 || h < 5) a = 0.58;
    else if (h >= 17) a = (h - 17) / 3 * 0.58;
    else if (h < 7) a = (7 - h) / 2 * 0.58;
    if (a <= 0.01) return;
    ctx.save();
    ctx.fillStyle = 'rgba(10,14,44,' + a + ')';
    ctx.fillRect(0, 0, VW, VH);
    ctx.globalCompositeOperation = 'lighter';
    const lights = [];
    A.world.active.props.forEach(pr => {
      if (pr.name === 'lamp' || pr.name === 'waypoint' || pr.name === 'cauldron') {
        if (pr.px > camX - 220 && pr.px < camX + VW + 220 && pr.py > camY - 220 && pr.py < camY + VH + 220) {
          lights.push({ x: pr.px - camX, y: pr.py - (pr.name === 'waypoint' ? 30 : 42), r: pr.name === 'lamp' ? 115 : 100, c: pr.name === 'cauldron' ? '255,140,60' : '255,200,110', a: 0.5 });
        }
      }
    });
    if (G.player) {
      lights.push({ x: G.player.x - camX, y: G.player.y - 26, r: 110, c: '255,225,170', a: 0.24 });
      G.projectiles.forEach(pr => lights.push({ x: pr.x - camX, y: pr.y - camY, r: 70, c: '200,220,255', a: 0.35 }));
      G.effects.forEach(e => {
        if (e.kind === 'ring' || e.kind === 'burst') lights.push({ x: e.x - camX, y: e.y - camY, r: 80, c: '220,200,255', a: 0.25 * (1 - e.t / e.dur) });
      });
    }
    lights.forEach(l => {
      if (l.x < -l.r || l.y < -l.r || l.x > VW + l.r || l.y > VH + l.r) return;
      const rg = ctx.createRadialGradient(l.x, l.y, 4, l.x, l.y, l.r);
      rg.addColorStop(0, 'rgba(' + l.c + ',' + l.a * a + ')');
      rg.addColorStop(0.55, 'rgba(' + l.c + ',' + l.a * a * 0.35 + ')');
      rg.addColorStop(1, 'rgba(' + l.c + ',0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, 6.283); ctx.fill();
    });
    ctx.restore();
  };

  /* ================================================================== */
  /* DECORAÇÃO ESTÁTICA                                                  */
  /* ================================================================== */
  G.buildDecor = function () {
    const map = A.world.active;
    const decor = [];
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        const id = map.map[y * map.w + x];
        if (id === A.art.TT.TREE) {
          decor.push({ x: x * T + 16, y: y * T + 28, spr: A.art.prop('tree1', (x * 3 + y) % 2) });
        } else if (id === A.art.TT.DARKTREE) {
          const zone = A.world.zoneAt(x, y);
          decor.push({ x: x * T + 16, y: y * T + 28, spr: zone === 'pantano' ? A.art.prop('deadTree', (x + y) % 2) : A.art.prop('tree2', (x * 2 + y) % 2) });
        } else if (id === A.art.TT.ROCK) {
          decor.push({ x: x * T + 16, y: y * T + 28, spr: A.art.prop((x + y) % 3 === 0 ? 'bigRock' : 'rock', (x + y) % 2) });
        } else if (id === A.art.TT.RUINWALL) {
          decor.push({ x: x * T + 16, y: y * T + 30, spr: G.ruinBlock });
        }
      }
    }
    G.decor = decor;
  };

  /* ================================================================== */
  /* HOOKS DE TRANSIÇÃO DE MAPA                                          */
  /* ================================================================== */
  const _spawnMonsters = G.spawnMonsters;
  G.spawnMonsters = function () {
    _spawnMonsters();
    G.buildDecor();
  };

  /* ================================================================== */
  /* UI TITLE / LOGIN                                                    */
  /* ================================================================== */
  A.ui.titlePlay = function () { };
  A.ui.showHelpModal = A.ui.showHelpModal;

  /* ================================================================== */
  /* BOOT                                                                */
  /* ================================================================== */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', G.init);
  else G.init();

})(window.A);
