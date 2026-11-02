/* ==========================================================================
   ARTE PROCEDURAL — tiles, personagens, monstros, ícones
   Tudo desenhado em canvas, sem imagens externas.
   ========================================================================== */
(function (A) {
  'use strict';

  const T = 32;
  const OUT = '#191324';
  const OUT2 = '#241b33';

  const TT = {
    GRASS: 0, FLOWER: 1, TALL: 2, DARK: 3, SWAMP: 4, SAND: 5, DIRT: 6, PATH: 7,
    STONE: 8, RUIN: 9, WATER: 10, SWAMPWATER: 11, WALL: 12, ROOF_R: 13, ROOF_B: 14,
    DOOR: 15, FENCE: 16, TREE: 17, DARKTREE: 18, ROCK: 19, RUINWALL: 20, BRIDGE: 21,
    PLAZA: 22, DIRT_DARK: 23, SNOW: 24, ICE: 25
  };
  const SOLID = new Set([TT.WATER, TT.SWAMPWATER, TT.WALL, TT.ROOF_R, TT.ROOF_B, TT.DOOR,
    TT.FENCE, TT.TREE, TT.DARKTREE, TT.ROCK, TT.RUINWALL]);

  /* --------------------------- helpers --------------------------- */
  function r(g, c, x, y, w, h) { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function box(g, c, x, y, w, h) { r(g, OUT, x - 1, y - 1, w + 2, h + 2); r(g, c, x, y, w, h); }
  function circle(g, c, x, y, rad) { g.fillStyle = c; g.beginPath(); g.arc(x, y, rad, 0, 6.2832); g.fill(); }
  function ring(g, c, x, y, rad, w) { g.strokeStyle = c; g.lineWidth = w || 1; g.beginPath(); g.arc(x, y, rad, 0, 6.2832); g.stroke(); }
  function speck(g, rng, cols, n, w, h) {
    for (let i = 0; i < n; i++) {
      r(g, cols[Math.floor(rng() * cols.length)], Math.floor(rng() * w), Math.floor(rng() * h),
        1 + Math.floor(rng() * 2), 1 + Math.floor(rng() * 2));
    }
  }
  function shade(c, a) { return A.shade(c, a); }

  /* --------------------------- tiles --------------------------- */
  const TILES = {};

  function grassTile(base, edge, dark, light, seed, flowers, tall) {
    return A.spr(T, T, (g) => {
      const rng = A.mulberry(seed);
      r(g, base, 0, 0, T, T);
      speck(g, rng, [dark, edge, light], 46, T, T);
      // manchas de terra
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(rng() * 24), y = Math.floor(rng() * 24);
        r(g, dark, x, y, 3 + Math.floor(rng() * 4), 2);
      }
      // folhas
      for (let i = 0; i < 8; i++) {
        const x = Math.floor(rng() * 28) + 2, y = Math.floor(rng() * 26) + 3;
        r(g, dark, x, y, 1, 3);
        r(g, light, x + 1, y - 1, 1, 1);
      }
      if (flowers) {
        const cols = ['#f7ec6a', '#f28fb0', '#ffffff', '#c07cff'];
        for (let i = 0; i < 3; i++) {
          const x = 4 + Math.floor(rng() * 22), y = 4 + Math.floor(rng() * 22), c = cols[Math.floor(rng() * cols.length)];
          r(g, c, x, y - 1, 1, 3); r(g, c, x - 1, y, 3, 1);
          r(g, '#f6a21f', x, y, 1, 1);
          r(g, dark, x, y + 1, 1, 2);
        }
      }
      if (tall) {
        for (let i = 0; i < 6; i++) {
          const x = Math.floor(rng() * 28) + 2, y = 8 + Math.floor(rng() * 20);
          r(g, dark, x, y, 1, 7); r(g, light, x + 1, y + 1, 1, 4);
        }
      }
    });
  }

  function pathTile(seed, plaza) {
    return A.spr(T, T, (g) => {
      const rng = A.mulberry(seed);
      const base = plaza ? '#9b97a8' : '#b08a5d';
      const dark = plaza ? '#7f7b8e' : '#8f6c44';
      const light = plaza ? '#b9b5c6' : '#cdab7c';
      r(g, base, 0, 0, T, T);
      speck(g, rng, [dark, light, shade(base, -12)], 40, T, T);
      // pedras
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 2; x++) {
          const ox = (y % 2) * 8 + x * 16 + 1;
          const oy = y * 8 + 1;
          r(g, dark, ox, oy, 14, 6);
          r(g, light, ox + 1, oy + 1, 12, 4);
          r(g, shade(base, 10), ox + 2, oy + 1, 5, 1);
        }
      }
      if (plaza) {
        r(g, dark, 0, 0, T, 1); r(g, dark, 0, 0, 1, T);
      }
    });
  }

  function stoneTile(seed, ruin) {
    return A.spr(T, T, (g) => {
      const rng = A.mulberry(seed);
      const base = ruin ? '#7c746a' : '#8a8a9c';
      const dark = ruin ? '#5f5850' : '#6c6c80';
      const light = ruin ? '#958b7e' : '#a3a3b6';
      r(g, base, 0, 0, T, T);
      // blocos 16x8
      for (let y = 0; y < 4; y++) {
        const off = (y % 2) * 8;
        for (let x = -1; x < 3; x++) {
          const ox = off + x * 16;
          r(g, light, ox + 1, y * 8 + 1, 14, 6);
          r(g, dark, ox + 1, y * 8 + 6, 14, 1);
          r(g, dark, ox + 14, y * 8 + 1, 1, 6);
        }
      }
      speck(g, rng, [dark, light], 18, T, T);
      if (ruin) {
        for (let i = 0; i < 4; i++) {
          r(g, '#4a6a3a', 2 + Math.floor(rng() * 26), 2 + Math.floor(rng() * 26), 2, 1);
        }
        // rachadura
        let x = 8 + Math.floor(rng() * 12), y = 2;
        for (let i = 0; i < 8; i++) { r(g, dark, x, y, 1, 3); y += 3; x += rng() > .5 ? 1 : -1; }
      }
    });
  }

  function waterTile(seed, frame, swamp) {
    return A.spr(T, T, (g) => {
      const rng = A.mulberry(seed + frame * 7);
      const base = swamp ? '#3d5a45' : '#2f6bb5';
      const mid = swamp ? '#4a6e52' : '#3f86da';
      const light = swamp ? '#7d9a6a' : '#79bcf6';
      r(g, base, 0, 0, T, T);
      for (let i = 0; i < 5; i++) {
        const y = 3 + Math.floor(rng() * 26);
        r(g, mid, 0, y, T, 2);
      }
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(rng() * 24), y = 3 + Math.floor(rng() * 26);
        r(g, light, x, y, 4 + Math.floor(rng() * 5), 1);
      }
      if (swamp) {
        for (let i = 0; i < 4; i++) r(g, '#3a2f1f', Math.floor(rng() * 28), Math.floor(rng() * 28), 2, 2);
        r(g, '#5d7a4a', 6, 8, 3, 1); r(g, '#5d7a4a', 22, 20, 3, 1);
      }
    });
  }

  function wallTile(seed, win) {
    return A.spr(T, T, (g) => {
      const rng = A.mulberry(seed);
      const base = '#e6d9bd', dark = '#cabda1', beam = '#6b4a2c';
      r(g, base, 0, 0, T, T);
      speck(g, rng, [dark, '#f2e7cf'], 20, T, T);
      r(g, beam, 0, 0, 3, T); r(g, beam, T - 3, 0, 3, T);
      r(g, beam, 0, 0, T, 3); r(g, beam, 0, T - 4, T, 4);
      r(g, shade(beam, -18), T - 3, 0, 1, T);
      r(g, shade(beam, 20), 1, 0, 1, T);
      if (win) {
        r(g, '#4a3420', 9, 8, 14, 13);
        r(g, '#2c2238', 11, 10, 10, 9);
        r(g, '#ffd978', 11, 10, 10, 9);
        r(g, '#fff1b8', 12, 11, 3, 3);
        r(g, '#4a3420', 15, 10, 2, 9); r(g, '#4a3420', 11, 14, 10, 1);
        r(g, '#6b4a2c', 8, 21, 16, 2);
      }
    });
  }

  function roofTile(seed, colA, colB, ridge) {
    return A.spr(T, T, (g) => {
      const rng = A.mulberry(seed);
      r(g, colA, 0, 0, T, T);
      for (let y = 0; y < 4; y++) {
        const yy = y * 8;
        r(g, colB, 0, yy + 6, T, 2);
        const off = (y % 2) * 8;
        for (let x = off; x < T; x += 8) {
          r(g, colB, x, yy, 1, 6);
          r(g, shade(colA, 24), x + 2, yy + 1, 4, 2);
          r(g, shade(colA, -20), x + 2, yy + 5, 5, 1);
        }
      }
      r(g, ridge ? shade(colA, 30) : shade(colA, -34), 0, ridge ? 0 : T - 2, T, 2);
      speck(g, rng, [shade(colA, -18), shade(colA, 16)], 12, T, T);
    });
  }

  function doorTile() {
    return A.spr(T, T, (g) => {
      r(g, '#e6d9bd', 0, 0, T, T);
      r(g, '#6b4a2c', 0, 0, 4, T); r(g, '#6b4a2c', T - 4, 0, 4, T); r(g, '#6b4a2c', 0, 0, T, 4);
      r(g, '#3a2412', 5, 4, 22, 28);
      r(g, '#5a3a22', 7, 6, 18, 26);
      r(g, '#6d4a2b', 9, 7, 6, 24); r(g, '#6d4a2b', 17, 7, 6, 24);
      r(g, '#3a2412', 15, 7, 2, 24);
      r(g, '#3a2412', 9, 16, 14, 2);
      r(g, '#f2c14e', 21, 19, 2, 3);
      r(g, '#8a6a46', 6, 29, 20, 2);
    });
  }

  function fenceTile() {
    return A.spr(T, T, (g) => {
      r(g, 'rgba(0,0,0,0)', 0, 0, T, T);
      r(g, '#6b4a2c', 2, 12, 28, 3); r(g, '#4a3018', 2, 15, 28, 1);
      r(g, '#6b4a2c', 2, 22, 28, 3); r(g, '#4a3018', 2, 25, 28, 1);
      r(g, '#5a3a22', 5, 7, 4, 24); r(g, '#7a5030', 6, 8, 1, 20);
      r(g, '#5a3a22', 23, 7, 4, 24); r(g, '#7a5030', 24, 8, 1, 20);
    });
  }

  function bridgeTile() {
    return A.spr(T, T, (g) => {
      const rng = A.mulberry(91);
      r(g, '#7a5230', 0, 0, T, T);
      for (let i = 0; i < 4; i++) {
        r(g, '#9a6a3e', 0, i * 8 + 1, T, 6);
        r(g, '#5e3d22', 0, i * 8 + 7, T, 1);
        r(g, '#5e3d22', 8 + Math.floor(rng() * 12), i * 8 + 1, 1, 6);
      }
      r(g, '#3a2412', 0, 0, 2, T); r(g, '#3a2412', T - 2, 0, 2, T);
    });
  }

  function buildTiles() {
    TILES[TT.GRASS] = [0, 1, 2, 3].map(i => grassTile('#4f8a3a', '#5b9b3d', '#3f7529', '#7cc255', 100 + i, false, false));
    TILES[TT.FLOWER] = [0, 1, 2].map(i => grassTile('#4f8a3a', '#5b9b3d', '#3f7529', '#7cc255', 120 + i, true, false));
    TILES[TT.TALL] = [0, 1, 2].map(i => grassTile('#4a8236', '#569439', '#3a6b26', '#7cc255', 140 + i, false, true));
    TILES[TT.DARK] = [0, 1, 2].map(i => grassTile('#2f5c34', '#396b3b', '#24482a', '#5b9b4d', 160 + i, false, true));
    TILES[TT.SWAMP] = [0, 1, 2].map(i => {
      return A.spr(T, T, (g) => {
        const rng = A.mulberry(180 + i);
        r(g, '#4a5b3a', 0, 0, T, T);
        speck(g, rng, ['#3b4a2e', '#5d7046', '#2f3d25'], 40, T, T);
        for (let k = 0; k < 3; k++) r(g, '#6a7a4a', Math.floor(rng() * 26), Math.floor(rng() * 26), 3, 1);
        for (let k = 0; k < 2; k++) r(g, '#2f3d25', Math.floor(rng() * 28), Math.floor(rng() * 28), 2, 2);
      });
    });
    TILES[TT.SAND] = [0, 1].map(i => A.spr(T, T, (g) => {
      const rng = A.mulberry(200 + i);
      r(g, '#d9c08a', 0, 0, T, T);
      speck(g, rng, ['#c4a873', '#e8d3a4', '#b89a63'], 50, T, T);
      for (let k = 0; k < 3; k++) r(g, '#f0e0b8', Math.floor(rng() * 26), Math.floor(rng() * 26), 3, 1);
    }));
    TILES[TT.DIRT] = [0, 1].map(i => A.spr(T, T, (g) => {
      const rng = A.mulberry(220 + i);
      r(g, '#7a5a38', 0, 0, T, T);
      speck(g, rng, ['#684a2d', '#8a6a45', '#5a3f26'], 50, T, T);
    }));
    TILES[TT.DIRT_DARK] = [0, 1].map(i => A.spr(T, T, (g) => {
      const rng = A.mulberry(240 + i);
      r(g, '#5a4530', 0, 0, T, T);
      speck(g, rng, ['#4a3826', '#6a5238', '#3d2e1f'], 50, T, T);
    }));
    TILES[TT.SNOW] = [0, 1, 2].map(i => A.spr(T, T, (g) => {
      const rng = A.mulberry(500 + i);
      r(g, '#dce9f4', 0, 0, T, T);
      speck(g, rng, ['#c8dbea', '#eef8ff', '#b8d0e2'], 44, T, T);
      for (let k = 0; k < 4; k++) r(g, '#f6fbff', Math.floor(rng() * 28), Math.floor(rng() * 28), 2, 1);
    }));
    TILES[TT.ICE] = [0, 1, 2].map(i => A.spr(T, T, (g) => {
      const rng = A.mulberry(520 + i);
      r(g, '#a8d4e8', 0, 0, T, T);
      r(g, '#bde8f4', 0, 0, T, 3);
      speck(g, rng, ['#93c4dc', '#c8ecf8', '#7fb8d4'], 34, T, T);
      g.strokeStyle = 'rgba(240,252,255,.55)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(3, 22); g.lineTo(13, 9); g.lineTo(20, 17); g.lineTo(29, 5); g.stroke();
    }));
    TILES[TT.PATH] = [0, 1, 2].map(i => pathTile(260 + i, false));
    TILES[TT.PLAZA] = [0, 1].map(i => pathTile(280 + i, true));
    TILES[TT.STONE] = [0, 1].map(i => stoneTile(300 + i, false));
    TILES[TT.RUIN] = [0, 1, 2].map(i => stoneTile(320 + i, true));
    TILES[TT.WATER] = [0, 1, 2].map(i => waterTile(340, i, false));
    TILES[TT.SWAMPWATER] = [0, 1, 2].map(i => waterTile(360, i, true));
    TILES[TT.WALL] = [wallTile(380, false), wallTile(381, true)];
    TILES[TT.ROOF_R] = [roofTile(400, '#b34c2c', '#8e3a20', true), roofTile(401, '#b34c2c', '#8e3a20', false)];
    TILES[TT.ROOF_B] = [roofTile(410, '#5d6a88', '#46516b', true), roofTile(411, '#5d6a88', '#46516b', false)];
    TILES[TT.DOOR] = [doorTile()];
    TILES[TT.FENCE] = [fenceTile()];
    TILES[TT.BRIDGE] = [bridgeTile()];
    TILES[TT.TREE] = TILES[TT.GRASS];
    TILES[TT.DARKTREE] = TILES[TT.DARK];
    TILES[TT.ROCK] = TILES[TT.GRASS];
    TILES[TT.RUINWALL] = TILES[TT.STONE];
  }

  /* --------------------------- props --------------------------- */
  const PROPS = {};

  function treeSprite(pal, seed, pine) {
    return A.spr(48, 64, (g) => {
      const rng = A.mulberry(seed);
      const trunk = '#54351d', trunkL = '#7a5030', trunkD = '#38220f';
      // raízes
      r(g, OUT, 19, 58, 12, 5);
      r(g, trunkD, 20, 56, 10, 6);
      r(g, trunk, 22, 40, 6, 18);
      r(g, trunkL, 23, 40, 2, 18);
      r(g, trunkD, 27, 40, 2, 18);
      const blobs = pine
        ? [[24, 14, 9], [24, 24, 13], [24, 34, 16], [17, 38, 9], [31, 38, 9]]
        : [[24, 22, 15], [14, 27, 11], [34, 27, 11], [18, 14, 11], [31, 15, 10], [24, 34, 12]];
      blobs.forEach(b => circle(g, OUT, b[0], b[1], b[2] + 1));
      blobs.forEach(b => circle(g, pal[0], b[0], b[1], b[2]));
      blobs.forEach(b => circle(g, pal[1], b[0] - 1, b[1] - 1, b[2] - 2));
      // sombra inferior
      blobs.forEach(b => { if (b[1] > 24) circle(g, pal[3], b[0] + 2, b[1] + 3, b[2] - 4); });
      // brilho
      for (let i = 0; i < 22; i++) {
        const x = 8 + Math.floor(rng() * 32), y = 5 + Math.floor(rng() * 32);
        r(g, pal[2], x, y, 2, 1);
      }
      for (let i = 0; i < 12; i++) {
        r(g, pal[3], 8 + Math.floor(rng() * 32), 14 + Math.floor(rng() * 28), 2, 2);
      }
    });
  }

  function deadTree(seed) {
    return A.spr(40, 64, (g) => {
      const rng = A.mulberry(seed);
      r(g, OUT, 17, 18, 8, 46);
      r(g, '#5a4a38', 18, 18, 5, 44);
      r(g, '#7a6a52', 19, 18, 1, 44);
      // galhos
      const branches = [[18, 30, -10, -12], [23, 26, 10, -14], [18, 40, -8, -8], [23, 38, 9, -10], [19, 20, -4, -12], [22, 20, 5, -10]];
      branches.forEach(b => {
        let x = b[0], y = b[1];
        for (let i = 0; i < 8; i++) {
          r(g, '#4a3a2a', x, y, 2, 2);
          x += b[2] / 8; y += b[3] / 8;
        }
      });
      for (let i = 0; i < 8; i++) r(g, '#3a2a1a', 14 + Math.floor(rng() * 14), 20 + Math.floor(rng() * 36), 2, 1);
    });
  }

  function rockSprite(seed, big) {
    return A.spr(big ? 48 : 32, big ? 40 : 28, (g) => {
      const rng = A.mulberry(seed);
      const w = big ? 44 : 28, h = big ? 34 : 22, x = big ? 2 : 2, y = big ? 4 : 4;
      g.fillStyle = OUT;
      g.beginPath();
      g.moveTo(x + 6, y + h); g.lineTo(x, y + h * .55); g.lineTo(x + 8, y + 2);
      g.lineTo(x + w - 6, y); g.lineTo(x + w, y + h * .45); g.lineTo(x + w - 5, y + h);
      g.closePath(); g.fill();
      g.fillStyle = '#6e6e80';
      g.beginPath();
      g.moveTo(x + 7, y + h - 2); g.lineTo(x + 2, y + h * .55); g.lineTo(x + 9, y + 3);
      g.lineTo(x + w - 7, y + 1); g.lineTo(x + w - 2, y + h * .45); g.lineTo(x + w - 6, y + h - 2);
      g.closePath(); g.fill();
      r(g, '#8a8a9c', x + 10, y + 4, w * .4, 3);
      r(g, '#8a8a9c', x + 4, y + 8, 4, h * .4);
      r(g, '#4e4e60', x + w - 8, y + 8, 3, h * .55);
      r(g, '#4e4e60', x + 8, y + h - 6, w - 16, 3);
      for (let i = 0; i < 6; i++) r(g, i % 2 ? '#5a5a6c' : '#7c7c8e', x + 8 + Math.floor(rng() * (w - 14)), y + 6 + Math.floor(rng() * (h - 12)), 2, 1);
      if (big) { r(g, '#4a6a3a', x + 4, y + h - 10, 5, 2); r(g, '#5d7a4a', x + w - 12, y + 6, 4, 2); }
    });
  }

  function bushSprite(seed, col) {
    return A.spr(32, 28, (g) => {
      const rng = A.mulberry(seed);
      const blobs = [[16, 16, 10], [9, 18, 7], [23, 18, 7], [16, 10, 7]];
      blobs.forEach(b => circle(g, OUT, b[0], b[1], b[2] + 1));
      blobs.forEach(b => circle(g, col[0], b[0], b[1], b[2]));
      blobs.forEach(b => circle(g, col[1], b[0] - 1, b[1] - 1, b[2] - 2));
      for (let i = 0; i < 8; i++) r(g, col[2], 6 + Math.floor(rng() * 20), 8 + Math.floor(rng() * 16), 2, 1);
      if (seed % 3 === 0) for (let i = 0; i < 4; i++) r(g, '#e05252', 8 + Math.floor(rng() * 16), 10 + Math.floor(rng() * 12), 2, 2);
    });
  }

  function lampSprite() {
    return A.spr(20, 60, (g) => {
      r(g, OUT, 8, 18, 4, 38);
      r(g, '#2b2438', 9, 18, 3, 37);
      r(g, '#4a3f60', 10, 18, 1, 36);
      r(g, OUT, 5, 54, 10, 5);
      r(g, '#3a3048', 6, 54, 8, 4);
      // lanterna
      r(g, OUT, 4, 6, 12, 13);
      r(g, '#3a3048', 5, 7, 10, 11);
      r(g, '#ffd978', 7, 9, 6, 7);
      r(g, '#fff3c4', 8, 10, 2, 4);
      r(g, '#ffb347', 11, 12, 1, 2);
      r(g, OUT, 6, 3, 8, 3);
      r(g, '#4a3f60', 7, 4, 6, 1);
      r(g, '#5a4f70', 4, 18, 12, 2);
    });
  }

  function fountainSprite() {
    return A.spr(104, 88, (g) => {
      // base
      r(g, OUT, 6, 60, 92, 24);
      r(g, '#6e6f84', 8, 62, 88, 20);
      r(g, '#8d8ea4', 8, 62, 88, 4);
      r(g, '#9a9bb0', 8, 78, 88, 4);
      // tanque
      r(g, OUT, 10, 42, 84, 24);
      r(g, '#b8b9cc', 12, 44, 80, 20);
      r(g, '#dcdde8', 12, 44, 80, 4);
      r(g, '#8d8ea4', 12, 60, 80, 4);
      // água
      r(g, '#2f78c4', 18, 48, 68, 12);
      r(g, '#3e8fe0', 18, 48, 68, 6);
      r(g, '#8fd0ff', 24, 50, 12, 1); r(g, '#8fd0ff', 50, 53, 16, 1); r(g, '#8fd0ff', 34, 56, 10, 1);
      // coluna
      r(g, OUT, 45, 18, 14, 30);
      r(g, '#c5c6d6', 46, 19, 12, 28);
      r(g, '#dcdde8', 46, 19, 3, 28);
      r(g, '#8d8ea4', 55, 19, 3, 28);
      // taça
      r(g, OUT, 32, 14, 40, 8);
      r(g, '#c5c6d6', 34, 15, 36, 6);
      r(g, '#dcdde8', 34, 15, 36, 2);
      r(g, OUT, 48, 4, 8, 12);
      r(g, '#bfe6ff', 50, 5, 4, 8);
      r(g, '#e8f7ff', 51, 5, 1, 4);
      // jatos
      g.strokeStyle = 'rgba(159,216,255,.85)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(36, 20); g.quadraticCurveTo(28, 30, 30, 44); g.stroke();
      g.beginPath(); g.moveTo(68, 20); g.quadraticCurveTo(76, 30, 74, 44); g.stroke();
      g.beginPath(); g.moveTo(44, 18); g.quadraticCurveTo(40, 28, 42, 40); g.stroke();
      g.beginPath(); g.moveTo(60, 18); g.quadraticCurveTo(64, 28, 62, 40); g.stroke();
      circle(g, 'rgba(200,240,255,.7)', 34, 45, 2);
      circle(g, 'rgba(200,240,255,.7)', 70, 45, 2);
    });
  }

  function stallSprite(seed, colA, colB) {
    return A.spr(64, 56, (g) => {
      r(g, OUT, 3, 14, 5, 40); r(g, '#5a3a22', 4, 15, 3, 38);
      r(g, OUT, 56, 14, 5, 40); r(g, '#5a3a22', 57, 15, 3, 38);
      // balcão
      r(g, OUT, 2, 34, 60, 22);
      r(g, '#8a5a2e', 3, 35, 58, 20);
      r(g, '#a8743c', 3, 35, 58, 3);
      r(g, '#6a4220', 3, 50, 58, 5);
      // toldo
      for (let i = 0; i < 8; i++) {
        r(g, OUT, i * 8, 2, 8, 18);
      }
      for (let i = 0; i < 8; i++) {
        r(g, i % 2 ? colB : colA, i * 8 + 1, 3, 6, 16);
        if (i % 2 === 0) r(g, colA, i * 8 + 1, 17, 6, 2);
      }
      r(g, '#00000033', 0, 19, 64, 2);
      // mercadorias
      ['#e8402a', '#f2b84b', '#7cc255', '#e8402a', '#f2b84b'].forEach((c, i) => {
        r(g, OUT, 7 + i * 10, 28, 8, 7);
        r(g, c, 8 + i * 10, 29, 6, 5);
        r(g, '#ffffff66', 9 + i * 10, 29, 2, 1);
      });
      r(g, '#f4efe2', 6, 25, 50, 2);
    });
  }

  function crateSprite() {
    return A.spr(28, 28, (g) => {
      r(g, OUT, 1, 1, 26, 26);
      r(g, '#8a5a2e', 2, 2, 24, 24);
      r(g, '#a8743c', 2, 2, 24, 3);
      r(g, '#5e3a1a', 2, 23, 24, 3);
      r(g, '#5e3a1a', 4, 4, 3, 20); r(g, '#5e3a1a', 21, 4, 3, 20);
      r(g, '#6a4220', 6, 13, 16, 2);
    });
  }

  function barrelSprite() {
    return A.spr(24, 30, (g) => {
      r(g, OUT, 2, 2, 20, 26);
      r(g, '#7a4e28', 3, 3, 18, 24);
      r(g, '#9a6a3a', 4, 3, 4, 24);
      r(g, '#5e3a1a', 17, 3, 4, 24);
      r(g, '#4a3a2a', 2, 8, 20, 2); r(g, '#4a3a2a', 2, 20, 20, 2);
      r(g, '#c9a06a', 4, 4, 2, 1);
    });
  }

  function waypointSprite(seed) {
    return A.spr(48, 84, (g) => {
      // base
      r(g, OUT, 8, 72, 32, 10);
      r(g, '#5a5470', 10, 73, 28, 8);
      r(g, '#8f87ac', 12, 72, 24, 3);
      // runas ao redor
      for (let i = 0; i < 6; i++) {
        const x = 6 + i * 7;
        r(g, '#7f8cff', x, 76, 2, 2);
      }
      // cristal
      g.fillStyle = OUT;
      g.beginPath(); g.moveTo(24, 6); g.lineTo(38, 34); g.lineTo(32, 66); g.lineTo(16, 66); g.lineTo(10, 34); g.closePath(); g.fill();
      g.fillStyle = '#5f6fd8';
      g.beginPath(); g.moveTo(24, 9); g.lineTo(35, 35); g.lineTo(30, 62); g.lineTo(18, 62); g.lineTo(13, 35); g.closePath(); g.fill();
      g.fillStyle = '#8f9bff';
      g.beginPath(); g.moveTo(24, 12); g.lineTo(20, 34); g.lineTo(24, 58); g.lineTo(24, 12); g.closePath(); g.fill();
      r(g, '#d4d8ff', 24, 16, 2, 22);
      r(g, '#aab2ff', 18, 36, 2, 10);
      // brilho
      circle(g, 'rgba(160,180,255,.28)', 24, 38, 18);
    });
  }

  function anvilSprite() {
    return A.spr(36, 28, (g) => {
      r(g, OUT, 3, 2, 30, 12);
      r(g, '#5a5a6c', 4, 3, 28, 9);
      r(g, '#8a8a9c', 4, 3, 28, 3);
      r(g, OUT, 14, 13, 8, 9);
      r(g, '#4a4a5c', 15, 14, 6, 7);
      r(g, OUT, 8, 21, 20, 5);
      r(g, '#3a3a4c', 9, 22, 18, 3);
      r(g, '#6a6a7c', 6, 5, 8, 2);
    });
  }

  function cauldronSprite() {
    return A.spr(40, 34, (g) => {
      r(g, OUT, 4, 12, 32, 18);
      r(g, '#2f2a38', 5, 13, 30, 16);
      r(g, '#4a3f52', 6, 13, 28, 4);
      r(g, '#6a5a78', 7, 14, 6, 2);
      r(g, OUT, 2, 28, 8, 4); r(g, OUT, 30, 28, 8, 4);
      r(g, '#2f2a38', 3, 29, 6, 2); r(g, '#2f2a38', 31, 29, 6, 2);
      // líquido
      r(g, '#7dff9a', 8, 12, 24, 4);
      r(g, '#c8ffd4', 12, 12, 6, 1);
      circle(g, 'rgba(125,255,154,.35)', 20, 12, 10);
      // bolhas
      circle(g, '#c8ffd4', 14, 9, 1.5); circle(g, '#c8ffd4', 24, 7, 1.5);
    });
  }

  function pumpkinSprite(jack) {
    return A.spr(26, 22, (g) => {
      r(g, OUT, 3, 7, 20, 13);
      r(g, '#e8802a', 4, 6, 18, 13);
      r(g, '#f4a24a', 6, 6, 5, 12);
      r(g, '#c4601a', 16, 6, 5, 12);
      r(g, '#c4601a', 10, 7, 2, 12);
      r(g, '#4a7a2a', 11, 2, 2, 5); r(g, '#4a7a2a', 14, 3, 3, 1);
      if (jack) {
        r(g, '#ffd75a', 6, 9, 3, 3); r(g, '#ffd75a', 15, 9, 3, 3);
        r(g, '#ffd75a', 8, 14, 8, 2); r(g, '#ffd75a', 10, 13, 1, 1); r(g, '#ffd75a', 14, 13, 1, 1);
        circle(g, 'rgba(255,190,70,.25)', 13, 12, 12);
      }
    });
  }

  function statueSprite() {
    return A.spr(40, 76, (g) => {
      r(g, OUT, 6, 64, 28, 10);
      r(g, '#6e6f84', 8, 65, 24, 8);
      r(g, '#9a9bb0', 8, 65, 24, 2);
      r(g, OUT, 12, 30, 16, 36);
      r(g, '#8a8a9c', 13, 31, 14, 34);
      r(g, '#a8a8bc', 14, 31, 4, 34);
      r(g, '#6a6a7c', 23, 31, 4, 34);
      r(g, OUT, 14, 10, 12, 20);
      r(g, '#a8a8bc', 15, 11, 10, 18);
      r(g, '#7c7c8e', 20, 12, 4, 16);
      r(g, '#5a5a6c', 17, 16, 2, 2); r(g, '#5a5a6c', 22, 16, 2, 2);
      // espada
      r(g, OUT, 28, 18, 6, 40);
      r(g, '#c9d2e4', 29, 19, 3, 32);
      r(g, '#8a8a9c', 28, 48, 6, 3);
      r(g, '#5a3a22', 29, 51, 3, 6);
      r(g, '#4a6a3a', 10, 60, 5, 2); r(g, '#4a6a3a', 25, 40, 3, 2);
    });
  }

  function tentSprite() {
    return A.spr(72, 56, (g) => {
      r(g, OUT, 3, 14, 66, 40);
      r(g, '#8a6a3a', 5, 15, 62, 38);
      r(g, '#a8844a', 5, 15, 62, 4);
      r(g, '#5e4524', 5, 48, 62, 5);
      // faixas
      for (let i = 0; i < 4; i++) r(g, '#6e5128', 8 + i * 16, 20, 3, 28);
      // abertura
      r(g, '#3a2a14', 30, 30, 12, 23);
      r(g, '#5e4524', 31, 31, 5, 22);
      g.fillStyle = '#3a2a14';
      g.beginPath(); g.moveTo(5, 15); g.lineTo(36, 2); g.lineTo(67, 15); g.closePath(); g.fill();
      g.fillStyle = '#a8844a';
      g.beginPath(); g.moveTo(9, 15); g.lineTo(36, 5); g.lineTo(63, 15); g.closePath(); g.fill();
      r(g, '#8a6a3a', 35, 5, 2, 52);
      r(g, '#d9c08a', 36, 0, 1, 6);
    });
  }

  function signSprite() {
    return A.spr(36, 48, (g) => {
      r(g, OUT, 16, 12, 4, 34);
      r(g, '#6b4a2c', 17, 12, 2, 33);
      r(g, OUT, 3, 3, 30, 16);
      r(g, '#a8743c', 4, 4, 28, 14);
      r(g, '#c99a5e', 4, 4, 28, 2);
      r(g, '#5e3a1a', 7, 8, 20, 2);
      r(g, '#5e3a1a', 7, 12, 14, 2);
      r(g, '#5e3a1a', 7, 16, 18, 1);
    });
  }

  function bannerSprite(col) {
    return A.spr(28, 64, (g) => {
      r(g, OUT, 12, 0, 4, 62);
      r(g, '#5a3a22', 13, 0, 2, 62);
      r(g, OUT, 2, 6, 24, 38);
      r(g, col, 3, 7, 22, 34);
      r(g, shade(col, -35), 3, 7, 22, 3);
      // símbolo
      circle(g, '#f2e7cf', 14, 20, 6);
      r(g, '#f2e7cf', 13, 12, 2, 16);
      r(g, '#f2e7cf', 9, 18, 10, 2);
      // ponta
      g.fillStyle = col;
      g.beginPath(); g.moveTo(3, 41); g.lineTo(14, 50); g.lineTo(25, 41); g.closePath(); g.fill();
      r(g, OUT, 2, 4, 24, 4);
      r(g, '#8a6a46', 3, 5, 22, 2);
    });
  }

  function tintSprite(src, color, alpha) {
    return A.spr(src.width, src.height, (g) => {
      g.drawImage(src, 0, 0);
      g.globalCompositeOperation = 'source-atop';
      g.globalAlpha = alpha == null ? 0.55 : alpha;
      g.fillStyle = color;
      g.fillRect(0, 0, src.width, src.height);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    });
  }

  function buildProps() {
    PROPS.tree1 = [treeSprite(['#2f6b32', '#3f8a3d', '#6cc04a', '#1f4f24'], 11, false), treeSprite(['#2a6034', '#3a7f46', '#5fb06a', '#1b4528'], 12, false)];
    PROPS.tree2 = [treeSprite(['#24552c', '#326d36', '#4f9a45', '#173f20'], 21, true), treeSprite(['#24552c', '#326d36', '#4f9a45', '#173f20'], 22, true)];
    PROPS.treeAutumn = [treeSprite(['#8a4a1c', '#b8601f', '#e8a33d', '#5e3010'], 31, false)];
    PROPS.deadTree = [deadTree(41), deadTree(42)];
    PROPS.rock = [rockSprite(51, false), rockSprite(52, false)];
    PROPS.bigRock = [rockSprite(53, true), rockSprite(54, true)];
    PROPS.bush = [bushSprite(61, ['#2f6b32', '#3f8a3d', '#6cc04a']), bushSprite(62, ['#2a6034', '#3a7f46', '#5fb06a']), bushSprite(63, ['#4a6a2a', '#5f8a35', '#8ab050'])];
    PROPS.lamp = [lampSprite()];
    PROPS.fountain = [fountainSprite()];
    PROPS.stallA = [stallSprite(71, '#c4483a', '#f4efe2')];
    PROPS.stallB = [stallSprite(72, '#3b6fc4', '#f4efe2')];
    PROPS.crate = [crateSprite()];
    PROPS.barrel = [barrelSprite()];
    PROPS.waypoint = [waypointSprite(81)];
    PROPS.anvil = [anvilSprite()];
    PROPS.cauldron = [cauldronSprite()];
    PROPS.pumpkin = [pumpkinSprite(false), pumpkinSprite(true)];
    PROPS.statue = [statueSprite()];
    PROPS.tent = [tentSprite()];
    PROPS.sign = [signSprite()];
    PROPS.banner = [bannerSprite('#6a4aa8'), bannerSprite('#b34c2c')];
    // Picos de Gelo
    PROPS.snowPine = [
      treeSprite(['#2f5f6a', '#3f7f8a', '#8fd0dc', '#dceef6'], 71, true),
      treeSprite(['#285460', '#376f7a', '#7fc4d0', '#cfe8f2'], 72, true)
    ];
    PROPS.iceRock = [
      tintSprite(rockSprite(51, false), '#9fdcff', 0.5),
      tintSprite(rockSprite(53, true), '#bde8ff', 0.45)
    ];
    PROPS.iceSpire = [
      tintSprite(statueSprite(), '#bde8ff', 0.62),
      tintSprite(statueSprite(), '#d08cff', 0.55)
    ];
  }

  /* --------------------------- personagens --------------------------- */
  const SPRITE_META = new WeakMap();
  const ACTOR_CACHE = new Map();
  const ACTOR_HD_CACHE = new Map();

  const SKINS = ['#f6d7b0', '#e8b98a', '#c98f6a', '#9a6142', '#6b4028'];
  const HAIRS = ['#f2c14e', '#e9e9f4', '#8a4a22', '#2a2a2a', '#c46a3a', '#7f5ad8', '#4a8bea', '#d94a6a'];
  const OUTFITS = ['#3b6fc4', '#3f8f5a', '#8a3a4a', '#6a4aa8', '#c47a2a', '#2f7f8f', '#5a5a7a', '#b34c2c'];
  A.LOOKS = { SKINS, HAIRS, OUTFITS };

  function actorSprite(look, cls, dir, frame) {
    const hd = A.HD_WARRIOR;
    if (cls === 'warrior' && hd && hd.state === 'ready') {
      const hdKey = (dir === 3 ? 3 : dir) + '|' + frame;
      if (ACTOR_HD_CACHE.has(hdKey)) return ACTOR_HD_CACHE.get(hdKey);
      const d = dir === 3 ? 3 : dir;
      const c = A.spr(48, 64, (g) => {
        g.imageSmoothingEnabled = false;
        g.drawImage(hd.image, frame * 96, d * 128, 96, 128, 0, 0, 48, 64);
      });
      SPRITE_META.set(c, { source: 'warrior-hd', anchorX: 24, anchorY: 62 });
      ACTOR_HD_CACHE.set(hdKey, c);
      return c;
    }
    const key = [look.skin, look.hair, look.hairStyle, look.outfit, look.accent, cls, dir, frame].join('|');
    if (ACTOR_CACHE.has(key)) return ACTOR_CACHE.get(key);

    const flip = dir === 3;
    const d = flip ? 2 : dir;

    const c = A.spr(32, 44, (g) => {
      if (flip) { g.translate(32, 0); g.scale(-1, 1); }

      const skin = look.skin || SKINS[0];
      const skinD = shade(skin, -28);
      const skinL = shade(skin, 18);
      const hair = look.hair || HAIRS[0];
      const hairD = shade(hair, -34);
      const outfit = look.outfit || OUTFITS[0];
      const outfitD = shade(outfit, -32);
      const outfitL = shade(outfit, 20);
      const accent = look.accent || '#e8c14a';
      const accentD = shade(accent, -36);
      const leather = '#5a3a22';
      const metal = '#c9d2e4';
      const metalD = '#7b879e';

      const walk = frame === 1 ? 1 : frame === 2 ? -1 : 0;
      const atk = frame === 3;
      const bob = walk === 1 ? -1 : walk === -1 ? 1 : 0;

      // lança / arma atrás
      if (cls === 'mage') {
        r(g, OUT, 3, 12, 3, 28); r(g, '#6b4a2c', 4, 12, 1, 27);
        circle(g, OUT, 4, 10, 5); circle(g, '#7f8cff', 4, 10, 3); circle(g, '#cfd4ff', 4, 9, 1);
      }
      if (cls === 'archer') {
        // aljava nas costas
        r(g, OUT, 24, 16, 6, 14); r(g, leather, 25, 17, 4, 12);
        r(g, '#d9c08a', 26, 14, 1, 5); r(g, '#d9c08a', 28, 14, 1, 5);
      }

      // pernas
      const legY = 31;
      if (cls === 'warrior' || cls === 'archer') {
        r(g, OUT, 9, legY, 6, 11 + (walk === 1 ? -2 : 0));
        r(g, outfitD, 10, legY, 4, 10 + (walk === 1 ? -2 : 0));
        r(g, OUT, 17, legY, 6, 11 + (walk === -1 ? -2 : 0));
        r(g, outfitD, 18, legY, 4, 10 + (walk === -1 ? -2 : 0));
        r(g, OUT, 9, 41, 7, 3); r(g, '#4a3018', 10, 41, 5, 2);
        r(g, OUT, 17, 41, 7, 3); r(g, '#4a3018', 18, 41, 5, 2);
      } else {
        // robe
        r(g, OUT, 8, legY - 4, 16, 14);
        r(g, outfitD, 9, legY - 3, 14, 12);
        r(g, outfit, 10, legY - 3, 12, 9);
        r(g, accentD, 9, 40, 14, 2);
        r(g, '#4a3018', 11, 41, 4, 2); r(g, '#4a3018', 18, 41, 4, 2);
      }

      // corpo
      r(g, OUT, 8, 17 + bob, 16, 16);
      r(g, outfit, 9, 18 + bob, 14, 14);
      r(g, outfitL, 10, 18 + bob, 4, 13);
      r(g, outfitD, 20, 18 + bob, 3, 13);
      // peitoral / detalhes
      if (cls === 'warrior') {
        r(g, metalD, 11, 19 + bob, 10, 7);
        r(g, metal, 12, 20 + bob, 8, 4);
        r(g, '#e8eef8', 13, 20 + bob, 2, 2);
        r(g, accentD, 9, 27 + bob, 14, 3);
        r(g, accent, 10, 27 + bob, 12, 1);
      } else if (cls === 'archer') {
        r(g, leather, 11, 19 + bob, 10, 9);
        r(g, '#7a5232', 12, 20 + bob, 8, 2);
        r(g, accent, 15, 20 + bob, 2, 7);
      } else {
        r(g, accent, 13, 19 + bob, 6, 2);
        r(g, accentD, 13, 21 + bob, 2, 8);
        r(g, accentD, 17, 21 + bob, 2, 8);
      }
      // cinto
      r(g, OUT, 8, 29 + bob, 16, 4);
      r(g, leather, 9, 30 + bob, 14, 2);
      r(g, accent, 15, 30 + bob, 3, 2);

      // braços
      const armY = 19 + bob;
      r(g, OUT, 4, armY, 5, 12);
      r(g, outfit, 5, armY + 1, 3, 9);
      r(g, skin, 5, armY + 9, 3, 3);
      r(g, OUT, 23, armY, 5, 12);
      r(g, outfit, 24, armY + 1, 3, 9);
      r(g, skin, 24, armY + 9, 3, 3);

      // cabeça
      const hy = 4 + bob;
      r(g, OUT, 9, hy, 14, 14);
      r(g, skin, 10, hy + 1, 12, 12);
      r(g, skinD, 10, hy + 10, 12, 3);
      r(g, skinL, 11, hy + 2, 3, 4);

      // cabelo
      const hs = look.hairStyle == null ? 0 : look.hairStyle;
      if (d === 1) {
        // costas
        r(g, hairD, 9, hy, 14, 12);
        r(g, hair, 10, hy, 12, 9);
        r(g, hairD, 10, hy + 8, 12, 4);
        if (hs === 1) { r(g, hair, 8, hy + 4, 4, 14); r(g, hair, 21, hy + 4, 4, 14); }
        if (hs === 2) { r(g, hair, 14, hy + 8, 5, 10); r(g, accent, 15, hy + 9, 3, 2); }
      } else {
        // topo
        r(g, hairD, 9, hy - 1, 14, 6);
        r(g, hair, 10, hy, 12, 4);
        if (hs === 1) { r(g, hairD, 8, hy + 2, 5, 12); r(g, hairD, 20, hy + 2, 5, 12); }
        if (hs === 2) { r(g, hairD, 9, hy + 2, 4, 8); r(g, hairD, 20, hy + 2, 3, 6); r(g, accent, 21, hy + 6, 2, 3); }
        if (hs === 3) { r(g, '#3a2a1a', 9, hy - 1, 14, 5); r(g, '#3a2a1a', 8, hy + 2, 16, 2); }
        // franja
        r(g, hair, 10, hy + 1, 12, 2);
        if (d === 0) {
          // olhos
          r(g, '#2a2233', 12, hy + 6, 2, 3);
          r(g, '#2a2233', 18, hy + 6, 2, 3);
          r(g, '#ffffff', 12, hy + 6, 1, 1);
          r(g, '#ffffff', 18, hy + 6, 1, 1);
          r(g, skinD, 15, hy + 10, 2, 1);
        } else {
          // perfil
          r(g, '#2a2233', 12, hy + 6, 2, 3);
          r(g, '#ffffff', 12, hy + 6, 1, 1);
          r(g, skinD, 9, hy + 9, 2, 2);
        }
      }

      // classe: arma
      if (cls === 'warrior') {
        if (d === 1) {
          r(g, OUT, 25, 8, 4, 26); r(g, metal, 26, 9, 2, 22); r(g, accentD, 24, 30, 6, 3);
        } else {
          r(g, OUT, 25, 10, 4, 26); r(g, metal, 26, 11, 2, 22); r(g, '#e8eef8', 26, 11, 1, 18);
          r(g, accentD, 23, 31, 7, 3); r(g, leather, 25, 34, 3, 6);
        }
        // escudo
        if (d === 0) {
          r(g, OUT, 0, 22, 8, 14); r(g, '#8c96ad', 1, 23, 6, 12);
          r(g, accent, 2, 24, 4, 3); r(g, '#c9d2e4', 2, 27, 1, 6);
        }
      } else if (cls === 'mage') {
        r(g, OUT, 26, 6, 3, 32); r(g, '#6b4a2c', 27, 7, 1, 30);
        circle(g, OUT, 27, 5, 5); circle(g, '#7f8cff', 27, 5, 3); circle(g, '#e0e5ff', 27, 4, 1);
      } else if (cls === 'archer') {
        g.strokeStyle = OUT; g.lineWidth = 4; g.beginPath(); g.arc(25, 22, 10, -1.3, 1.3); g.stroke();
        g.strokeStyle = '#8a5a2e'; g.lineWidth = 2; g.beginPath(); g.arc(25, 22, 10, -1.3, 1.3); g.stroke();
        g.strokeStyle = '#d9d2c0'; g.lineWidth = 1; g.beginPath(); g.moveTo(27, 13); g.lineTo(27, 31); g.stroke();
      } else if (cls === 'cleric') {
        r(g, OUT, 25, 10, 3, 26); r(g, '#6b4a2c', 26, 11, 1, 24);
        r(g, OUT, 22, 6, 9, 7); r(g, '#c9d2e4', 23, 7, 7, 5); r(g, accent, 25, 8, 3, 3);
        // livro
        if (d === 0) { r(g, OUT, 1, 24, 8, 9); r(g, '#f4efe2', 2, 25, 6, 7); r(g, accentD, 4, 25, 2, 7); }
      }

      // contorno extra no chão
      r(g, 'rgba(0,0,0,.18)', 7, 43, 18, 1);
    });

    ACTOR_CACHE.set(key, c);
    return c;
  }

  function drawAnchored(ctx, sprite, x, y, scale) {
    const s = scale == null ? 1 : scale;
    const meta = SPRITE_META.get(sprite);
    const anchorX = meta ? meta.anchorX : sprite.width / 2;
    const anchorY = meta ? meta.anchorY : sprite.height;
    ctx.drawImage(sprite, x - anchorX * s, y - anchorY * s, sprite.width * s, sprite.height * s);
  }

  function portrait(look, cls) {
    const src = actorSprite(look, cls, 0, 0);
    const c = A.spr(72, 72, (g) => {
      const grd = g.createLinearGradient(0, 0, 0, 72);
      grd.addColorStop(0, '#2c2340'); grd.addColorStop(1, '#150f24');
      g.fillStyle = grd; g.fillRect(0, 0, 72, 72);
      circle(g, 'rgba(242,184,75,.08)', 36, 40, 30);
      const scale = Math.min(68 / src.width, 68 / src.height);
      drawAnchored(g, src, 36, 66, scale);
      g.strokeStyle = '#d9a23f'; g.lineWidth = 2; g.strokeRect(1, 1, 70, 70);
    });
    return c;
  }

  /* --------------------------- monstros --------------------------- */
  const MON_CACHE = new Map();

  function mons(type, frame) {
    const key = type + '|' + frame;
    if (MON_CACHE.has(key)) return MON_CACHE.get(key);
    const f = frame;
    let c;
    switch (type) {
      case 'slime': c = A.spr(36, 32, (g) => {
        const sq = f ? 1 : 0;
        const y = 8 + sq;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(18, 29, 12, 3, 0, 0, 6.283); g.fill();
        g.fillStyle = OUT; g.beginPath(); g.ellipse(18, y + 10, 13, 11 - sq, 0, 0, 6.283); g.fill();
        g.fillStyle = '#3f9f45'; g.beginPath(); g.ellipse(18, y + 9, 12, 10 - sq, 0, 0, 6.283); g.fill();
        g.fillStyle = '#63d35f'; g.beginPath(); g.ellipse(17, y + 8, 10, 8 - sq, 0, 0, 6.283); g.fill();
        circle(g, '#b7f5ae', 13, y + 4, 2);
        r(g, '#b7f5ae', 21, y + 3, 3, 2);
        r(g, '#16202e', 12, y + 8, 3, 4); r(g, '#16202e', 21, y + 8, 3, 4);
        r(g, '#ffffff', 12, y + 8, 1, 1); r(g, '#ffffff', 21, y + 8, 1, 1);
        r(g, '#2f7a35', 14, y + 15, 8, 1);
      }); break;
      case 'wolf': c = A.spr(44, 34, (g) => {
        const a = f ? 1 : 0;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(22, 31, 15, 3, 0, 0, 6.283); g.fill();
        const B = '#7c8191', L = '#9aa0b0', D = '#5f6475';
        // cauda
        r(g, OUT, 36, 12, 7, 4); r(g, D, 37, 12, 6, 3); r(g, D, 41, 9, 3, 4);
        // corpo
        r(g, OUT, 8, 12, 28, 14); r(g, B, 9, 13, 26, 12); r(g, L, 9, 13, 26, 4); r(g, D, 9, 22, 26, 3);
        // patas
        r(g, OUT, 11, 24, 5, 8 - a); r(g, D, 12, 25, 3, 6 - a);
        r(g, OUT, 18, 24, 5, 7 + a); r(g, D, 19, 25, 3, 5 + a);
        r(g, OUT, 26, 24, 5, 8 - a); r(g, D, 27, 25, 3, 6 - a);
        r(g, OUT, 32, 24, 5, 7 + a); r(g, D, 33, 25, 3, 5 + a);
        // cabeça
        r(g, OUT, 2, 8, 15, 13); r(g, B, 3, 9, 13, 11); r(g, L, 3, 9, 13, 3);
        r(g, OUT, 3, 4, 4, 6); r(g, D, 4, 5, 2, 4);
        r(g, OUT, 9, 3, 4, 7); r(g, D, 10, 4, 2, 5);
        r(g, '#ff5a3c', 5, 12, 2, 2); r(g, '#1a1a22', 1, 14, 3, 2);
        r(g, '#ffffff', 4, 18, 3, 1); r(g, '#ffffff', 2, 17, 1, 1);
        r(g, D, 14, 17, 2, 2);
      }); break;
      case 'goblin': c = A.spr(32, 40, (g) => {
        const a = f ? 1 : 0;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(16, 38, 9, 2.5, 0, 0, 6.283); g.fill();
        const S = '#78ac45', SD = '#5f8f38', SL = '#8fc45a';
        r(g, OUT, 11, 27, 5, 11 - a); r(g, SD, 12, 28, 3, 9 - a);
        r(g, OUT, 17, 27, 5, 10 + a); r(g, SD, 18, 28, 3, 8 + a);
        r(g, OUT, 11, 36 - a, 6, 4); r(g, '#3a2a14', 12, 36 - a, 4, 3);
        r(g, OUT, 17, 35 + a, 6, 4); r(g, '#3a2a14', 18, 35 + a, 4, 3);
        // corpo
        r(g, OUT, 9, 18, 14, 12); r(g, '#7a4a26', 10, 19, 12, 10);
        r(g, '#9a6a3a', 11, 19, 4, 9); r(g, '#5e3a1a', 10, 27, 12, 2);
        // braços
        r(g, OUT, 5, 19, 5, 10); r(g, S, 6, 20, 3, 8);
        r(g, OUT, 22, 19, 5, 10); r(g, S, 23, 20, 3, 8);
        // cabeça
        r(g, OUT, 8, 6, 16, 14); r(g, S, 9, 7, 14, 12); r(g, SL, 10, 8, 4, 4);
        r(g, OUT, 4, 8, 6, 4); r(g, S, 5, 9, 5, 2);
        r(g, OUT, 23, 8, 6, 4); r(g, S, 23, 9, 5, 2);
        r(g, '#c9d2e4', 5, 9, 2, 1); r(g, '#c9d2e4', 26, 9, 2, 1);
        r(g, '#ffe04a', 11, 11, 2, 3); r(g, '#ffe04a', 19, 11, 2, 3);
        r(g, '#2a1a14', 11, 11, 1, 1); r(g, '#2a1a14', 19, 11, 1, 1);
        r(g, '#3a2a14', 14, 16, 4, 1);
        // arma
        r(g, OUT, 26, 10, 3, 20); r(g, '#8a5a2e', 27, 11, 1, 18);
        r(g, OUT, 23, 8, 8, 6); r(g, '#c9d2e4', 24, 9, 6, 4);
      }); break;
      case 'crab': c = A.spr(40, 28, (g) => {
        const a = f ? 1 : 0;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(20, 26, 14, 2.5, 0, 0, 6.283); g.fill();
        const C = '#d9614c', CD = '#a84334', CL = '#f0856d';
        // patas
        for (let i = 0; i < 3; i++) {
          r(g, OUT, 3 + i * 3, 16 + a, 9, 3); r(g, CD, 4 + i * 3, 17 + a, 7, 1);
          r(g, OUT, 28 + i * 3, 16 + a, 9, 3); r(g, CD, 29 + i * 3, 17 + a, 7, 1);
        }
        // corpo
        r(g, OUT, 8, 8, 24, 16); r(g, C, 9, 9, 22, 14); r(g, CL, 10, 9, 20, 4); r(g, CD, 10, 20, 20, 3);
        // olhos
        r(g, OUT, 13, 4, 4, 5); r(g, OUT, 23, 4, 4, 5); r(g, '#ffffff', 14, 5, 2, 3); r(g, '#ffffff', 24, 5, 2, 3);
        r(g, '#1a1a22', 14, 6, 1, 2); r(g, '#1a1a22', 24, 6, 1, 2);
        // pinças
        r(g, OUT, 0, 10, 9, 6); r(g, C, 1, 11, 7, 4); r(g, CD, 0, 9, 4, 2);
        r(g, OUT, 31, 10, 9, 6); r(g, C, 32, 11, 7, 4); r(g, CD, 36, 9, 4, 2);
      }); break;
      case 'bandit': c = A.spr(32, 42, (g) => {
        const a = f ? 1 : 0;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(16, 40, 8, 2.5, 0, 0, 6.283); g.fill();
        const S = '#c98f6a', V = '#5a4a3a', R = '#8a2a2a';
        r(g, OUT, 10, 29, 5, 11 - a); r(g, '#3a3a4a', 11, 30, 3, 9 - a);
        r(g, OUT, 17, 29, 5, 10 + a); r(g, '#3a3a4a', 18, 30, 3, 8 + a);
        r(g, OUT, 10, 38 - a, 6, 4); r(g, '#2a2018', 11, 38 - a, 4, 3);
        r(g, OUT, 17, 37 + a, 6, 4); r(g, '#2a2018', 18, 37 + a, 4, 3);
        r(g, OUT, 9, 18, 14, 13); r(g, V, 10, 19, 12, 11); r(g, '#6a5a4a', 11, 19, 4, 10);
        r(g, OUT, 8, 28, 16, 3); r(g, '#3a2a1a', 9, 29, 14, 1);
        r(g, OUT, 5, 19, 5, 11); r(g, V, 6, 20, 3, 9); r(g, S, 6, 28, 3, 3);
        r(g, OUT, 22, 19, 5, 11); r(g, V, 23, 20, 3, 9); r(g, S, 23, 28, 3, 3);
        r(g, OUT, 9, 5, 14, 14); r(g, S, 10, 6, 12, 12); r(g, S, 10, 15, 12, 3);
        r(g, R, 9, 11, 14, 5);
        r(g, '#1a1a22', 12, 8, 2, 2); r(g, '#1a1a22', 18, 8, 2, 2);
        r(g, '#3a2a1a', 13, 17, 6, 1);
        r(g, '#2a2a2a', 9, 4, 14, 4);
        // adaga
        r(g, OUT, 25, 20, 3, 13); r(g, '#c9d2e4', 26, 21, 1, 9); r(g, '#8a5a2e', 24, 29, 4, 2);
      }); break;
      case 'spider': c = A.spr(44, 30, (g) => {
        const a = f ? 1 : 0;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(22, 28, 15, 2.5, 0, 0, 6.283); g.fill();
        const C = '#4a3a5e', CD = '#332844', CL = '#6a5680';
        for (let i = 0; i < 4; i++) {
          const yy = 12 + i * 3;
          r(g, OUT, 2, yy, 12, 3); r(g, CD, 3, yy + 1, 10, 1);
          r(g, OUT, 30, yy, 12, 3); r(g, CD, 31, yy + 1, 10, 1);
          r(g, OUT, 4 + i * 2, yy + 2, 3, 8 + a); r(g, CD, 5 + i * 2, yy + 3, 1, 6 + a);
          r(g, OUT, 36 - i * 2, yy + 2, 3, 8 + a); r(g, CD, 37 - i * 2, yy + 3, 1, 6 + a);
        }
        r(g, OUT, 12, 8, 20, 17); r(g, C, 13, 9, 18, 15); r(g, CL, 15, 9, 8, 5);
        r(g, OUT, 17, 4, 10, 8); r(g, C, 18, 5, 8, 6);
        r(g, '#ff4a5a', 18, 7, 2, 2); r(g, '#ff4a5a', 24, 7, 2, 2);
        r(g, '#ff4a5a', 17, 6, 1, 1); r(g, '#ff4a5a', 25, 6, 1, 1);
        r(g, CD, 15, 13, 14, 2);
      }); break;
      case 'treant': c = A.spr(52, 68, (g) => {
        const a = f ? 1 : 0;
        g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(26, 65, 18, 4, 0, 0, 6.283); g.fill();
        const B = '#5a4530', BD = '#3d2e1f', BL = '#7a6040', G = '#3f7a3a', GL = '#5fa04a';
        // pernas
        r(g, OUT, 14, 50, 7, 17 - a); r(g, BD, 15, 51, 5, 15 - a);
        r(g, OUT, 31, 50, 7, 16 + a); r(g, BD, 32, 51, 5, 14 + a);
        r(g, OUT, 10, 63 - a, 12, 5); r(g, OUT, 29, 61 + a, 12, 5);
        // tronco
        r(g, OUT, 13, 22, 26, 30); r(g, B, 14, 23, 24, 28); r(g, BL, 15, 24, 6, 26); r(g, BD, 32, 24, 5, 26);
        r(g, '#4a3826', 20, 28, 2, 22); r(g, '#4a3826', 27, 26, 2, 24);
        // braços
        r(g, OUT, 2, 24, 14, 7); r(g, B, 3, 25, 12, 5); r(g, BD, 2, 30, 6, 4);
        r(g, OUT, 36, 24, 14, 7); r(g, B, 37, 25, 12, 5); r(g, BD, 44, 30, 6, 4);
        // copa
        const blobs = [[26, 12, 14], [14, 16, 10], [38, 16, 10], [26, 22, 12]];
        blobs.forEach(b => circle(g, OUT, b[0], b[1], b[2] + 1));
        blobs.forEach(b => circle(g, '#2f6b32', b[0], b[1], b[2]));
        blobs.forEach(b => circle(g, G, b[0] - 1, b[1] - 1, b[2] - 2));
        for (let i = 0; i < 16; i++) circle(g, GL, 8 + Math.floor(Math.random() * 34) * 1, 4 + Math.floor(Math.random() * 26), 1.5);
        // olhos
        r(g, '#1a1410', 20, 34, 3, 4); r(g, '#1a1410', 29, 34, 3, 4);
        r(g, '#ffe27a', 21, 35, 1, 2); r(g, '#ffe27a', 30, 35, 1, 2);
        r(g, '#2a1a10', 23, 42, 6, 2);
      }); break;
      case 'skeleton': c = A.spr(34, 44, (g) => {
        const a = f ? 1 : 0;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(17, 42, 8, 2.5, 0, 0, 6.283); g.fill();
        const B = '#d8d8e6', BD = '#a8a8bc', BL = '#f2f2fa';
        // pernas
        r(g, OUT, 11, 30, 4, 11 - a); r(g, B, 12, 31, 2, 9 - a);
        r(g, OUT, 19, 30, 4, 10 + a); r(g, B, 20, 31, 2, 8 + a);
        r(g, OUT, 10, 40 - a, 6, 3); r(g, BD, 11, 40 - a, 4, 2);
        r(g, OUT, 18, 39 + a, 6, 3); r(g, BD, 19, 39 + a, 4, 2);
        // coluna
        r(g, OUT, 15, 26, 4, 8); r(g, B, 16, 26, 2, 7);
        // costelas
        r(g, OUT, 10, 18, 14, 12); r(g, '#2a2233', 11, 19, 12, 10);
        r(g, B, 12, 19, 2, 9); r(g, B, 20, 19, 2, 9);
        for (let i = 0; i < 4; i++) r(g, B, 12, 20 + i * 2, 10, 1);
        // braços
        r(g, OUT, 6, 19, 4, 12); r(g, B, 7, 20, 2, 10);
        r(g, OUT, 24, 19, 4, 12); r(g, B, 25, 20, 2, 10);
        // crânio
        r(g, OUT, 10, 4, 14, 15); r(g, B, 11, 5, 12, 13); r(g, BL, 12, 6, 4, 4);
        r(g, '#1a1a22', 13, 9, 3, 4); r(g, '#1a1a22', 19, 9, 3, 4);
        r(g, '#ff4a3a', 14, 10, 1, 2); r(g, '#ff4a3a', 20, 10, 1, 2);
        r(g, '#1a1a22', 15, 15, 5, 1); r(g, BD, 15, 16, 1, 2); r(g, BD, 18, 16, 1, 2);
        // espada
        r(g, OUT, 28, 8, 4, 26); r(g, '#c9d2e4', 29, 9, 2, 20); r(g, '#8a5a2e', 27, 29, 6, 2); r(g, '#6b4a2c', 29, 31, 2, 5);
      }); break;
      case 'wraith': c = A.spr(38, 50, (g) => {
        const a = f ? 1 : 0;
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(19, 48, 9, 2.5, 0, 0, 6.283); g.fill();
        const P = '#8f7ad8', PD = '#5f4a9e', PL = '#c0b0ff';
        // manto
        g.fillStyle = OUT;
        g.beginPath(); g.moveTo(19, 2); g.lineTo(34, 20); g.lineTo(31, 44 + a); g.lineTo(24, 38); g.lineTo(19, 46); g.lineTo(14, 38); g.lineTo(7, 44 - a); g.lineTo(4, 20); g.closePath(); g.fill();
        g.fillStyle = PD;
        g.beginPath(); g.moveTo(19, 4); g.lineTo(32, 21); g.lineTo(29, 40 + a); g.lineTo(23, 35); g.lineTo(19, 42); g.lineTo(15, 35); g.lineTo(9, 40 - a); g.lineTo(6, 21); g.closePath(); g.fill();
        g.fillStyle = P;
        g.beginPath(); g.moveTo(19, 6); g.lineTo(27, 21); g.lineTo(25, 33); g.lineTo(19, 30); g.lineTo(13, 33); g.lineTo(11, 21); g.closePath(); g.fill();
        // capuz
        circle(g, OUT, 19, 13, 11); circle(g, PD, 19, 13, 9); circle(g, '#1a1020', 19, 14, 6);
        r(g, '#7dffea', 16, 13, 2, 2); r(g, '#7dffea', 21, 13, 2, 2);
        // mãos
        r(g, OUT, 4, 24, 5, 7); r(g, PL, 5, 25, 3, 5);
        r(g, OUT, 29, 24, 5, 7); r(g, PL, 30, 25, 3, 5);
        // energia
        for (let i = 0; i < 8; i++) r(g, 'rgba(160,140,255,.6)', 5 + Math.floor(Math.random() * 28), 20 + Math.floor(Math.random() * 22), 1, 2);
      }); break;
      case 'golem': c = A.spr(54, 56, (g) => {
        const a = f ? 1 : 0;
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(27, 54, 18, 4, 0, 0, 6.283); g.fill();
        const B = '#8f887a', BD = '#6a6458', BL = '#aaa394';
        r(g, OUT, 14, 40, 9, 14 - a); r(g, BD, 15, 41, 7, 12 - a);
        r(g, OUT, 31, 40, 9, 13 + a); r(g, BD, 32, 41, 7, 11 + a);
        r(g, OUT, 10, 51 - a, 14, 5); r(g, OUT, 30, 50 + a, 14, 5);
        // torso
        r(g, OUT, 11, 18, 32, 26); r(g, B, 12, 19, 30, 24);
        r(g, BL, 13, 19, 8, 10); r(g, BD, 36, 22, 5, 20);
        r(g, '#6a6458', 22, 30, 10, 2); r(g, '#6a6458', 18, 40, 18, 2);
        // braços enormes
        r(g, OUT, 1, 20, 12, 24); r(g, B, 2, 21, 10, 22); r(g, BD, 2, 38, 8, 5);
        r(g, OUT, 41, 20, 12, 24); r(g, B, 42, 21, 10, 22); r(g, BD, 44, 38, 8, 5);
        // cabeça
        r(g, OUT, 17, 3, 20, 16); r(g, B, 18, 4, 18, 14); r(g, BL, 19, 4, 6, 5);
        r(g, '#2a2430', 21, 9, 12, 4);
        r(g, '#7fd0ff', 22, 10, 3, 2); r(g, '#7fd0ff', 29, 10, 3, 2);
        // núcleo
        circle(g, 'rgba(127,208,255,.35)', 27, 30, 9);
        circle(g, OUT, 27, 30, 5); circle(g, '#7fd0ff', 27, 30, 4); circle(g, '#d4f4ff', 26, 29, 1);
        // rachaduras
        r(g, '#5a5448', 15, 24, 1, 8); r(g, '#5a5448', 20, 34, 6, 1); r(g, '#5a5448', 34, 24, 1, 10);
      }); break;
      case 'witch': c = A.spr(40, 50, (g) => {
        const a = f ? 1 : 0;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(20, 48, 10, 2.5, 0, 0, 6.283); g.fill();
        const R = '#4a3a6e', RD = '#302548', G = '#7dff9a';
        r(g, OUT, 11, 34, 8, 14); r(g, R, 12, 35, 6, 12); r(g, RD, 17, 35, 2, 12);
        r(g, OUT, 22, 34, 8, 14); r(g, R, 23, 35, 6, 12); r(g, RD, 27, 35, 2, 12);
        // robe
        g.fillStyle = OUT; g.beginPath(); g.moveTo(12, 18); g.lineTo(28, 18); g.lineTo(33, 40); g.lineTo(7, 40); g.closePath(); g.fill();
        g.fillStyle = R; g.beginPath(); g.moveTo(13, 19); g.lineTo(27, 19); g.lineTo(31, 39); g.lineTo(9, 39); g.closePath(); g.fill();
        r(g, RD, 10, 37, 20, 2);
        // cabeça
        r(g, OUT, 12, 5, 16, 15); r(g, '#b8a8c8', 13, 6, 14, 13); r(g, '#d0c4dc', 14, 7, 4, 4);
        r(g, '#1a1020', 15, 11, 3, 3); r(g, '#1a1020', 22, 11, 3, 3);
        r(g, G, 16, 12, 1, 1); r(g, G, 23, 12, 1, 1);
        r(g, '#5a2a4a', 17, 16, 5, 1);
        // chapéu
        g.fillStyle = OUT; g.beginPath(); g.moveTo(20, 0); g.lineTo(30, 7); g.lineTo(6, 9); g.closePath(); g.fill();
        g.fillStyle = '#3a2a55'; g.beginPath(); g.moveTo(20, 2); g.lineTo(27, 7); g.lineTo(8, 8); g.closePath(); g.fill();
        r(g, OUT, 4, 8, 32, 4); r(g, '#4a3a6e', 6, 9, 28, 2);
        // cajado
        r(g, OUT, 34, 10, 3, 32); r(g, '#6b4a2c', 35, 11, 1, 30);
        circle(g, OUT, 35, 8, 6); circle(g, G, 35, 8, 4); circle(g, '#d4ffdc', 34, 7, 1);
        circle(g, 'rgba(125,255,154,.25)', 35, 8, 10);
      }); break;
      case 'boss_rei': c = A.spr(84, 92, (g) => {
        const a = f ? 1 : 0;
        g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(42, 88, 28, 6, 0, 0, 6.283); g.fill();
        const B = '#c8c0d8', BD = '#8f86a8', BL = '#f0eaff', C = '#ffb347';
        // pernas
        r(g, OUT, 26, 62, 10, 22 - a); r(g, B, 27, 63, 8, 20 - a);
        r(g, OUT, 48, 62, 10, 21 + a); r(g, B, 49, 63, 8, 19 + a);
        r(g, OUT, 22, 82 - a, 16, 7); r(g, BD, 23, 82 - a, 14, 5);
        r(g, OUT, 46, 81 + a, 16, 7); r(g, BD, 47, 81 + a, 14, 5);
        // torso
        r(g, OUT, 24, 32, 36, 34); r(g, '#2a2233', 25, 33, 34, 32);
        r(g, B, 27, 34, 4, 28); r(g, B, 53, 34, 4, 28);
        for (let i = 0; i < 7; i++) r(g, B, 27, 36 + i * 4, 30, 2);
        r(g, C, 30, 50, 24, 4); r(g, '#8a6a1a', 30, 53, 24, 1);
        // ombreiras
        r(g, OUT, 12, 30, 16, 14); r(g, '#3a3048', 13, 31, 14, 12); r(g, C, 14, 32, 12, 2);
        r(g, OUT, 56, 30, 16, 14); r(g, '#3a3048', 57, 31, 14, 12); r(g, C, 58, 32, 12, 2);
        // braços
        r(g, OUT, 10, 42, 8, 20); r(g, BD, 11, 43, 6, 18);
        r(g, OUT, 66, 42, 8, 20); r(g, BD, 67, 43, 6, 18);
        // crânio
        r(g, OUT, 30, 6, 24, 26); r(g, B, 31, 7, 22, 24); r(g, BL, 33, 8, 8, 6);
        r(g, '#1a1020', 34, 15, 6, 7); r(g, '#1a1020', 44, 15, 6, 7);
        r(g, '#ff3a2a', 35, 17, 2, 3); r(g, '#ff3a2a', 45, 17, 2, 3);
        r(g, '#1a1020', 36, 26, 12, 2);
        for (let i = 0; i < 4; i++) r(g, BD, 37 + i * 3, 27, 1, 2);
        // coroa
        r(g, OUT, 28, 0, 28, 9); r(g, C, 29, 1, 26, 6);
        r(g, OUT, 31, -4, 4, 6); r(g, C, 32, -3, 2, 4);
        r(g, OUT, 40, -6, 4, 8); r(g, C, 41, -5, 2, 6);
        r(g, OUT, 49, -4, 4, 6); r(g, C, 50, -3, 2, 4);
        r(g, '#e05252', 41, 2, 2, 2);
        // espadão
        r(g, OUT, 70, 18, 7, 56); r(g, '#d8d8e6', 71, 19, 5, 44); r(g, '#f4f4ff', 72, 19, 1, 40);
        r(g, OUT, 64, 58, 20, 6); r(g, C, 65, 59, 18, 3);
        r(g, OUT, 72, 63, 4, 12); r(g, '#5a3a22', 73, 63, 2, 11);
        // aura
        circle(g, 'rgba(255,60,50,.12)', 42, 44, 40);
      }); break;
      case 'yeti': c = A.spr(58, 66, (g) => {
        const a = f ? 1 : 0;
        g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(29, 63, 19, 4, 0, 0, 6.283); g.fill();
        const F = '#e8f2fa', FD = '#c8dce8', FL = '#ffffff', SK = '#b8d4e4';
        // pernas
        r(g, OUT, 16, 49, 10, 15 - a); r(g, FD, 17, 50, 8, 13 - a);
        r(g, OUT, 32, 49, 10, 14 + a); r(g, FD, 33, 50, 8, 12 + a);
        r(g, OUT, 13, 61 - a, 14, 5); r(g, SK, 14, 62 - a, 12, 3);
        r(g, OUT, 31, 60 + a, 14, 5); r(g, SK, 32, 61 + a, 12, 3);
        // torso peludo
        r(g, OUT, 14, 24, 30, 28); r(g, F, 15, 25, 28, 26);
        r(g, FL, 17, 26, 8, 18); r(g, FD, 37, 30, 5, 20);
        for (let i = 0; i < 22; i++) r(g, i % 2 ? FL : FD, 16 + Math.floor(Math.random() * 26), 27 + Math.floor(Math.random() * 20), 2, 2);
        // braços longos
        r(g, OUT, 4, 25, 12, 28); r(g, F, 5, 26, 10, 26); r(g, FD, 6, 47, 8, 7);
        r(g, OUT, 42, 25, 12, 28); r(g, F, 43, 26, 10, 26); r(g, FD, 44, 47, 8, 7);
        // cabeça
        r(g, OUT, 16, 4, 26, 24); r(g, F, 17, 5, 24, 22); r(g, FL, 19, 6, 8, 8);
        r(g, SK, 20, 15, 18, 9);
        r(g, '#1a2430', 21, 12, 4, 4); r(g, '#1a2430', 33, 12, 4, 4);
        r(g, '#7fd0ff', 22, 13, 2, 2); r(g, '#7fd0ff', 34, 13, 2, 2);
        r(g, '#2a3440', 24, 21, 11, 3);
        r(g, '#f4fbff', 25, 21, 2, 4); r(g, '#f4fbff', 29, 21, 2, 4); r(g, '#f4fbff', 33, 21, 2, 4);
        // chifres
        r(g, OUT, 13, 2, 6, 10); r(g, SK, 14, 3, 4, 8);
        r(g, OUT, 39, 2, 6, 10); r(g, SK, 40, 3, 4, 8);
        // aura fria
        circle(g, 'rgba(160,230,255,.12)', 29, 38, 32);
      }); break;
      case 'frostwolf': c = tintSprite(mons('wolf', f), '#6fd0ff', 0.5); break;
      case 'icegolem': c = tintSprite(mons('golem', f), '#9fdcff', 0.42); break;
      case 'frostwitch': c = tintSprite(mons('witch', f), '#8fe4ff', 0.48); break;
      case 'boss_ice': c = tintSprite(mons('boss_rei', f), '#5fc8ff', 0.55); break;
      case 'boss_rainha': c = tintSprite(mons('boss_rei', f), '#b8f4ff', 0.55); break;
      case 'crab_king': c = tintSprite(mons('crab', f), '#ffd080', 0.35); break;
      case 'boss_treant': c = tintSprite(mons('treant', f), '#7fd0a0', 0.38); break;
      case 'boss_lodo': c = tintSprite(mons('treant', f), '#7fcf50', 0.5); break;
      case 'eclipse_knight': c = tintSprite(mons('skeleton', f), '#a040ff', 0.48); break;
      case 'eclipse_mage': c = tintSprite(mons('wraith', f), '#d040ff', 0.5); break;
      case 'boss_cidadela': c = tintSprite(mons('boss_rei', f), '#b040ff', 0.5); break;
      case 'boss_eclipse': c = tintSprite(mons('boss_rei', f), '#ff40b0', 0.52); break;
      default: c = A.spr(32, 32, (g) => { r(g, '#ff00ff', 8, 8, 16, 16); });
    }
    MON_CACHE.set(key, c);
    return c;
  }

  /* --------------------------- ícones --------------------------- */
  const ICON_CACHE = new Map();

  function iconCanvas(name) {
    if (ICON_CACHE.has(name)) return ICON_CACHE.get(name);
    const c = A.spr(32, 32, (g) => {
      g.clearRect(0, 0, 32, 32);
      const O = '#1a1424';
      const rect = (col, x, y, w, h) => r(g, col, x, y, w, h);
      const line = (col, x1, y1, x2, y2, w) => {
        g.strokeStyle = col; g.lineWidth = w || 1; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      };
      switch (name) {
        case 'sword':
          line(O, 7, 25, 24, 8, 7); line('#8a94aa', 9, 23, 23, 9, 4); line('#e8eef8', 10, 22, 22, 10, 1);
          line('#d9a23f', 5, 21, 12, 28, 3); rect('#8a5a2e', 4, 26, 5, 4);
          break;
        case 'staff':
          line(O, 9, 28, 21, 8, 5); line('#8a5a2e', 10, 27, 20, 9, 2);
          circle(g, O, 21, 7, 7); circle(g, '#5f6fd8', 21, 7, 5); circle(g, '#c9d2ff', 20, 5, 2);
          break;
        case 'bow':
          g.strokeStyle = O; g.lineWidth = 5; g.beginPath(); g.arc(9, 16, 12, -1.25, 1.25); g.stroke();
          g.strokeStyle = '#8a5a2e'; g.lineWidth = 3; g.beginPath(); g.arc(9, 16, 12, -1.25, 1.25); g.stroke();
          line('#d9d2c0', 12, 5, 12, 27, 1); line(O, 6, 16, 27, 16, 3); line('#c9d2e4', 8, 16, 26, 16, 1);
          line('#d9a23f', 24, 13, 28, 16, 2); line('#d9a23f', 24, 19, 28, 16, 2);
          break;
        case 'mace':
          line(O, 9, 28, 19, 10, 5); line('#8a5a2e', 10, 27, 18, 11, 2);
          circle(g, O, 21, 8, 8); circle(g, '#8a8fa4', 21, 8, 6);
          for (let i = 0; i < 6; i++) { const a = i * 1.047; rect('#c9d2e4', 21 + Math.cos(a) * 7 - 1, 8 + Math.sin(a) * 7 - 1, 3, 3); }
          break;
        case 'chest':
          g.fillStyle = O; g.beginPath(); g.moveTo(6, 8); g.lineTo(26, 8); g.lineTo(28, 16); g.lineTo(24, 28); g.lineTo(8, 28); g.lineTo(4, 16); g.closePath(); g.fill();
          g.fillStyle = '#8a94aa'; g.beginPath(); g.moveTo(8, 10); g.lineTo(24, 10); g.lineTo(25, 16); g.lineTo(22, 26); g.lineTo(10, 26); g.lineTo(7, 16); g.closePath(); g.fill();
          rect('#c9d2e4', 10, 11, 5, 8); rect('#d9a23f', 14, 18, 4, 8); rect('#6a7488', 7, 15, 18, 2);
          break;
        case 'helmet':
          g.fillStyle = O; g.beginPath(); g.arc(16, 16, 12, Math.PI, 0); g.lineTo(28, 26); g.lineTo(4, 26); g.closePath(); g.fill();
          g.fillStyle = '#8a94aa'; g.beginPath(); g.arc(16, 16, 10, Math.PI, 0); g.lineTo(26, 25); g.lineTo(6, 25); g.closePath(); g.fill();
          rect('#c9d2e4', 9, 13, 4, 8); rect('#1a1424', 13, 19, 6, 4); rect('#d9a23f', 15, 6, 2, 10);
          break;
        case 'boots':
          rect(O, 6, 8, 9, 16); rect('#7a4e28', 7, 9, 7, 14); rect(O, 18, 10, 9, 14); rect('#7a4e28', 19, 11, 7, 12);
          rect(O, 4, 22, 13, 6); rect('#5e3a1a', 5, 23, 11, 4); rect(O, 16, 22, 13, 6); rect('#5e3a1a', 17, 23, 11, 4);
          break;
        case 'ring':
          circle(g, O, 16, 19, 9); circle(g, '#d9a23f', 16, 19, 7); circle(g, '#2a2233', 16, 19, 5);
          rect(O, 12, 4, 8, 8); rect('#7fd0ff', 13, 5, 6, 6); rect('#d4f4ff', 14, 6, 2, 2);
          break;
        case 'amulet':
          g.strokeStyle = O; g.lineWidth = 3; g.beginPath(); g.arc(16, 12, 10, 0.2, 2.94); g.stroke();
          g.strokeStyle = '#d9a23f'; g.lineWidth = 1; g.beginPath(); g.arc(16, 12, 10, 0.2, 2.94); g.stroke();
          g.fillStyle = O; g.beginPath(); g.moveTo(16, 12); g.lineTo(25, 20); g.lineTo(16, 29); g.lineTo(7, 20); g.closePath(); g.fill();
          g.fillStyle = '#c07cff'; g.beginPath(); g.moveTo(16, 14); g.lineTo(23, 20); g.lineTo(16, 27); g.lineTo(9, 20); g.closePath(); g.fill();
          rect('#e8d4ff', 15, 16, 2, 5);
          break;
        case 'potion_hp': case 'potion_mp': case 'elixir':
          {
            const liq = name === 'potion_hp' ? '#e05252' : name === 'potion_mp' ? '#4a8bea' : '#f2b84b';
            rect(O, 12, 3, 8, 5); rect('#c9d2e4', 13, 4, 6, 3);
            rect(O, 11, 8, 10, 3); rect(O, 7, 11, 18, 18);
            rect('#2a2233', 9, 13, 14, 15);
            rect(liq, 9, 17, 14, 10); rect(A.shade(liq, 30), 9, 17, 14, 2);
            rect('#ffffff88', 11, 15, 2, 8); rect('#ffffff55', 20, 19, 2, 5);
            if (name === 'elixir') { rect('#d9a23f', 8, 11, 1, 18); rect('#d9a23f', 23, 11, 1, 18); rect('#ffe27a', 14, 1, 4, 3); }
            break;
          }
        case 'herb':
          line(O, 16, 28, 16, 12, 3);
          g.fillStyle = O; g.beginPath(); g.ellipse(10, 14, 7, 4, -0.6, 0, 6.283); g.fill();
          g.fillStyle = '#4f9a3a'; g.beginPath(); g.ellipse(10, 14, 6, 3, -0.6, 0, 6.283); g.fill();
          g.fillStyle = O; g.beginPath(); g.ellipse(22, 10, 7, 4, 0.6, 0, 6.283); g.fill();
          g.fillStyle = '#6fc255'; g.beginPath(); g.ellipse(22, 10, 6, 3, 0.6, 0, 6.283); g.fill();
          line('#7cc255', 16, 24, 16, 12, 1);
          break;
        case 'ore':
          g.fillStyle = O; g.beginPath(); g.moveTo(5, 24); g.lineTo(8, 10); g.lineTo(20, 6); g.lineTo(28, 14); g.lineTo(26, 26); g.lineTo(10, 28); g.closePath(); g.fill();
          g.fillStyle = '#7a7468'; g.beginPath(); g.moveTo(7, 23); g.lineTo(10, 12); g.lineTo(20, 8); g.lineTo(26, 15); g.lineTo(24, 24); g.lineTo(11, 26); g.closePath(); g.fill();
          rect('#b9a38a', 12, 11, 5, 2); rect('#d9c08a', 18, 16, 4, 2); rect('#a89478', 11, 20, 6, 2);
          break;
        case 'crystal':
          g.fillStyle = O; g.beginPath(); g.moveTo(16, 3); g.lineTo(26, 13); g.lineTo(22, 28); g.lineTo(10, 28); g.lineTo(6, 13); g.closePath(); g.fill();
          g.fillStyle = '#5f6fd8'; g.beginPath(); g.moveTo(16, 5); g.lineTo(24, 13); g.lineTo(20, 26); g.lineTo(12, 26); g.lineTo(8, 13); g.closePath(); g.fill();
          g.fillStyle = '#aab2ff'; g.beginPath(); g.moveTo(16, 6); g.lineTo(12, 13); g.lineTo(16, 24); g.closePath(); g.fill();
          rect('#e8ecff', 16, 10, 2, 10);
          break;
        case 'leather':
          g.fillStyle = O; g.beginPath(); g.moveTo(4, 12); g.lineTo(10, 6); g.lineTo(16, 10); g.lineTo(22, 6); g.lineTo(28, 12); g.lineTo(24, 26); g.lineTo(8, 26); g.closePath(); g.fill();
          g.fillStyle = '#a8743c'; g.beginPath(); g.moveTo(6, 13); g.lineTo(11, 8); g.lineTo(16, 12); g.lineTo(21, 8); g.lineTo(26, 13); g.lineTo(22, 24); g.lineTo(10, 24); g.closePath(); g.fill();
          rect('#c99a5e', 10, 14, 12, 2); rect('#7a4e28', 10, 20, 12, 1);
          break;
        case 'cloth':
          rect(O, 5, 8, 22, 18); rect('#d9c9ff', 7, 9, 18, 16); rect('#b8a4e8', 7, 9, 18, 4);
          line('#8f7ac8', 7, 16, 25, 16, 1); line('#8f7ac8', 7, 22, 25, 22, 1);
          rect('#a48fd8', 14, 9, 3, 16);
          break;
        case 'bone':
          g.save(); g.translate(16, 16); g.rotate(-0.6);
          rect(O, -12, -4, 24, 8); rect('#e6e1cf', -10, -2, 20, 4);
          circle(g, O, -11, -3, 4); circle(g, O, -11, 3, 4); circle(g, '#e6e1cf', -11, -3, 3); circle(g, '#e6e1cf', -11, 3, 3);
          circle(g, O, 11, -3, 4); circle(g, O, 11, 3, 4); circle(g, '#e6e1cf', 11, -3, 3); circle(g, '#e6e1cf', 11, 3, 3);
          g.restore();
          break;
        case 'essence':
          circle(g, 'rgba(176,124,255,.25)', 16, 16, 13);
          circle(g, O, 16, 16, 9); circle(g, '#7a4ac8', 16, 16, 7);
          circle(g, '#b07cff', 14, 14, 4); circle(g, '#e0ccff', 13, 13, 2);
          rect('#b07cff', 6, 20, 2, 2); rect('#b07cff', 25, 8, 2, 2); rect('#b07cff', 24, 24, 1, 1);
          break;
        case 'coin':
          circle(g, O, 13, 20, 9); circle(g, '#b8861f', 13, 20, 8); circle(g, '#f2c14e', 13, 20, 6);
          circle(g, O, 21, 12, 8); circle(g, '#b8861f', 21, 12, 7); circle(g, '#ffd978', 21, 12, 5);
          rect('#fff1b8', 19, 9, 2, 3);
          break;
        case 'scroll':
          rect(O, 5, 7, 22, 20); rect('#e8dcc0', 7, 8, 18, 18);
          rect('#c9b892', 7, 8, 18, 2); rect('#c9b892', 7, 24, 18, 2);
          line('#8a7a5a', 10, 13, 22, 13, 1); line('#8a7a5a', 10, 17, 22, 17, 1); line('#8a7a5a', 10, 21, 18, 21, 1);
          rect('#b34c2c', 14, 8, 4, 18);
          break;
        case 'skull':
          r(g, O, 7, 5, 18, 16); r(g, '#e6e1cf', 8, 6, 16, 14);
          r(g, O, 10, 11, 4, 4); r(g, O, 18, 11, 4, 4); r(g, O, 14, 17, 4, 4);
          r(g, '#e6e1cf', 10, 21, 12, 5); r(g, O, 13, 21, 2, 4); r(g, O, 17, 21, 2, 4);
          break;
        case 'star':
          g.fillStyle = O; g.beginPath();
          for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? 6 : 13; g.lineTo(16 + Math.cos(a) * rad, 16 + Math.sin(a) * rad); }
          g.closePath(); g.fill();
          g.fillStyle = '#f2d06b'; g.beginPath();
          for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? 5 : 11; g.lineTo(16 + Math.cos(a) * rad, 16 + Math.sin(a) * rad); }
          g.closePath(); g.fill();
          break;
        case 'map':
          rect(O, 3, 6, 26, 21); rect('#d9c9a0', 5, 8, 22, 17);
          rect('#8fcf6a', 6, 15, 8, 9); rect('#6fb5d8', 14, 9, 6, 6); rect('#c9b892', 20, 17, 7, 7);
          line('#8a5a2e', 7, 12, 24, 22, 1); line('#8a5a2e', 24, 10, 10, 23, 1);
          rect('#b34c2c', 21, 8, 3, 3);
          break;
        case 'anvil':
          rect(O, 4, 8, 24, 10); rect('#5a5a6c', 5, 9, 22, 8); rect('#8a8a9c', 5, 9, 22, 3);
          rect(O, 13, 17, 6, 8); rect('#4a4a5c', 14, 18, 4, 6);
          rect(O, 7, 24, 18, 5); rect('#3a3a4c', 8, 25, 16, 3);
          break;
        case 'crown':
          rect(O, 4, 14, 24, 12); rect('#f2b84b', 5, 15, 22, 10);
          g.fillStyle = O; g.beginPath(); g.moveTo(4, 15); g.lineTo(7, 5); g.lineTo(12, 12); g.lineTo(16, 3); g.lineTo(20, 12); g.lineTo(25, 5); g.lineTo(28, 15); g.closePath(); g.fill();
          g.fillStyle = '#ffd978'; g.beginPath(); g.moveTo(6, 16); g.lineTo(8, 8); g.lineTo(12, 14); g.lineTo(16, 6); g.lineTo(20, 14); g.lineTo(24, 8); g.lineTo(26, 16); g.closePath(); g.fill();
          rect('#e05252', 15, 18, 3, 3); rect('#6fb5d8', 9, 19, 2, 2); rect('#6fb5d8', 22, 19, 2, 2);
          break;
        case 'shield':
          g.fillStyle = O; g.beginPath(); g.moveTo(16, 3); g.lineTo(27, 7); g.lineTo(26, 18); g.lineTo(16, 29); g.lineTo(6, 18); g.lineTo(5, 7); g.closePath(); g.fill();
          g.fillStyle = '#8a94aa'; g.beginPath(); g.moveTo(16, 5); g.lineTo(25, 8); g.lineTo(24, 17); g.lineTo(16, 26); g.lineTo(8, 17); g.lineTo(7, 8); g.closePath(); g.fill();
          rect('#d9a23f', 15, 8, 2, 14); rect('#d9a23f', 10, 13, 12, 2);
          break;
        case 'users':
          circle(g, O, 12, 11, 6); circle(g, '#d9c9a0', 12, 11, 4);
          circle(g, O, 23, 13, 5); circle(g, '#c9a06a', 23, 13, 3);
          g.fillStyle = O; g.beginPath(); g.arc(11, 26, 9, Math.PI, 0); g.fill();
          g.fillStyle = '#6a4aa8'; g.beginPath(); g.arc(11, 25, 7, Math.PI, 0); g.fill();
          g.fillStyle = O; g.beginPath(); g.arc(23, 26, 7, Math.PI, 0); g.fill();
          g.fillStyle = '#8a5a2e'; g.beginPath(); g.arc(23, 25, 5, Math.PI, 0); g.fill();
          break;
        case 'arrow':
          line(O, 6, 26, 25, 7, 6); line('#c9d2e4', 8, 24, 24, 8, 2);
          line(O, 20, 5, 28, 5, 4); line('#d9a23f', 21, 6, 27, 6, 2);
          line(O, 27, 5, 27, 13, 4); line('#d9a23f', 27, 6, 27, 12, 2);
          break;
        case 'fire':
          g.fillStyle = O; g.beginPath(); g.moveTo(16, 2); g.quadraticCurveTo(28, 14, 22, 24); g.quadraticCurveTo(18, 30, 12, 26); g.quadraticCurveTo(4, 18, 16, 2); g.fill();
          g.fillStyle = '#e05252'; g.beginPath(); g.moveTo(16, 6); g.quadraticCurveTo(25, 16, 20, 23); g.quadraticCurveTo(16, 27, 12, 23); g.quadraticCurveTo(7, 17, 16, 6); g.fill();
          g.fillStyle = '#ffb347'; g.beginPath(); g.moveTo(16, 13); g.quadraticCurveTo(21, 18, 18, 23); g.quadraticCurveTo(15, 26, 13, 22); g.quadraticCurveTo(11, 18, 16, 13); g.fill();
          break;
        case 'ice':
          for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; line(O, 16, 16, 16 + Math.cos(a) * 13, 16 + Math.sin(a) * 13, 4); }
          for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; line('#a8e8ff', 16, 16, 16 + Math.cos(a) * 12, 16 + Math.sin(a) * 12, 2); }
          circle(g, '#e0f8ff', 16, 16, 3);
          break;
        case 'bolt':
          g.fillStyle = O; g.beginPath(); g.moveTo(18, 2); g.lineTo(6, 18); g.lineTo(14, 18); g.lineTo(11, 30); g.lineTo(26, 12); g.lineTo(17, 12); g.closePath(); g.fill();
          g.fillStyle = '#f2d06b'; g.beginPath(); g.moveTo(17, 5); g.lineTo(9, 16); g.lineTo(15, 16); g.lineTo(13, 25); g.lineTo(23, 14); g.lineTo(16, 14); g.closePath(); g.fill();
          break;
        case 'trap':
          for (let i = 0; i < 6; i++) { line(O, 6 + i * 4, 26, 10 + i * 4, 10, 3); line('#c9d2e4', 7 + i * 4, 24, 10 + i * 4, 12, 1); }
          line('#8a5a2e', 5, 26, 27, 26, 3); line('#8a5a2e', 5, 11, 27, 11, 2);
          break;
        case 'boot':
          rect(O, 10, 6, 8, 16); rect('#7a4e28', 11, 7, 6, 14);
          rect(O, 8, 21, 16, 7); rect('#5e3a1a', 9, 22, 14, 5);
          line('#d9a23f', 11, 14, 17, 14, 2); line('#d9a23f', 11, 17, 17, 17, 2);
          break;
        case 'heal':
          circle(g, '#173726', 16, 16, 12);
          circle(g, '#2a5c3c', 16, 16, 10);
          rect('#7dff9a', 13, 6, 6, 20); rect('#7dff9a', 6, 13, 20, 6);
          rect('#e8fff0', 14, 7, 4, 18); rect('#e8fff0', 7, 14, 18, 4);
          circle(g, '#d8ffe4', 16, 16, 2);
          break;
        case 'sigil':
          circle(g, '#f2b84b', 16, 16, 12); circle(g, '#150f24', 16, 16, 9);
          circle(g, '#f2b84b', 16, 16, 4); line('#f2b84b', 16, 4, 16, 28, 1); line('#f2b84b', 4, 16, 28, 16, 1);
          break;
        default:
          rect(O, 5, 5, 22, 22); rect('#3d3160', 7, 7, 18, 18);
          rect('#a99cc4', 14, 10, 4, 12); rect('#a99cc4', 14, 24, 4, 2);
      }
    });
    ICON_CACHE.set(name, c);
    return c;
  }

  const ICON_URL = new Map();
  function iconURL(name) {
    if (ICON_URL.has(name)) return ICON_URL.get(name);
    const url = iconCanvas(name).toDataURL();
    ICON_URL.set(name, url);
    return url;
  }

  /* --------------------------- minimapa --------------------------- */
  function buildMinimap(map, mw, mh, colors) {
    return A.spr(mw, mh, (g) => {
      const img = g.createImageData(mw, mh);
      for (let i = 0; i < mw * mh; i++) {
        const c = colors[map[i]] || [0, 0, 0];
        img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    });
  }

  A.art = {
    TT, SOLID, TILES, PROPS,
    init() { buildTiles(); buildProps(); },
    tile(id, tx, ty, frame) {
      const set = TILES[id] || TILES[TT.GRASS];
      const v = ((tx * 7 + ty * 13 + ((tx * ty) % 5)) & 255) % set.length;
      if (id === TT.WATER || id === TT.SWAMPWATER) return set[frame % set.length];
      return set[v];
    },
    prop(name, variant) {
      const set = PROPS[name] || PROPS.bush;
      return set[(variant || 0) % set.length];
    },
    actor: actorSprite,
    portrait,
    monster: mons,
    icon: iconCanvas,
    iconURL,
    buildMinimap,
    drawAnchored,
    white(src) {
      const result = A.spr(src.width, src.height, (g) => {
        g.drawImage(src, 0, 0);
        g.globalCompositeOperation = 'source-in';
        g.fillStyle = '#ffffff'; g.fillRect(0, 0, src.width, src.height);
      });
      const meta = SPRITE_META.get(src);
      if (meta) SPRITE_META.set(result, { source: meta.source, anchorX: meta.anchorX, anchorY: meta.anchorY });
      return result;
    }
  };

  A.art.init();
})(window.A);
