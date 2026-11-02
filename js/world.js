/* ==========================================================================
   MUNDO — geração do mapa, vila, estradas, propriedades e masmorra
   ========================================================================== */
(function (A) {
  'use strict';

  const TT = A.art.TT;
  const T = A.T;
  const MW = A.MW, MH = A.MH;

  const Z = {
    VILA: 'vila', CAMPOS: 'campos', COSTA: 'costa', FLORESTA: 'floresta',
    RUINAS: 'ruinas', PANTANO: 'pantano', PICOS: 'picos', CRIPTA: 'cripta', CIDADELA: 'cidadela'
  };

  const MINI = {
    [TT.GRASS]: [79, 138, 58], [TT.DARK]: [47, 92, 52], [TT.TALL]: [74, 130, 54],
    [TT.FLOWER]: [92, 150, 70], [TT.SWAMP]: [85, 100, 65], [TT.SAND]: [217, 192, 138],
    [TT.WATER]: [47, 107, 181], [TT.SWAMPWATER]: [61, 90, 69], [TT.DIRT]: [122, 90, 56],
    [TT.DIRT_DARK]: [90, 69, 48], [TT.PATH]: [176, 138, 93], [TT.PLAZA]: [155, 151, 168],
    [TT.STONE]: [138, 138, 156], [TT.RUIN]: [124, 116, 106], [TT.WALL]: [230, 217, 189],
    [TT.ROOF_R]: [179, 76, 44], [TT.ROOF_B]: [93, 106, 136], [TT.DOOR]: [90, 58, 34],
    [TT.FENCE]: [140, 100, 60], [TT.TREE]: [47, 107, 50], [TT.DARKTREE]: [36, 85, 52],
    [TT.ROCK]: [110, 110, 128], [TT.RUINWALL]: [138, 138, 156], [TT.BRIDGE]: [122, 82, 48],
    [TT.SNOW]: [226, 238, 248], [TT.ICE]: [166, 214, 236]
  };

  const rng = A.mulberry(90210);

  function idx(x, y, w) { return y * w + x; }

  function vnoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = A.hash(xi + seed, yi), b = A.hash(xi + 1 + seed, yi);
    const c = A.hash(xi + seed, yi + 1), d = A.hash(xi + 1 + seed, yi + 1);
    return A.lerp(A.lerp(a, b, u), A.lerp(c, d, u), v);
  }

  function createMap(w, h, fill) {
    return {
      id: 'map', w, h, map: new Uint8Array(w * h).fill(fill),
      blocked: new Uint8Array(w * h), props: [], spots: [], nodes: [],
      set(x, y, t) {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        this.map[y * w + x] = t;
      },
      get(x, y) {
        if (x < 0 || y < 0 || x >= w || y >= h) return TT.WALL;
        return this.map[y * w + x];
      },
      solidTile(x, y) {
        if (x < 0 || y < 0 || x >= w || y >= h) return true;
        if (A.art.SOLID.has(this.get(x, y))) return true;
        return this.blocked[y * w + x] === 1;
      },
      block(x, y) {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        this.blocked[y * w + x] = 1;
      }
    };
  }

  function town(map, name, x, y, w, h, roof) {
    const roofT = roof === 'B' ? TT.ROOF_B : TT.ROOF_R;
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (yy === y + h - 1) map.set(xx, yy, TT.WALL);
        else map.set(xx, yy, roofT);
      }
    }
    const dx = x + Math.floor(w / 2);
    map.set(dx, y + h - 1, TT.DOOR);
    map.set(dx - 1, y + h, TT.PATH);
    map.set(dx, y + h, TT.PATH);
    map.set(dx + 1, y + h, TT.PATH);
    return { x, y, w, h, doorX: dx, doorY: y + h - 1, name };
  }

  function road(map, x1, y1, x2, y2, width, tile) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2;
    const t = tile == null ? TT.PATH : tile;
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const cx = Math.round(A.lerp(x1, x2, p));
      const cy = Math.round(A.lerp(y1, y2, p));
      for (let oy = 0; oy < width; oy++) {
        for (let ox = 0; ox < width; ox++) {
          const xx = cx - Math.floor(width / 2) + ox;
          const yy = cy - Math.floor(width / 2) + oy;
          const cur = map.get(xx, yy);
          if (cur === TT.WALL || cur === TT.ROOF_R || cur === TT.ROOF_B || cur === TT.DOOR) continue;
          map.set(xx, yy, t);
        }
      }
    }
  }

  function scatter(map, tile, count, x0, y0, x1, y1, replace, check) {
    let placed = 0, guard = 0;
    while (placed < count && guard++ < count * 40) {
      const x = x0 + Math.floor(rng() * (x1 - x0));
      const y = y0 + Math.floor(rng() * (y1 - y0));
      const cur = map.get(x, y);
      if (replace && !replace.includes(cur)) continue;
      if (check && !check(x, y)) continue;
      map.set(x, y, tile);
      placed++;
    }
  }

  /* ------------------------------------------------------------------ */
  /* MUNDO ABERTO                                                        */
  /* ------------------------------------------------------------------ */
  function generateOverworld() {
    const map = createMap(MW, MH, TT.GRASS);
    map.id = 'overworld';
    const spots = [];
    const nodes = [];
    const props = [];

    // ---- terreno base ----
    for (let y = 0; y < MH; y++) {
      for (let x = 0; x < MW; x++) {
        const n = vnoise(x * 0.09, y * 0.09, 3);
        const n2 = vnoise(x * 0.18 + 40, y * 0.18, 7);
        let t = TT.GRASS;
        if (n2 > 0.74) t = TT.TALL;
        else if (n > 0.78) t = TT.FLOWER;

        // Picos de Gelo: bioma congelado a leste. A neve é aplicada antes dos
        // outros biomas para que a fronteira do mapa fique limpa.
        if (x >= 152) {
          const sn = vnoise(x * 0.13 + 71, y * 0.13 + 19, 61);
          t = sn > 0.63 ? TT.ICE : TT.SNOW;
          if (sn > 0.78) t = TT.ICE;
        }

        // costa oeste
        const coast = 17 + n * 12 + Math.sin(y * 0.14) * 4;
        if (x < coast - 5) t = TT.WATER;
        else if (x < coast) t = TT.SAND;

        // floresta leste
        if (x > 103 && x < 152 && y < 62) {
          const f = vnoise(x * 0.11 + 12, y * 0.11 + 9, 21);
          if (x > 110 || f > 0.5) {
            t = f > 0.62 ? TT.DARK : TT.GRASS;
            if (f > 0.86) t = TT.DARK;
          }
        }

        // ruínas sul
        if (x >= 54 && x <= 102 && y >= 70) {
          const r = vnoise(x * 0.2 + 5, y * 0.2, 33);
          if (y > 73) t = r > 0.55 ? TT.RUIN : TT.STONE;
          else if (y > 70) t = r > 0.6 ? TT.DIRT_DARK : TT.DIRT;
        }

        // pântano sudeste
        if (x > 102 && x < 152 && y > 62) {
          const s = vnoise(x * 0.15, y * 0.15 + 8, 44);
          if (x > 108 || s > 0.5) {
            t = TT.SWAMP;
            if (s > 0.68) t = TT.SWAMPWATER;
            if (s > 0.84) t = TT.SWAMP;
          }
        }

        // lago dos campos
        const dx = x - 42, dy = y - 18;
        const d = Math.sqrt(dx * dx + dy * dy * 1.3);
        if (d < 6.5 + n * 1.5) t = TT.WATER;
        else if (d < 8.5 + n) t = TT.SAND;

        // lago da floresta
        const fx = x - 126, fy = y - 46;
        const fd = Math.sqrt(fx * fx * 1.25 + fy * fy);
        if (fd < 4.5) t = TT.WATER;
        else if (fd < 6) t = TT.SAND;

        map.set(x, y, t);
      }
    }

    // ---- vila ----
    const VX0 = 53, VY0 = 34, VX1 = 97, VY1 = 67;
    for (let y = VY0; y <= VY1; y++) {
      for (let x = VX0; x <= VX1; x++) {
        const cur = map.get(x, y);
        if (cur === TT.WATER || cur === TT.SWAMPWATER) continue;
        if (rng() < 0.18) map.set(x, y, TT.FLOWER);
        else if (rng() < 0.1) map.set(x, y, TT.TALL);
        else map.set(x, y, TT.GRASS);
      }
    }
    // praça
    for (let y = 45; y <= 59; y++) {
      for (let x = 67; x <= 83; x++) map.set(x, y, TT.PLAZA);
    }
    // chão de terra em volta da praça
    for (let y = 44; y <= 60; y++) {
      for (let x = 66; x <= 84; x++) {
        if (x === 66 || x === 84 || y === 44 || y === 60) map.set(x, y, TT.PATH);
      }
    }

    // estradas principais
    road(map, 75, 18, 75, 34, 3);
    road(map, 75, 60, 75, 70, 3);
    road(map, 30, 50, 67, 50, 3);
    road(map, 83, 50, 107, 50, 3);
    road(map, 75, 19, 75, 8, 2);
    road(map, 46, 19, 46, 34, 2);
    road(map, 75, 70, 75, 78, 3);
    road(map, 83, 56, 100, 64, 2);
    road(map, 100, 64, 126, 78, 2);
    road(map, 126, 78, 130, 92, 2);
    road(map, 26, 50, 26, 76, 2);
    road(map, 26, 76, 54, 84, 2);
    road(map, 54, 84, 75, 84, 2);
    road(map, 98, 50, 108, 44, 2);
    road(map, 108, 44, 118, 34, 2);
    road(map, 42, 22, 42, 8, 2);
    // passagem para os Picos de Gelo
    road(map, 144, 50, 158, 50, 3, TT.STONE);
    road(map, 158, 50, 170, 22, 3, TT.STONE);
    road(map, 170, 22, 170, 12, 2, TT.STONE);
    road(map, 160, 50, 182, 72, 2, TT.STONE);
    road(map, 170, 22, 184, 30, 2, TT.STONE);

    // ponte no lago? estrada não cruza; coloca uma passarela decorativa
    for (let x = 47; x <= 51; x++) map.set(x, 19, TT.BRIDGE);

    // ---- construções ----
    const buildings = [
      town(map, 'Taverna O Lobo Dourado', 56, 39, 8, 5, 'R'),
      town(map, 'Forja de Brann', 78, 40, 8, 5, 'B'),
      town(map, 'Loja de Orla', 55, 51, 7, 5, 'R'),
      town(map, 'Banco de Aurora', 85, 51, 6, 4, 'B'),
      town(map, 'Templo da Aurora', 83, 56, 7, 5, 'B'),
      town(map, 'Casa de Nara', 66, 37, 5, 4, 'R'),
      town(map, 'Casa do Norte', 88, 37, 6, 5, 'B'),
      town(map, 'Guilda dos Viajantes', 90, 60, 6, 5, 'R')
    ];

    // ---- árvores / rochas ----
    function farFromVillage(x, y) {
      return !(x > 51 && x < 99 && y > 32 && y < 69);
    }
    function nearRoad(x, y) {
      const c = map.get(x, y);
      return c === TT.PATH || c === TT.PLAZA || c === TT.BRIDGE;
    }
    // floresta densa
    scatter(map, TT.DARKTREE, 420, 103, 4, 151, 61, [TT.DARK, TT.GRASS, TT.TALL], farFromVillage);
    scatter(map, TT.TREE, 110, 94, 4, 115, 40, [TT.GRASS, TT.TALL, TT.FLOWER], farFromVillage);
    scatter(map, TT.TREE, 65, 30, 4, 103, 34, [TT.GRASS, TT.TALL, TT.FLOWER], farFromVillage);
    scatter(map, TT.TREE, 30, 30, 66, 54, 97, [TT.GRASS, TT.TALL], farFromVillage);
    // campos: árvores isoladas
    scatter(map, TT.TREE, 34, 30, 6, 100, 34, [TT.GRASS, TT.FLOWER], (x, y) => farFromVillage(x, y) && !nearRoad(x, y));
    // pântano: árvores mortas
    scatter(map, TT.DARKTREE, 55, 105, 63, 151, 98, [TT.SWAMP, TT.SWAMPWATER, TT.DARK], farFromVillage);
    // rochas
    scatter(map, TT.ROCK, 60, 30, 5, 102, 34, [TT.GRASS, TT.TALL], farFromVillage);
    scatter(map, TT.ROCK, 30, 55, 71, 102, 98, [TT.STONE, TT.RUIN, TT.DIRT_DARK], farFromVillage);
    scatter(map, TT.ROCK, 20, 105, 64, 151, 98, [TT.SWAMP], farFromVillage);
    // pinheiros e formações de gelo (props para profundidade visual)
    for (let i = 0; i < 130; i++) {
      const x = 153 + Math.floor(rng() * 35), y = 4 + Math.floor(rng() * 92);
      const cur = map.get(x, y);
      if (cur === TT.SNOW || cur === TT.ICE) {
        if (rng() < 0.62) addProp('snowPine', x, y, Math.floor(rng() * 2), 1, 1);
        else if (rng() < 0.35) addProp('iceRock', x, y, Math.floor(rng() * 2), 1, 1);
      }
    }
    for (let i = 0; i < 16; i++) {
      const x = 156 + Math.floor(rng() * 30), y = 8 + Math.floor(rng() * 84);
      if (!map.solidTile(x, y)) addProp('iceSpire', x, y, Math.floor(rng() * 2), 1, 2);
    }
    // flores extras na vila
    scatter(map, TT.FLOWER, 60, 52, 34, 98, 67, [TT.GRASS], null);

    // ---- ruínas: paredes quebradas ----
    for (let i = 0; i < 46; i++) {
      const x = 58 + Math.floor(rng() * 42), y = 74 + Math.floor(rng() * 21);
      if (map.get(x, y) === TT.RUIN || map.get(x, y) === TT.STONE) {
        const len = 2 + Math.floor(rng() * 5);
        const horiz = rng() < 0.5;
        for (let k = 0; k < len; k++) {
          const xx = x + (horiz ? k : 0), yy = y + (horiz ? 0 : k);
          if (rng() < 0.8) map.set(xx, yy, TT.RUINWALL);
        }
      }
    }
    // portão das ruínas
    map.set(74, 72, TT.RUIN); map.set(75, 72, TT.RUIN); map.set(76, 72, TT.RUIN);
    map.set(73, 72, TT.RUINWALL); map.set(77, 72, TT.RUINWALL);

    // ---- props ----
    function addProp(name, tx, ty, variant, footW, footH, ground) {
      const spr = A.art.prop(name, variant || 0);
      const px = tx * T + T / 2;
      const py = ty * T + T;
      const p = { name, variant: variant || 0, spr, px, py, ground: !!ground };
      props.push(p);
      if (footW && footH) {
        const x0 = Math.floor((px - footW * T / 2) / T), x1 = Math.floor((px + footW * T / 2 - 1) / T);
        const y0 = Math.floor((py - footH * T) / T), y1 = Math.floor((py - 1) / T);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) map.block(x, y);
      }
      return p;
    }

    // fonte no centro da praça
    addProp('fountain', 75.5, 53, 0, 4, 3);
    // estátua
    addProp('statue', 69, 57, 0, 2, 2);
    // postes
    [[71, 46], [80, 46], [71, 59], [80, 59], [75, 40], [75, 63], [61, 50], [88, 50], [58, 43], [86, 44]].forEach(([x, y]) => addProp('lamp', x, y, 0, 1, 1));
    // barracas
    addProp('stallA', 63, 47, 0, 2, 1);
    addProp('stallB', 67, 47, 0, 2, 1);
    // ferreiro
    addProp('anvil', 84, 47, 0, 1, 1);
    // caldeirão da curandeira
    addProp('cauldron', 65, 42, 0, 1, 1);
    // caixas e barris
    addProp('crate', 59, 44, 0, 1, 1);
    addProp('crate', 60, 45, 0, 1, 1);
    addProp('barrel', 58, 44, 0, 1, 1);
    addProp('barrel', 87, 47, 0, 1, 1);
    addProp('crate', 89, 55, 0, 1, 1);
    addProp('barrel', 84, 60, 0, 1, 1);
    addProp('crate', 92, 58, 0, 1, 1);
    // placas
    addProp('sign', 74, 43, 0, 1, 1);
    addProp('sign', 75, 35, 0, 1, 1);
    addProp('sign', 75, 67, 0, 1, 1);
    addProp('sign', 30, 51, 0, 1, 1);
    addProp('sign', 106, 51, 0, 1, 1);
    // estandartes
    addProp('banner', 68, 45, 0, 1, 1);
    addProp('banner', 82, 45, 1, 1, 1);
    // abóboras
    addProp('pumpkin', 68, 63, 0, 1, 1);
    addProp('pumpkin', 69, 64, 1, 1, 1);
    addProp('pumpkin', 67, 64, 0, 1, 1);
    // ponto de viagem
    const wp = addProp('waypoint', 74, 61, 0, 1, 1); wp.waypoint = true;

    // acampamento goblin (floresta)
    addProp('tent', 114, 28, 0, 3, 1);
    addProp('cauldron', 118, 30, 0, 1, 1);
    addProp('crate', 112, 31, 0, 1, 1);
    addProp('crate', 113, 31, 0, 1, 1);
    addProp('barrel', 120, 29, 0, 1, 1);
    addProp('banner', 111, 30, 1, 1, 1);
    // acampamento na costa
    addProp('tent', 15, 66, 0, 3, 1);
    addProp('crate', 19, 67, 0, 1, 1);
    addProp('barrel', 20, 66, 0, 1, 1);
    addProp('cauldron', 18, 64, 0, 1, 1);
    // ruínas: obeliscos improvisados com estátuas
    addProp('statue', 60, 78, 0, 2, 2);
    addProp('statue', 96, 86, 0, 2, 2);
    // waypoints do mundo
    const wps = [
      ['waypoint', 74, 22, 'campos'], ['waypoint', 26, 60, 'costa'],
      ['waypoint', 118, 35, 'floresta'], ['waypoint', 76, 83, 'ruinas'],
      ['waypoint', 127, 78, 'pantano'], ['waypoint', 170, 22, 'picos']
    ];
    wps.forEach(([n, x, y, id]) => { const p = addProp(n, x, y, 0, 1, 1); p.waypoint = true; p.wpId = id; });
    // portais das masmorras
    const portal = addProp('waypoint', 75, 86, 0, 1, 1); portal.portal = 'cripta';
    const portal2 = addProp('statue', 182, 72, 0, 1, 1); portal2.portal = 'cidadela';
    portal2.tint = '#d08cff';
    // decoração espalhada
    for (let i = 0; i < 150; i++) {
      const x = 5 + Math.floor(rng() * (MW - 10)), y = 5 + Math.floor(rng() * (MH - 10));
      const cur = map.get(x, y);
      if (cur === TT.GRASS || cur === TT.TALL || cur === TT.DARK) {
        if (rng() < 0.5) addProp('bush', x, y, Math.floor(rng() * 3), 0, 0, true);
      }
    }
    for (let i = 0; i < 30; i++) {
      const x = 5 + Math.floor(rng() * (MW - 10)), y = 5 + Math.floor(rng() * (MH - 10));
      const cur = map.get(x, y);
      if (cur === TT.GRASS || cur === TT.DARK || cur === TT.SWAMP) addProp(rng() < 0.5 ? 'rock' : 'bigRock', x, y, Math.floor(rng() * 2), 0, 0, true);
    }

    // ---- pontos de monstros ----
    const regions = [
      { zone: Z.CAMPOS, x0: 32, y0: 5, x1: 100, y1: 34, types: [['slime', 0.58], ['wolf', 0.32], ['goblin', 0.10]] },
      { zone: Z.CAMPOS, x0: 30, y0: 66, x1: 53, y1: 96, types: [['slime', 0.4], ['wolf', 0.4], ['bandit', 0.2]] },
      { zone: Z.COSTA, x0: 5, y0: 38, x1: 27, y1: 82, types: [['crab', 0.55], ['bandit', 0.45]] },
      { zone: Z.FLORESTA, x0: 105, y0: 4, x1: 148, y1: 61, types: [['goblin', 0.44], ['spider', 0.34], ['treant', 0.22]] },
      { zone: Z.RUINAS, x0: 56, y0: 73, x1: 101, y1: 97, types: [['skeleton', 0.76], ['golem', 0.24]] },
      { zone: Z.PANTANO, x0: 104, y0: 64, x1: 150, y1: 98, types: [['wraith', 0.45], ['witch', 0.25], ['golem', 0.15], ['spider', 0.15]] },
      { zone: Z.PICOS, x0: 154, y0: 4, x1: 188, y1: 96, types: [['frostwolf', 0.36], ['icegolem', 0.26], ['yeti', 0.2], ['frostwitch', 0.18]] }
    ];
    regions.forEach(r => {
      for (let y = r.y0; y < r.y1; y += 4) {
        for (let x = r.x0; x < r.x1; x += 4) {
          if (rng() > 0.42) continue;
          const tx = A.clamp(x + Math.floor(rng() * 4), 1, MW - 2);
          const ty = A.clamp(y + Math.floor(rng() * 4), 1, MH - 2);
          if (map.solidTile(tx, ty)) continue;
          let rv = rng(), acc = 0, type = r.types[0][0];
          for (const [tt, w] of r.types) { acc += w; if (rv <= acc) { type = tt; break; } }
          spots.push({ type, x: tx, y: ty, zone: r.zone });
        }
      }
    });

    // Chefes de mundo da campanha. Ficam longe das rotas principais e são
    // reaproveitados pelo rastreamento de missões.
    spots.push({ type: 'crab_king', x: 13, y: 72, zone: Z.COSTA, boss: true });
    spots.push({ type: 'boss_treant', x: 124, y: 18, zone: Z.FLORESTA, boss: true });
    spots.push({ type: 'boss_lodo', x: 141, y: 90, zone: Z.PANTANO, boss: true });
    spots.push({ type: 'boss_ice', x: 176, y: 32, zone: Z.PICOS, boss: true });
    spots.push({ type: 'boss_rainha', x: 184, y: 86, zone: Z.PICOS, boss: true });

    // ---- nós de coleta ----
    const nodeTypes = [
      ['herb', 34, Z.CAMPOS, 32, 6, 100, 34], ['herb', 18, Z.FLORESTA, 105, 6, 147, 62],
      ['herb', 12, Z.PANTANO, 106, 66, 147, 96],
      ['ore', 22, Z.CAMPOS, 30, 5, 100, 34], ['ore', 22, Z.RUINAS, 56, 72, 101, 97],
      ['crystal', 12, Z.RUINAS, 56, 72, 101, 97], ['crystal', 10, Z.PANTANO, 106, 66, 149, 96],
      ['crystal', 8, Z.FLORESTA, 105, 6, 149, 62],
      ['crystal', 18, Z.PICOS, 153, 5, 188, 96], ['ore', 12, Z.PICOS, 153, 5, 188, 96]
    ];
    nodeTypes.forEach(([type, count, zone, x0, y0, x1, y1]) => {
      let n = 0, guard = 0;
      while (n < count && guard++ < count * 60) {
        const x = x0 + Math.floor(rng() * (x1 - x0)), y = y0 + Math.floor(rng() * (y1 - y0));
        if (map.solidTile(x, y)) continue;
        if (x > 52 && x < 98 && y > 33 && y < 68) continue;
        const t = map.get(x, y);
        if (t === TT.PATH || t === TT.PLAZA || t === TT.ROOF_R || t === TT.ROOF_B || t === TT.WALL) continue;
        nodes.push({ type, x, y, zone, active: true, timer: 0 });
        n++;
      }
    });

    map.props = props;
    map.spots = spots;
    map.nodes = nodes;
    map.buildings = buildings;
    map.minimap = A.art.buildMinimap(map.map, MW, MH, MINI);
    return map;
  }

  /* ------------------------------------------------------------------ */
  /* CRIPTA DO ECLIPSE                                                   */
  /* ------------------------------------------------------------------ */
  function generateDungeon() {
    const W = 48, H = 38;
    const map = createMap(W, H, TT.WALL);
    map.id = 'cripta';
    map.dungeon = 'cripta';
    map.spawn = { x: 24 * T + T / 2, y: 32 * T + T / 2 };
    map.w = W; map.h = H;

    function carve(x0, y0, x1, y1, tile) {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) map.set(x, y, tile == null ? TT.RUIN : tile);
    }

    // corredor de entrada
    carve(20, 26, 28, 35, TT.RUIN);
    carve(22, 18, 26, 27, TT.RUIN);
    // salão central
    carve(10, 11, 38, 22, TT.RUIN);
    // corredores laterais
    carve(4, 14, 10, 18, TT.RUIN);
    carve(38, 14, 44, 18, TT.RUIN);
    // sala do trono
    carve(13, 3, 35, 10, TT.RUIN);
    // chão de pedra em detalhes
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (map.get(x, y) === TT.RUIN && (x + y) % 7 === 0) map.set(x, y, TT.STONE);
      }
    }
    // pilares
    [[14, 13], [18, 13], [22, 13], [26, 13], [30, 13], [34, 13],
     [14, 20], [18, 20], [22, 20], [26, 20], [30, 20], [34, 20],
     [17, 4], [23, 4], [29, 4]].forEach(([x, y]) => map.set(x, y, TT.RUINWALL));

    const props = [];
    function addProp(name, tx, ty, variant, footW, footH) {
      const spr = A.art.prop(name, variant || 0);
      const px = tx * T + T / 2, py = ty * T + T;
      const p = { name, variant: variant || 0, spr, px, py };
      props.push(p);
      if (footW) {
        for (let y = ty - footH + 1; y <= ty; y++) for (let x = tx - Math.floor(footW / 2); x <= tx + Math.floor(footW / 2); x++) map.block(x, y);
      }
      return p;
    }
    // braseiros
    [[12, 12], [36, 12], [12, 21], [36, 21], [15, 5], [33, 5]].forEach(([x, y]) => addProp('cauldron', x, y, 0, 1, 1));
    // estátuas
    [[11, 17], [37, 17], [15, 8], [33, 8]].forEach(([x, y]) => addProp('statue', x, y, 0, 2, 2));
    // trono improvisado (pedra + banner)
    addProp('banner', 24, 3, 0, 0, 0);
    addProp('banner', 25, 3, 1, 0, 0);
    // ossos e caixas
    [[8, 16], [42, 16], [16, 24], [32, 24], [21, 30], [27, 30]].forEach(([x, y]) => addProp('pumpkin', x, y, 1, 0, 0));
    [[6, 15], [43, 17], [11, 20], [37, 20]].forEach(([x, y]) => addProp('crate', x, y, 0, 1, 1));
    // portal de saída
    const exit = addProp('waypoint', 24, 34, 0, 1, 1); exit.exit = true;

    // pontos de spawn
    const spots = [];
    [[13, 15], [19, 17], [27, 17], [34, 16], [22, 20], [30, 20], [6, 16], [42, 16], [18, 5], [30, 5], [24, 8]].forEach(([x, y]) => {
      spots.push({ type: 'skeleton', x, y, zone: Z.CRIPTA });
    });
    spots.push({ type: 'boss_rei', x: 24, y: 5, zone: Z.CRIPTA, boss: true });
    // aranhas nas laterais
    spots.push({ type: 'spider', x: 7, y: 17, zone: Z.CRIPTA });
    spots.push({ type: 'spider', x: 41, y: 15, zone: Z.CRIPTA });

    map.props = props;
    map.spots = spots;
    map.nodes = [];
    map.exit = exit;
    map.minimap = A.art.buildMinimap(map.map, W, H, MINI);
    return map;
  }

  /* ------------------------------------------------------------------ */
  /* CIDADELA DO ECLIPSE                                                 */
  /* ------------------------------------------------------------------ */
  function generateCitadel() {
    const W = 54, H = 42;
    const map = createMap(W, H, TT.WALL);
    map.id = 'cidadela';
    map.dungeon = 'cidadela';
    map.spawn = { x: 27 * T + T / 2, y: 36 * T + T / 2 };
    map.w = W; map.h = H;

    function carve(x0, y0, x1, y1, tile) {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) map.set(x, y, tile);
    }
    // Entrada e corredor central
    carve(24, 31, 30, 40, TT.SNOW);
    carve(22, 24, 32, 31, TT.STONE);
    // Grande salão
    carve(9, 13, 44, 24, TT.STONE);
    // Asas laterais
    carve(5, 15, 9, 22, TT.ICE);
    carve(44, 15, 48, 22, TT.ICE);
    // Corredores para os tronos gêmeos
    carve(15, 10, 22, 13, TT.RUIN);
    carve(32, 10, 39, 13, TT.RUIN);
    carve(12, 5, 22, 10, TT.RUIN);
    carve(32, 5, 42, 10, TT.RUIN);
    // Detalhes de piso
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = map.get(x, y);
        if ((t === TT.STONE || t === TT.RUIN) && (x * 3 + y * 5) % 11 === 0) map.set(x, y, TT.ICE);
      }
    }
    // Pilares do salão
    [[12, 15], [17, 15], [22, 15], [27, 15], [32, 15], [37, 15], [41, 15],
     [12, 22], [17, 22], [22, 22], [27, 22], [32, 22], [37, 22], [41, 22],
     [18, 7], [36, 7]].forEach(([x, y]) => map.set(x, y, TT.RUINWALL));

    const props = [];
    function addProp(name, tx, ty, variant, footW, footH) {
      const spr = A.art.prop(name, variant || 0);
      const px = tx * T + T / 2, py = ty * T + T;
      const p = { name, variant: variant || 0, spr, px, py };
      props.push(p);
      if (footW) {
        for (let y = ty - footH + 1; y <= ty; y++) for (let x = tx - Math.floor(footW / 2); x <= tx + Math.floor(footW / 2); x++) map.block(x, y);
      }
      return p;
    }
    [[11, 14], [42, 14], [11, 23], [42, 23], [17, 6], [37, 6]].forEach(([x, y]) => addProp('cauldron', x, y, 0, 1, 1));
    [[10, 18], [43, 18], [20, 12], [34, 12]].forEach(([x, y]) => addProp('statue', x, y, 0, 1, 1));
    [[15, 5], [16, 5], [38, 5], [39, 5]].forEach(([x, y], i) => addProp('banner', x, y, i % 2, 0, 0));
    [[8, 16], [45, 21], [21, 30], [33, 30], [26, 35]].forEach(([x, y]) => addProp('crate', x, y, 0, 1, 1));
    const exit = addProp('waypoint', 27, 39, 0, 1, 1); exit.exit = true;

    const spots = [];
    [[14, 18], [20, 19], [26, 18], [31, 20], [38, 18], [24, 22], [34, 22], [8, 18], [46, 18], [27, 27]]
      .forEach(([x, y]) => spots.push({ type: 'eclipse_knight', x, y, zone: Z.CIDADELA }));
    [[6, 20], [47, 16], [21, 12], [33, 12], [25, 30], [30, 26]]
      .forEach(([x, y]) => spots.push({ type: 'eclipse_mage', x, y, zone: Z.CIDADELA }));
    spots.push({ type: 'boss_cidadela', x: 17, y: 7, zone: Z.CIDADELA, boss: true });
    spots.push({ type: 'boss_eclipse', x: 37, y: 7, zone: Z.CIDADELA, boss: true });

    map.props = props;
    map.spots = spots;
    map.nodes = [];
    map.exit = exit;
    map.minimap = A.art.buildMinimap(map.map, W, H, MINI);
    return map;
  }

  /* ------------------------------------------------------------------ */
  /* ZONAS E UTILIDADES                                                  */
  /* ------------------------------------------------------------------ */
  function zoneAt(tx, ty) {
    if (tx >= 152) return Z.PICOS;
    if (tx >= 53 && tx <= 97 && ty >= 34 && ty <= 67) return Z.VILA;
    if (tx > 102 && ty > 62) return Z.PANTANO;
    if (tx >= 54 && tx <= 102 && ty >= 70) return Z.RUINAS;
    if (tx > 103 && ty < 63) return Z.FLORESTA;
    if (tx < 29 && ty >= 38 && ty <= 84) return Z.COSTA;
    return Z.CAMPOS;
  }

  function tileCenter(x, y) { return { x: x * T + T / 2, y: y * T + T / 2 }; }

  function randomWalkable(map, x0, y0, x1, y1) {
    for (let i = 0; i < 200; i++) {
      const x = x0 + Math.floor(Math.random() * (x1 - x0));
      const y = y0 + Math.floor(Math.random() * (y1 - y0));
      if (!map.solidTile(x, y)) return tileCenter(x, y);
    }
    return tileCenter(Math.floor((x0 + x1) / 2), Math.floor((y0 + y1) / 2));
  }

  const overworld = generateOverworld();
  const dungeon = generateDungeon();
  const citadel = generateCitadel();
  const dungeons = { cripta: dungeon, cidadela: citadel };

  A.world = {
    Z, MINI,
    overworld, dungeon, citadel, dungeons,
    active: overworld,
    activeDungeonId: null,
    dungeonReturn: null,
    buildings: overworld.buildings,
    zoneAt,
    tileCenter,
    randomWalkable,
    enter(d) {
      this.active = d;
      this.activeDungeonId = d && d.dungeon ? d.id : null;
    },
    enterDungeon(id) {
      const d = dungeons[id];
      if (!d) return false;
      const p = A.game && A.game.player;
      if (p) this.dungeonReturn = { x: p.x, y: p.y, zone: this.zoneAt(Math.floor(p.x / T), Math.floor(p.y / T)) };
      this.enter(d);
      return true;
    },
    isDungeon() { return !!(this.active && this.active.dungeon); },
    isDungeonId(id) { return !!(this.active && this.active.dungeon === id); },
    getDungeon(id) { return dungeons[id] || null; },
    getMap() { return this.active; },
    // posições fixas de teleporte (em pixels)
    travelPoints: {
      vila: { map: 'overworld', x: 74 * T + T / 2, y: 62 * T + T / 2 },
      campos: { map: 'overworld', x: 74 * T + T / 2, y: 23 * T + T / 2 },
      costa: { map: 'overworld', x: 26 * T + T / 2, y: 61 * T + T / 2 },
      floresta: { map: 'overworld', x: 118 * T + T / 2, y: 36 * T + T / 2 },
      ruinas: { map: 'overworld', x: 76 * T + T / 2, y: 84 * T + T / 2 },
      pantano: { map: 'overworld', x: 127 * T + T / 2, y: 79 * T + T / 2 },
      picos: { map: 'overworld', x: 170 * T + T / 2, y: 23 * T + T / 2 }
    },
    dungeonSpawn: { x: 24 * T + T / 2, y: 32 * T + T / 2 },
    dungeonExitSpot: { x: 75 * T + T / 2, y: 87 * T + T / 2 }
  };

  // marca colisão de NPCs e pontos de viagem
  A.NPCS.forEach(n => {
    if (n.prop) return;
    overworld.block(n.x, n.y);
  });

})(window.A);
