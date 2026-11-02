/* ==========================================================================
   INTERFACE — menu, criação, HUD, janelas, chat, tooltips
   ========================================================================== */
(function (A) {
  'use strict';

  const U = {
    game: null,
    currentWin: null,
    winData: null,
    wins: {},
    winOrder: [],
    selectedItem: null,
    selectedClass: 'warrior',
    look: { skin: '#f6d7b0', hair: '#8a4a22', hairStyle: 0, outfit: '#3b6fc4', accent: '#e8c14a' },
    channel: 'todos',
    chatMsgs: [],
    previewTimer: null,
    previewFrame: 0,
    hudTimer: 0,
    miniTimer: 0,
    tabs: {},
    selectedMail: 'welcome',
    invFilter: 'all',
    createError: ''
  };

  const SKILL_ICONS = {
    giro: 'sword', investida: 'arrow', grito: 'users', pele: 'shield',
    bolaFogo: 'fire', novaGelo: 'ice', raio: 'bolt', escudo: 'shield',
    tiro: 'arrow', chuva: 'arrow', armadilha: 'trap', passo: 'boot',
    luz: 'heal', julgamento: 'star', bencao: 'shield', renascer: 'heal'
  };

  const NAMES_A = ['Ael', 'Bran', 'Cael', 'Dorian', 'Ely', 'Fen', 'Gal', 'Ith', 'Kael', 'Lyr', 'Mor', 'Nyx', 'Ori', 'Rav', 'Sel', 'Thal', 'Vex', 'Wyn', 'Zar'];
  const NAMES_B = ['dor', 'rin', 'thas', 'mir', 'vyn', 'dan', 'riel', 'nor', 'gorn', 'iel', 'sara', 'wen', 'mar', 'thir', 'eus'];

  const CH = { geral: 'Geral', comercio: 'Comércio', grupo: 'Grupo', guilda: 'Guilda', sistema: 'Sistema' };

  function esc(s) { return A.esc(s); }
  function icon(name) { return A.art.iconURL(name); }
  function tip(html) { return 'data-tip="' + A.esc(encodeURIComponent(html)) + '"'; }
  function pct(a, b) { return Math.max(0, Math.min(100, (a / Math.max(1, b)) * 100)); }

  /* ================================================================== */
  /* INICIALIZAÇÃO                                                       */
  /* ================================================================== */
  U.init = function (game) {
    U.game = game;
    U.injectIcons();
    U.bind();
    U.renderLookSwatches();
    U.updateTitleClock();
    setInterval(U.updateTitleClock, 30000);
    // modal root
    if (!A.$('#modalRoot')) {
      const m = A.el('div', 'modal-root');
      m.id = 'modalRoot';
      document.body.appendChild(m);
    }
  };

  U.injectIcons = function () {
    A.$$('[data-icon]').forEach(el => {
      const n = el.getAttribute('data-icon');
      if (el.tagName === 'IMG') el.src = icon(n);
      else el.style.backgroundImage = 'url(' + icon(n) + ')';
    });
  };

  U.bind = function () {
    document.addEventListener('click', U.onClick);
    document.addEventListener('mouseover', U.onHover);
    document.addEventListener('mousemove', U.onMove);
    document.addEventListener('mouseout', U.onOut);
    document.addEventListener('input', U.onInput);
    document.addEventListener('change', U.onInput);

    const chat = A.$('#chatInput');
    if (chat) {
      chat.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          const text = chat.value.trim();
          if (text) {
            U.game.sendChat(text, U.channel === 'todos' ? 'geral' : U.channel);
            chat.value = '';
          }
          chat.blur();
        } else if (e.key === 'Escape') chat.blur();
      });
    }
    const name = A.$('#charName');
    if (name) name.addEventListener('input', () => { A.$('#previewName').textContent = name.value.trim() || 'Sem nome'; });

    const wins = A.$('#windows');
    if (wins) {
      // foco: a janela clicada sobe para frente, sem fechar as demais
      wins.addEventListener('pointerdown', (e) => {
        const el = e.target.closest('.win');
        if (!el) return;
        const n = el.getAttribute('data-window');
        if (n) U.focusWin(n);
      }, true);
    }
    window.addEventListener('resize', () => U.layoutWins());
    U.bindHoldActions();
  };

  // Segurar +/− distribui vários pontos; um clique simples distribui um.
  U.bindHoldActions = function () {
    U._hold = null;
    U._suppressHoldClick = false;

    const stop = (commit) => {
      const h = U._hold;
      if (!h) return;
      U._hold = null;
      clearTimeout(h.timer);
      clearInterval(h.repeat);
      if (h.started) {
        U._suppressHoldClick = true;
        setTimeout(() => { U._suppressHoldClick = false; }, 240);
        U.updateAttrNumbers();
        if (commit && U.game && U.game.save) U.game.save();
        // Atualiza também os valores derivados (ataque, vida, poder) depois que
        // o gesto termina. O pequeno atraso deixa o clique sintético passar
        // antes de recriar o conteúdo da janela.
        setTimeout(() => {
          if (U.isWinOpen('character')) U.refreshWin('character');
        }, 40);
      }
    };
    U.stopHold = stop;

    document.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const btn = e.target.closest('[data-hold]');
      if (!btn || btn.disabled) return;
      const act = btn.getAttribute('data-act');
      if (act !== 'alloc' && act !== 'dealloc') return;
      if (U._hold) stop(false);
      const stat = btn.getAttribute('data-stat');
      const dir = btn.getAttribute('data-hold') === 'minus' ? -1 : 1;
      U._hold = { stat, dir, timer: 0, repeat: 0, started: false };
      U._hold.timer = setTimeout(() => {
        const h = U._hold;
        if (!h) return;
        h.started = true;
        const add = () => {
          if (!U._hold) return;
          const G = U.game;
          const ok = h.dir < 0 ? G.deallocate(h.stat, true) : G.allocate(h.stat, true);
          if (!ok) { stop(false); return; }
          U.updateAttrNumbers();
        };
        add();
        h.repeat = setInterval(add, 90);
      }, 360);
    });

    window.addEventListener('pointerup', () => stop(true));
    window.addEventListener('pointercancel', () => stop(false));
    window.addEventListener('blur', () => stop(false));
  };

  // Atualização leve durante o "segurar" para não recriar a janela no meio
  // do clique (isso interromperia o gesto no navegador).
  U.updateAttrNumbers = function () {
    const rec = U.wins.character;
    const p = U.game && U.game.player;
    if (!rec || !p) return;
    const root = rec.el;
    const badge = A.$('[data-points-badge]', root);
    if (badge) badge.textContent = p.points + ' pts';
    ['for', 'des', 'int', 'vit'].forEach(k => {
      const v = A.$('[data-attr-val="' + k + '"]', root);
      if (v) v.textContent = p.attrs[k];
      const minus = A.$('[data-act="dealloc"][data-stat="' + k + '"]', root);
      if (minus) minus.disabled = (p.alloc[k] || 0) <= 0;
      const plus = A.$('[data-act="alloc"][data-stat="' + k + '"]', root);
      if (plus) plus.disabled = p.points <= 0;
    });
    const reset = A.$('[data-act="reset-attrs"]', root);
    if (reset) reset.disabled = !['for', 'des', 'int', 'vit'].some(k => (p.alloc[k] || 0) > 0);
  };

  U.onClick = function (e) {
    const winBtn = e.target.closest('[data-win]');
    if (winBtn) {
      const n = winBtn.getAttribute('data-win');
      U.toggleWin(n);
      return;
    }
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.getAttribute('data-act');
    const ds = btn.dataset;
    U._lastClick = e;
    U.action(act, ds, btn);
  };

  U.action = function (act, d, btn) {
    const G = U.game;
    switch (act) {
      case 'title-play':
        U.show('login');
        setTimeout(() => { const i = A.$('#loginName'); if (i) { i.value = A.store.get('aurora.account', ''); i.focus(); } }, 120);
        break;
      case 'title-help': U.showHelpModal(); break;
      case 'title-credits': U.showCredits(); break;
      case 'title-settings': U.showQuickSettings(); break;
      case 'toggle-menu-group': U.showMenuGroup(); break;
      case 'open-win': U.toggleWin(d.win); break;
      case 'goto-title': U.show('title'); break;
      case 'goto-login': U.show('login'); break;
      case 'goto-servers': G.backToServers(); break;
      case 'goto-chars': G.backToChars(); break;
      case 'do-login': {
        const name = (A.$('#loginName').value || '').trim();
        G.login(name);
        break;
      }
      case 'refresh-servers': G.refreshServers(); U.toast('Servidores atualizados.', 'ok'); break;
      case 'server-select': G.openServer(d.id); break;
      case 'char-enter': G.enterCharacter(d.id); break;
      case 'char-new': G.openCreate(); break;
      case 'char-delete': G.deleteCharacter(d.id); break;
      case 'class-select': U.selectedClass = d.cls; U.renderCreate(); break;
      case 'random-name': {
        const n = A.pick(NAMES_A) + A.pick(NAMES_B);
        A.$('#charName').value = n.slice(0, 14);
        A.$('#previewName').textContent = n.slice(0, 14);
        break;
      }
      case 'create-char': U.tryCreate(); break;
      case 'logout': G.logout(); break;
      case 'respawn': G.respawn(); break;
      case 'skill': G.useSkill(parseInt(d.index, 10)); break;
      case 'potion-hp': G.usePotion('potion_hp'); break;
      case 'potion-mp': G.usePotion('potion_mp'); break;
      case 'toggle-chat': {
        const cp = A.$('#chatPanel');
        if (window.innerWidth <= 900) cp.classList.toggle('mobile-open');
        else cp.classList.toggle('min');
        break;
      }
      case 'close-win': U.closeWin(U.winNameFromEl(btn)); break;
      case 'alloc':
        if (U._suppressHoldClick) { U._suppressHoldClick = false; break; }
        G.allocate(d.stat);
        U.refreshWin();
        break;
      case 'dealloc':
        if (U._suppressHoldClick) { U._suppressHoldClick = false; break; }
        G.deallocate(d.stat);
        U.refreshWin();
        break;
      case 'reset-attrs':
        if (G.resetAttributes()) U.refreshWin();
        break;
      case 'quest-track': G.trackQuest(d.id, d.daily === '1'); break;
      case 'select-item': {
        const e = U._lastClick || {};
        const multi = !!(e.ctrlKey || e.metaKey || e.shiftKey);
        if (multi) {
          if (U.selectedItems.has(d.uid)) U.selectedItems.delete(d.uid);
          else U.selectedItems.add(d.uid);
          U.selectedItem = d.uid;
        } else {
          U.selectedItems.clear();
          U.selectedItems.add(d.uid);
          U.selectedItem = d.uid;
        }
        U.refreshWin('inventory');
        break;
      }
      case 'equip-item': {
        const p = G.player;
        const uid = d.uid || U.selectedItem;
        if (uid) { A.sys.equip(p, uid); U.selectedItem = null; U.refreshWin(); }
        break;
      }
      case 'use-item': {
        const p = G.player;
        const uid = d.uid || U.selectedItem;
        if (uid) {
          const r = A.sys.useConsumable(p, uid);
          if (r) {
            if (r.healed) G.floatText(p.x, p.y - 40, '+' + r.healed, '#7dff9a');
            if (r.mana) G.floatText(p.x, p.y - 52, '+' + r.mana, '#8fb8ff');
            A.audio.play('heal');
            U.refreshWin(); U.updateHUD(true);
          }
        }
        break;
      }
      case 'sell-item': {
        const p = G.player;
        const uid = d.uid || U.selectedItem;
        if (uid) {
          const price = A.sys.sellItem(p, uid);
          if (price) { A.audio.play('coin'); U.toast('Vendido por ' + price + ' ouro.', 'ok'); U.selectedItem = null; U.refreshWin(); U.updateHUD(true); }
        }
        break;
      }
      case 'unequip': {
        const p = G.player;
        if (A.sys.unequip(p, d.slot)) U.refreshWin();
        break;
      }
      case 'deposit-item': {
        const p = G.player;
        const uid = d.uid || U.selectedItem;
        if (uid && A.sys.deposit(p, uid)) { U.selectedItem = null; U.refreshWin(); }
        break;
      }
      case 'withdraw-item': {
        const p = G.player;
        if (A.sys.withdraw(p, d.uid)) U.refreshWin();
        break;
      }
      case 'quest-turnin': {
        const p = G.player;
        const r = A.sys.turnInQuest(p, d.id);
        if (r) {
          A.audio.play('level');
          if (r.levels && r.levels.length) G.onLevelUp(r.levels);
          U.toast('Missão concluída! +' + (r.reward.gold || 0) + ' ouro, +' + (r.reward.xp || 0) + ' XP', 'quest');
          if (r.next) U.toast('Nova missão: ' + r.next.title, 'quest');
          G.save();
          U.refreshWin(); U.updateHUD(true);
        }
        break;
      }
      case 'daily-claim': {
        const p = G.player;
        const r = A.sys.claimDaily(p, d.id);
        if (r) {
          A.audio.play('coin');
          U.toast('Recompensa diária: +' + r.reward.gold + ' ouro, +' + r.reward.xp + ' XP', 'quest');
          if (r.levels && r.levels.length) G.onLevelUp(r.levels);
          G.save(); U.refreshWin(); U.updateHUD(true);
        }
        break;
      }
      case 'travel': G.travel(d.zone); break;
      case 'inv-filter': U.invFilter = d.filter; U.refreshWin('inventory'); break;
      case 'win-tab': U.tabs[d.win] = d.tab; U.refreshWin(d.win); break;
      case 'market-buy': {
        const r = A.sys.buyMarket(G.player, d.id);
        if (r.ok) {
          A.audio.play('buy');
          U.toast('Comprado: ' + r.item.name, 'ok');
          G.save(); U.refreshWin(); U.updateHUD(true);
        } else { A.audio.play('error'); U.toast(r.msg, 'erro'); }
        break;
      }
      case 'market-refresh': A.sys.refreshMarket(G.player, true); U.refreshWin(); break;
      case 'craft': {
        const it = A.sys.craft(G.player, d.id);
        if (it) {
          A.audio.play('buy');
          U.toast('Criado: ' + it.name, 'ok');
          G.save(); U.refreshWin();
        } else { A.audio.play('error'); U.toast('Materiais ou nível insuficiente.', 'erro'); }
        break;
      }
      case 'mail-open': U.selectedMail = d.id; A.sys.initMail(G.player); const m = G.player.mail.find(x => x.id === d.id); if (m) m.read = true; U.refreshWin('mail'); U.updateHUD(true); break;
      case 'mail-claim': {
        const a = A.sys.claimMail(G.player, d.id);
        if (a) {
          A.audio.play('coin');
          U.toast('Recompensa do correio resgatada!', 'ok');
          G.save(); U.refreshWin();
        }
        break;
      }
      case 'party-create': G.createParty(); U.refreshWin(); break;
      case 'party-invite': G.inviteParty(); U.refreshWin(); break;
      case 'party-leave': G.leaveParty(); U.refreshWin(); break;
      case 'guild-create': {
        const inp = A.$('#guildName');
        const name = inp ? inp.value.trim() : '';
        if (name.length < 3) { U.toast('Nome de guilda muito curto.', 'erro'); break; }
        G.createGuild(name); U.refreshWin();
        break;
      }
      case 'guild-join': G.joinGuild(d.name); U.refreshWin(); break;
      case 'guild-leave': G.leaveGuild(); U.refreshWin(); break;
      case 'dialogue-choice': G.dialogueChoose(d.npc, parseInt(d.idx, 10)); break;
      case 'npc-action': G.npcAction(d.npc, d.opt); break;
      case 'shop-buy': G.buyShop(d); U.refreshWin(); break;
      case 'shop-tab': U.tabs.shop = d.tab; U.refreshWin('shop'); break;
      case 'endgame-rift': {
        const p = G.player;
        const lvl = parseInt(d.level || '0', 10);
        const r = A.sys.riftRun(p, lvl);
        U.toast(r.msg, r.ok ? 'quest' : 'erro');
        if (r.levels && r.levels.length) G.onLevelUp(r.levels);
        G.save(); U.refreshWin('endgame'); U.updateHUD(true);
        break;
      }
      case 'endgame-raid': {
        const p = G.player;
        const r = A.sys.raidRun(p, d.diff);
        U.toast(r.msg, r.ok ? 'quest' : 'erro');
        if (r.levels && r.levels.length) G.onLevelUp(r.levels);
        G.save(); U.refreshWin('endgame'); U.updateHUD(true);
        break;
      }
      case 'endgame-arena': {
        const p = G.player;
        const r = A.sys.arenaFight(p);
        U.toast(r.msg, r.win ? 'quest' : 'erro');
        if (r.levels && r.levels.length) G.onLevelUp(r.levels);
        G.save(); U.refreshWin('endgame'); U.updateHUD(true);
        break;
      }
      case 'endgame-faction': {
        const p = G.player;
        if (A.sys.factionJoin(p, d.id)) U.toast('Facção escolhida: ' + d.id, 'ok');
        G.save(); U.refreshWin('endgame');
        break;
      }
      case 'endgame-chest': {
        const p = G.player;
        const r = A.sys.chestClaim(p, parseInt(d.tier || '2', 10));
        U.toast(r.msg, r.ok ? 'quest' : 'erro');
        if (r.levels && r.levels.length) G.onLevelUp(r.levels);
        G.save(); U.refreshWin('endgame'); U.updateHUD(true);
        break;
      }
      case 'endgame-season': {
        const p = G.player;
        const r = A.sys.seasonClaim(p);
        U.toast(r.msg, r.ok ? 'quest' : 'erro');
        if (r.levels && r.levels.length) G.onLevelUp(r.levels);
        G.save(); U.refreshWin('endgame'); U.updateHUD(true);
        break;
      }
      case 'sell-selected': {
        const p = G.player;
        const uids = Array.from(U.selectedItems || []);
        let total = 0;
        uids.forEach(uid => {
          const price = A.sys.sellItem(p, uid);
          if (price) total += price;
        });
        U.selectedItems.clear(); U.selectedItem = null;
        A.audio.play('coin');
        U.toast('Vendido por ' + total + ' ouro.', 'ok');
        G.save(); U.refreshWin('inventory'); U.updateHUD(true);
        break;
      }
      case 'deposit-selected': {
        const p = G.player;
        const uids = Array.from(U.selectedItems || []);
        uids.forEach(uid => { A.sys.deposit(p, uid); });
        U.selectedItems.clear(); U.selectedItem = null;
        G.save(); U.refreshWin('inventory'); U.updateHUD(true);
        break;
      }
      case 'disassemble-selected': {
        const p = G.player;
        const uids = Array.from(U.selectedItems || []);
        let count = 0;
        uids.forEach(uid => { if (A.sys.disassemble(p, uid)) count++; });
        U.selectedItems.clear(); U.selectedItem = null;
        A.audio.play('coin');
        U.toast(count + ' item(ns) desmascarado(s).', 'ok');
        G.save(); U.refreshWin('inventory'); U.updateHUD(true);
        break;
      }
      case 'rebind-key': {
        G._rebindingAction = d.action;
        U.toast('Pressione a nova tecla.', 'ok');
        break;
      }
      case 'help': U.showHelpModal(); break;
      case 'save-now': G.save(); U.toast('Progresso salvo.', 'ok'); break;
      case 'export-save': {
        const txt = G.exportSave();
        const ta = A.$('#exportArea');
        if (ta) { ta.value = txt; ta.select(); document.execCommand && document.execCommand('copy'); }
        U.toast('Save copiado para a área de transferência.', 'ok');
        break;
      }
      case 'import-save': {
        const ta = A.$('#importArea');
        if (ta && ta.value.trim()) { G.importSave(ta.value.trim()); }
        else U.toast('Cole um save válido primeiro.', 'erro');
        break;
      }
      case 'reset-save': {
        if (confirm('Isso apaga TODOS os personagens e contas deste navegador. Continuar?')) G.resetAll();
        break;
      }
      case 'mobile-attack': G.actionAttack(true); break;
      case 'dodge': G.tryDodge(); break;
      case 'toggle-auto-hunt': G.toggleAutoHunt(); break;
      case 'mobile-interact': G.interact(); break;
      case 'fullscreen': {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
        else document.exitFullscreen && document.exitFullscreen();
        break;
      }
    }
  };

  U.onHover = function (e) {
    const t = e.target.closest('[data-tip]');
    const tt = A.$('#tooltip');
    if (!t || !tt) return;
    const html = decodeURIComponent(t.getAttribute('data-tip'));
    tt.innerHTML = html;
    tt.classList.remove('hidden');
  };
  U.onMove = function (e) {
    const tt = A.$('#tooltip');
    if (!tt || tt.classList.contains('hidden')) return;
    const pad = 14;
    let x = e.clientX + pad, y = e.clientY + pad;
    const r = tt.getBoundingClientRect();
    if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - pad;
    if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - pad;
    tt.style.left = x + 'px';
    tt.style.top = y + 'px';
  };
  U.onOut = function (e) {
    if (e.target.closest('[data-tip]')) {
      const tt = A.$('#tooltip');
      if (tt) tt.classList.add('hidden');
    }
  };

  U.onInput = function (e) {
    const el = e.target;
    if (el.matches('[data-setting]')) {
      const key = el.getAttribute('data-setting');
      let v = el.type === 'checkbox' ? el.checked : el.type === 'range' ? parseInt(el.value, 10) : el.value;
      U.game.setSetting(key, v);
      const val = el.parentElement.querySelector('.sv');
      if (val && el.type === 'range') val.textContent = v + '%';
    }
  };

  /* ================================================================== */
  /* TELAS                                                               */
  /* ================================================================== */
  U.show = function (id) {
    A.$$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    if (id === 'create') U.startPreview(); else U.stopPreview();
    if (id === 'chars') U.renderChars();
    if (id === 'servers') U.renderServers();
    if (id === 'create') U.renderCreate();
    if (id === 'game') setTimeout(() => { const w = A.$('#world'); if (w) w.focus(); }, 50);
    const modal = A.$('#modalRoot');
    if (modal) modal.innerHTML = '';
  };

  U.setBoot = function (pct, text) {
    const f = A.$('#bootFill'), s = A.$('#bootStatus');
    if (f) f.style.width = A.clamp(pct, 0, 100) + '%';
    if (s && text) s.textContent = text;
  };

  U.bootDone = function () {
    A.$('#bootTip').textContent = A.pick(A.TIPS);
    setTimeout(() => U.show('title'), 450);
  };

  U.updateTitleClock = function () {
    const el = A.$('#titleClock');
    if (!el) return;
    const d = new Date();
    el.textContent = d.toLocaleDateString('pt-BR') + ' • ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  U.loginError = function (msg) {
    const e = A.$('#loginError');
    if (e) e.textContent = msg;
  };

  U.setAccount = function (name) {
    const a = A.$('#serverAccount');
    if (a) a.textContent = name;
  };

  /* ---------------------------- servidores ---------------------------- */
  U.renderServers = function () {
    const wrap = A.$('#serverList');
    if (!wrap) return;
    const G = U.game;
    const account = G.account;
    U.setAccount(account ? account.name : '—');
    wrap.innerHTML = A.SERVERS.map(s => {
      const popPct = s.pop / s.cap * 100;
      const count = account && account.chars && account.chars[s.id] ? account.chars[s.id].length : 0;
      const can = s.status === 'online';
      const tag = s.tag ? '<span class="server-tag ' + (s.tag === 'Novo' ? 'novo' : '') + '">' + s.tag + '</span>' : '';
      return '<div class="server-card ' + (can ? 'selectable' : 'maint') + (popPct > 90 ? ' full' : '') + '"' + (can ? ' data-act="server-select" data-id="' + s.id + '"' : '') + '>' +
        '<div class="server-flag">' + s.region + '</div>' +
        '<div class="server-info">' +
          '<div class="server-name">' + esc(s.name) + tag + '</div>' +
          '<div class="server-meta">' + esc(s.host) + ' • ' + s.channels.length + ' canais • ' + count + '/3 personagens</div>' +
          '<div class="server-pop"><div class="pop-bar ' + (popPct > 70 ? 'busy' : '') + '"><i style="width:' + popPct + '%"></i></div><small>' + A.fmt(s.pop) + ' / ' + A.fmt(s.cap) + '</small></div>' +
        '</div>' +
        '<div class="server-right"><div class="server-status ' + s.status + '">' + (s.status === 'online' ? '● Online' : '◐ Manutenção') + '</div><div class="server-ping">' + s.ping + ' ms</div></div>' +
      '</div>';
    }).join('');
  };

  /* ---------------------------- personagens ---------------------------- */
  U.renderChars = function () {
    const wrap = A.$('#charList');
    if (!wrap) return;
    const G = U.game;
    const server = A.SERVERS.find(s => s.id === G.currentServer) || A.SERVERS[0];
    const chars = G.charsFor(server.id);
    A.$('#charServer').textContent = server.name;
    A.$('#charSlotsInfo').textContent = chars.length + '/3 espaços usados';
    let html = '';
    for (let i = 0; i < 3; i++) {
      const c = chars[i];
      if (c) {
        const cls = A.CLASSES[c.cls];
        html += '<div class="char-card">' +
          '<button class="char-delete" data-act="char-delete" data-id="' + c.id + '" title="Excluir">✕</button>' +
          '<div class="char-portrait"><canvas width="128" height="128" data-portrait="' + esc(JSON.stringify({ look: c.look, cls: c.cls })) + '"></canvas><div class="grade"></div><span class="char-lvl">Nv ' + c.level + '</span></div>' +
          '<div class="char-body">' +
            '<div class="char-name">' + esc(c.name) + '</div>' +
            '<div class="char-class" style="color:' + cls.color + '">' + esc(cls.name) + ' • ' + esc(cls.role.split(' • ')[0]) + '</div>' +
            '<div class="char-meta">' + esc(server.name) + ' • ' + A.fmtTime(c.playtime || 0) + ' jogadas</div>' +
            '<div class="char-last">Último acesso: ' + (c.lastSeen ? new Date(c.lastSeen).toLocaleDateString('pt-BR') : '—') + '</div>' +
            '<div class="char-actions"><button class="btn btn-primary" data-act="char-enter" data-id="' + c.id + '">Entrar</button></div>' +
          '</div>' +
        '</div>';
      } else {
        html += '<div class="char-card empty" data-act="char-new"><div class="char-plus">＋</div><div class="char-empty-label">Criar personagem</div><div class="muted" style="font-size:11px">Espaço livre</div></div>';
      }
    }
    wrap.innerHTML = html;
    A.$$('#charList [data-portrait]').forEach(cv => {
      try {
        const d = JSON.parse(cv.getAttribute('data-portrait'));
        const src = A.art.portrait(d.look, d.cls);
        const g = cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.drawImage(src, 0, 0, 128, 128);
      } catch (e) {}
    });
  };

  /* ---------------------------- criação ---------------------------- */
  U.renderLookSwatches = function () {
    const skins = A.LOOKS.SKINS, hairs = A.LOOKS.HAIRS, outfits = A.LOOKS.OUTFITS;
    const skin = A.$('#skinSwatches'), hair = A.$('#hairSwatches'), outfit = A.$('#outfitSwatches'), style = A.$('#styleSwatches');
    if (!skin) return;
    skin.innerHTML = skins.map(c => '<button class="swatch" data-act="swatch" data-kind="skin" data-val="' + c + '" style="background:' + c + '"></button>').join('');
    hair.innerHTML = hairs.map(c => '<button class="swatch" data-act="swatch" data-kind="hair" data-val="' + c + '" style="background:' + c + '"></button>').join('');
    outfit.innerHTML = outfits.map(c => '<button class="swatch" data-act="swatch" data-kind="outfit" data-val="' + c + '" style="background:' + c + '"></button>').join('');
    style.innerHTML = [0, 1, 2, 3].map(i => '<button class="swatch style" data-act="swatch" data-kind="hairStyle" data-val="' + i + '">' + ['Curto', 'Longo', 'Cauda', 'Capuz'][i] + '</button>').join('');
    // handler dedicado
    [skin, hair, outfit, style].forEach(w => {
      w.addEventListener('click', (e) => {
        const b = e.target.closest('[data-kind]');
        if (!b) return;
        const k = b.getAttribute('data-kind');
        let v = b.getAttribute('data-val');
        if (k === 'hairStyle') v = parseInt(v, 10);
        U.look[k] = v;
        U.renderLookSwatches();
        U.drawPreview();
      });
    });
    U.markSwatches();
  };

  U.markSwatches = function () {
    A.$$('.swatch').forEach(b => {
      const k = b.getAttribute('data-kind'), v = b.getAttribute('data-val');
      let sel = false;
      if (k === 'hairStyle') sel = U.look.hairStyle === parseInt(v, 10);
      else sel = U.look[k] === v;
      b.classList.toggle('selected', sel);
    });
  };

  U.renderCreate = function () {
    const cards = A.$('#classCards');
    if (!cards) return;
    const G = U.game;
    const server = A.SERVERS.find(s => s.id === G.currentServer) || A.SERVERS[0];
    A.$('#createServer').textContent = server.name;
    if (!A.$('#charName').value) {
      const n = A.pick(NAMES_A) + A.pick(NAMES_B);
      A.$('#charName').value = n.slice(0, 14);
      A.$('#previewName').textContent = n.slice(0, 14);
    }
    cards.innerHTML = Object.keys(A.CLASSES).map(k => {
      const c = A.CLASSES[k];
      const diff = c.bars.dificuldade;
      return '<button class="class-card ' + (U.selectedClass === k ? 'selected' : '') + '" data-act="class-select" data-cls="' + k + '">' +
        '<div class="class-icon"><img src="' + icon(c.icon) + '" alt=""></div>' +
        '<div><div class="class-card-name" style="color:' + c.color + '">' + c.name + '</div><div class="class-card-role">' + c.role + '</div>' +
        '<div class="class-diff">' + [1, 2, 3, 4, 5].map(i => '<i class="' + (i <= diff ? 'on' : '') + '"></i>').join('') + '</div></div>' +
      '</button>';
    }).join('');
    const c = A.CLASSES[U.selectedClass];
    const bars = [['Vida', c.bars.vida], ['Ataque', c.bars.ataque], ['Defesa', c.bars.defesa], ['Magia', c.bars.magia], ['Dificuldade', c.bars.dificuldade]];
    A.$('#classSummary').innerHTML = A.sys.classSummary(U.selectedClass) +
      '<div class="stat-bars">' + bars.map(b => '<div class="stat-bar-row"><span>' + b[0] + '</span><div class="sb"><i style="width:' + (b[1] * 20) + '%"></i></div></div>').join('') + '</div>';
    A.$('#previewClass').textContent = c.name;
    if (U.look.accent !== c.color) {
      U.look.accent = c.color;
      U.drawPreview();
    }
    U.markSwatches();
    U.markSwatches();
    U.drawPreview();
  };

  U.startPreview = function () {
    U.stopPreview();
    U.previewTimer = setInterval(() => {
      U.previewFrame = (U.previewFrame + 1) % 4;
      U.drawPreview();
    }, 220);
  };
  U.stopPreview = function () {
    if (U.previewTimer) clearInterval(U.previewTimer);
    U.previewTimer = null;
  };

  U.drawPreview = function () {
    const cv = A.$('#createCanvas');
    if (!cv) return;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const W = cv.width, H = cv.height;
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#2f2448'); grd.addColorStop(1, '#120d1f');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // círculo de luz
    const rg = g.createRadialGradient(W / 2, H * .42, 10, W / 2, H * .42, 130);
    rg.addColorStop(0, 'rgba(242,184,75,.16)'); rg.addColorStop(1, 'rgba(242,184,75,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    // chão
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.beginPath(); g.ellipse(W / 2, H - 32, 62, 12, 0, 0, 6.283); g.fill();
    const spr = A.art.actor(U.look, U.selectedClass, 0, U.previewFrame === 3 ? 1 : 0);
    const sc = 5;
    const bob = U.previewFrame === 1 ? -2 : 0;
    g.drawImage(spr, (W - spr.width * sc) / 2, H - 28 - spr.height * sc + bob, spr.width * sc, spr.height * sc);
    // partículas
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 6.283 + U.previewFrame * .1;
      const rr = 80 + (i % 3) * 18;
      g.fillStyle = i % 2 ? 'rgba(242,184,75,.5)' : 'rgba(167,139,250,.4)';
      g.fillRect(W / 2 + Math.cos(a) * rr, H * .48 + Math.sin(a) * rr * .55, 2, 2);
    }
  };

  U.tryCreate = function () {
    const G = U.game;
    const name = (A.$('#charName').value || '').trim();
    const err = A.$('#createError');
    if (name.length < 3) { err.textContent = 'O nome precisa ter pelo menos 3 letras.'; return; }
    if (name.length > 14) { err.textContent = 'O nome pode ter no máximo 14 letras.'; return; }
    if (!/^[A-Za-zÀ-ÿ0-9 ]+$/.test(name)) { err.textContent = 'Use apenas letras, números e espaços.'; return; }
    if (G.charsFor(G.currentServer).some(c => c.name.toLowerCase() === name.toLowerCase())) {
      err.textContent = 'Já existe um personagem com esse nome neste servidor.';
      return;
    }
    if (G.charsFor(G.currentServer).length >= 3) { err.textContent = 'Você já tem 3 personagens neste servidor.'; return; }
    err.textContent = '';
    G.createCharacter({ name, cls: U.selectedClass, look: Object.assign({}, U.look) });
  };

  /* ================================================================== */
  /* JOGO — ENTRADA E HUD                                                */
  /* ================================================================== */
  U.enterGame = function (p) {
    U.show('game');
    U.closeAllWins();
    U.selectedItem = null;
    U.selectedItems = new Set();
    U.invFilter = 'all';
    const cv = A.$('#hudPortrait');
    if (cv) {
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.clearRect(0, 0, 64, 64);
      g.drawImage(A.art.portrait(p.look, p.cls), 0, 0, 64, 64);
    }
    U.buildSkillBar(p);
    U.clearChat();
    U.addChat('sistema', null, 'Bem-vindo(a) a Aurora, ' + p.name + '!', 'good');
    U.addChat('sistema', null, 'Use WASD para mover, botão esquerdo para atacar na mira e 1–4 para habilidades.', null);
    U.addChat('sistema', null, 'Botão direito move por clique. R liga a auto-caça (alvo, habilidades e coleta).', null);
    U.addChat('sistema', null, 'Pressione E para interagir, I para a mochila, J para missões e M para o mapa.', null);
    U.addChat('sistema', null, 'Clique na missão do HUD ou em Missões para ir ao objetivo. A AUTO continua com menus abertos.', null);
    U.addChat('sistema', null, 'Servidor ' + (A.SERVERS.find(s => s.id === p.server) || {}).name + ' • jogadores online são simulados.', 'warn');
    U.updateHUD(true);
    U.zoneBanner((A.world.isDungeon() ? (A.ZONES[A.world.activeDungeonId || 'cripta'] || {}).name || 'Masmorra' : A.ZONES[A.world.zoneAt(Math.floor(p.x / A.T), Math.floor(p.y / A.T))].name), A.world.isDungeon() ? 'Masmorra' : 'Aurora');
  };

  U.buildSkillBar = function (p) {
    const bar = A.$('#skillBar');
    if (!bar) return;
    const skills = A.SKILLS[p.cls];
    bar.innerHTML = skills.map((s, i) => {
      const ic = SKILL_ICONS[s.id] || 'sigil';
      return '<button class="skill-slot" data-act="skill" data-index="' + i + '" ' + tip(skillTip(s, i)) + '>' +
        '<img src="' + icon(ic) + '" alt="">' +
        '<kbd>' + (i + 1) + '</kbd>' +
        '<span class="mp">' + s.mp + '</span>' +
        '<span class="cd" data-cd="' + i + '"></span>' +
        '<span class="nomana" data-nomana="' + i + '"></span>' +
      '</button>';
    }).join('');
  };

  function skillTip(s, i) {
    return '<div class="tt-name" style="color:#f2b84b">' + s.name + '</div>' +
      '<div class="tt-sub">Tecla ' + (i + 1) + ' • ' + s.mp + ' de mana • recarga ' + s.cd + 's</div>' +
      '<div class="tt-sep"></div><div class="tt-stat">' + s.desc + '</div>';
  }

  U.updateHUD = function (force) {
    const p = U.game.player;
    if (!p) return;
    A.$('#hudName').textContent = p.name;
    A.$('#hudClass').textContent = A.CLASSES[p.cls].name;
    A.$('#hudLevel').textContent = p.level;
    A.$('#hudHpFill').style.width = pct(p.hp, p.maxHp) + '%';
    A.$('#hudHpText').textContent = Math.max(0, Math.round(p.hp)) + ' / ' + p.maxHp;
    A.$('#hudMpFill').style.width = pct(p.mp, p.maxMp) + '%';
    A.$('#hudMpText').textContent = Math.round(p.mp) + ' / ' + p.maxMp;
    const stMax = U.game.staminaMax(p);
    const stFill = A.$('#hudStFill'), stText = A.$('#hudStText');
    if (stFill) stFill.style.width = pct(p.stamina, stMax) + '%';
    if (stText) stText.textContent = Math.round(p.stamina) + ' / ' + stMax + ' vigor';
    const need = A.sys.xpNeed(p.level);
    A.$('#hudXpFill').style.width = pct(p.xp, need) + '%';
    A.$('#hudXpText').textContent = Math.floor(p.xp) + ' / ' + need + ' XP';
    A.$('#hudGold').textContent = A.fmt(p.gold);
    A.$('#hudPower').textContent = A.fmt(p.power);
    A.$('#hudServer').textContent = (A.SERVERS.find(s => s.id === p.server) || {}).name || p.server;
    A.$('#hudPing').textContent = U.game.ping + ' ms';
    A.$('#hudOnline').textContent = A.fmt(U.game.onlineCount()) + ' online';
    A.$('#hudClock').textContent = (U.game.isNight() ? '☾ ' : '☀ ') + U.game.clockString();
    const tile = { x: Math.floor(p.x / A.T), y: Math.floor(p.y / A.T) };
    const zoneKey = U.game.isDungeon() ? (A.world.activeDungeonId || 'cripta') : A.world.zoneAt(tile.x, tile.y);
    const zone = A.ZONES[zoneKey];
    A.$('#hudZone').textContent = zone ? zone.name : 'Aurora';
    A.$('#miniZone').textContent = zone ? zone.name : 'Aurora';
    A.$('#miniCoords').textContent = tile.x + ', ' + tile.y;

    // poções
    A.$('#potionHpCount').textContent = A.sys.countItem(p, 'potion_hp');
    A.$('#potionMpCount').textContent = A.sys.countItem(p, 'potion_mp');

    const hpAuto = A.$('#autoPotionHp');
    const hpPctEl = A.$('#autoPotionHpPct');
    const hpVal = A.$('#autoPotionHpVal');
    if (hpAuto) hpAuto.checked = !!U.game.settings.autoPotionHp;
    if (hpPctEl) hpPctEl.value = U.game.settings.autoPotionHpPct;
    if (hpVal) hpVal.textContent = (U.game.settings.autoPotionHpPct || 50) + '%';
    const mpAuto = A.$('#autoPotionMp');
    const mpPctEl = A.$('#autoPotionMpPct');
    const mpVal = A.$('#autoPotionMpVal');
    if (mpAuto) mpAuto.checked = !!U.game.settings.autoPotionMp;
    if (mpPctEl) mpPctEl.value = U.game.settings.autoPotionMpPct;
    if (mpVal) mpVal.textContent = (U.game.settings.autoPotionMpPct || 30) + '%';

    // habilidades
    const cds = U.game.skillCooldowns || [];
    const skills = A.SKILLS[p.cls];
    skills.forEach((s, i) => {
      const el = A.$('[data-cd="' + i + '"]');
      const nm = A.$('[data-nomana="' + i + '"]');
      if (el) {
        const cd = cds[i] || 0;
        if (cd > 0.05) { el.classList.add('show'); el.textContent = cd >= 10 ? Math.ceil(cd) : cd.toFixed(1); }
        else el.classList.remove('show');
      }
      if (nm) nm.classList.toggle('show', p.mp < s.mp);
    });

    // buffs
    const buffs = U.game.getBuffs();
    A.$('#hudBuffs').innerHTML = buffs.map(b => '<div class="buff' + (b.bad ? ' bad' : '') + '" title="' + esc(b.label) + '">' + b.icon + '<small>' + Math.ceil(b.t) + '</small></div>').join('');

    // esquiva
    const dodgeBtn = A.$('#dodgeBtn');
    if (dodgeBtn) {
      const dcd = U.game.dodgeCd || 0;
      const canDodge = p.stamina >= (U.game.DODGE ? U.game.DODGE.cost : 25) && dcd <= 0;
      dodgeBtn.classList.toggle('cooling', dcd > 0.02);
      dodgeBtn.classList.toggle('no-stamina', p.stamina < (U.game.DODGE ? U.game.DODGE.cost : 25));
      const dEl = A.$('#dodgeCd');
      if (dEl) dEl.textContent = dcd > 0.02 ? (dcd >= 10 ? Math.ceil(dcd) : dcd.toFixed(1)) : '';
      dodgeBtn.title = canDodge ? 'Esquiva (V) — gasta 25 de vigor' : dcd > 0 ? 'Esquiva recarregando…' : 'Vigor insuficiente';
    }

    // missões
    const act = A.sys.activeQuests(p);
    // A missão rastreada tem prioridade no HUD, como no Mir4. Se ela for uma
    // diária, montamos a entrada a partir de p.dailies.
    const tracked = U.game.questTrack;
    let main = tracked ? act.find(q => q.id === tracked.id) : null;
    if (!main && tracked) {
      const dl = p.dailies && p.dailies.list ? p.dailies.list.find(x => x.id === tracked.id) : null;
      if (dl) main = { id: tracked.id, data: tracked.data, st: dl, daily: true };
    }
    if (!main) main = act.find(q => q.id.startsWith('q')) || act[0];
    const hq = A.$('#hudQuest');
    if (main) {
      const pr = main.daily
        ? { cur: main.st.progress, need: main.data.need, done: main.st.progress >= main.data.need }
        : A.sys.questProgress(p, main.id);
      hq.classList.add('trackable');
      hq.setAttribute('data-act', 'quest-track');
      hq.setAttribute('data-id', main.id);
      if (main.daily) hq.setAttribute('data-daily', '1');
      else hq.removeAttribute('data-daily');
      hq.setAttribute('title', 'Clique para rastrear e ir até o objetivo');
      hq.innerHTML = '<div class="q-title"><span>' + esc(main.data.title) + '</span></div>' +
        '<div class="q-desc">' + esc(main.data.desc) + '</div>' +
        (pr.need > 0 ? '<div class="q-prog"><div class="pb"><i style="width:' + pct(pr.cur, pr.need) + '%"></i></div><span>' + pr.cur + '/' + pr.need + '</span></div>' : '') +
        (pr.done ? '<div class="q-done">✓ Pronta para entregar</div>' : '') +
        '<div class="q-go">' + (pr.done ? 'Clique para ir entregar →' : 'Clique para ir ao objetivo →') + '</div>';
    } else {
      hq.classList.remove('trackable');
      hq.removeAttribute('data-act');
      hq.removeAttribute('data-id');
      hq.removeAttribute('data-daily');
      hq.removeAttribute('title');
      hq.innerHTML = '<div class="q-title">Missões</div><div class="q-empty">Fale com Mestre Aldric na praça para começar.</div>';
    }
    const ready = act.filter(q => A.sys.questProgress(p, q.id).done).length;
    const qb = A.$('#questBadge');
    if (qb) { qb.textContent = ready; qb.classList.toggle('show', ready > 0); }
    const unread = A.sys.mailUnread(p);
    const mb = A.$('#mailBadge');
    if (mb) { mb.textContent = unread; mb.classList.toggle('show', unread > 0); }

    A.$$('.hud-btn[data-win]').forEach(b => b.classList.toggle('open', U.isWinOpen(b.getAttribute('data-win'))));

    U.updateAutoHunt();
    if (force) U.renderMinimap(p);
  };

  U.updateAutoHunt = function () {
    const on = !!U.game.autoHunt;
    A.$$('[data-act="toggle-auto-hunt"]').forEach(el => {
      el.classList.toggle('on', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
      const label = el.querySelector('.ah-state');
      if (label) label.textContent = on ? 'ON' : 'OFF';
    });
  };

  U.tick = function (dt) {
    const p = U.game.player;
    if (!p || !A.$('#game').classList.contains('active')) return;
    U.hudTimer += dt;
    U.miniTimer += dt;
    if (U.hudTimer >= 0.12) { U.hudTimer = 0; U.updateHUD(false); }
    if (U.miniTimer >= 0.12) { U.miniTimer = 0; U.renderMinimap(p); }
  };

  U.renderMinimap = function (p) {
    const cv = A.$('#minimap');
    if (!cv) return;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const W = cv.width, H = cv.height;
    g.fillStyle = '#0a0712'; g.fillRect(0, 0, W, H);
    const map = A.world.active;
    const cols = 44, rows = 30, sc = 4;
    const ptx = Math.floor(p.x / A.T), pty = Math.floor(p.y / A.T);
    const sx = ptx - Math.floor(cols / 2), sy = pty - Math.floor(rows / 2);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tx = sx + x, ty = sy + y;
        let col = [10, 7, 18];
        if (tx >= 0 && ty >= 0 && tx < map.w && ty < map.h) {
          col = A.world.MINI[map.map[ty * map.w + tx]] || [20, 14, 30];
          if (map.blocked[ty * map.w + tx]) col = [Math.min(255, col[0] * .65), Math.min(255, col[1] * .65), Math.min(255, col[2] * .65)];
        }
        g.fillStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
        g.fillRect(x * sc, y * sc, sc, sc);
      }
    }
    function dot(wx, wy, color, size) {
      const dx = (wx / A.T - sx) * sc, dy = (wy / A.T - sy) * sc;
      if (dx < 0 || dy < 0 || dx > W || dy > H) return;
      g.fillStyle = color;
      g.fillRect(Math.round(dx - (size || 3) / 2), Math.round(dy - (size || 3) / 2), size || 3, size || 3);
    }
    if (!A.world.isDungeon()) {
      A.NPCS.forEach(n => dot(n.x * A.T + 16, n.y * A.T + 16, '#f2b84b', 4));
      Object.keys(A.world.travelPoints).forEach(k => {
        const t = A.world.travelPoints[k];
        dot(t.x, t.y, p.waypoints[k] ? '#8fd0ff' : '#5a4a80', 4);
      });
      (U.game.bots || []).forEach(b => dot(b.x, b.y, '#8fb8ff', 2));
    } else {
      const ex = A.world.active.exit;
      if (ex) dot(ex.px, ex.py, '#8fd0ff', 4);
    }
    (U.game.monsters || []).forEach(m => { if (m.hp > 0) dot(m.x, m.y, m.boss ? '#ff4a3a' : '#e07a5a', m.boss ? 6 : 2); });
    dot(p.x, p.y, '#ffffff', 5);
    // borda
    g.strokeStyle = 'rgba(242,184,75,.25)'; g.lineWidth = 1; g.strokeRect(.5, .5, W - 1, H - 1);
  };

  U.zoneBanner = function (title, sub) {
    const el = A.$('#zoneBanner');
    if (!el) return;
    el.innerHTML = '<div class="zb-title">' + esc(title) + '</div><div class="zb-line"></div><div class="zb-sub">' + esc(sub) + '</div>';
    el.classList.add('show');
    clearTimeout(U._zbT);
    U._zbT = setTimeout(() => el.classList.remove('show'), 2600);
  };

  U.levelUpFx = function (level) {
    U.toast('Nível ' + level + '! +5 pontos de atributo', 'ach');
    const el = A.$('#zoneBanner');
    if (!el) return;
    el.innerHTML = '<div class="zb-title">NÍVEL ' + level + '</div><div class="zb-line"></div><div class="zb-sub">Você ficou mais forte</div>';
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
  };

  U.showDeath = function (lost) {
    const d = A.$('#death');
    d.classList.remove('hidden');
    A.$('#deathText').textContent = lost > 0
      ? 'Você perdeu ' + A.fmt(lost) + ' de ouro. A escuridão o envolveu… mas Aurora ainda precisa de você.'
      : 'A escuridão o envolveu… mas Aurora ainda precisa de você.';
  };
  U.hideDeath = function () { A.$('#death').classList.add('hidden'); };

  /* ================================================================== */
  /* CHAT                                                                */
  /* ================================================================== */
  U.clearChat = function () {
    U.chatMsgs = [];
    U.renderChat();
  };

  U.addChat = function (channel, from, text, cls) {
    U.chatMsgs.push({ ch: channel, from, text, cls: cls || '', t: Date.now() });
    if (U.chatMsgs.length > 120) U.chatMsgs.shift();
    U.renderChat();
  };

  U.renderChat = function () {
    const list = A.$('#chatList');
    if (!list) return;
    const filter = U.channel;
    const msgs = U.chatMsgs.filter(m => filter === 'todos' || m.ch === filter || m.ch === 'sistema' && filter === 'todos');
    list.innerHTML = msgs.slice(-80).map(m => {
      if (!m.from) return '<div class="chat-line sys ' + m.cls + '">' + esc(m.text) + '</div>';
      return '<div class="chat-line"><span class="ch ' + m.ch + '">' + (CH[m.ch] || m.ch) + '</span><span class="from">' + esc(m.from) + ':</span> ' + esc(m.text) + '</div>';
    }).join('');
    list.scrollTop = list.scrollHeight;
  };

  U.setChannel = function (ch) {
    U.channel = ch;
    A.$$('#chatTabs button').forEach(b => b.classList.toggle('active', b.getAttribute('data-chat') === ch));
    const pref = A.$('#chatPrefix');
    if (pref) pref.textContent = '[' + (ch === 'todos' ? 'Geral' : CH[ch] || ch) + ']';
    U.renderChat();
  };

  /* ================================================================== */
  /* JANELAS                                                             */
  /* ================================================================== */
  function winHTML(out) {
    return '<div class="win-head" title="Arraste para mover a janela"><img class="wi" src="' + icon(out.icon || 'sigil') + '" alt=""><h3>' + out.title + '</h3><span class="wh-sub">' + (out.sub || '') + '</span><button class="win-close" data-act="close-win" title="Fechar">✕</button></div>' +
      (out.tabs || '') +
      '<div class="win-body">' + out.body + '</div>' +
      (out.foot || '');
  }

  function inputKey(el) {
    if (el.id) return '#' + el.id;
    const ds = el.getAttribute('data-setting');
    if (ds) return '[data-setting="' + ds + '"]';
    if (el.name) return '[name="' + el.name + '"]';
    return null;
  }

  function captureWinState(el) {
    const fields = [];
    A.$$('input, textarea, select', el).forEach(f => {
      const key = inputKey(f);
      if (!key) return;
      fields.push({ key, value: f.value, checked: !!f.checked, type: f.type });
    });
    const active = document.activeElement;
    let focus = null;
    if (active && el.contains(active)) {
      const key = inputKey(active);
      if (key) focus = { key, start: active.selectionStart, end: active.selectionEnd };
    }
    const body = A.$('.win-body', el);
    return { fields, focus, scroll: body ? body.scrollTop : 0 };
  }

  function restoreWinState(el, state) {
    if (!state) return;
    state.fields.forEach(f => {
      const node = A.$(f.key, el);
      if (!node) return;
      if (f.type === 'checkbox') node.checked = f.checked;
      else node.value = f.value;
    });
    if (state.focus) {
      const node = A.$(state.focus.key, el);
      if (node && typeof node.focus === 'function') {
        node.focus();
        try { node.setSelectionRange(state.focus.start, state.focus.end); } catch (e) { /* select/checkbox */ }
      }
    }
    const body = A.$('.win-body', el);
    if (body) body.scrollTop = state.scroll;
  }

  U.winNameFromEl = function (el) {
    if (!el || !el.closest) return null;
    const w = el.closest('#windows .win');
    return w ? w.getAttribute('data-window') : null;
  };

  U.isWinOpen = function (name) { return !!(name && U.wins[name]); };

  U.focusWin = function (name) {
    const rec = U.wins[name];
    if (!rec) return;
    U.winOrder = U.winOrder.filter(n => n !== name);
    U.winOrder.push(name);
    U.currentWin = name;
    U.winData = rec.data || null;
    U.applyWinZ();
  };

  U.applyWinZ = function () {
    U.winOrder.forEach((n, i) => {
      const rec = U.wins[n];
      if (!rec) return;
      rec.el.style.zIndex = String(10 + i);
      rec.el.classList.toggle('active-win', n === U.currentWin);
    });
  };

  U.toggleWin = function (name) {
    if (U.isWinOpen(name)) U.closeWin(name);
    else U.openWin(name);
  };

  U.closeWin = function (name) {
    name = name || U.currentWin;
    const rec = U.wins[name];
    if (!rec) return;
    rec.el.remove();
    delete U.wins[name];
    U.winOrder = U.winOrder.filter(n => n !== name);
    if (U.currentWin === name) {
      U.currentWin = U.winOrder.length ? U.winOrder[U.winOrder.length - 1] : null;
      const top = U.currentWin ? U.wins[U.currentWin] : null;
      U.winData = top ? (top.data || null) : null;
    }
    U.applyWinZ();
    U.layoutWins();
    if (U.game.player) U.updateHUD();
    const tt = A.$('#tooltip');
    if (tt) tt.classList.add('hidden');
  };

  U.closeAllWins = function () {
    Object.keys(U.wins).forEach(n => {
      const rec = U.wins[n];
      if (rec) rec.el.remove();
    });
    U.wins = {};
    U.winOrder = [];
    U.currentWin = null;
    U.winData = null;
    if (U.game.player) U.updateHUD();
    const tt = A.$('#tooltip');
    if (tt) tt.classList.add('hidden');
  };

  U.openWin = function (name, data) {
    if (!U.game.player && name !== 'help') return;
    const existing = U.wins[name];
    if (existing) {
      if (data !== undefined) existing.data = data;
      U.focusWin(name);
      if (data !== undefined) U.refreshWin(name);
      return;
    }
    const fn = WINS[name];
    if (!fn) return;
    const p = U.game.player;
    const recData = data !== undefined ? data : null;
    const out = fn(p, recData || {});
    const wrap = A.$('#windows');
    if (!wrap) return;
    const el = A.el('div', 'win ' + (out.cls || ''));
    el.setAttribute('data-window', name);
    el.innerHTML = winHTML(out);
    wrap.appendChild(el);
    const rec = { el, data: recData, custom: false };
    U.wins[name] = rec;
    U.winOrder.push(name);
    U.currentWin = name;
    U.winData = recData;
    U.bindDrag(name, rec);
    U.applyWinZ();
    U.placeNewWin(name, rec);
    if (U.selectedMail && name === 'mail') {
      const m = p.mail && p.mail.find(x => x.id === U.selectedMail);
      if (m) m.read = true;
    }
    U.postRender(name, out, p, el);
    U.updateHUD(true);
  };

  U.refreshWin = function (name) {
    if (!U.winOrder.length) return;
    const p = U.game.player;
    const names = name ? [name] : U.winOrder.slice();
    names.forEach(n => {
      const rec = U.wins[n];
      const fn = WINS[n];
      if (!rec || !fn || !p) return;
      const out = fn(p, rec.data || {});
      const state = captureWinState(rec.el);
      rec.el.className = 'win ' + (out.cls || '') + (U.currentWin === n ? ' active-win' : '');
      rec.el.innerHTML = winHTML(out);
      restoreWinState(rec.el, state);
      U.postRender(n, out, p, rec.el);
    });
    U.applyWinZ();
  };

  U.placeNewWin = function (name, rec) {
    const wrap = A.$('#windows');
    if (!wrap) return;
    // Se nenhuma janela foi movida manualmente, organiza todas lado a lado.
    const custom = U.winOrder.some(n => U.wins[n] && U.wins[n].custom);
    if (!custom) {
      U.layoutWins();
      return;
    }
    const vw = wrap.clientWidth, vh = wrap.clientHeight;
    const r = rec.el.getBoundingClientRect();
    const off = (vw < 1000 ? 60 : 34) * Math.max(0, U.winOrder.length - 1);
    const left = A.clamp((vw - r.width) / 2 + off, 8, Math.max(8, vw - r.width - 8));
    const top = A.clamp((vh - r.height) / 2 + off, 8, Math.max(8, vh - 70));
    rec.el.style.transform = 'none';
    rec.el.style.left = left + 'px';
    rec.el.style.top = top + 'px';
  };

  U.layoutWins = function () {
    const wrap = A.$('#windows');
    if (!wrap) return;
    const recs = U.winOrder.map(n => U.wins[n]).filter(Boolean);
    if (!recs.length) return;
    if (recs.some(r => r.custom)) {
      // janelas movidas pelo jogador mantêm a posição; apenas limita à tela
      recs.forEach(rec => U.constrainWin(rec));
      return;
    }
    const vw = wrap.clientWidth, vh = wrap.clientHeight;

    if (recs.length === 1) {
      recs[0].el.style.left = '';
      recs[0].el.style.top = '';
      recs[0].el.style.transform = '';
      return;
    }

    if (recs.length === 2) {
      const a = recs[0].el, b = recs[1].el;
      const gap = 12;
      const wa = a.offsetWidth, wb = b.offsetWidth;
      const ha = a.offsetHeight, hb = b.offsetHeight;
      if (wa + wb + gap + 16 <= vw) {
        const x0 = Math.max(8, (vw - (wa + wb + gap)) / 2);
        const top = Math.max(8, (vh - Math.max(ha, hb)) / 2);
        a.style.transform = 'none'; b.style.transform = 'none';
        a.style.left = x0 + 'px'; b.style.left = (x0 + wa + gap) + 'px';
        a.style.top = top + 'px'; b.style.top = top + 'px';
        return;
      }
    }

    // fallback: cascata com deslocamento para os cabeçalhos ficarem visíveis
    const step = 60;
    recs.forEach((rec, i) => {
      const r = rec.el.getBoundingClientRect();
      const off = (i - (recs.length - 1) / 2) * step;
      const left = A.clamp((vw - r.width) / 2 + off, 8, Math.max(8, vw - r.width - 8));
      const top = A.clamp((vh - r.height) / 2 + off, 8, Math.max(8, vh - 70));
      rec.el.style.transform = 'none';
      rec.el.style.left = left + 'px';
      rec.el.style.top = top + 'px';
    });
  };

  U.constrainWin = function (rec) {
    const wrap = A.$('#windows');
    if (!wrap) return;
    const el = rec.el;
    if (!el.style.left || el.style.transform !== 'none') return;
    const vw = wrap.clientWidth, vh = wrap.clientHeight;
    const w = el.offsetWidth, h = el.offsetHeight;
    const left = A.clamp(parseFloat(el.style.left) || 0, 0, Math.max(0, vw - Math.min(w, vw)));
    const top = A.clamp(parseFloat(el.style.top) || 0, 0, Math.max(0, vh - 70));
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  };

  U.bindDrag = function (name, rec) {
    // Delegação no próprio .win: o cabeçalho é recriado a cada refresh.
    rec.el.addEventListener('pointerdown', (e) => {
      const head = e.target.closest('.win-head');
      if (!head || !rec.el.contains(head)) return;
      if (e.button !== 0) return;
      if (e.target.closest('button, input, textarea, select, a')) return;
      const wrap = A.$('#windows');
      if (!wrap) return;
      e.preventDefault();
      const el = rec.el;
      const pr = wrap.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const startX = e.clientX, startY = e.clientY;
      const ox = r.left - pr.left, oy = r.top - pr.top;
      el.style.transform = 'none';
      el.style.left = ox + 'px';
      el.style.top = oy + 'px';
      head.classList.add('dragging');
      document.body.classList.add('dragging-win');
      U.focusWin(name);

      const move = (ev) => {
        const w = el.offsetWidth;
        const left = A.clamp(ox + (ev.clientX - startX), 0, Math.max(0, pr.width - w));
        const top = A.clamp(oy + (ev.clientY - startY), 0, Math.max(0, pr.height - 70));
        el.style.left = left + 'px';
        el.style.top = top + 'px';
        rec.custom = true;
      };
      const end = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        head.classList.remove('dragging');
        document.body.classList.remove('dragging-win');
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    });
  };

  U.postRender = function (name, out, p, root) {
    const q = (sel) => root ? A.$(sel, root) : A.$(sel);
    if (name === 'character') {
      const cv = q('#sheetPortrait');
      if (cv) {
        const g = cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.drawImage(A.art.portrait(p.look, p.cls), 0, 0, cv.width, cv.height);
      }
    }
    if (name === 'map') U.drawWorldMap(p, root);
    if (name === 'npc') {
      const rec = root ? U.wins[name] : null;
      const npc = A.NPCS.find(n => n.id === ((rec && rec.data) || U.winData || {}).npc);
      const cv = q('#npcCanvas');
      if (cv && npc) {
        const g = cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        const look = Object.assign({ skin: '#f0c9a0', hair: '#8a4a22' }, npc.look || {});
        const cls = npc.role === 'Ferreiro' ? 'warrior' : npc.role === 'Treinadora' ? 'archer' : npc.role === 'Curandeira' || npc.role === 'Masmorra e Eventos' ? 'cleric' : 'mage';
        const spr = A.art.actor(look, cls, 0, 0);
        g.fillStyle = '#120d1f'; g.fillRect(0, 0, cv.width, cv.height);
        const rg = g.createRadialGradient(55, 42, 5, 55, 42, 60);
        rg.addColorStop(0, 'rgba(242,184,75,.16)'); rg.addColorStop(1, 'rgba(242,184,75,0)');
        g.fillStyle = rg; g.fillRect(0, 0, cv.width, cv.height);
        g.drawImage(spr, cv.width / 2 - 48, cv.height - 104, 96, 132);
      }
    }
    if (name === 'market' || name === 'shop' || name === 'inventory' || name === 'bank' || name === 'craft') {
      // tooltips já embutidos
    }
  };

  /* ---------------------------- HTML helpers ---------------------------- */
  function ringColor(it) { return it && it.color ? it.color : '#c9c4d6'; }

  function itemCell(it, p, extra) {
    if (!it) return '<div class="item-cell empty"></div>';
    const tt = encodeURIComponent(A.sys.itemTooltip(it, it.kind === 'gear' ? p.equipment[it.slot] : null));
    const selected = U.selectedItem === it.uid || (U.selectedItems && U.selectedItems.has(it.uid));
    const rk = it.kind === 'gear' ? (it.rarity || 'comum') : 'comum';
    const rc = (A.RARITY[rk] || A.RARITY.comum).color;
    const bg = String(rc).replace('#', '') + '24';
    const border = String(rc).replace('#', '') + '59';
    return '<button class="item-cell ' + (selected ? 'selected' : '') + '" data-act="select-item" data-uid="' + it.uid + '" data-tip="' + A.esc(tt) + '" style="background:' + bg + ';box-shadow:inset 0 0 0 1px ' + border + ';">' +
      '<span class="rline" style="color:' + rc + '"></span>' +
      '<img src="' + icon(it.icon) + '" alt="">' +
      ((it.qty || 1) > 1 ? '<span class="qty">' + it.qty + '</span>' : '') +
    '</button>';
  }

  function equipCell(p, slot) {
    const it = p.equipment[slot];
    const label = { weapon: 'Arma', chest: 'Peitoral', helmet: 'Elmo', boots: 'Botas', ring: 'Anel', amulet: 'Amuleto' }[slot];
    if (!it) return '<div class="equip-slot"><span class="slot-label">' + label + '</span></div>';
    const tt = encodeURIComponent(A.sys.itemTooltip(it, null));
    const rk = it.rarity || 'comum';
    const rc = (A.RARITY[rk] || A.RARITY.comum).color;
    const bg = String(rc).replace('#', '') + '24';
    const border = String(rc).replace('#', '') + '59';
    return '<button class="equip-slot filled" data-act="unequip" data-slot="' + slot + '" data-tip="' + A.esc(tt) + '" style="background:' + bg + ';box-shadow:inset 0 0 0 1px ' + border + ';">' +
      '<span class="rar" style="color:' + rc + '"></span><img src="' + icon(it.icon) + '" alt=""><span class="slot-label">' + label + '</span>' +
    '</button>';
  }

  function goldHtml(p) {
    return '<span class="bag-gold"><img src="' + icon('coin') + '" alt=""> <b>' + A.fmt(p.gold) + '</b> ouro</span>';
  }

  function emptyCells(n) {
    return '<div class="item-cell empty"></div>'.repeat(Math.max(0, n));
  }

  function progressBar(cur, need) {
    return '<div class="qbar"><div class="pb"><i style="width:' + pct(cur, need) + '%"></i></div><span>' + Math.min(cur, need) + ' / ' + need + '</span></div>';
  }

  /* ---------------------------- WINS ---------------------------- */
  const WINS = {};

  WINS.character = function (p) {
    const c = A.CLASSES[p.cls];
    const at = p.attrs;
    const attrNames = { for: 'Força', des: 'Destreza', int: 'Intelecto', vit: 'Vitalidade' };
    const attrDesc = { for: 'Ataque físico', des: 'Crítico e velocidade', int: 'Mana e magia', vit: 'Vida e defesa' };
    const hasAlloc = ['for', 'des', 'int', 'vit'].some(k => (p.alloc[k] || 0) > 0);
    return {
      title: 'Personagem', icon: 'helmet', sub: c.name + ' • Nível ' + p.level,
      cls: 'mid',
      body: '<div class="sheet-top"><div class="sheet-portrait"><canvas id="sheetPortrait" width="88" height="88"></canvas></div>' +
        '<div><div class="sheet-name">' + esc(p.name) + '</div><div class="sheet-sub" style="color:' + c.color + '">' + c.name + ' • ' + c.role + '</div>' +
        '<div class="sheet-sub">Nível ' + p.level + ' • ' + A.fmtTime(p.playtime) + ' jogadas • ' + (A.SERVERS.find(s => s.id === p.server) || {}).name + '</div></div>' +
        '<div class="sheet-power"><b>' + A.fmt(p.power) + '</b><span>Poder</span></div></div>' +
        '<div class="win-grid-3">' +
          '<div><div class="attr-head"><span class="subhead" style="margin:0">Atributos</span><span class="points-badge" data-points-badge>' + p.points + ' pts</span>' +
            '<button class="btn small attr-reset" data-act="reset-attrs" ' + (hasAlloc ? '' : 'disabled') + '>Redistribuir</button></div>' +
          '<div class="stat-list">' +
            Object.keys(attrNames).map(k => '<div class="attr-row"><span class="an">' + attrNames[k] + '<br><small style="color:#6f6486;font-size:9px">' + attrDesc[k] + '</small></span><span class="av" data-attr-val="' + k + '">' + at[k] + '</span>' +
              '<button class="attr-minus" data-act="dealloc" data-stat="' + k + '" data-hold="minus" title="Remover 1 ponto (segure para remover vários)" ' + ((p.alloc[k] || 0) <= 0 ? 'disabled' : '') + '>−</button>' +
              '<button class="attr-plus" data-act="alloc" data-stat="' + k + '" data-hold="plus" title="Adicionar 1 ponto (segure para adicionar vários)" ' + (p.points <= 0 ? 'disabled' : '') + '>+</button></div>').join('') +
          '</div>' +
          '<div class="subhead" style="margin-top:14px">Combate</div>' +
          '<div class="stat-list">' +
            '<div class="stat-row"><span>Ataque</span><b>' + p.atk + '</b></div>' +
            '<div class="stat-row"><span>Defesa</span><b>' + p.def + '</b></div>' +
            '<div class="stat-row"><span>Vida</span><b>' + p.maxHp + '</b></div>' +
            '<div class="stat-row"><span>Mana</span><b>' + p.maxMp + '</b></div>' +
            '<div class="stat-row"><span>Crítico</span><b>' + p.crit.toFixed(1) + '%</b></div>' +
            '<div class="stat-row"><span>Velocidade</span><b>' + p.speed + '</b></div>' +
          '</div></div>' +
          '<div><div class="subhead">Equipamento</div><div class="equip-grid">' +
            ['weapon', 'chest', 'helmet', 'boots', 'ring', 'amulet'].map(s => equipCell(p, s)).join('') +
          '</div>' +
          '<div class="subhead" style="margin-top:14px">Progresso</div>' +
          '<div class="stat-list">' +
            '<div class="stat-row"><span>Experiência</span><b>' + Math.floor(p.xp) + ' / ' + A.sys.xpNeed(p.level) + '</b></div>' +
            '<div class="stat-row"><span>Monstros derrotados</span><b>' + p.achStats.kills + '</b></div>' +
            '<div class="stat-row"><span>Missões concluídas</span><b>' + p.achStats.quests + '</b></div>' +
            '<div class="stat-row"><span>Mortes</span><b>' + (p.deaths || 0) + '</b></div>' +
            '<div class="stat-row"><span>Conquistas</span><b>' + Object.keys(p.achievements).length + ' / ' + A.ACHIEVEMENTS.length + '</b></div>' +
          '</div></div>' +
          '<div><div class="subhead">Habilidades</div>' +
            A.SKILLS[p.cls].map((s, i) => '<div class="list-row" style="padding:6px 8px"><div class="lr-icon" style="width:30px;height:30px"><img src="' + icon(SKILL_ICONS[s.id] || 'sigil') + '" style="width:22px;height:22px"></div><div class="lr-mid"><div class="lr-name" style="font-size:11.5px">' + s.name + '</div><div class="lr-sub">' + s.mp + ' mana • ' + s.cd + 's</div></div><b style="color:#f2b84b">' + (i + 1) + '</b></div>').join('') +
          '</div>' +
        '</div>',
      foot: '<span>Pressione <b>C</b> para abrir/fechar</span><span class="spacer"></span><span>Dica: cada nível concede 5 pontos. Segure +/− para distribuir vários.</span>'
    };
  };

  WINS.inventory = function (p) {
    const filters = [['all', 'Todos'], ['gear', 'Equipamentos'], ['consumable', 'Consumíveis'], ['material', 'Materiais']];
    const list = p.inventory.filter(it => U.invFilter === 'all' || it.kind === U.invFilter);
    const sel = p.inventory.find(x => x.uid === U.selectedItem);
    const selectedList = p.inventory.filter(it => U.selectedItems && U.selectedItems.has(it.uid));
    const cells = list.map(it => itemCell(it, p)).join('') + emptyCells(Math.max(0, p.bagCap - list.length));
    let detail = '<div class="item-detail"><div class="id-icon"><img src="' + icon('scroll') + '"></div><div><div class="id-name">Nenhum item selecionado</div><div class="id-sub">Clique para selecionar; Ctrl/Shift para seleção múltipla.</div></div></div>';
    if (selectedList.length > 1) {
      const totalSell = selectedList.reduce((s, it) => s + Math.floor((it.value || 1) * (it.kind === 'material' ? .6 : .5) * (it.qty || 1)), 0);
      detail = '<div class="item-detail"><div class="id-icon"><img src="' + icon('chest') + '"></div><div><div class="id-name">' + selectedList.length + ' itens selecionados</div>' +
        '<div class="id-sub">Ações em lote para os itens selecionados.</div></div><div class="id-actions">' +
        '<button class="btn small" data-act="sell-selected">Vender tudo (' + totalSell + 'g)</button>' +
        (!A.world.isDungeon() ? '<button class="btn small" data-act="deposit-selected">Depositar tudo</button>' : '') +
        '<button class="btn small" data-act="disassemble-selected">Desmascarar tudo</button>' +
        '</div></div>';
    } else if (sel) {
      const r = A.RARITY[sel.rarity];
      let acts = '';
      if (sel.kind === 'gear') acts += '<button class="btn small" data-act="equip-item" data-uid="' + sel.uid + '">Equipar</button>';
      if (sel.kind === 'consumable') acts += '<button class="btn small" data-act="use-item" data-uid="' + sel.uid + '">Usar</button>';
      acts += '<button class="btn small" data-act="sell-item" data-uid="' + sel.uid + '">Vender por ' + Math.floor((sel.value || 1) * (sel.kind === 'material' ? .6 : .5) * (sel.qty || 1)) + 'g</button>';
      if (!A.world.isDungeon()) acts += '<button class="btn small" data-act="deposit-item" data-uid="' + sel.uid + '">Depositar</button>';
      detail = '<div class="item-detail"><div class="id-icon"><img src="' + icon(sel.icon) + '"></div><div><div class="id-name" style="color:' + ringColor(sel) + '">' + esc(sel.name) + ' <span style="font-size:10px;color:#a89fbd">' + (r ? r.name : '') + '</span></div>' +
        '<div class="id-sub">' + (sel.kind === 'gear' ? 'Nível ' + sel.ilvl + ' • ' + (A.ITEM_BASES[sel.base] ? A.ITEM_BASES[sel.base].label : sel.slot) : sel.kind === 'consumable' ? 'Consumível' : 'Material') + '</div></div><div class="id-actions">' + acts + '</div></div>';
    }
    return {
      title: 'Mochila', icon: 'chest', sub: p.inventory.length + ' / ' + p.bagCap + ' espaços', cls: 'mid',
      body: '<div class="bag-head">' + filters.map(f => '<button class="btn small ' + (U.invFilter === f[0] ? 'btn-primary' : '') + '" data-act="inv-filter" data-filter="' + f[0] + '">' + f[1] + '</button>').join('') + goldHtml(p) + '</div>' +
        '<div class="item-grid">' + cells + '</div>' + detail,
      foot: '<span>Clique no item para selecionar. Itens equipados não aparecem aqui.</span><span class="spacer"></span><span>Mochila: <b>' + p.inventory.length + '/' + p.bagCap + '</b></span>'
    };
  };

  WINS.quests = function (p) {
    A.sys.initDailies(p);
    const act = A.sys.activeQuests(p);
    const mains = act.filter(q => q.id.startsWith('q'));
    const others = act.filter(q => !q.id.startsWith('q'));
    let body = '<div class="win-grid-2"><div><div class="subhead">Missões principais</div>';
    if (!mains.length) body += '<div class="quest-card"><div class="qc-title">Tudo em dia</div><div class="qc-desc">Fale com Mestre Aldric para continuar a história.</div></div>';
    mains.forEach(q => { body += questCard(p, q); });
    body += '<div class="subhead" style="margin-top:16px">Outras missões</div>';
    if (!others.length) body += '<div class="quest-card"><div class="qc-desc">Nenhuma missão secundária ativa. Confira o Quadro de Recompensas na praça.</div></div>';
    others.forEach(q => { body += questCard(p, q); });
    body += '</div><div><div class="subhead">Diárias — ' + p.dailies.date + '</div>';
    p.dailies.list.forEach(dl => {
      const d = A.SIDE_QUESTS.find(x => x.id === dl.id);
      if (!d) return;
      const done = dl.progress >= d.need;
      body += '<div class="quest-card trackable ' + (done ? 'ready' : '') + '" data-act="quest-track" data-id="' + d.id + '" data-daily="1" title="Clique para rastrear e ir até o objetivo">' +
        '<div class="qc-top"><span class="qc-title">' + d.title + '</span><span class="qc-type">Diária</span></div>' +
        '<div class="qc-desc">' + d.desc + '</div>' + progressBar(dl.progress, d.need) +
        '<div class="qc-reward"><span>Ouro: <b>' + d.rewards.gold + '</b></span><span>XP: <b>' + d.rewards.xp + '</b></span></div>' +
        '<div class="qc-actions"><button class="btn small" data-act="quest-track" data-id="' + d.id + '" data-daily="1">Ir até</button>' +
          '<button class="btn small ' + (done && !dl.claimed ? 'btn-primary' : '') + '" data-act="daily-claim" data-id="' + d.id + '" ' + (!done || dl.claimed ? 'disabled' : '') + '>' + (dl.claimed ? 'Resgatada' : done ? 'Resgatar' : 'Em andamento') + '</button></div>' +
      '</div>';
    });
    const claimed = A.QUESTS.filter(q => p.quests[q.id] && p.quests[q.id].claimed).length;
    body += '<div class="subhead" style="margin-top:16px">Campanha</div>';
    A.CHAPTERS.forEach(ch => {
      const cp = A.sys.chapterProgress(p, ch);
      const unlocked = A.sys.chapterUnlocked(p, ch);
      const status = cp.done ? 'Concluído' : !unlocked ? 'Bloqueado (Nv ' + ch.minLevel + ')' : (cp.claimed + '/' + cp.total + ' missões');
      body += '<div class="quest-card ' + (cp.done ? 'ready' : '') + '" style="' + (!unlocked ? 'opacity:.65' : '') + '">' +
        '<div class="qc-top"><span class="qc-title">' + ch.n + '. ' + esc(ch.title) + '</span><span class="qc-type">' + (cp.done ? '✓' : 'Capítulo') + '</span></div>' +
        '<div class="qc-desc">' + esc(ch.subtitle) + '<br>' + esc(ch.intro) + '</div>' +
        '<div class="qc-reward"><span>Progresso: <b>' + status + '</b></span>' + (!unlocked ? '<span>Nível mínimo: <b>' + ch.minLevel + '</b></span>' : '') + '</div>' +
      '</div>';
    });
    body += '<div class="subhead" style="margin-top:16px">História</div><div class="quest-card"><div class="qc-desc">Missões principais concluídas: <b>' + claimed + ' / ' + A.QUESTS.length + '</b></div>' +
      '<div class="qc-desc">Capítulo atual: <b>' + (p.story ? p.story.chapter : 1) + ' / 8</b></div></div>';
    body += '</div></div>';
    return {
      title: 'Missões', icon: 'scroll', sub: act.length + ' ativas', cls: 'wide',
      body: body,
      foot: '<span>Pressione <b>J</b> para abrir/fechar</span><span class="spacer"></span><span>Missões concluídas: <b>' + p.achStats.quests + '</b></span>'
    };
  };

  function questCard(p, q) {
    const d = q.data;
    const pr = A.sys.questProgress(p, q.id);
    const rw = d.reward || d.rewards || {};
    let itemsTxt = (rw.items || []).map(i => (A.MATERIALS[i.id] || A.CONSUMABLES[i.id] || {}).name || i.id).join(', ');
    return '<div class="quest-card trackable ' + (pr.done ? 'ready' : '') + '" data-act="quest-track" data-id="' + d.id + '" title="Clique para rastrear e ir até o objetivo">' +
      '<div class="qc-top"><span class="qc-title">' + esc(d.title) + '</span><span class="qc-type">' + (d.id.startsWith('q') ? 'Principal' : 'Caçada') + '</span></div>' +
      '<div class="qc-desc">' + esc(d.desc) + '</div>' + progressBar(pr.cur, pr.need) +
      '<div class="qc-reward"><span>Ouro: <b>' + (rw.gold || 0) + '</b></span><span>XP: <b>' + (rw.xp || 0) + '</b></span>' + (itemsTxt ? '<span>Itens: <b>' + esc(itemsTxt) + '</b></span>' : '') + '</div>' +
      '<div class="qc-actions"><button class="btn small" data-act="quest-track" data-id="' + d.id + '">Ir até</button>' +
        '<button class="btn small ' + (pr.done ? 'btn-primary' : '') + '" data-act="quest-turnin" data-id="' + d.id + '" ' + (pr.done ? '' : 'disabled') + '>' + (pr.done ? 'Entregar recompensa' : 'Em andamento') + '</button></div>' +
    '</div>';
  }

  WINS.endgame = function (p) {
    A.sys.endgameWeek(p);
    const eg = p.endgame || {};
    const tab = U.tabs.endgame || 'visao';
    const tabs = [['visao', 'Visão'], ['fendas', 'Fendas'], ['raid', 'Raid'], ['arena', 'Arena'], ['temporada', 'Temporada']];
    let body = '<div class="win-tabs">' + tabs.map(t => '<button class="tab ' + (tab === t[0] ? 'active' : '') + '" data-act="win-tab" data-win="endgame" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
    if (tab === 'visao') {
      body += '<div class="quest-card"><div class="qc-title">Endgame</div>' +
        '<div class="qc-desc">Chaves de fenda: <b>' + (eg.keys || 0) + '</b> • Fragmentos: <b>' + (eg.fragments || 0) + '</b> • Relíquias: <b>' + (eg.relics || []).length + '</b></div>' +
        '<div class="qc-desc">Fenda máxima: <b>+' + ((eg.best && eg.best.rift) || 0) + '</b> • Raid: <b>' + ((eg.best && eg.best.raid) || 0) + '</b> • Arena: <b>' + ((eg.arena && eg.arena.rating) || 1000) + ' ELO</b></div>' +
        '<div class="qc-desc">Atividades semanais: <b>' + (eg.activities || 0) + '/8</b> • Baú resgatado: <b>' + (eg.chestClaimed || 0) + '</b></div>' +
        '<div class="qc-desc">Facção: <b>' + (eg.faction || 'nenhuma') + '</b> • Reputação: <b>' + (eg.rep || 0) + '</b> • Temporada: <b>' + ((eg.season && eg.season.level) || 0) + '/40</b></div>' +
        '<div class="qc-actions">' +
        [2, 4, 8].map(tier => '<button class="btn small ' + ((eg.activities || 0) >= tier && (eg.chestClaimed || 0) < tier ? 'btn-primary' : '') + '" data-act="endgame-chest" data-tier="' + tier + '" ' + (!((eg.activities || 0) >= tier) ? 'disabled' : '') + '>Baú ' + tier + ' ativ.</button>').join('') +
        '<button class="btn small" data-act="endgame-season">Resgatar temporada</button>' +
        '</div></div>';
    } else if (tab === 'fendas') {
      const best = (eg.best && eg.best.rift) || 0;
      body += '<div class="quest-card"><div class="qc-title">Fendas de Aurora</div><div class="qc-desc">Use uma chave para abrir uma fenda. Nível máximo desbloqueado: +' + (best + 1) + '.</div>' +
        '<div class="qc-actions">' + [0, 1, 2, 3, 4, 5].map(lv => {
          const lvl = Math.min(15, Math.max(0, best + 1 - (5 - lv)));
          return '<button class="btn small" data-act="endgame-rift" data-level="' + lvl + '">Fenda +' + lvl + '</button>';
        }).join('') + '</div>' +
        '<div class="qc-desc">Recompensa: fragmentos, XP, ouro e reputação. Chaves vêm de chefes de campanha.</div></div>';
    } else if (tab === 'raid') {
      body += '<div class="quest-card"><div class="qc-title">Raid da Cidadela</div><div class="qc-desc">8 jogadores (aliados simulados) enfrentam o Arauto. Dificuldades com lockout semanal de loot.</div>' +
        '<div class="qc-actions">' +
        ['normal', 'heroico', 'mitico'].map(d => '<button class="btn small" data-act="endgame-raid" data-diff="' + d + '">Raid ' + d + '</button>').join('') +
        '</div><div class="qc-desc">Relíquias caem em Heroico e Mítico. Replay livre, loot uma vez por semana.</div></div>';
    } else if (tab === 'arena') {
      body += '<div class="quest-card"><div class="qc-title">Arena de Ecos</div><div class="qc-desc">Enfrente ecos de builds simuladas. ELO atual: ' + ((eg.arena && eg.arena.rating) || 1000) + ' • V/D: ' + ((eg.arena && eg.arena.wins) || 0) + '/' + ((eg.arena && eg.arena.losses) || 0) + '.</div>' +
        '<div class="qc-actions"><button class="btn small btn-primary" data-act="endgame-arena">Lutar agora</button></div></div>';
    } else if (tab === 'temporada') {
      const factions = [['aurora', 'Guardiões de Aurora'], ['eclipse', 'Ordem do Eclipse'], ['geada', 'Filhos da Geada']];
      body += '<div class="quest-card"><div class="qc-title">Facções</div><div class="qc-desc">Escolha uma facção. Atividades de endgame geram reputação.</div>' +
        '<div class="qc-actions">' + factions.map(f => '<button class="btn small ' + (eg.faction === f[0] ? 'btn-primary' : '') + '" data-act="endgame-faction" data-id="' + f[0] + '">' + f[1] + '</button>').join('') + '</div></div>';
      body += '<div class="quest-card"><div class="qc-title">Temporada (10 semanas)</div><div class="qc-desc">Nível ' + ((eg.season && eg.season.level) || 0) + '/40 • XP: ' + ((eg.season && eg.season.xp) || 0) + '.</div>' +
        '<div class="qc-actions"><button class="btn small btn-primary" data-act="endgame-season">Resgatar recompensas</button></div></div>';
    }
    return { title: 'Endgame', icon: 'star', sub: 'Conteúdo de alto nível', cls: 'wide', body: body,
      foot: '<span>Fendas, raid, arena e temporada são simulados localmente.</span>' };
  };

  WINS.map = function (p) {
    const wp = A.WAYPOINTS;
    return {
      title: 'Mapa de Aurora', icon: 'map', sub: 'Mundo aberto', cls: 'wide',
      body: '<div class="map-wrap"><canvas id="mapCanvas" width="750" height="500"></canvas>' +
        '<div class="map-legend"><span><i style="background:#4f8a3a"></i>Campos</span><span><i style="background:#2f5c34"></i>Floresta</span><span><i style="background:#d9c08a"></i>Costa</span><span><i style="background:#7c746a"></i>Ruínas</span><span><i style="background:#4a5b3a"></i>Pântano</span><span><i style="background:#bde8ff"></i>Picos</span><span><i style="background:#f2b84b"></i>Vila</span></div>' +
        '<div class="travel-list">' + wp.map(w => {
          const ok = p.waypoints[w.id];
          return '<button class="travel-btn ' + (ok ? '' : 'locked') + '" ' + (ok ? 'data-act="travel" data-zone="' + w.id + '"' : 'disabled') + '>' + w.name + '<small>' + (ok ? 'Viajar' : 'Não desbloqueado') + '</small></button>';
        }).join('') + '</div></div>',
      foot: '<span>Clique em um ponto de viagem desbloqueado para viajar.</span><span class="spacer"></span><span>Explorados: <b>' + Object.keys(p.waypoints).length + '/' + wp.length + '</b></span>'
    };
  };

  U.drawWorldMap = function (p, root) {
    const cv = root ? A.$('#mapCanvas', root) : A.$('#mapCanvas');
    if (!cv) return;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const map = A.world.overworld.minimap;
    const sc = cv.width / A.MW;
    g.drawImage(map, 0, 0, cv.width, cv.height);
    // névoa suave nas bordas
    g.fillStyle = 'rgba(10,7,18,.08)'; g.fillRect(0, 0, cv.width, cv.height);
    function marker(wx, wy, color, size, label) {
      const x = (wx / A.T) * sc, y = (wy / A.T) * sc;
      g.fillStyle = color;
      g.beginPath(); g.arc(x, y, size || 4, 0, 6.283); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 1; g.stroke();
      if (label) {
        g.font = '10px Segoe UI'; g.fillStyle = '#f0e8dc';
        g.textAlign = 'center';
        g.fillText(label, x, y - 8);
      }
    }
    A.WAYPOINTS.forEach(w => marker(w.x * A.T + 16, w.y * A.T + 16, p.waypoints[w.id] ? '#8fd0ff' : '#5a4a80', 4, w.name));
    A.NPCS.forEach(n => { if (!n.prop) marker(n.x * A.T + 16, n.y * A.T + 16, '#f2b84b', 3); });
    marker(75 * A.T, 86 * A.T, '#b07cff', 5, 'Cripta');
    marker(182 * A.T, 72 * A.T, '#d08cff', 5, 'Cidadela');
    marker(p.x, p.y, '#ffffff', 5);
    // rótulos de zona
    g.font = 'bold 11px Georgia'; g.textAlign = 'center'; g.fillStyle = 'rgba(240,232,220,.65)';
    g.fillText('CAMPOS VERDES', 60 * sc, 18 * sc);
    g.fillText('COSTA PARTIDA', 14 * sc, 58 * sc);
    g.fillText('FLORESTA DE ÉBANO', 126 * sc, 22 * sc);
    g.fillText('RUÍNAS DE SOLMAR', 76 * sc, 90 * sc);
    g.fillText('PÂNTANO CINZENTO', 126 * sc, 88 * sc);
    g.fillText('VILA AURORA', 75 * sc, 43 * sc);
  };

  WINS.social = function (p) {
    const tab = U.tabs.social || 'grupo';
    const G = U.game;
    let body = '<div class="tab-bar">' +
      [['grupo', 'Grupo'], ['guilda', 'Guilda'], ['online', 'Online (' + (G.bots ? G.bots.length : 0) + ')']].map(t => '<button class="' + (tab === t[0] ? 'active' : '') + '" data-act="win-tab" data-win="social" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
    if (tab === 'grupo') {
      if (p.party) {
        body += '<div class="party-box"><div class="subhead">Grupo de ' + esc(p.party.leader) + '</div>' +
          p.party.members.map(m => '<div class="member-row"><div class="member-avatar">' + esc(m.name[0]) + '</div><span>' + esc(m.name) + '</span><span class="lv">Nv ' + m.level + '</span><div class="hpbar"><i style="width:' + m.hpPct + '%"></i></div></div>').join('') +
          '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn small" data-act="party-invite">Convidar jogador</button><button class="btn small danger" data-act="party-leave">Sair do grupo</button></div></div>' +
          '<p class="muted" style="font-size:11px;margin-top:10px">Membros do grupo recebem +10% de experiência. Jogadores simulados entram instantaneamente.</p>';
      } else {
        body += '<div class="party-box"><div class="subhead">Sem grupo</div><p class="muted" style="font-size:12px;line-height:1.6">Junte-se a outros aventureiros para ganhar +10% de XP e dividir o perigo. Você pode criar um grupo e convidar jogadores simulados.</p>' +
          '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-primary small" data-act="party-create">Criar grupo</button><button class="btn small" data-act="party-invite">Entrar em grupo aleatório</button></div></div>';
      }
    } else if (tab === 'guilda') {
      if (p.guild) {
        body += '<div class="guild-box"><div class="subhead">' + esc(p.guild.name) + '</div><p class="muted" style="font-size:11.5px">Membros: ' + p.guild.members.length + ' • Fundada em ' + new Date(p.guild.created).toLocaleDateString('pt-BR') + '</p>' +
          p.guild.members.map(m => '<div class="member-row"><div class="member-avatar">' + esc(m.name[0]) + '</div><span>' + esc(m.name) + '</span><span class="lv">' + m.rank + '</span></div>').join('') +
          '<button class="btn small danger" style="margin-top:10px" data-act="guild-leave">Sair da guilda</button></div>';
      } else {
        body += '<div class="guild-box"><div class="subhead">Fundar guilda</div><div class="input-row"><input id="guildName" type="text" maxlength="20" placeholder="Nome da guilda" style="flex:1;padding:9px 11px;border-radius:7px;background:rgba(0,0,0,.3);border:1px solid rgba(167,139,250,.25);color:#ece5f6"><button class="btn small btn-primary" data-act="guild-create">Fundar (500g)</button></div>' +
          '<div class="subhead" style="margin-top:14px">Guildas abertas</div>' +
          A.GUILD_NAMES.map(n => '<div class="list-row"><div class="lr-icon"><img src="' + icon('shield') + '"></div><div class="lr-mid"><div class="lr-name">' + n + '</div><div class="lr-sub">' + A.GUILD_MEMBERS.length + ' membros • Recrutando</div></div><button class="btn small" data-act="guild-join" data-name="' + n + '">Entrar</button></div>').join('') + '</div>';
      }
    } else {
      body += '<div class="online-box"><div class="subhead">Jogadores online — ' + (A.SERVERS.find(s => s.id === p.server) || {}).name + '</div>' +
        (G.bots || []).map(b => '<div class="online-row"><span class="online-dot"></span><span>' + esc(b.name) + '</span><span style="color:#6f6486;font-size:10px">Nv ' + b.level + ' ' + A.CLASSES[b.cls].name + '</span><span class="on-zone">' + b.zone + '</span></div>').join('') +
        '<p class="muted" style="font-size:10.5px;margin-top:10px">Estes jogadores fazem parte da simulação local do servidor.</p></div>';
    }
    return {
      title: 'Social', icon: 'users', sub: (p.party ? 'Em grupo' : 'Sem grupo') + ' • ' + (p.guild ? p.guild.name : 'Sem guilda'),
      cls: 'small', body: body
    };
  };

  WINS.achievements = function (p) {
    const stats = {
      kills: p.achStats.kills, level: p.level, gold: p.gold,
      waypoints: Object.keys(p.waypoints).length, quests: p.achStats.quests,
      crafts: p.achStats.crafts, boss: p.achStats.boss,
      party: p.party ? 1 : 0, guild: p.guild ? 1 : 0
    };
    return {
      title: 'Conquistas', icon: 'crown', sub: Object.keys(p.achievements).length + ' / ' + A.ACHIEVEMENTS.length, cls: 'wide',
      body: '<div class="ach-grid">' + A.ACHIEVEMENTS.map(a => {
        const val = stats[a.stat] || 0;
        const done = !!p.achievements[a.id];
        return '<div class="ach-card ' + (done ? 'done' : '') + '"><div class="ach-icon"><img src="' + icon(a.icon) + '"></div><div style="flex:1"><div class="ach-name">' + a.name + '</div><div class="ach-desc">' + a.desc + '</div><div class="ach-prog"><div class="pb"><i style="width:' + pct(val, a.goal) + '%"></i></div><span>' + Math.min(val, a.goal) + '/' + a.goal + '</span></div></div></div>';
      }).join('') + '</div>',
      foot: '<span>Conquistas são salvas junto com o personagem.</span>'
    };
  };

  WINS.skills = function (p) {
    return {
      title: 'Habilidades', icon: 'star', sub: A.CLASSES[p.cls].name, cls: 'small',
      body: A.SKILLS[p.cls].map((s, i) => '<div class="skill-row"><div class="sk-icon"><img src="' + icon(SKILL_ICONS[s.id] || 'sigil') + '"></div><div><div class="sk-name">' + s.name + '</div><div class="sk-desc">' + s.desc + '</div></div><div class="sk-meta"><b>' + (i + 1) + '</b>' + s.mp + ' mana<br>' + s.cd + 's recarga</div></div>').join(''),
      foot: '<span>Use as teclas 1–4 durante o combate.</span>'
    };
  };

  WINS.market = function (p) {
    A.sys.refreshMarket(p);
    const tab = U.tabs.market || 'comprar';
    const m = p.market;
    let body = '<div class="bag-head"><div class="tab-bar" style="margin:0"><button class="' + (tab === 'comprar' ? 'active' : '') + '" data-act="win-tab" data-win="market" data-tab="comprar">Comprar</button><button class="' + (tab === 'vender' ? 'active' : '') + '" data-act="win-tab" data-win="market" data-tab="vender">Vender</button></div>' + goldHtml(p) + '</div>';
    if (tab === 'comprar') {
      body += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span class="muted" style="font-size:11px">Anúncios renovam em ' + Math.max(0, Math.ceil((m.until - Date.now()) / 60000)) + ' min</span><button class="btn small" data-act="market-refresh">↻ Renovar</button></div>';
      body += m.listings.map(l => {
        const r = A.RARITY[l.item.rarity] || A.RARITY.comum;
        return '<div class="list-row"><div class="lr-icon"><img src="' + icon(l.item.icon) + '"></div><div class="lr-mid"><div class="lr-name" style="color:' + r.color + '">' + esc(l.item.name) + '</div><div class="lr-sub">' + (l.item.kind === 'gear' ? 'Nv ' + l.item.ilvl + ' • ' + r.name : 'x' + l.item.qty + ' • ' + (A.MATERIALS[l.item.id] ? 'Material' : 'Consumível')) + ' • Vendido por ' + esc(l.seller) + '</div></div><span class="lr-price">' + A.fmt(l.price) + 'g</span><button class="btn small btn-primary lr-btn" data-act="market-buy" data-id="' + l.id + '">Comprar</button></div>';
      }).join('');
    } else {
      const list = p.inventory.filter(it => it.kind === 'gear' || it.kind === 'material' || it.kind === 'consumable');
      body += list.length ? list.map(it => {
        const price = Math.max(1, Math.floor((it.value || 1) * (it.kind === 'material' ? .6 : .5) * (it.qty || 1)));
        return '<div class="list-row"><div class="lr-icon"><img src="' + icon(it.icon) + '"></div><div class="lr-mid"><div class="lr-name">' + esc(it.name) + (it.qty > 1 ? ' x' + it.qty : '') + '</div><div class="lr-sub">' + (it.kind === 'gear' ? 'Nv ' + it.ilvl : it.kind) + '</div></div><span class="lr-price">' + A.fmt(price) + 'g</span><button class="btn small lr-btn" data-act="sell-item" data-uid="' + it.uid + '">Vender</button></div>';
      }).join('') : '<p class="muted">Nada para vender.</p>';
    }
    return {
      title: 'Mercado', icon: 'coin', sub: 'Leilão de Aurora', cls: 'wide', body: body,
      foot: '<span>O mercado é simulado com anúncios de outros jogadores.</span>'
    };
  };

  WINS.bank = function (p) {
    const bag = p.inventory.map(it => '<div class="list-row" style="padding:6px 8px"><div class="lr-icon" style="width:30px;height:30px"><img src="' + icon(it.icon) + '" style="width:22px;height:22px"></div><div class="lr-mid"><div class="lr-name" style="font-size:11.5px">' + esc(it.name) + (it.qty > 1 ? ' x' + it.qty : '') + '</div></div><button class="btn small" data-act="deposit-item" data-uid="' + it.uid + '">→</button></div>').join('') || '<p class="muted" style="font-size:11px">Mochila vazia.</p>';
    const bank = p.bank.map(it => '<div class="list-row" style="padding:6px 8px"><div class="lr-icon" style="width:30px;height:30px"><img src="' + icon(it.icon) + '" style="width:22px;height:22px"></div><div class="lr-mid"><div class="lr-name" style="font-size:11.5px">' + esc(it.name) + (it.qty > 1 ? ' x' + it.qty : '') + '</div></div><button class="btn small" data-act="withdraw-item" data-uid="' + it.uid + '">←</button></div>').join('') || '<p class="muted" style="font-size:11px">Banco vazio.</p>';
    return {
      title: 'Banco de Aurora', icon: 'chest', sub: 'Armazenamento compartilhado', cls: 'wide',
      body: '<div class="two-col"><div class="bank-col"><h4>Mochila (' + p.inventory.length + '/' + p.bagCap + ')</h4>' + bag + '</div><div class="bank-col"><h4>Banco (' + p.bank.length + ')</h4>' + bank + '</div></div>',
      foot: '<span>O banco é compartilhado entre os personagens da conta neste servidor.</span>'
    };
  };

  WINS.craft = function (p) {
    return {
      title: 'Criação', icon: 'anvil', sub: 'Ferreiro Brann', cls: 'wide',
      body: A.RECIPES.map(r => {
        const can = A.sys.canCraft(p, r);
        const mats = Object.keys(r.mats).map(m => {
          const have = A.sys.countItem(p, m);
          return '<span class="' + (have >= r.mats[m] ? 'ok' : 'no') + '">' + (A.MATERIALS[m] ? A.MATERIALS[m].name : m) + ' ' + have + '/' + r.mats[m] + '</span>';
        }).join('');
        return '<div class="craft-row"><div class="cr-icon"><img src="' + icon(r.icon) + '"></div><div style="flex:1"><div class="cr-name">' + r.name + '</div><div class="cr-mats">' + mats + '</div><div class="muted" style="font-size:9.5px;margin-top:3px">Requer nível ' + r.level + '</div></div><div class="cr-actions"><button class="btn small ' + (can ? 'btn-primary' : '') + '" data-act="craft" data-id="' + r.id + '" ' + (can ? '' : 'disabled') + '>Criar</button></div></div>';
      }).join(''),
      foot: '<span>Materiais vêm de monstros e nós de coleta pelo mundo.</span>'
    };
  };

  WINS.mail = function (p) {
    A.sys.initMail(p);
    if (!p.mail.find(m => m.id === U.selectedMail)) U.selectedMail = p.mail[0] && p.mail[0].id;
    const m = p.mail.find(x => x.id === U.selectedMail);
    if (m) m.read = true;
    const list = p.mail.map(x => '<div class="mail-item ' + (x.id === U.selectedMail ? 'selected' : '') + '" data-act="mail-open" data-id="' + x.id + '"><div class="mi-from">' + esc(x.from) + '</div><div class="mi-sub ' + (!x.read ? 'unread' : '') + '">' + esc(x.subject) + '</div><div class="mi-from">' + new Date(x.date).toLocaleDateString('pt-BR') + (x.claimed ? ' • resgatada' : '') + '</div></div>').join('');
    let read = '<p class="muted">Selecione uma mensagem.</p>';
    if (m) {
      const att = [];
      if (m.attach.gold) att.push('<span>🪙 ' + m.attach.gold + ' ouro</span>');
      (m.attach.items || []).forEach(it => att.push('<span>📦 ' + ((A.CONSUMABLES[it.id] || A.MATERIALS[it.id] || {}).name || it.id) + ' x' + it.qty + '</span>'));
      read = '<div class="mail-read"><h4>' + esc(m.subject) + '</h4><div class="mr-meta">De: ' + esc(m.from) + ' • ' + new Date(m.date).toLocaleString('pt-BR') + '</div><div class="mr-body">' + esc(m.body) + '</div>' +
        (att.length ? '<div class="mail-attach"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#a89fbd;margin-bottom:6px">Anexos</div><div style="display:flex;gap:14px;flex-wrap:wrap">' + att.join('') + '</div>' +
          '<button class="btn small btn-primary" style="margin-top:10px" data-act="mail-claim" data-id="' + m.id + '" ' + (m.claimed ? 'disabled' : '') + '>' + (m.claimed ? 'Já resgatado' : 'Resgatar anexos') + '</button></div>' : '') +
      '</div>';
    }
    return {
      title: 'Correio', icon: 'scroll', sub: A.sys.mailUnread(p) + ' não lidas', cls: 'wide',
      body: '<div class="mail-layout"><div class="mail-list">' + list + '</div><div>' + read + '</div></div>',
      foot: '<span>Mensagens do sistema e recompensas chegam aqui.</span>'
    };
  };

  WINS.settings = function (p) {
    const s = U.game.settings;
    const G = U.game;
    const row = (label, key, val, min, max, step) => '<div class="setting-row"><span>' + label + '</span><input type="range" min="' + min + '" max="' + max + '" step="' + (step || 1) + '" value="' + val + '" data-setting="' + key + '"><span class="sv">' + val + '%</span></div>';
    const check = (label, key, val) => '<div class="setting-row"><span>' + label + '</span><input type="checkbox" data-setting="' + key + '" ' + (val ? 'checked' : '') + '></div>';
    const hotkeys = [
      ['moveUp', 'Mover para cima'], ['moveDown', 'Mover para baixo'], ['moveLeft', 'Mover para esquerda'], ['moveRight', 'Mover para direita'],
      ['run', 'Correr'], ['attack', 'Atacar na mira'], ['attackNearest', 'Atacar próximo'], ['autoToggle', 'Auto-caça'], ['dodge', 'Esquiva'], ['interact', 'Interagir'],
      ['skill1', 'Habilidade 1'], ['skill2', 'Habilidade 2'], ['skill3', 'Habilidade 3'], ['skill4', 'Habilidade 4'],
      ['potionHp', 'Poção de vida'], ['potionMp', 'Poção de mana'], ['openCharacter', 'Personagem'], ['openInventory', 'Mochila'],
      ['openQuests', 'Missões'], ['openMap', 'Mapa'], ['openSocial', 'Social'], ['openAchievements', 'Conquistas'], ['toggleChat', 'Chat']
    ];
    const hotkeyRows = hotkeys.map(([a, label]) => '<div class="setting-row"><span>' + label + '</span><button class="btn small" data-act="rebind-key" data-action="' + a + '">' + String(G.hotkey(a)[0] || '—').toUpperCase() + '</button></div>').join('');
    return {
      title: 'Configurações', icon: 'sigil', sub: 'v' + A.VERSION, cls: 'small',
      body: '<div class="setting-section">Áudio</div>' + row('Música', 'music', Math.round(s.music * 100), 0, 100) + row('Efeitos', 'sfx', Math.round(s.sfx * 100), 0, 100) +
        '<div class="setting-section">Jogo</div>' + check('Números de dano', 'damageNumbers', s.damageNumbers) + check('Tremor de tela', 'screenShake', s.screenShake) + check('Mostrar FPS', 'showFps', s.showFps) + check('Minimapa', 'minimap', s.minimap) +
        '<div class="setting-section">Controles</div>' + hotkeyRows +
        '<div class="setting-section">Conta e save</div>' +
        '<div class="setting-section">Conta e save</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><button class="btn small" data-act="save-now">Salvar agora</button><button class="btn small" data-act="export-save">Exportar save</button><button class="btn small" data-act="fullscreen">Tela cheia</button></div>' +
        '<textarea class="save-area" id="exportArea" placeholder="Seu save aparece aqui ao clicar em Exportar." readonly></textarea>' +
        '<div class="field" style="margin-top:8px"><span>Importar save</span><textarea class="save-area" id="importArea" placeholder="Cole aqui o código do save…"></textarea></div>' +
        '<button class="btn small" data-act="import-save">Importar</button> <button class="btn small danger" data-act="reset-save">Apagar tudo</button>' +
        '<p class="muted" style="font-size:10px;line-height:1.5;margin-top:12px">Personagens salvos localmente neste navegador. O modo online é simulado; não há servidor real por trás.</p>',
      foot: '<span>Pressione ESC para fechar.</span>'
    };
  };

  WINS.help = function () {
    return {
      title: 'Como jogar', icon: 'scroll', sub: 'Controles e dicas', cls: 'small',
      body: '<div class="win-grid-2"><div><div class="subhead">Movimento</div><div class="stat-list">' +
        '<div class="stat-row"><span>Andar</span><b>W A S D</b></div>' +
        '<div class="stat-row"><span>Correr</span><b>Shift</b></div>' +
        '<div class="stat-row"><span>Atacar na mira</span><b>Botão esquerdo</b></div>' +
        '<div class="stat-row"><span>Mover por clique</span><b>Botão direito</b></div>' +
        '<div class="stat-row"><span>Atacar próximo</span><b>Espaço</b></div>' +
        '<div class="stat-row"><span>Travar alvo próximo</span><b>Tab</b></div>' +
        '<div class="stat-row"><span>Auto-caça</span><b>R</b></div>' +
        '<div class="stat-row"><span>Interagir</span><b>E</b></div>' +
        '<div class="stat-row"><span>Habilidades</span><b>1 2 3 4</b></div>' +
        '<div class="stat-row"><span>Poções</span><b>5 6</b></div>' +
        '<div class="stat-row"><span>Personagem</span><b>C</b></div>' +
        '<div class="stat-row"><span>Mochila</span><b>I</b></div>' +
        '<div class="stat-row"><span>Missões</span><b>J</b></div>' +
        '<div class="stat-row"><span>Mapa</span><b>M</b></div>' +
        '<div class="stat-row"><span>Social</span><b>O</b></div>' +
        '<div class="stat-row"><span>Conquistas</span><b>K</b></div>' +
      '</div></div><div><div class="subhead">Dicas</div>' + A.TIPS.slice(0, 12).map(t => '<div style="font-size:11.5px;line-height:1.55;color:#b8add0;margin-bottom:7px">• ' + t + '</div>').join('') + '</div></div>',
      foot: '<span>Clique nas missões para rastrear; a AUTO continua com janelas abertas.</span>'
    };
  };

  WINS.npc = function (p, data) {
    const npc = A.NPCS.find(n => n.id === data.npc);
    if (!npc) return { title: 'NPC', icon: 'users', body: '' };
    const greet = {
      aldric: 'Aurora precisa de você, ' + p.name + '. O Eclipse avança e os monstros ficam mais ousados a cada noite. Está pronto para escrever seu nome na história?',
      orla: 'Poções fresquinhas, ervas do campo e o melhor preço da vila! Não saia para a floresta sem uma poção de vida, querido.',
      brann: 'Aço bom é aço quente. Traga minério e couro que eu forjo algo que aguente o tranco. Ou compre pronto, se tiver pressa.',
      elara: 'Sua postura melhorou. Ainda há muito a aprender sobre o fluxo de mana e o timing dos golpes. Quer revisar suas habilidades?',
      nara: 'Sinto suas feridas daqui. Deixe-me cuidar de você — a luz de Aurora não abandona ninguém.',
      banco: 'Segurança em primeiro lugar. Seus itens ficam guardados aqui, longe dos perigos do mundo.',
      arauto: 'A Cripta e a Cidadela do Eclipse se abrem para os corajosos. Lá embaixo, antigos heróis guardam o selo. Diga-me: você está pronto para o nível 18?',
      sella: 'O frio não perdoa, mas a Vigília dos Picos resiste. Se precisar de missões ou de um ponto seguro, estou aqui.',
      quadro: 'Recompensas diárias para quem mantém as estradas seguras. Confira os contratos de hoje.'
    };
    const role = npc.role;
    let opts = '';
    const Q = (label, opt) => '<button class="btn" data-act="npc-action" data-npc="' + npc.id + '" data-opt="' + opt + '">' + label + '</button>';
    if (npc.id === 'aldric') { opts += Q('📜 Ver missões', 'quests'); opts += Q('🛡️ Guilda', 'guild'); opts += Q('✦ História de Aurora', 'lore'); }
    if (npc.id === 'orla') { opts += Q('🧪 Comprar poções', 'shop_potion'); opts += Q('💰 Vender itens', 'sell'); opts += Q('👋 Até logo', 'close'); }
    if (npc.id === 'brann') { opts += Q('⚒️ Forjar item', 'craft'); opts += Q('⚔️ Comprar equipamento', 'shop_gear'); opts += Q('💰 Vender itens', 'sell'); }
    if (npc.id === 'elara') { opts += Q('📖 Revisar habilidades', 'skills'); opts += Q('💡 Como jogar', 'help'); }
    if (npc.id === 'nara') { opts += Q('✨ Curar completamente', 'heal'); opts += Q('🧪 Comprar poções', 'shop_potion'); }
    if (npc.id === 'banco') { opts += Q('🏦 Abrir banco', 'bank'); }
    if (npc.id === 'arauto') { opts += Q('💀 Entrar na Cripta', 'dungeon'); opts += Q('🏰 Entrar na Cidadela', 'dungeon2'); opts += Q('📜 Missões', 'quests'); opts += Q('🏆 Meu progresso', 'progress'); }
    if (npc.id === 'sella') { opts += Q('📜 Missões dos Picos', 'quests'); opts += Q('💡 Como jogar', 'help'); }
    if (npc.id === 'quadro') { opts += Q('📋 Contratos diários', 'quests'); }
    if (npc.prop) opts = Q('📋 Ver contratos', 'quests');

    // Diálogo estruturado (Etapa 2): usado apenas se o NPC tiver dialogueId válido.
    const dlgId = npc.dialogueId;
    const dlg = dlgId && A.DIALOGUES && A.DIALOGUES[dlgId];
    let contentHtml = '';
    if (dlg) {
      if (!A.game.dialogueState || A.game.dialogueState.npcId !== npc.id) {
        A.game.dialogueState = { npcId: npc.id, dialogueId: dlgId, nodeId: 'start' };
      }
      const st = A.game.dialogueState;
      const node = (st && st.nodeId) ? A.dialogue.getNode(dlgId, st.nodeId) : null;
      if (node) {
        const avail = A.dialogue.availableOptions(node, p);
        const optsHtml = avail.map(o => '<button class="btn" data-act="dialogue-choice" data-npc="' + npc.id + '" data-idx="' + o._idx + '">' + esc(o.label) + '</button>').join('');
        contentHtml = '<div class="npc-greet">“' + esc(node.text) + '”</div><div class="npc-options">' + optsHtml + '</div>';
      } else {
        contentHtml = '<div class="npc-greet">“' + esc(greet[npc.id] || 'Bem-vindo a Aurora.') + '”</div>';
      }
    } else {
      contentHtml = '<div class="npc-greet">“' + esc(greet[npc.id] || 'Bem-vindo a Aurora.') + '”</div>';
    }

    return {
      title: npc.name, icon: npc.marker === 'shop' ? 'coin' : npc.marker === 'quest' ? 'scroll' : 'users', sub: role, cls: 'small',
      body: '<div class="npc-dialog"><div class="npc-side"><canvas id="npcCanvas" width="110" height="110"></canvas><div class="npc-name">' + esc(npc.name) + '</div><div class="npc-role">' + esc(role) + '</div></div>' +
        '<div class="npc-main">' + contentHtml + '<div class="npc-options">' + opts + '</div></div></div>'
    };
  };

  WINS.shop = function (p, data) {
    const type = (data && data.type) || U.tabs.shop || 'potion';
    U.tabs.shop = type;
    const tab = '<div class="bag-head"><div class="tab-bar" style="margin:0"><button class="' + (type === 'potion' ? 'active' : '') + '" data-act="shop-tab" data-tab="potion">Poções</button><button class="' + (type === 'gear' ? 'active' : '') + '" data-act="shop-tab" data-tab="gear">Equipamento</button><button class="' + (type === 'sell' ? 'active' : '') + '" data-act="shop-tab" data-tab="sell">Vender</button></div>' + goldHtml(p) + '</div>';
    let list = '';
    if (type === 'potion') {
      list += Object.keys(A.CONSUMABLES).map(id => {
        const c = A.CONSUMABLES[id];
        return '<div class="list-row"><div class="lr-icon"><img src="' + icon(c.icon) + '"></div><div class="lr-mid"><div class="lr-name">' + c.name + '</div><div class="lr-sub">' + (c.kind === 'hp' ? 'Restaura 45% da vida' : c.kind === 'mp' ? 'Restaura 50% da mana' : 'Restaura tudo') + '</div></div><span class="lr-price">' + c.value + 'g</span><button class="btn small btn-primary" data-act="shop-buy" data-kind="consumable" data-id="' + id + '">Comprar</button></div>';
      }).join('');
      list += '<div class="subhead" style="margin-top:12px">Materiais</div>' + Object.keys(A.MATERIALS).map(id => {
        const m = A.MATERIALS[id];
        return '<div class="list-row"><div class="lr-icon"><img src="' + icon(m.icon) + '"></div><div class="lr-mid"><div class="lr-name">' + m.name + '</div></div><span class="lr-price">' + (m.value * 2) + 'g</span><button class="btn small" data-act="shop-buy" data-kind="material" data-id="' + id + '">Comprar</button></div>';
      }).join('');
    } else if (type === 'gear') {
      const stock = U.game.shopStock || [];
      list = stock.map(it => {
        const r = A.RARITY[it.rarity];
        return '<div class="list-row"><div class="lr-icon"><img src="' + icon(it.icon) + '"></div><div class="lr-mid"><div class="lr-name" style="color:' + r.color + '">' + it.name + '</div><div class="lr-sub">Nv ' + it.ilvl + ' • ' + r.name + ' • +' + (it.atk || 0) + ' atk / +' + (it.def || 0) + ' def</div></div><span class="lr-price">' + A.fmt(it.shopPrice) + 'g</span><button class="btn small btn-primary" data-act="shop-buy" data-kind="gear" data-uid="' + it.uid + '">Comprar</button></div>';
      }).join('') || '<p class="muted">O ferreiro está reabastecendo o estoque. Volte em instantes.</p>';
    } else {
      const inv = p.inventory.filter(it => it.kind === 'gear' || it.kind === 'material' || it.kind === 'consumable');
      list = inv.length ? inv.map(it => {
        const price = Math.max(1, Math.floor((it.value || 1) * (it.kind === 'material' ? .6 : .5) * (it.qty || 1)));
        return '<div class="list-row"><div class="lr-icon"><img src="' + icon(it.icon) + '"></div><div class="lr-mid"><div class="lr-name">' + esc(it.name) + (it.qty > 1 ? ' x' + it.qty : '') + '</div></div><span class="lr-price">' + price + 'g</span><button class="btn small" data-act="sell-item" data-uid="' + it.uid + '">Vender</button></div>';
      }).join('') : '<p class="muted">Nada para vender.</p>';
    }
    return {
      title: type === 'sell' ? 'Vender itens' : type === 'gear' ? 'Forja de Brann' : 'Loja de Orla',
      icon: type === 'gear' ? 'anvil' : 'coin',
      sub: 'Mercador', cls: 'wide', body: tab + list,
      foot: '<span>Equipamentos do ferreiro mudam conforme seu nível.</span>'
    };
  };

  /* ================================================================== */
  /* MODAIS SIMPLES (fora do jogo)                                       */
  /* ================================================================== */
  U.modal = function (title, body, sub) {
    const root = A.$('#modalRoot');
    if (!root) return;
    root.innerHTML = '<div class="modal-back" data-act="modal-close"></div><div class="win small modal-win"><div class="win-head"><img class="wi" src="' + icon('sigil') + '"><h3>' + title + '</h3><span class="wh-sub">' + (sub || '') + '</span><button class="win-close" data-act="modal-close">✕</button></div><div class="win-body">' + body + '</div></div>';
    root.style.display = 'block';
    root.onclick = (e) => {
      if (e.target.closest('[data-act="modal-close"]')) {
        root.innerHTML = ''; root.style.display = 'none'; root.onclick = null;
      }
    };
  };

  U.showMenuGroup = function () {
    const items = [
      ['map', 'Mapa', 'map'],
      ['social', 'Social', 'users'],
      ['mail', 'Correio', 'scroll'],
      ['achievements', 'Conquistas', 'crown'],
      ['endgame', 'Endgame', 'star'],
      ['settings', 'Configurações', 'sigil'],
      ['market', 'Mercado', 'coin'],
      ['bank', 'Banco', 'chest']
    ];
    const body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + items.map(([n, label, key]) => '<button class="btn" data-act="open-win" data-win="' + n + '" style="justify-content:flex-start"><img src="' + icon(key) + '" alt="">' + label + '</button>').join('') + '</div>';
    U.modal('Menus', body, 'Navegação');
  };

  U.showHelpModal = function () {
    const h = WINS.help(U.game.player || {});
    U.modal('Como jogar', h.body, 'Controles');
  };

  U.showCredits = function () {
    U.modal('Créditos', '<div style="font-size:12.5px;line-height:1.7;color:#c6bcd9">' +
      '<p><b style="color:#f2b84b">Crônicas de Aurora</b> — um MMORPG de navegador feito em HTML5 Canvas puro.</p>' +
      '<p>Arte procedural, mapa, criaturas, itens e interface gerados em tempo real. Sem imagens externas.</p>' +
      '<p>Servidores, jogadores, mercado e correio são <b>simulados localmente</b>; não há backend real.</p>' +
      '<p style="margin-top:12px;color:#8b7fa6;font-size:11px">Inspirado em clássicos do gênero. Feito para rodar offline, direto no navegador.</p>' +
      '</div>', 'Sobre');
  };

  U.showQuickSettings = function () {
    const s = U.game.settings;
    U.modal('Configurações', '<div class="setting-section">Áudio</div>' +
      '<div class="setting-row"><span>Música</span><input type="range" min="0" max="100" value="' + Math.round(s.music * 100) + '" data-setting="music"><span class="sv">' + Math.round(s.music * 100) + '%</span></div>' +
      '<div class="setting-row"><span>Efeitos</span><input type="range" min="0" max="100" value="' + Math.round(s.sfx * 100) + '" data-setting="sfx"><span class="sv">' + Math.round(s.sfx * 100) + '%</span></div>' +
      '<p class="muted" style="font-size:11px;margin-top:12px">O progresso é salvo automaticamente no navegador.</p>',
      'Áudio');
    U.game.applySettings();
  };

  /* ================================================================== */
  /* FEEDBACK                                                            */
  /* ================================================================== */
  U.toast = function (msg, type, key, cooldown) {
    const wrap = A.$('#toasts');
    if (!wrap) return;
    if (key) {
      const now = Date.now();
      U._toastLast = U._toastLast || {};
      const last = U._toastLast[key] || 0;
      const wait = cooldown || 2200;
      if (now - last < wait) return;
      U._toastLast[key] = now;
    }
    const t = A.el('div', 'toast ' + (type || ''), esc(msg));
    if (key) t.setAttribute('data-key', key);
    wrap.appendChild(t);
    setTimeout(() => t.classList.add('fade'), 2600);
    setTimeout(() => t.remove(), 3100);
  };

  A.ui = U;

  /* botões de chat */
  document.addEventListener('click', (e) => {
    const c = e.target.closest('#chatTabs button');
    if (c) U.setChannel(c.getAttribute('data-chat'));
  });

})(window.A);
