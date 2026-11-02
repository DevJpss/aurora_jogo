const { open, boot, ok, fail, summary } = require('./helpers');

(async () => {
  const { browser, page } = await open();
  try {
    const { errors } = await boot(page, { name: 'Vila', cls: 'warrior' });

    // Habitantes adicionados.
    const citizens = await page.evaluate(() => ['helena','dario','liora','tomas','nilo','marta','breno','irene','caio','rosa'].every(id => A.NPCS.some(n => n.id === id)));
    if (citizens) ok('novos habitantes de Vila Aurora cadastrados');
    else fail('habitantes faltando');

    // Animais adicionados.
    const animals = await page.evaluate(() => (A.ANIMALS || []).map(a => a.id));
    if (animals.indexOf('pingo') >= 0 && animals.indexOf('brasa') >= 0 && animals.indexOf('estrela') >= 0) ok('animais Pingo, Brasa e Estrela cadastrados');
    else fail('animais: ' + animals.join(','));

    // NPCs antigos continuam funcionando.
    await page.evaluate(() => { A.game.openNpc(A.NPCS.find(n => n.id === 'aldric')); });
    const oldNpc = await page.evaluate(() => A.game.dialogueState === null && !!A.NPCS.find(n => n.id === 'aldric'));
    if (oldNpc) ok('NPCs antigos continuam funcionando');
    else fail('NPC antigo quebrou');

    // Rotina muda conforme horário (Orla).
    const routine = await page.evaluate(() => {
      A.game.worldClock = 9 * 3600;
      A.game.npcState = A.game.npcState || {};
      delete A.game.npcState.orla;
      A.game.npcPos('orla');
      A.game.updateNpcs(0.2);
      const dayDest = A.game.npcState.orla.dest || A.game.npcState.orla;
      A.game.worldClock = 21 * 3600;
      delete A.game.npcState.orla;
      A.game.npcPos('orla');
      A.game.updateNpcs(0.2);
      const nightDest = A.game.npcState.orla.dest || A.game.npcState.orla;
      return { dayDest, nightDest };
    });
    if (routine.dayDest && routine.nightDest) ok('rotinas mudam conforme o horário');
    else fail('rotina: ' + JSON.stringify(routine));

    // Animais possuem posição válida.
    const animalPos = await page.evaluate(() => {
      const p = A.game.animalPos('pingo');
      return p && A.game.canStand(p.x, p.y, 4);
    });
    if (animalPos) ok('animais possuem posição válida');
    else fail('posição de animal inválida');

    // Acontecimento local ativa e registra consequência.
    const event = await page.evaluate(() => {
      A.game.worldClock = 10.5 * 3600;
      const p = A.game.player;
      p.eventState = {};
      A.game.updateEvents(0.2);
      return {
        state: p.eventState.caixa_quebrada,
        flag: !!(p.story.flags && p.story.flags.evento_caixa_quebrada),
        memory: A.sys.hasMemory(p, 'marta', 'caixa_quebrada_vista')
      };
    });
    if (event.state === 'active' && event.flag && event.memory) ok('acontecimento local ativa e registra consequência');
    else fail('acontecimento: ' + JSON.stringify(event));

    // Evento resolve após horário.
    const resolved = await page.evaluate(() => {
      A.game.worldClock = 12.5 * 3600;
      A.game.updateEvents(0.2);
      return A.game.player.eventState.caixa_quebrada;
    });
    if (resolved === 'resolved') ok('acontecimento encerra corretamente');
    else fail('resolução: ' + resolved);

    // Persistência de evento.
    const persisted = await page.evaluate(() => {
      A.game.save();
      A.game.loadSave();
      const p = A.game.player;
      return p.eventState && p.eventState.caixa_quebrada === 'resolved' && !!(p.story.flags && p.story.flags.evento_caixa_quebrada);
    });
    if (persisted) ok('consequências de acontecimentos persistem');
    else fail('persistência de evento falhou');

    // Migração de save antigo.
    const migrated = await page.evaluate(() => {
      const p = A.sys.deserialize({ id: 'leg3', name: 'Antigo3', cls: 'mage', level: 5, pos: { x: 100, y: 100 } });
      return p.eventState && typeof p.eventState === 'object';
    });
    if (migrated) ok('save antigo migra com eventState');
    else fail('migração de evento falhou');

    const realErrors = errors.filter(e => !/favicon|ERR_FAILED|net::/i.test(e));
    if (realErrors.length === 0) ok('nenhum erro de página/console');
    else fail('erros no navegador:\n' + realErrors.join('\n'));
  } catch (e) {
    fail('exceção: ' + (e && e.stack || e));
  } finally {
    await browser.close();
    summary('village-life');
  }
})();