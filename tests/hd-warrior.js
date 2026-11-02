const { open, ok, fail, summary } = require('./helpers');

(async () => {
  const { browser, page } = await open();
  try {
    await page.goto('http://127.0.0.1:8123/', { waitUntil: 'load' });
    const result = await page.evaluate(async () => {
      const look = A.LOOKS ? { skin: A.LOOKS.SKINS[0], hair: A.LOOKS.HAIRS[0], hairStyle: 0, outfit: A.LOOKS.OUTFITS[0], accent: '#e8c14a' } : {};
      const hd = A.HD_WARRIOR;
      const loadedState = hd.state;
      hd.state = 'loading';
      const fallback = A.art.actor(look, 'warrior', 0, 0);
      const fallbackOk = fallback.width === 32 && fallback.height === 44;
      hd.state = loadedState;
      await new Promise((resolve) => { const tick = () => hd.state === 'ready' ? resolve() : setTimeout(tick, 10); tick(); });
      const frames = [];
      for (let d = 0; d < 4; d++) for (let f = 0; f < 4; f++) frames.push(A.art.actor(look, 'warrior', d, f));
      const cached = A.art.actor(look, 'warrior', 0, 0) === frames[0];
      const hdOk = frames.every((c) => c.width === 48 && c.height === 64);
      const other = A.art.actor(look, 'mage', 0, 0);
      const otherOk = other.width === 32 && other.height === 44;
      const ca = document.createElement('canvas'); ca.width = 96; ca.height = 128;
      const cb = document.createElement('canvas'); cb.width = 96; cb.height = 128;
      ca.getContext('2d').drawImage(hd.image, 0, 256, 96, 128, 0, 0, 96, 128);
      cb.getContext('2d').drawImage(hd.image, 0, 384, 96, 128, 0, 0, 96, 128);
      const pa = ca.getContext('2d').getImageData(0, 0, 96, 128).data;
      const pb = cb.getContext('2d').getImageData(0, 0, 96, 128).data;
      let mirrorOk = true;
      for (let y = 0; y < 128 && mirrorOk; y++) for (let x = 0; x < 96; x++) for (let k = 0; k < 4; k++) {
        if (pa[(y * 96 + x) * 4 + k] !== pb[(y * 96 + (95 - x)) * 4 + k]) { mirrorOk = false; break; }
      }
      const white = A.art.white(frames[0]);
      const portrait = A.art.portrait(look, 'warrior');
      return { fallbackOk, hdOk, cached, otherOk, mirrorOk, whiteOk: white.width === 48 && white.height === 64, portraitOk: portrait.width === 72 && portrait.height === 72 };
    });
    for (const [name, value] of Object.entries(result)) value ? ok(name) : fail(name);
  } catch (e) { fail(e.message); }
  await browser.close();
  summary('hd-warrior');
})();
