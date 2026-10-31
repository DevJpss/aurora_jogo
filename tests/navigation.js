/* Navegação: WASD/clique/AUTO contornam a taverna e a esquiva não atravessa parede. */
const { open, boot, ok, fail, summary } = require('./helpers');

(async () => {
  const { browser, page } = await open();
  try {
    const { errors } = await boot(page, { name: 'Nav', cls: 'warrior' });
    const setup = await page.evaluate(() => {
      const G = A.game, p = G.player;
      p.level = 40; A.sys.recalc(p);
      p.hp = p.maxHp = 50000;
      p.waypoints = { vila: true, campos: true, costa: true, floresta: true, ruinas: true, pantano: true, cripta: true };
      G.dead = false; G.trans = null;
      G.setAutoHunt(false, true);
      G.cancelQuestTrack(true, false);
      G.monsters.forEach(m => { m.dead = true; m.hp = 0; });
      A.ui.closeAllWins();
      return { building: A.world.active.buildings[0], tile: A.T };
    });
    const b = setup.building;

    async function place(tx, ty) {
      return page.evaluate(({ tx, ty }) => {
        const G = A.game;
        G.dead = false; G.trans = null;
        G.setAutoHunt(false, true);
        G.cancelQuestTrack(true, false);
        G.keys = {}; G.moveTo = null; G.resetNav();
        G.teleportPlayer(tx * A.T + 16, ty * A.T + 24);
        G.snapCamera();
        return { x: G.player.x, y: G.player.y };
      }, { tx, ty });
    }

    // 1. WASD diagonal contra a parede inferior: desliza para o lado.
    await place(b.x + 1, b.y + b.h + 1);
    const slideA = await page.evaluate(() => ({ x: A.game.player.x, y: A.game.player.y }));
    await page.keyboard.down('w');
    await page.keyboard.down('d');
    await page.waitForTimeout(850);
    await page.keyboard.up('d');
    await page.keyboard.up('w');
    const slideB = await page.evaluate(() => ({ x: A.game.player.x, y: A.game.player.y }));
    if (slideB.x - slideA.x > 50 && slideA.y - slideB.y < 32) {
      ok('WASD desliza na parede inferior (dx=' + Math.round(slideB.x - slideA.x) + ', dy=' + Math.round(slideB.y - slideA.y) + ')');
    } else fail('WASD prendeu na parede inferior (dx=' + Math.round(slideB.x - slideA.x) + ', dy=' + Math.round(slideB.y - slideA.y) + ')');

    // 2. WASD diagonal contra a parede lateral: desliza para cima.
    await place(b.x + b.w + 1, b.y + b.h - 1);
    const sideA = await page.evaluate(() => ({ x: A.game.player.x, y: A.game.player.y }));
    await page.keyboard.down('w');
    await page.keyboard.down('a');
    await page.waitForTimeout(850);
    await page.keyboard.up('a');
    await page.keyboard.up('w');
    const sideB = await page.evaluate(() => ({ x: A.game.player.x, y: A.game.player.y }));
    if (sideA.y - sideB.y > 60 && sideB.x - sideA.x < 60) {
      ok('WASD desliza na parede lateral (dx=' + Math.round(sideB.x - sideA.x) + ', dy=' + Math.round(sideB.y - sideA.y) + ')');
    } else fail('WASD prendeu na parede lateral (dx=' + Math.round(sideB.x - sideA.x) + ', dy=' + Math.round(sideB.y - sideA.y) + ')');

    // 3. Clique direito no outro lado da taverna: contorna com A*.
    await place(b.x - 2, b.y + 2);
    const click = await page.evaluate(({ b }) => {
      const G = A.game;
      const goal = { x: (b.x + b.w + 2) * A.T + 16, y: G.player.y };
      const cv = A.$('#world');
      const r = cv.getBoundingClientRect();
      const scale = Math.min(r.width / 1280, r.height / 720);
      const ox = (r.width - 1280 * scale) / 2;
      const oy = (r.height - 720 * scale) / 2;
      return {
        goal,
        sx: r.left + ox + (goal.x - G.cam.x) * scale,
        sy: r.top + oy + (goal.y - G.cam.y) * scale,
        blocked: !G.lineClear(G.player.x, G.player.y, goal.x, goal.y, 7),
        pathLen: (G.findPath(G.player.x, G.player.y, goal.x, goal.y) || []).length
      };
    }, { b });
    await page.mouse.click(click.sx, click.sy, { button: 'right' });
    const accepted = await page.evaluate(() => ({ moveTo: !!A.game.moveTo, win: !!A.ui.currentWin }));
    await page.waitForTimeout(5600);
    const arrived = await page.evaluate(({ goal }) => {
      const G = A.game;
      return {
        remaining: Math.hypot(G.player.x - goal.x, G.player.y - goal.y),
        moveTo: G.moveTo,
        frameErrors: G.frameErrors || 0
      };
    }, { goal: click.goal });
    if (accepted.moveTo && click.blocked && click.pathLen > 1 && arrived.remaining < 34 && arrived.moveTo === null) {
      ok('clique direito contorna a taverna (rota=' + click.pathLen + ', restante=' + Math.round(arrived.remaining) + 'px)');
    } else fail('clique direito não chegou (aceito=' + accepted.moveTo + ', rota=' + click.pathLen + ', restante=' + Math.round(arrived.remaining) + 'px)');

    // 4. Clique dentro da parede: recusa sem criar destino impossível.
    await place(b.x - 2, b.y + 2);
    const solidClick = await page.evaluate(({ b }) => {
      const G = A.game;
      const target = { x: (b.x + Math.floor(b.w / 2)) * A.T + 16, y: (b.y + Math.floor(b.h / 2)) * A.T + 24 };
      const cv = A.$('#world');
      const r = cv.getBoundingClientRect();
      const scale = Math.min(r.width / 1280, r.height / 720);
      const ox = (r.width - 1280 * scale) / 2;
      const oy = (r.height - 720 * scale) / 2;
      return {
        sx: r.left + ox + (target.x - G.cam.x) * scale,
        sy: r.top + oy + (target.y - G.cam.y) * scale,
        before: { x: G.player.x, y: G.player.y },
        blocked: !G.canStand(target.x, target.y, 8)
      };
    }, { b });
    await page.mouse.click(solidClick.sx, solidClick.sy, { button: 'right' });
    await page.waitForTimeout(400);
    const solidAfter = await page.evaluate(() => ({ moveTo: !!A.game.moveTo, x: A.game.player.x, y: A.game.player.y }));
    const solidMoved = Math.hypot(solidAfter.x - solidClick.before.x, solidAfter.y - solidClick.before.y);
    if (solidClick.blocked && !solidAfter.moveTo && solidMoved < 3) ok('clique dentro de parede é recusado sem prender o movimento');
    else fail('clique dentro de parede criou destino inválido (moved=' + solidMoved.toFixed(1) + ')');

    // 5. Esquiva em direção a uma parede: para antes de atravessar.
    const dodgeWall = await page.evaluate(() => {
      const G = A.game, map = A.world.active;
      let solid = null;
      for (let ty = 4; ty < map.h - 4 && !solid; ty++) {
        for (let tx = 4; tx < map.w - 4; tx++) {
          if (map.solidTile(tx, ty) && !map.solidTile(tx - 1, ty) && !map.solidTile(tx - 1, ty - 1) && !map.solidTile(tx - 1, ty + 1)) {
            solid = { tx, ty };
            break;
          }
        }
      }
      if (!solid) return { found: false };
      G.dead = false; G.trans = null;
      G.setAutoHunt(false, true);
      const spot = G.safeSpawn((solid.tx - 1) * A.T + 16, solid.ty * A.T + 24);
      G.teleportPlayer(spot.x, spot.y);
      G.snapCamera();
      G.player.stamina = 100;
      G.dodgeCd = 0; G.dodgeT = 0; G.invulnT = 0;
      const started = G.startDodge(1, 0, false);
      for (let i = 0; i < 20; i++) G.updateDodge(1 / 60);
      return {
        found: true, started, solid,
        x: G.player.x, y: G.player.y,
        stand: G.canStand(G.player.x, G.player.y, 7),
        tileSolid: map.solidTile(Math.floor(G.player.x / A.T), Math.floor(G.player.y / A.T)),
        wallX: solid.tx * A.T
      };
    });
    if (dodgeWall.found && dodgeWall.started && dodgeWall.stand && !dodgeWall.tileSolid && dodgeWall.x < dodgeWall.wallX) {
      ok('esquiva para contra a parede e para antes de atravessar');
    } else fail('esquiva atravessou/entrou na parede: ' + JSON.stringify(dodgeWall));

    // 6. AUTO contorna a taverna com a mochila aberta.
    const autoSetup = await page.evaluate(({ b }) => {
      const G = A.game, p = G.player;
      G.dead = false; G.trans = null;
      G.setAutoHunt(false, true);
      G.cancelQuestTrack(true, false);
      A.ui.closeAllWins();
      let m = G.monsters.find(x => x) || null;
      if (!m) return { missing: true };
      m.dead = false;
      m.x = m.ax = (b.x + Math.floor(b.w / 2)) * A.T + 16;
      m.y = m.ay = (b.y - 2) * A.T + 24;
      m.hp = m.maxHp = 1e9;
      m.level = p.level;
      m.speed = 0; m.aggressive = false; m.aggroT = 0; m.hurt = 0;
      m.atk = 0; m.ranged = false; m.wanderT = 1e9;
      const start = { x: (b.x + Math.floor(b.w / 2)) * A.T + 16, y: (b.y + b.h + 2) * A.T + 24 };
      G.teleportPlayer(start.x, start.y);
      G.snapCamera();
      G.target = m; G.autoChase = true;
      G.setAutoHunt(true, true);
      A.ui.openWin('inventory');
      return {
        auto: G.autoHunt,
        invOpen: A.ui.isWinOpen('inventory'),
        directBlocked: !G.lineClear(p.x, p.y, m.x, m.y, 7),
        dist0: Math.hypot(p.x - m.x, p.y - m.y)
      };
    }, { b });
    let reached = false, snap = null;
    for (let i = 0; i < 14; i++) {
      await page.waitForTimeout(500);
      snap = await page.evaluate(() => {
        const G = A.game, p = G.player, m = G.target;
        return {
          dist: m ? Math.hypot(p.x - m.x, p.y - m.y) : null,
          auto: G.autoHunt,
          invOpen: A.ui.isWinOpen('inventory'),
          frameErrors: G.frameErrors || 0
        };
      });
      if (snap.dist != null && snap.dist <= 90) { reached = true; break; }
    }
    if (!autoSetup.missing && autoSetup.auto && autoSetup.invOpen && autoSetup.directBlocked && reached && snap.auto && snap.invOpen) {
      ok('AUTO contorna a taverna e alcança o alvo (' + Math.round(autoSetup.dist0) + 'px -> ' + Math.round(snap.dist) + 'px) com a mochila aberta');
    } else fail('AUTO não alcançou o alvo atrás da parede: ' + JSON.stringify({ autoSetup, snap, reached }));

    const realErrors = errors.filter(e => !/favicon|ERR_FAILED|net::/i.test(e));
    if (arrived.frameErrors === 0 && snap && snap.frameErrors === 0 && realErrors.length === 0) ok('navegação sem erros de frame, página ou console');
    else fail('erros: ' + JSON.stringify({ frameErrors: arrived.frameErrors, autoErrors: snap && snap.frameErrors, errors: realErrors }));
  } catch (e) {
    fail(e && e.stack ? e.stack : String(e));
  } finally {
    await browser.close();
  }
  process.exitCode = summary('navigation') ? 1 : 0;
})();
