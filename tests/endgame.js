const { open, boot, ok, fail, summary } = require('./helpers');

(async () => {
  const { browser, page } = await open();
  try {
    const { errors } = await boot(page, { name: 'Endgame', cls: 'warrior' });
    // Prepara personagem de endgame.
    await page.evaluate(() => {
      const p = A.game.player;
      p.level = 60;
      A.sys.recalc(p);
      p.hp = p.maxHp; p.mp = p.maxMp;
      A.sys.syncCampaign(p, true);
      p.endgame.keys = 3;
      p.endgame.activities = 0;
      p.endgame.chestClaimed = 0;
    });
    const r1 = await page.evaluate(() => {
      const p = A.game.player;
      const a = A.sys.riftRun(p, 0);
      const b = A.sys.riftRun(p, 1);
      return { a, b, keys: p.endgame.keys, frags: p.endgame.fragments, acts: p.endgame.activities };
    });
    if (r1.a.ok && r1.b.ok !== undefined) ok('Fenda executada'); else fail(JSON.stringify(r1));
    const chest = await page.evaluate(() => {
      const p = A.game.player;
      // força 8 atividades
      p.endgame.activities = 8;
      return A.sys.chestClaim(p, 8);
    });
    if (chest.ok) ok('Baú de 8 atividades resgatado'); else fail(JSON.stringify(chest));
    const raid = await page.evaluate(() => {
      const p = A.game.player;
      return A.sys.raidRun(p, 'normal');
    });
    if (raid.ok !== undefined) ok('Raid executada'); else fail(JSON.stringify(raid));
    const arena = await page.evaluate(() => {
      const p = A.game.player;
      return A.sys.arenaFight(p);
    });
    if (arena.ok) ok('Arena executada'); else fail(JSON.stringify(arena));
    const season = await page.evaluate(() => {
      const p = A.game.player;
      A.sys.seasonProgress(p, 1000);
      return A.sys.seasonClaim(p);
    });
    if (season.ok) ok('Temporada resgatada'); else fail(JSON.stringify(season));
    const faction = await page.evaluate(() => {
      const p = A.game.player;
      A.sys.factionJoin(p, 'aurora');
      return p.endgame.faction;
    });
    if (faction === 'aurora') ok('Facção escolhida'); else fail(faction);

    // Abre janela.
    await page.evaluate(() => A.ui.openWin('endgame'));
    await page.waitForTimeout(300);
    const open = await page.evaluate(() => !!document.querySelector('[data-window="endgame"]'));
    if (open) ok('Janela de endgame abre'); else fail('janela não abriu');
    if (!errors.length) ok('sem erros'); else fail(errors.join(' | '));
  } catch (e) { fail(e.message); }
  finally { await browser.close(); summary('endgame'); }
})();