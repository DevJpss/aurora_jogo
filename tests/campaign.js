const { open, boot, ok, fail, summary } = require('./helpers');

(async () => {
  const { browser, page } = await open();
  try {
    const { errors } = await boot(page, { name: 'Campanha', cls: 'warrior' });

    const data = await page.evaluate(() => ({
      chapters: A.CHAPTERS.length,
      quests: A.QUESTS.length,
      zones: Object.keys(A.ZONES),
      monsters: Object.keys(A.MONSTERS).length,
      dungeons: Object.keys(A.DUNGEONS),
      firstQuest: A.game.player.quests,
      story: A.game.player.story
    }));
    if (data.chapters === 8) ok('8 capítulos definidos'); else fail('capítulos: ' + data.chapters);
    if (data.quests === 40) ok('40 missões principais'); else fail('missões: ' + data.quests);
    if (data.zones.indexOf('picos') >= 0 && data.zones.indexOf('cidadela') >= 0) ok('zonas Picos e Cidadela existem'); else fail('zonas: ' + data.zones.join(','));
    if (data.monsters >= 24) ok('monstros novos registrados (' + data.monsters + ')'); else fail('monstros: ' + data.monsters);
    if (data.dungeons.length === 2) ok('2 masmorras registradas'); else fail('masmorras: ' + data.dungeons.join(','));
    if (data.firstQuest.q1 && !data.firstQuest.q2) ok('apenas q1 ativa no início'); else fail('quests iniciais: ' + JSON.stringify(data.firstQuest));
    if (data.story.chapter === 1) ok('história começa no capítulo 1'); else fail('capítulo: ' + data.story.chapter);

    // Entrega q1 e verifica avanço para q2.
    const turn1 = await page.evaluate(() => {
      const p = A.game.player;
      A.sys.talkTo(p, 'aldric');
      const r = A.sys.turnInQuest(p, 'q1');
      return { next: r && r.next ? r.next.id : null, q2: !!p.quests.q2, level: p.level };
    });
    if (turn1.next === 'q2' && turn1.q2) ok('q1 entrega e inicia q2'); else fail('turn1: ' + JSON.stringify(turn1));

    // Capítulo 2 não abre antes do nível 8.
    const gate = await page.evaluate(() => {
      const p = A.game.player;
      p.level = 5;
      A.sys.syncCampaign(p, true);
      return { q6: !!p.quests.q6, chapter: p.story.chapter };
    });
    if (!gate.q6) ok('capítulo 2 bloqueado abaixo do nível 8'); else fail('q6 desbloqueou cedo: ' + JSON.stringify(gate));

    // Masmorra da Cidadela exige nível 44.
    const dg = await page.evaluate(() => {
      const p = A.game.player;
      p.level = 30;
      try { A.game.startDungeon('cidadela'); } catch (e) {}
      return { map: p.map, isDungeon: A.world.isDungeon() };
    });
    if (!dg.isDungeon && dg.map !== 'cidadela') ok('Cidadela bloqueada no nível 30'); else fail('Cidadela abriu cedo: ' + JSON.stringify(dg));

    // Novas espécies de monstro existem em A.MONSTERS e podem ser instanciadas.
    const monOk = await page.evaluate(() => {
      const spot = { type: 'frostwolf', x: 160, y: 20, zone: 'picos' };
      const m = A.game.makeMonster(spot);
      const spot2 = { type: 'boss_eclipse', x: 37, y: 7, zone: 'cidadela' };
      const m2 = A.game.makeMonster(spot2);
      return !!(m && m2 && m.type === 'frostwolf' && m2.boss);
    });
    if (monOk) ok('monstros novos podem ser instanciados'); else fail('falha ao instanciar monstros novos');

    // Sem erros de console/página.
    if (!errors.length) ok('sem erros de página/console'); else fail('erros: ' + errors.join(' | '));
  } catch (e) {
    fail('exceção: ' + e.message);
  } finally {
    await browser.close();
    summary('campaign');
  }
})();