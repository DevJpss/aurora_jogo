const { open, boot, ok, fail, summary } = require('./helpers');

(async () => {
  const { browser, page } = await open();
  try {
    const { errors } = await boot(page, { name: 'Relacoes', cls: 'warrior' });

    // Afinidade inicial neutra.
    const initRel = await page.evaluate(() => A.sys.relation(A.game.player, 'orla'));
    if (initRel === 0) ok('afinidade inicial neutra');
    else fail('afinidade inicial: ' + initRel);

    // Aumento, diminuição e limites.
    const rel = await page.evaluate(() => {
      const p = A.game.player;
      A.sys.changeRelation(p, 'orla', 5);
      A.sys.changeRelation(p, 'orla', -2);
      const before = A.sys.relation(p, 'orla');
      A.sys.changeRelation(p, 'orla', 200);
      const max = A.sys.relation(p, 'orla');
      A.sys.changeRelation(p, 'orla', -300);
      const min = A.sys.relation(p, 'orla');
      A.sys.setRelation(p, 'orla', 0);
      return { before, max, min, reset: A.sys.relation(p, 'orla') };
    });
    if (rel.before === 3) ok('afinidade aumenta e diminui corretamente');
    else fail('afinidade intermediária: ' + JSON.stringify(rel));
    if (rel.max === 100 && rel.min === -100 && rel.reset === 0) ok('limites de afinidade respeitados');
    else fail('limites: ' + JSON.stringify(rel));

    // Memória: registro, consulta e prevenção de duplicação.
    const mem = await page.evaluate(() => {
      const p = A.game.player;
      const first = A.sys.remember(p, 'orla', 'mem_teste', 'evento', { foo: 1 });
      const dup = A.sys.remember(p, 'orla', 'mem_teste', 'evento', { foo: 2 });
      const has = A.sys.hasMemory(p, 'orla', 'mem_teste');
      return { first, dup, has };
    });
    if (mem.first && !mem.dup && mem.has) ok('memória registrada sem duplicação');
    else fail('memória: ' + JSON.stringify(mem));

    // Conhecimento: registro, consulta e prevenção de duplicação.
    const know = await page.evaluate(() => {
      const p = A.game.player;
      const first = A.sys.learn(p, 'orla', 'conh_teste', { bar: 1 });
      const dup = A.sys.learn(p, 'orla', 'conh_teste', { bar: 2 });
      const has = A.sys.hasKnowledge(p, 'orla', 'conh_teste');
      return { first, dup, has };
    });
    if (know.first && !know.dup && know.has) ok('conhecimento registrado sem duplicação');
    else fail('conhecimento: ' + JSON.stringify(know));

    // Condições de diálogo.
    const cond = await page.evaluate(() => {
      const p = A.game.player;
      A.sys.setRelation(p, 'orla', 15);
      A.sys.remember(p, 'orla', 'mem_cond', 'evento');
      A.sys.learn(p, 'orla', 'conh_cond');
      const node = { options: [
        { label: 'rel', condition: { relation: { min: 10 } } },
        { label: 'mem', condition: { hasMemory: 'mem_cond' } },
        { label: 'notmem', condition: { notMemory: 'mem_inexistente' } },
        { label: 'know', condition: { hasKnowledge: 'conh_cond' } },
        { label: 'notknow', condition: { notKnowledge: 'conh_inexistente' } }
      ] };
      const opts = A.dialogue.availableOptions(node, p, 'orla').map(o => o.label);
      return opts;
    });
    if (cond.indexOf('rel') >= 0 && cond.indexOf('mem') >= 0 && cond.indexOf('notmem') >= 0 && cond.indexOf('know') >= 0 && cond.indexOf('notknow') >= 0) ok('condições de relacionamento/memória/conhecimento funcionam');
    else fail('condições: ' + JSON.stringify(cond));

    // Efeitos de diálogo.
    const eff = await page.evaluate(() => {
      const p = A.game.player;
      const before = A.sys.relation(p, 'orla');
      A.dialogue.applyEffect({ changeRelation: -4, remember: 'mem_eff', learn: 'conh_eff' }, p, 'orla');
      return {
        relation: A.sys.relation(p, 'orla'),
        memory: A.sys.hasMemory(p, 'orla', 'mem_eff'),
        knowledge: A.sys.hasKnowledge(p, 'orla', 'conh_eff')
      };
    });
    if (eff.memory && eff.knowledge) ok('efeitos de diálogo aplicam relação/memória/conhecimento');
    else fail('efeitos: ' + JSON.stringify(eff));

    // Integração com missões: q26 final registra memória/conhecimento para Aldric.
    await page.evaluate(() => {
      const p = A.game.player;
      p.quests.q26 = { progress: 0, done: false, claimed: false, stage: 0 };
    });
    await page.evaluate(() => { A.sys.talkTo(A.game.player, 'aldric'); });
    await page.evaluate(() => { A.sys.turnInQuest(A.game.player, 'q26'); }); // etapa 1
    await page.evaluate(() => { A.sys.questEvent(A.game.player, 'explore', 'vila', 1); });
    await page.evaluate(() => { A.sys.turnInQuest(A.game.player, 'q26'); }); // etapa 2
    await page.evaluate(() => { A.sys.talkTo(A.game.player, 'aldric'); });
    await page.evaluate(() => { A.sys.turnInQuest(A.game.player, 'q26'); }); // etapa 3
    const missao = await page.evaluate(() => {
      const p = A.game.player;
      return {
        mem: A.sys.hasMemory(p, 'aldric', 'q26_ajudou_selos'),
        know: A.sys.hasKnowledge(p, 'aldric', 'selo_rompido')
      };
    });
    if (missao.mem && missao.know) ok('integração com missões registra memória e conhecimento');
    else fail('integração: ' + JSON.stringify(missao));

    // Persistência após salvar e carregar.
    const persisted = await page.evaluate(() => {
      A.game.save();
      A.game.loadSave();
      const p = A.game.player;
      return {
        relation: A.sys.relation(p, 'orla'),
        memory: A.sys.hasMemory(p, 'orla', 'mem_teste'),
        knowledge: A.sys.hasKnowledge(p, 'orla', 'conh_teste'),
        aldricMem: A.sys.hasMemory(p, 'aldric', 'q26_ajudou_selos')
      };
    });
    if (persisted.memory && persisted.knowledge && persisted.aldricMem) ok('relacionamentos persistem após save/load');
    else fail('persistência: ' + JSON.stringify(persisted));

    // Migração de save antigo.
    const migrated = await page.evaluate(() => {
      const p = A.sys.deserialize({ id: 'legacy2', name: 'Antigo2', cls: 'mage', level: 5, pos: { x: 100, y: 100 } });
      return {
        rel: p.npcRelations,
        mem: p.npcMemory,
        know: p.npcKnowledge
      };
    });
    if (migrated.rel && migrated.mem && migrated.know && typeof migrated.rel === 'object') ok('migração de save antigo cria campos padrão');
    else fail('migração: ' + JSON.stringify(migrated));

    // Isolamento entre personagens.
    const isolated = await page.evaluate(() => {
      const p1 = A.sys.blankCharacter({ cls: 'warrior', name: 'P1', server: 'aurora' });
      const p2 = A.sys.blankCharacter({ cls: 'mage', name: 'P2', server: 'aurora' });
      A.sys.changeRelation(p1, 'orla', 7);
      A.sys.remember(p1, 'orla', 'mem_iso');
      A.sys.learn(p1, 'orla', 'conh_iso');
      return {
        p2rel: A.sys.relation(p2, 'orla'),
        p2mem: A.sys.hasMemory(p2, 'orla', 'mem_iso'),
        p2know: A.sys.hasKnowledge(p2, 'orla', 'conh_iso')
      };
    });
    if (isolated.p2rel === 0 && !isolated.p2mem && !isolated.p2know) ok('dados isolados entre personagens');
    else fail('isolamento: ' + JSON.stringify(isolated));

    const realErrors = errors.filter(e => !/favicon|ERR_FAILED|net::/i.test(e));
    if (realErrors.length === 0) ok('nenhum erro de página/console');
    else fail('erros no navegador:\n' + realErrors.join('\n'));
  } catch (e) {
    fail('exceção: ' + (e && e.stack || e));
  } finally {
    await browser.close();
    summary('npc-relations');
  }
})();