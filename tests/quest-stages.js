const { open, boot, ok, fail, summary } = require('./helpers');

(async () => {
  const { browser, page } = await open();
  try {
    const { errors } = await boot(page, { name: 'Etapas', cls: 'warrior' });

    // Missões antigas continuam sem etapas.
    const legacy = await page.evaluate(() => {
      const q = A.QUESTS.find(x => x.id === 'q1');
      return !q.stages;
    });
    if (legacy) ok('missões antigas continuam sem etapas');
    else fail('q1 ganhou etapas inesperadamente');

    // Prepara q26 como missão ativa na etapa 0.
    await page.evaluate(() => {
      const p = A.game.player;
      p.quests.q26 = { progress: 0, done: false, claimed: false, stage: 0 };
    });

    // Etapa 1: talk com Aldric.
    await page.evaluate(() => { A.sys.talkTo(A.game.player, 'aldric'); });
    const s1 = await page.evaluate(() => {
      const p = A.game.player;
      const pr = A.sys.questProgress(p, 'q26');
      return { stage: p.quests.q26.stage, progress: pr.cur, need: pr.need, done: pr.done, claimed: p.quests.q26.claimed };
    });
    if (s1.stage === 0 && s1.done) ok('etapa 1 (talk) conclui corretamente');
    else fail('etapa 1 inesperada: ' + JSON.stringify(s1));

    // Não avança sem cumprir requisitos: tentar entregar q26 de novo? já done; testar etapa 2 sem progresso.
    await page.evaluate(() => { A.sys.turnInQuest(A.game.player, 'q26'); });
    const s2before = await page.evaluate(() => {
      const p = A.game.player;
      return { stage: p.quests.q26.stage, progress: p.quests.q26.progress };
    });
    // após turn-in da etapa 1, deve ter avançado para etapa 2 com progresso 0
    if (s2before.stage === 1 && s2before.progress === 0) ok('turn-in da etapa 1 avança para etapa 2');
    else fail('avanço de etapa falhou: ' + JSON.stringify(s2before));

    const noAdvance = await page.evaluate(() => {
      const p = A.game.player;
      const r = A.sys.turnInQuest(p, 'q26');
      return r;
    });
    if (noAdvance === null) ok('etapa 2 não avança sem cumprir requisitos');
    else fail('avanço indevido: ' + JSON.stringify(noAdvance));

    // Etapa 2: explore vila.
    await page.evaluate(() => { A.sys.questEvent(A.game.player, 'explore', 'vila', 1); });
    const s2done = await page.evaluate(() => {
      const p = A.game.player;
      const pr = A.sys.questProgress(p, 'q26');
      return { stage: p.quests.q26.stage, done: pr.done };
    });
    if (s2done.done) ok('etapa 2 (explore) conclui corretamente');
    else fail('etapa 2 não concluiu: ' + JSON.stringify(s2done));

    await page.evaluate(() => { A.sys.turnInQuest(A.game.player, 'q26'); });
    const s3 = await page.evaluate(() => {
      const p = A.game.player;
      return { stage: p.quests.q26.stage, claimed: p.quests.q26.claimed };
    });
    if (s3.stage === 2 && !s3.claimed) ok('turn-in da etapa 2 avança para etapa 3');
    else fail('avanço para etapa 3 falhou: ' + JSON.stringify(s3));

    // Etapa 3: talk final.
    await page.evaluate(() => { A.sys.talkTo(A.game.player, 'aldric'); });
    await page.evaluate(() => { A.sys.turnInQuest(A.game.player, 'q26'); });
    const final = await page.evaluate(() => {
      const p = A.game.player;
      return { claimed: p.quests.q26.claimed, flag: !!(p.story.flags && p.story.flags.q26_selos_rompidos) };
    });
    if (final.claimed && final.flag) ok('etapa final conclui e aplica consequência narrativa');
    else fail('conclusão final falhou: ' + JSON.stringify(final));

    // Pré-condições: diálogo reconhece missão ativa.
    await page.evaluate(() => {
      const p = A.game.player;
      p.quests.q26 = { progress: 0, done: false, claimed: false, stage: 0 };
    });
    const dlgOpt = await page.evaluate(() => {
      A.game.openNpc(A.NPCS.find(n => n.id === 'orla'));
      const node = A.dialogue.getNode('orla', 'start');
      return A.dialogue.availableOptions(node, A.game.player).some(o => o.label === 'Sobre o selo...');
    });
    if (dlgOpt) ok('diálogo reconhece missão ativa');
    else fail('opção de diálogo não apareceu com missão ativa');

    // Persistência no meio da missão.
    await page.evaluate(() => {
      const p = A.game.player;
      p.quests.q26 = { progress: 0, done: false, claimed: false, stage: 1 };
      p.story.flags = p.story.flags || {};
      p.story.flags.q26_selos_rompidos = false;
    });
    const midPersist = await page.evaluate(() => {
      A.game.save();
      A.game.loadSave();
      const p = A.game.player;
      return { stage: p.quests.q26.stage, progress: p.quests.q26.progress };
    });
    if (midPersist.stage === 1 && midPersist.progress === 0) ok('progresso de missão com etapas persiste');
    else fail('persistência falhou: ' + JSON.stringify(midPersist));

    // Interface apresenta etapa correta (verificação indireta via questStageIndex).
    const uiStage = await page.evaluate(() => A.sys.questStageIndex(A.game.player, 'q26'));
    if (uiStage === 1) ok('interface/estado apresenta etapa correta');
    else fail('etapa na interface inesperada: ' + uiStage);

    const realErrors = errors.filter(e => !/favicon|ERR_FAILED|net::/i.test(e));
    if (realErrors.length === 0) ok('nenhum erro de página/console');
    else fail('erros no navegador:\n' + realErrors.join('\n'));
  } catch (e) {
    fail('exceção: ' + (e && e.stack || e));
  } finally {
    await browser.close();
    summary('quest-stages');
  }
})();