/* Smoke: boot, login, criação, HUD, esquiva, save v4 e backup. */
const { open, boot, ok, fail, summary } = require('./helpers');

(async () => {
  const { browser, page } = await open();
  try {
    const { errors } = await boot(page, { name: 'Smoke', cls: 'warrior' });

    const state = await page.evaluate(() => {
      const G = A.game, p = G.player;
      return {
        hasPlayer: !!p,
        level: p.level,
        stamina: p.stamina,
        staminaMax: p.staminaMax,
        hasBar: !!document.querySelector('#hudStFill') && !!document.querySelector('#dodgeBtn'),
        story: p.story && p.story.chapter,
        endgame: !!p.endgame && !!p.endgame.arena,
        saveVersion: G.saveData.version,
        unlocked: p.unlocks && p.unlocks.raid === false
      };
    });
    if (state.hasPlayer && state.level === 1) ok('personagem criado e nível 1');
    else fail('personagem não iniciou corretamente: ' + JSON.stringify(state));
    if (state.stamina === 100 && state.staminaMax === 100) ok('vigor inicial 100/100');
    else fail('vigor inicial inesperado: ' + state.stamina + '/' + state.staminaMax);
    if (state.hasBar) ok('HUD exibe barra de vigor e botão de esquiva');
    else fail('HUD sem barra de vigor/botão de esquiva');
    if (state.story === 1 && state.endgame && state.unlocked) ok('campos de campanha/endgame nasceram no save');
    else fail('campos v4 ausentes: ' + JSON.stringify(state));
    if (state.saveVersion === 4) ok('save marcado como versão 4');
    else fail('versão do save: ' + state.saveVersion);

    const dodge = await page.evaluate(() => {
      const G = A.game, p = G.player;
      p.stamina = 100; G.dodgeCd = 0; G.invulnT = 0; G.dodgeT = 0;
      const x = p.x, y = p.y;
      const started = G.tryDodge();
      G.updateDodge(1 / 60);
      return {
        started, stamina: p.stamina, cd: G.dodgeCd, inv: G.invulnT,
        dist: Math.hypot(p.x - x, p.y - y), stand: G.canStand(p.x, p.y, 7)
      };
    });
    if (dodge.started && dodge.stamina === 75 && dodge.cd > 0 && dodge.inv > 0) {
      ok('esquiva consome 25 de vigor, entra em recarga e concede i-frames');
    } else fail('esquiva não aplicou custo/recarga/i-frames: ' + JSON.stringify(dodge));
    if (dodge.dist > 0 && dodge.stand) ok('esquiva moveu o personagem sem atravessar obstáculo');
    else fail('movimento da esquiva inválido: ' + JSON.stringify(dodge));

    await page.evaluate(() => {
      const G = A.game;
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      G.player.stamina = 100; G.dodgeCd = 0; G.dodgeT = 0; G.invulnT = 0;
      G.dead = false; G.trans = null;
    });
    await page.keyboard.press('v');
    await page.waitForTimeout(60);
    const keyDodge = await page.evaluate(() => {
      const G = A.game;
      return {
        stamina: G.player.stamina,
        cd: G.dodgeCd,
        inv: G.invulnT,
        btn: !!document.querySelector('.mob-btn[data-act="dodge"]')
      };
    });
    if ((keyDodge.stamina < 100 || keyDodge.cd > 0) && keyDodge.inv > 0) ok('tecla V aciona a esquiva');
    else fail('tecla V não acionou a esquiva: ' + JSON.stringify(keyDodge));
    if (keyDodge.btn) ok('botão de esquiva existe no layout mobile');
    else fail('botão mobile de esquiva ausente');

    const blocked = await page.evaluate(() => {
      const G = A.game, p = G.player;
      p.stamina = 100; G.dodgeCd = 0; G.dodgeT = 0;
      const hp = p.hp;
      G.invulnT = 0.4;
      const dmg = G.damagePlayer(9999, 1);
      return { dmg, hpDiff: p.hp - hp, inv: G.invulnT };
    });
    if (blocked.dmg === 0 && blocked.hpDiff === 0) ok('i-frames anulam dano enquanto a esquiva está ativa');
    else fail('dano passou durante i-frames: ' + JSON.stringify(blocked));

    const save = await page.evaluate(() => {
      const G = A.game;
      G.player.gold = 777;
      G.save();
      const raw = localStorage.getItem(A.SAVE_KEY);
      const bak = localStorage.getItem(A.SAVE_KEY + '.bak');
      let parsed = null, bakParsed = null;
      try { parsed = JSON.parse(raw); } catch (e) {}
      try { bakParsed = JSON.parse(bak); } catch (e) {}
      return {
        rawOk: !!parsed && parsed.version === 4,
        bakOk: !!bakParsed && bakParsed.version === 4,
        gold: parsed && parsed.accounts[Object.keys(parsed.accounts)[0]].chars.aurora[0].gold
      };
    });
    if (save.rawOk && save.gold === 777) ok('save principal grava versão 4 e o ouro atual');
    else fail('save principal inválido: ' + JSON.stringify(save));
    if (save.bakOk) ok('backup rotativo válido foi criado');
    else fail('backup rotativo ausente/inválido');

    const legacy = await page.evaluate(() => {
      const p = A.sys.deserialize({
        id: 'legacy1', name: 'Antigo', cls: 'mage', level: 99,
        alloc: { for: -2, des: 3, int: 0, vit: 1 }, points: -5,
        hp: 10, mp: 10, pos: { x: 100, y: 100 }
      });
      return { level: p.level, stamina: p.stamina, chapter: p.story.chapter, raid: p.unlocks.raid, rating: p.endgame.arena.rating };
    });
    if (legacy.level === 60 && legacy.stamina === 100 && legacy.chapter === 1 && legacy.raid === false && legacy.rating === 1000) {
      ok('personagem antigo migra para v4 com nível limitado a 60 e campos padrão');
    } else fail('migração de personagem antigo falhou: ' + JSON.stringify(legacy));

    const recovery = await page.evaluate(() => {
      const G = A.game;
      const raw = localStorage.getItem(A.SAVE_KEY);
      const bak = localStorage.getItem(A.SAVE_KEY + '.bak');
      localStorage.setItem(A.SAVE_KEY, '{corrompido');
      if (!bak) localStorage.setItem(A.SAVE_KEY + '.bak', raw);
      G.loadSave();
      const accounts = Object.keys(G.saveData.accounts || {}).length;
      localStorage.setItem(A.SAVE_KEY, raw);
      return { version: G.saveData.version, accounts, restored: G._saveRestored === true };
    });
    if (recovery.version === 4 && recovery.accounts > 0 && recovery.restored) ok('save corrompido é recuperado pelo backup');
    else fail('recuperação de save falhou: ' + JSON.stringify(recovery));

    const realErrors = errors.filter(e => !/favicon|ERR_FAILED|net::/i.test(e));
    if (realErrors.length === 0) ok('nenhum erro de página/console');
    else fail('erros no navegador:\n' + realErrors.join('\n'));
  } catch (e) {
    fail('exceção: ' + (e && e.stack || e));
  } finally {
    await browser.close();
  }
  process.exitCode = summary('smoke') ? 1 : 0;
})();
