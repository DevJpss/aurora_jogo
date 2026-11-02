const { open, boot, ok, fail, summary } = require('./helpers');

(async () => {
  const { browser, page } = await open();
  try {
    const { errors } = await boot(page, { name: 'Dialogo', cls: 'warrior' });

    // NPC sem dialogueId continua no comportamento antigo.
    await page.evaluate(() => { A.game.openNpc(A.NPCS.find(n => n.id === 'aldric')); });
    const noDlg = await page.evaluate(() => A.game.dialogueState);
    if (noDlg === null) ok('NPC sem diálogo mantém comportamento antigo');
    else fail('dialogueState inesperado para NPC sem diálogo: ' + JSON.stringify(noDlg));

    // NPC com diálogo abre a árvore.
    await page.evaluate(() => { A.game.openNpc(A.NPCS.find(n => n.id === 'orla')); });
    const dlgState = await page.evaluate(() => A.game.dialogueState);
    if (dlgState && dlgState.nodeId === 'start') ok('NPC com diálogo abre na etapa inicial');
    else fail('falha ao abrir diálogo: ' + JSON.stringify(dlgState));

    const optCount = await page.evaluate(() => A.dialogue.availableOptions(A.dialogue.getNode('orla', 'start'), A.game.player, 'orla').length);
    if (optCount >= 2) ok('diálogo apresenta pelo menos duas opções');
    else fail('opções insuficientes: ' + optCount);

    // Opção condicional não aparece sem flag.
    const hasConditionalBefore = await page.evaluate(() => A.dialogue.availableOptions(A.dialogue.getNode('orla', 'start'), A.game.player, 'orla').some(o => o.label === 'Já nos falamos antes?'));
    if (!hasConditionalBefore) ok('opção condicional oculta sem flag');
    else fail('opção condicional apareceu sem flag');

    // Avança para etapa correta.
    await page.evaluate(() => {
      const node = A.dialogue.getNode('orla', 'start');
      const opt = A.dialogue.availableOptions(node, A.game.player, 'orla').find(o => o.label === 'Como está a vila hoje?');
      A.game.dialogueChoose('orla', opt._idx);
    });
    const afterChoice = await page.evaluate(() => A.game.dialogueState && A.game.dialogueState.nodeId);
    if (afterChoice === 'vila') ok('escolha avança para a etapa correta');
    else fail('etapa após escolha: ' + afterChoice);

    // Volta ao início e ativa flag.
    await page.evaluate(() => {
      const node = A.dialogue.getNode('orla', 'vila');
      const opt = A.dialogue.availableOptions(node, A.game.player, 'orla').find(o => o.label === 'Encerrar conversa.');
      A.game.dialogueChoose('orla', opt._idx);
    });
    const ended = await page.evaluate(() => A.game.dialogueState);
    if (!ended || ended.nodeId === null) ok('diálogo pode ser encerrado');
    else fail('diálogo não encerrou: ' + JSON.stringify(ended));

    const flagSet = await page.evaluate(() => !!(A.game.player.story.flags && A.game.player.story.flags.orla_conversou));
    if (flagSet) ok('flag narrativa aplicada pela escolha');
    else fail('flag não foi aplicada');

    // Reabre e verifica opção condicional + persistência após save/load.
    await page.evaluate(() => { A.game.openNpc(A.NPCS.find(n => n.id === 'orla')); });
    const hasConditionalAfter = await page.evaluate(() => A.dialogue.availableOptions(A.dialogue.getNode('orla', 'start'), A.game.player, 'orla').some(o => o.label === 'Já nos falamos antes?'));
    if (hasConditionalAfter) ok('opção condicional aparece com flag');
    else fail('opção condicional não apareceu com flag');

    const persisted = await page.evaluate(() => {
      A.game.save();
      const raw = localStorage.getItem(A.SAVE_KEY);
      const parsed = JSON.parse(raw);
      const acc = Object.keys(parsed.accounts)[0];
      const p = parsed.accounts[acc].chars.aurora[0];
      return !!(p.story && p.story.flags && p.story.flags.orla_conversou);
    });
    if (persisted) ok('flag narrativa persiste no save');
    else fail('flag não persistiu no save');

    const reloaded = await page.evaluate(() => {
      A.game.loadSave();
      const p = A.game.player;
      return !!(p.story && p.story.flags && p.story.flags.orla_conversou);
    });
    if (reloaded) ok('flag narrativa permanece após carregar save');
    else fail('flag perdida após loadSave');

    // Serviços antigos continuam funcionando.
    await page.evaluate(() => { A.game.openNpc(A.NPCS.find(n => n.id === 'orla')); });
    await page.evaluate(() => { A.game.npcAction('orla', 'shop_potion'); });
    const shopOpen = await page.evaluate(() => A.ui.isWinOpen('shop'));
    if (shopOpen) ok('serviços antigos continuam funcionando');
    else fail('serviço não abriu');

    const realErrors = errors.filter(e => !/favicon|ERR_FAILED|net::/i.test(e));
    if (realErrors.length === 0) ok('nenhum erro de página/console');
    else fail('erros no navegador:\n' + realErrors.join('\n'));
  } catch (e) {
    fail('exceção: ' + (e && e.stack || e));
  } finally {
    await browser.close();
    summary('dialogue');
  }
})();