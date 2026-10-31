/* Harness compartilhado dos testes de navegador (Playwright + Edge headless). */
const { chromium } = require('playwright-core');

const BASE = process.env.AURORA_URL || 'http://127.0.0.1:8123/';
const EDGE = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

let failures = 0;
function ok(msg) { console.log('PASS: ' + msg); }
function fail(msg) { console.error('FAIL: ' + msg); failures++; process.exitCode = 1; }
function summary(name) {
  if (failures) console.error('\n' + name + ': ' + failures + ' falha(s).');
  else console.log('\n' + name + ': tudo certo.');
  return failures;
}

async function boot(page, opts) {
  opts = opts || {};
  const name = opts.name || 'Teste';
  const cls = opts.cls || 'warrior';
  const errors = [];
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => {
    const t = document.querySelector('#title');
    return t && t.classList.contains('active');
  }, null, { timeout: 20000 });

  await page.click('[data-act="title-play"]');
  await page.fill('#loginName', name);
  await page.click('[data-act="do-login"]');
  await page.waitForTimeout(250);
  await page.click('#serverList [data-act="server-select"]');
  await page.waitForTimeout(250);
  await page.click('[data-act="char-new"]');
  await page.waitForTimeout(250);
  await page.click('[data-act="class-select"][data-cls="' + cls + '"]');
  await page.fill('#charName', name);
  await page.click('[data-act="create-char"]');
  await page.waitForFunction(() => window.A && A.game && A.game.player && !A.game.trans, null, { timeout: 20000 });
  await page.waitForTimeout(400);
  return { errors, name };
}

async function open() {
  const browser = await chromium.launch({
    executablePath: EDGE,
    headless: true,
    args: ['--disable-gpu']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  return { browser, page };
}

module.exports = { BASE, EDGE, open, boot, ok, fail, summary };
