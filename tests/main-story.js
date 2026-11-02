const { open, boot, ok, fail, summary } = require('./helpers');

(async () => {
  const { browser, page } = await open();
  try {
    const { errors } = await boot(page, { name: 'Arco', cls: 'warrior' });

    // Missões do arco existem.
    const hasArc = await page.evaluate(() => ['arc1_q1','arc1_q2','arc1_q3'].every(id => !!A.sys.questById(id)));
    if (hasArc) ok('missões do primeiro arco cadastradas');
    else fail('missões do arco faltando');

    // Inicia arc1_q1 via diálogo com Marta.
    await page.evaluate(() => { A.game.openNpc(A.NPCS.find(n => n.id === 'marta')); });
    await page.evaluate(() => {
      const node = A.dialogue.getNode('marta', 'start');
      const opt = A.dialogue.availableOptions(node, A.game.player, 'marta').find(o => o.label === 'O que você ouviu?');
      if (opt) A.game.dialogueChoose('marta', opt._idx);
    });
    await page.evaluate(() => {
      const node = A.dialogue.getNode('marta', 'detalhe');
      const opt = A.dialogue.availableOptions(node, A.game.player, 'marta').find(o => o.label === 'Vou observar hoje à noite.');
      if (opt) A.game.dialogueChoose('marta', opt._idx);
    });
    const started = await page.evaluate(() => !!A.game.player.quests.arc1_q1 && !A.game.player.quests.arc1_q1.claimed);
    if (started) ok('primeira missão do arco inicia via diálogo');
    else fail('missão não iniciou');

    // Progresso da etapa 1 (talk) e avanço.
    await page.evaluate(() => { A.sys.talkTo(A.game.player, 'marta'); });
    await page.evaluate(() => { A.sys.turnInQuest(A.game.player, 'arc1_q1'); });
    const stage2 = await page.evaluate(() => A.game.player.quests.arc1_q1.stage);
    if (stage2 === 1) ok('arc1_q1 avança para etapa de exploração');
    else fail('etapa: ' + stage2);

    // Etapa 2 define flag arc1_investigando.
    await page.evaluate(() => { A.sys.questEvent(A.game.player, 'explore', 'vila', 1); });
    await page.evaluate(() => { A.sys.turnInQuest(A.game.player, 'arc1_q1'); });
    const flag = await page.evaluate(() => !!(A.game.player.story.flags && A.game.player.story.flags.arc1_investigando));
    if (flag) ok('consequência arc1_investigando aplicada');
    else fail('flag não aplicada');

    // arc1_q3 registra conhecimento para Irene (requer arc1_q2 concluída).
    await page.evaluate(() => {
      const p = A.game.player;
      if (!p.quests.arc1_q1) p.quests.arc1_q1 = { progress: 0, done: false, claimed: false, stage: 0 };
      p.quests.arc1_q1.claimed = true;
      p.quests.arc1_q1.done = true;
      if (!p.quests.arc1_q2) p.quests.arc1_q2 = { progress: 0, done: false, claimed: false, stage: 0 };
      p.quests.arc1_q2.claimed = true;
      p.quests.arc1_q2.done = true;
      p.quests.arc1_q3 = { progress: 0, done: false, claimed: false, stage: 0 };
    });
    await page.evaluate(() => { A.game.openNpc(A.NPCS.find(n => n.id === 'irene')); });
    await page.evaluate(() => {
      const node = A.dialogue.getNode('irene', 'start');
      const opt = A.dialogue.availableOptions(node, A.game.player, 'irene').find(o => o.label === 'Que registros?');
      if (opt) A.game.dialogueChoose('irene', opt._idx);
    });
    await page.evaluate(() => {
      const node = A.dialogue.getNode('irene', 'registros');
      const opt = A.dialogue.availableOptions(node, A.game.player, 'irene').find(o => o.label === 'Posso ver o pergaminho?');
      if (opt) A.game.dialogueChoose('irene', opt._idx);
    });
    await page.evaluate(() => {
      const node = A.dialogue.getNode('irene', 'pergaminho');
      const opt = A.dialogue.availableOptions(node, A.game.player, 'irene').find(o => o.label === 'Obrigado, Irene.');
      if (opt) A.game.dialogueChoose('irene', opt._idx);
    });
    const know = await page.evaluate(() => A.sys.hasKnowledge(A.game.player, 'irene', 'cinco_nomes_registro'));
    if (know) ok('conhecimento sobre cinco nomes registrado para Irene');
    else fail('conhecimento não registrado');

    // Manifestação indireta: condição de flag (sem nome/identificação).
    const manifestCond = await page.evaluate(() => {
      const p = A.game.player;
      return !!(p.story.flags && p.story.flags.arc1_investigando);
    });
    if (manifestCond) ok('condição de manifestação indireta disponível');
    else fail('condição ausente');

    // Nenhum diálogo direto de Elyssara (não existe NPC/dialogue com esse id).
    const ely = await page.evaluate(() => !!(A.NPCS.find(n => /elyssara/i.test(n.id || n.name)) || (A.DIALOGUES && A.DIALOGUES.elyssara)));
    if (!ely) ok('nenhuma aparição direta de Elyssara');
    else fail('Elyssara apareceu diretamente');

    // Encadeamento: missões posteriores não iniciam prematuramente.
    const chain = await page.evaluate(() => {
      const p = A.sys.blankCharacter({ cls: 'warrior', name: 'Chain', server: 'aurora' });
      const r2before = A.sys.startQuest(p, 'arc1_q2');
      const r3before = A.sys.startQuest(p, 'arc1_q3');
      // conclui arc1_q1
      p.quests.arc1_q1 = { progress: 0, done: false, claimed: false, stage: 0 };
      A.sys.talkTo(p, 'marta');
      A.sys.turnInQuest(p, 'arc1_q1');
      A.sys.questEvent(p, 'explore', 'vila', 1);
      A.sys.turnInQuest(p, 'arc1_q1');
      const r2after = A.sys.startQuest(p, 'arc1_q2');
      const r3before2 = A.sys.startQuest(p, 'arc1_q3');
      return { r2before, r3before, r2after, r3before2 };
    });
    if (chain.r2before === false && chain.r3before === false && chain.r2after !== false) ok('encadeamento bloqueia missões posteriores');
    else fail('encadeamento: ' + JSON.stringify(chain));

    // Consequências nos diálogos.
    const cons = await page.evaluate(() => {
      const p = A.game.player;
      // garante arc1_q1 concluída
      if (!p.quests.arc1_q1) p.quests.arc1_q1 = { progress: 0, done: false, claimed: false, stage: 0 };
      p.quests.arc1_q1.claimed = true;
      p.quests.arc1_q1.done = true;
      A.game.openNpc(A.NPCS.find(n => n.id === 'marta'));
      const martaOpts = A.dialogue.availableOptions(A.dialogue.getNode('marta', 'start'), p, 'marta').map(o => o.label);
      return { martaHasFollowup: martaOpts.indexOf('Voltei sobre os sussurros.') >= 0 };
    });
    if (cons.martaHasFollowup) ok('Marta comenta após a investigação');
    else fail('consequência de Marta ausente');

    // Manifestação: condição de flag e ausência de interação.
    const manif = await page.evaluate(() => {
      const p = A.game.player;
      const beforeFlag = !!(p.story.flags && p.story.flags.arc1_investigando);
      const zone = A.world.zoneAt(75, 48);
      const hasNpcAtSpot = !!A.NPCS.find(n => n.x === 75 && n.y === 48) || !!(A.ANIMALS || []).find(a => a.x === 75 && a.y === 48);
      return { beforeFlag, zone, hasNpcAtSpot };
    });
    if (manif.zone === 'vila' && !manif.hasNpcAtSpot) ok('manifestação restrita à praça e sem interação');
    else fail('manifestação: ' + JSON.stringify(manif));

    // Persistência.
    const persisted = await page.evaluate(() => {
      A.game.save();
      A.game.loadSave();
      const p = A.game.player;
      return !!(p.story.flags && p.story.flags.arc1_investigando) && A.sys.hasKnowledge(p, 'irene', 'cinco_nomes_registro');
    });
    if (persisted) ok('progresso do arco persiste');
    else fail('persistência do arco falhou');

    const realErrors = errors.filter(e => !/favicon|ERR_FAILED|net::/i.test(e));
    if (realErrors.length === 0) ok('nenhum erro de página/console');
    else fail('erros no navegador:\n' + realErrors.join('\n'));
  } catch (e) {
    fail('exceção: ' + (e && e.stack || e));
  } finally {
    await browser.close();
    summary('main-story');
  }
})();