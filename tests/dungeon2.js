const { open, boot, ok, fail, summary } = require('./helpers');

(async () => {
  const { browser, page } = await open();
  try {
    const { errors } = await boot(page, { name: 'Dung', cls: 'warrior' });
    const r1 = await page.evaluate(() => {
      const p = A.game.player; p.level = 18;
      A.game.startDungeon('cripta');
      return new Promise(res => setTimeout(() => res({ map: p.map, isD: A.world.isDungeon(), zone: A.ZONES[A.world.activeDungeonId || 'cripta'].name, mons: A.game.monsters.length }), 600));
    });
    if (r1.isD && r1.mons > 0) ok('Cripta abriu com ' + r1.mons + ' monstros'); else fail(JSON.stringify(r1));
    await page.evaluate(() => { A.game.leaveDungeon(true); });
    await page.waitForTimeout(500);
    const r2 = await page.evaluate(() => {
      const p = A.game.player; p.level = 44;
      A.game.startDungeon('cidadela');
      return new Promise(res => setTimeout(() => res({ map: p.map, isD: A.world.isDungeon(), zone: A.ZONES[A.world.activeDungeonId || 'cidadela'].name, mons: A.game.monsters.length, exit: !!A.world.active.exit }), 600));
    });
    if (r2.isD && r2.mons > 0 && r2.exit) ok('Cidadela abriu com ' + r2.mons + ' monstros'); else fail(JSON.stringify(r2));
    if (!errors.length) ok('sem erros'); else fail(errors.join(' | '));
  } catch (e) { fail(e.message); }
  finally { await browser.close(); summary('dungeon2'); }
})();