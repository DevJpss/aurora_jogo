/* Combate: telegrafia, dano no fim do windup, esquiva por i-frames e AUTO. */
const { open, boot, ok, fail, summary } = require('./helpers');

(async () => {
  const { browser, page } = await open();
  try {
    const { errors } = await boot(page, { name: 'Combat', cls: 'archer' });

    const created = await page.evaluate(() => {
      const G = A.game, p = G.player;
      p.hp = p.maxHp = 5000;
      G.invulnT = 0; G.dodgeT = 0; G.dodgeCd = 0; G.statuses = {};
      G.castTelegraph({
        shape: 'circle', x: p.x, y: p.y, r: 120,
        windup: 0.18, atk: 100, mult: 1, label: 'Teste'
      });
      return { count: G.telegraphs.length, shape: G.telegraphs[0] && G.telegraphs[0].shape };
    });
    if (created.count === 1 && created.shape === 'circle') ok('telegrafia circular criada');
    else fail('telegrafia não foi criada: ' + JSON.stringify(created));

    await page.waitForTimeout(420);
    const hit = await page.evaluate(() => {
      const G = A.game, p = G.player;
      return { count: G.telegraphs.length, hp: p.hp, max: p.maxHp };
    });
    if (hit.count === 0 && hit.hp < hit.max) ok('telegrafia resolve no fim do windup e causa dano');
    else fail('telegrafia não resolveu/causou dano: ' + JSON.stringify(hit));

    const iframe = await page.evaluate(() => {
      const G = A.game, p = G.player;
      p.hp = p.maxHp; G.invulnT = 0.5;
      const dmg = G.damagePlayer(500, 1);
      return { dmg, hp: p.hp, inv: G.invulnT };
    });
    if (iframe.dmg === 0 && iframe.hp === 5000) ok('esquiva (i-frames) evita o dano da telegrafia');
    else fail('i-frames não evitaram dano: ' + JSON.stringify(iframe));

    const outside = await page.evaluate(() => {
      const G = A.game, p = G.player;
      p.hp = p.maxHp; G.invulnT = 0;
      G.castTelegraph({ shape: 'circle', x: p.x + 900, y: p.y, r: 60, windup: 0.1, atk: 500, mult: 1 });
      return { before: p.hp };
    });
    await page.waitForTimeout(300);
    const outsideAfter = await page.evaluate(() => A.game.player.hp);
    if (outsideAfter === outside.before) ok('ficar fora do círculo não recebe dano');
    else fail('dano aplicado fora do círculo: ' + outside.before + ' → ' + outsideAfter);

    const cone = await page.evaluate(() => {
      const G = A.game, p = G.player;
      const tg = { shape: 'cone', x: 0, y: 0, ang: 0, spread: 1.2, len: 100 };
      return {
        inside: G.pointInTelegraph(tg, 60, 0),
        behind: G.pointInTelegraph(tg, -60, 0),
        far: G.pointInTelegraph(tg, 220, 0)
      };
    });
    if (cone.inside && !cone.behind && !cone.far) ok('forma de cone acerta à frente e ignora atrás/longe');
    else fail('teste de cone falhou: ' + JSON.stringify(cone));

    const line = await page.evaluate(() => {
      const G = A.game;
      const tg = { shape: 'line', x: 0, y: 0, ang: 0, len: 200, width: 40 };
      return {
        inside: G.pointInTelegraph(tg, 100, 10),
        side: G.pointInTelegraph(tg, 100, 40),
        behind: G.pointInTelegraph(tg, -10, 0)
      };
    });
    if (line.inside && !line.side && !line.behind) ok('forma de linha respeita comprimento e largura');
    else fail('teste de linha falhou: ' + JSON.stringify(line));

    const boss = await page.evaluate(() => {
      const G = A.game, p = G.player;
      const m = { x: p.x + 80, y: p.y, atk: 90 };
      G.castTelegraph = G.castTelegraph.bind(G);
      const before = G.telegraphs.length;
      G.bossWave(m);
      const tg = G.telegraphs[G.telegraphs.length - 1];
      return { added: G.telegraphs.length - before, shape: tg && tg.shape, windup: tg && tg.windup, source: tg && tg.source };
    });
    if (boss.added === 1 && boss.shape === 'circle' && boss.windup >= 0.8 && boss.source === 'enemy') {
      ok('onda do chefe usa telegrafia de 0,92s');
    } else fail('onda do chefe não usa telegrafia: ' + JSON.stringify(boss));

    const auto = await page.evaluate(() => {
      const G = A.game, p = G.player;
      G.telegraphs = [];
      p.stamina = 100; G.dodgeCd = 0; G.dodgeT = 0; G.invulnT = 0;
      G.castTelegraph({ shape: 'circle', x: p.x, y: p.y, r: 120, windup: 0.22, atk: 300, mult: 1 });
      const st = p.stamina;
      G.autoDodge();
      return { stamina: p.stamina, inv: G.invulnT, dodging: G.dodgeT > 0, st0: st };
    });
    if (auto.stamina < auto.st0 && auto.inv > 0 && auto.dodging) ok('AUTO usa esquiva contra telegrafia iminente');
    else fail('AUTO não esquivou da telegrafia: ' + JSON.stringify(auto));

    const status = await page.evaluate(() => {
      const G = A.game, p = G.player;
      G.statuses = {}; G.statusRecent = {};
      G.applyPlayerStatus('slow', 2, 0.4);
      const slow = G.moveSpeedMult();
      G.applyPlayerStatus('burn', 3, 1);
      const before = p.hp;
      G.updateStatuses(1.05);
      return { slow, burn: !!G.statuses.burn, hpLoss: before - p.hp };
    });
    if (status.slow < 0.8 && status.burn && status.hpLoss > 0) ok('status de lentidão e queimadura funcionam');
    else fail('status não funcionaram: ' + JSON.stringify(status));

    const realErrors = errors.filter(e => !/favicon|ERR_FAILED|net::/i.test(e));
    if (realErrors.length === 0) ok('nenhum erro de página/console');
    else fail('erros no navegador:\n' + realErrors.join('\n'));
  } catch (e) {
    fail('exceção: ' + (e && e.stack || e));
  } finally {
    await browser.close();
  }
  process.exitCode = summary('combat') ? 1 : 0;
})();
