'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'sprites', 'guerreiro varias animacoes 3.jpg');
const OUT_DIR = path.join(ROOT, 'assets', 'pixel-art', 'actors', 'warrior');
const SHEET_96 = path.join(OUT_DIR, 'warrior-96x128.png');
const SHEET_48 = path.join(OUT_DIR, 'warrior-48x64.png');
const PREVIEW = path.join(OUT_DIR, 'preview.png');

const FRAME_W = 96;
const FRAME_H = 128;
const BASELINE = 124;
const FOOT_BAND = 0.1;
const MAGENTA = { r: 255, g: 0, b: 255 };
const SOURCE_COLS = 8;
const SOURCE_ROWS = 4;
const SELECTED_COLUMNS = [0, 2, 4, 6];

function magentaDistance(r, g, b) {
  return Math.max(Math.abs(r - MAGENTA.r), Math.abs(g - MAGENTA.g), Math.abs(b - MAGENTA.b));
}

function isMagentaLike(r, g, b) {
  return magentaDistance(r, g, b) <= 48 ||
    (r > 115 && b > 100 && g < 125 && r - g > 50 && b - g > 35);
}

function pixelIndex(x, y, width) {
  return (y * width + x) * 4;
}

function hasMagentaNeighbor(data, x, y, width, height) {
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (!dx && !dy) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const i = pixelIndex(nx, ny, width);
      if (data[i + 3] === 0) return true;
    }
  }
  return false;
}

function cleanBackground(data, width, height) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = pixelIndex(x, y, width);
      if (isMagentaLike(data[i], data[i + 1], data[i + 2])) data[i + 3] = 0;
      else data[i + 3] = 255;
    }
  }

  // JPEG halos next to the removed background are pink even when outside tolerance.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = pixelIndex(x, y, width);
      if (data[i + 3] !== 0 && hasMagentaNeighbor(data, x, y, width, height) &&
          data[i] > 95 && data[i + 2] > 85 && data[i + 1] < 135 &&
          data[i] - data[i + 1] > 35 && data[i + 2] - data[i + 1] > 25) {
        data[i + 3] = 0;
      }
    }
  }
}

function cropFrame(data, width, height, x0, y0, x1, y1) {
  let minX = x1;
  let minY = y1;
  let maxX = -1;
  let maxY = -1;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      if (data[pixelIndex(x, y, width) + 3] > 16) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX || maxY < minY) throw new Error(`Nenhum pixel opaco na célula ${x0},${y0}`);

  const result = {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    data: Buffer.alloc((maxX - minX + 1) * (maxY - minY + 1) * 4),
    originalX: minX,
    originalY: minY,
    originalMaxY: maxY
  };
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const source = pixelIndex(x, y, width);
      const target = pixelIndex(x - minX, y - minY, result.width);
      data.copy(result.data, target, source, source + 4);
    }
  }
  return result;
}

function pruneFloatingTop(frame) {
  const seen = new Uint8Array(frame.width * frame.height);
  const remove = new Uint8Array(frame.width * frame.height);
  const components = [];
  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      const seed = y * frame.width + x;
      if (seen[seed] || frame.data[pixelIndex(x, y, frame.width) + 3] <= 16) continue;
      const queue = [seed];
      const pixels = [];
      seen[seed] = 1;
      while (queue.length) {
        const current = queue.pop();
        const cx = current % frame.width;
        const cy = Math.floor(current / frame.width);
        pixels.push(current);
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= frame.width || ny >= frame.height) continue;
            const next = ny * frame.width + nx;
            if (seen[next] || frame.data[pixelIndex(nx, ny, frame.width) + 3] <= 16) continue;
            seen[next] = 1;
            queue.push(next);
          }
        }
      }
      let minY = frame.height;
      let maxY = -1;
      pixels.forEach((p) => {
        const py = Math.floor(p / frame.width);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);
      });
      components.push({ pixels, minY, maxY });
    }
  }
  for (const component of components) {
    if (component.pixels.length <= 48 && component.maxY < frame.height * 0.34) {
      component.pixels.forEach((p) => { remove[p] = 1; });
    }
  }
  for (let i = 0; i < remove.length; i += 1) {
    if (remove[i]) frame.data[pixelIndex(i % frame.width, Math.floor(i / frame.width), frame.width) + 3] = 0;
  }
}

function footCenter(frame) {
  const start = Math.max(0, Math.floor(frame.height * (1 - FOOT_BAND)));
  const centers = [];
  for (let y = start; y < frame.height; y += 1) {
    let minX = frame.width;
    let maxX = -1;
    for (let x = 0; x < frame.width; x += 1) {
      if (frame.data[pixelIndex(x, y, frame.width) + 3] > 16) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
    if (maxX >= minX) centers.push((minX + maxX) / 2);
  }
  if (!centers.length) return frame.width / 2;
  centers.sort((a, b) => a - b);
  return centers[Math.floor(centers.length / 2)];
}

async function resizeNearest(frame, scale) {
  const width = Math.max(1, Math.round(frame.width * scale));
  const height = Math.max(1, Math.round(frame.height * scale));
  return {
    width,
    height,
    data: await sharp(frame.data, { raw: { width: frame.width, height: frame.height, channels: 4 } })
      .resize(width, height, { kernel: sharp.kernel.nearest })
      .raw()
      .toBuffer(),
    footCenter: footCenter(frame) * scale
  };
}

function makeCanvas() {
  return Buffer.alloc(FRAME_W * FRAME_H * 4);
}

function placeFrame(canvas, frame, x, y) {
  for (let row = 0; row < frame.height; row += 1) {
    const destY = y + row;
    if (destY < 0 || destY >= FRAME_H) continue;
    for (let col = 0; col < frame.width; col += 1) {
      const destX = x + col;
      if (destX < 0 || destX >= FRAME_W) continue;
      const source = pixelIndex(col, row, frame.width);
      const target = pixelIndex(destX, destY, FRAME_W);
      if (frame.data[source + 3] > 0) frame.data.copy(canvas, target, source, source + 4);
    }
  }
}

function mirror(frame) {
  const data = Buffer.alloc(frame.data.length);
  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      const source = pixelIndex(x, y, frame.width);
      const target = pixelIndex(frame.width - 1 - x, y, frame.width);
      frame.data.copy(data, target, source, source + 4);
    }
  }
  return { width: frame.width, height: frame.height, data, footCenter: frame.width - frame.footCenter };
}

async function writeRaw(buffer, width, height, filename) {
  await sharp(buffer, { raw: { width, height, channels: 4 } }).png().toFile(filename);
}

async function main() {
  const input = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = input;
  cleanBackground(data, info.width, info.height);

  const cellW = info.width / SOURCE_COLS;
  const cellH = info.height / SOURCE_ROWS;
  const frames = [];
  let maxWidth = 0;
  let maxHeight = 0;
  for (let dir = 0; dir < 3; dir += 1) {
    for (let frame = 0; frame < SELECTED_COLUMNS.length; frame += 1) {
      const sourceColumn = SELECTED_COLUMNS[frame];
      const cropped = cropFrame(
        data, info.width, info.height,
        Math.floor(sourceColumn * cellW), Math.floor(dir * cellH),
        Math.floor((sourceColumn + 1) * cellW), Math.floor((dir + 1) * cellH)
      );
      if (dir === 1 && (frame === 0 || frame === 1)) pruneFloatingTop(cropped);
      frames.push({ dir, frame, cropped });
      maxWidth = Math.max(maxWidth, cropped.width);
      maxHeight = Math.max(maxHeight, cropped.height);
    }
  }

  const scale = Math.min((FRAME_W - 8) / maxWidth, (FRAME_H - 8) / maxHeight);
  const canvases = [];
  for (const item of frames) {
    const scaled = await resizeNearest(item.cropped, scale);
    const canvas = makeCanvas();
    const x = Math.round(48 - scaled.footCenter);
    const y = BASELINE - scaled.height;
    placeFrame(canvas, scaled, x, y);
    canvases.push({ dir: item.dir, frame: item.frame, canvas });
  }

  for (const item of canvases.filter((entry) => entry.dir === 2)) {
    canvases.push({ dir: 3, frame: item.frame, canvas: mirror({
      width: FRAME_W,
      height: FRAME_H,
      data: item.canvas,
      footCenter: 48
    }).data });
  }
  canvases.sort((a, b) => a.dir - b.dir || a.frame - b.frame);

  const sheet96 = Buffer.alloc(FRAME_W * 4 * FRAME_H * 4 * 4);
  for (const item of canvases) {
    for (let y = 0; y < FRAME_H; y += 1) {
      const source = pixelIndex(0, y, FRAME_W);
      const target = pixelIndex(item.frame * FRAME_W, item.dir * FRAME_H + y, FRAME_W * 4);
      item.canvas.copy(sheet96, target, source, source + FRAME_W * 4);
    }
  }

  const sheet48 = await sharp(sheet96, { raw: { width: FRAME_W * 4, height: FRAME_H * 4, channels: 4 } })
    .resize(FRAME_W * 2, FRAME_H * 2, { kernel: sharp.kernel.nearest })
    .raw().toBuffer();
  const preview = Buffer.alloc(48 * 16 * 64 * 4);
  for (let index = 0; index < canvases.length; index += 1) {
    const frame48 = await sharp(canvases[index].canvas, { raw: { width: FRAME_W, height: FRAME_H, channels: 4 } })
      .resize(48, 64, { kernel: sharp.kernel.nearest }).raw().toBuffer();
    for (let y = 0; y < 64; y += 1) {
      for (let x = 0; x < 48; x += 1) {
        const target = pixelIndex(index * 48 + x, y, 48 * 16);
        const source = pixelIndex(x, y, 48);
        const checker = ((Math.floor(x / 6) + Math.floor(y / 6)) % 2) ? 205 : 225;
        preview[target] = checker;
        preview[target + 1] = checker;
        preview[target + 2] = checker;
        preview[target + 3] = 255;
        if (frame48[source + 3] > 0) frame48.copy(preview, target, source, source + 4);
      }
    }
    const guideY = 62;
    for (let x = 0; x < 48; x += 1) {
      const target = pixelIndex(index * 48 + x, guideY, 48 * 16);
      preview[target] = 220;
      preview[target + 1] = 50;
      preview[target + 2] = 50;
      preview[target + 3] = 255;
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  await writeRaw(sheet96, FRAME_W * 4, FRAME_H * 4, SHEET_96);
  await writeRaw(sheet48, FRAME_W * 2, FRAME_H * 2, SHEET_48);
  await writeRaw(preview, 48 * 16, 64, PREVIEW);
  console.log(`Fonte: ${info.width}x${info.height}`);
  console.log(`Caixa máxima: ${maxWidth}x${maxHeight}; escala única: ${scale.toFixed(4)}`);
  console.log(`Gerados: ${path.relative(ROOT, SHEET_96)}, ${path.relative(ROOT, SHEET_48)}, ${path.relative(ROOT, PREVIEW)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
