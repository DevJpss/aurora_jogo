const { open, boot, ok, fail, summary } = require('./helpers');

(async () => {
  const { browser, page } = await open();
  try {
    const { errors } = await boot(page, { name: 'NPCs', cls: 'warrior' });

    // NPC estático mantém posição original e interação.
    const staticCheck = await page.evaluate(() => {
      const n = A.NPCS.find(x => x.id === 'aldric');
      const pos = A.game.npcPos('aldric');
      const expX = n.x * A.T + 16;
      const expY = n.y * A.T + 18;
      return { x: pos.x, y: pos.y, expX, expY, match: pos.x === expX && pos.y === expY };
    });
    if (staticCheck.match) ok('NPC estático mantém posição original'); else fail('posição estática inesperada: ' + JSON.stringify(staticCheck));

    await page.evaluate(() => {
      const pos = A.game.npcPos('aldric');
      A.game.player.x = pos.x;
      A.game.player.y = pos.y;
      A.game.updateInteractables();
    });
    const nearStatic = await page.evaluate(() => A.game.nearNpc && A.game.nearNpc.id);
    if (nearStatic === 'aldric') ok('NPC estático continua interagível'); else fail('interação estática falhou: ' + nearStatic);

    // NPC com rotina se movimenta, respeita obstáculos e para no destino.
    const moveResult = await page.evaluate(() => {
      A.game.worldClock = 19 * 3600; // noite -> segundo ponto da rotina
      A.game.npcPos('orla');
      A.game.updateNpcs(0.2); // dispara replanejamento
      const before = A.game.npcPos('orla');
      let steps = 0;
      while (A.game.npcState.orla && A.game.npcState.orla.moving && steps < 300) {
        A.game.updateNpcs(0.2);
        steps++;
      }
      const after = A.game.npcPos('orla');
      const st = A.game.npcState.orla;
      return {
        before, after, steps,
        moving: !!(st && st.moving),
        canStand: A.game.canStand(after.x, after.y, 6),
        destX: st.dest.x,
        destY: st.dest.y
      };
    });
    const moved = Math.hypot(moveResult.after.x - moveResult.before.x, moveResult.after.y - moveResult.before.y) > 20;
    if (moved) ok('NPC com rotina se movimenta'); else fail('NPC não se moveu: ' + JSON.stringify(moveResult));
    if (moveResult.canStand) ok('NPC não atravessa paredes (posição válida)'); else fail('NPC em posição inválida: ' + JSON.stringify(moveResult));
    if (!moveResult.moving) ok('NPC para ao chegar ao destino'); else fail('NPC não parou: ' + JSON.stringify(moveResult));
    const atDest = Math.abs(moveResult.after.x - moveResult.destX) < 8 && Math.abs(moveResult.after.y - moveResult.destY) < 8;
    if (atDest) ok('NPC alcança o ponto da rotina'); else fail('destino não alcançado: ' + JSON.stringify(moveResult));

    // Interagível durante a movimentação: forçar um novo deslocamento e testar.
    const interactMoving = await page.evaluate(() => {
      A.game.worldClock = 9 * 3600; // dia -> volta ao primeiro ponto
      A.game.npcPos('orla');
      // desloca um pouco para garantir movimento
      A.game.updateNpcs(0.2);
      const pos = A.game.npcPos('orla');
      A.game.player.x = pos.x;
      A.game.player.y = pos.y;
      A.game.updateInteractables();
      return A.game.nearNpc && A.game.nearNpc.id;
    });
    if (interactMoving === 'orla') ok('NPC continua interagível durante a movimentação'); else fail('interação em movimento falhou: ' + interactMoving);

    const realErrors = errors.filter(e => !/favicon|ERR_FAILED|net::/i.test(e));
    if (realErrors.length === 0) ok('nenhum erro de página/console');
    else fail('erros no navegador:\n' + realErrors.join('\n'));
  } catch (e) {
    fail('exceção: ' + (e && e.stack || e));
  } finally {
    await browser.close();
    summary('npcs');
  }
})();