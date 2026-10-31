/* ==========================================================================
   Utilidades gerais
   ========================================================================== */
(function (A) {
  'use strict';

  A.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  A.lerp = (a, b, t) => a + (b - a) * t;
  A.rand = (a, b) => a + Math.random() * (b - a);
  A.randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  A.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  A.chance = (p) => Math.random() < p;
  A.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  A.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  A.fmt = (n) => {
    n = Math.round(n || 0);
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 10000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  A.fmtTime = (s) => {
    s = Math.max(0, Math.round(s));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    return (h ? h + 'h ' : '') + m + 'min';
  };

  A.mulberry = function (a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  A.hash = function (x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  A.shade = function (hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  A.canvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return { c, g };
  };

  A.spr = function (w, h, fn) {
    const { c, g } = A.canvas(w, h);
    fn(g, c);
    return c;
  };

  A.$ = (sel, root) => (root || document).querySelector(sel);
  A.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  A.el = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  A.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  };

  A.store = {
    get(key, fallback) {
      try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
      catch (e) { return fallback; }
    },
    raw(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setRaw(key, raw) {
      try { localStorage.setItem(key, raw); return true; }
      catch (e) { return false; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    del(key) { try { localStorage.removeItem(key); } catch (e) {} }
  };

  /* ---------------- áudio procedural ---------------- */
  A.audio = {
    ctx: null, master: null, music: null, sfx: null, started: false,
    settings: { music: 0.35, sfx: 0.55 },

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.music.gain.value = this.settings.music * 0.3;
      this.music.connect(this.master);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = this.settings.sfx;
      this.sfx.connect(this.master);
    },

    resume() {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },

    setVolumes(music, sfx) {
      this.settings.music = music;
      this.settings.sfx = sfx;
      if (this.music) this.music.gain.value = music * 0.3;
      if (this.sfx) this.sfx.gain.value = sfx;
    },

    tone(freq, dur, type, vol, when, slide) {
      if (!this.ctx) return;
      const t0 = (when || this.ctx.currentTime);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol || 0.12), t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.sfx);
      o.start(t0); o.stop(t0 + dur + 0.02);
    },

    noise(dur, vol, when, filterFreq) {
      if (!this.ctx) return;
      const t0 = when || this.ctx.currentTime;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = filterFreq || 1800;
      const g = this.ctx.createGain(); g.gain.value = vol || 0.15;
      src.connect(f); f.connect(g); g.connect(this.sfx);
      src.start(t0);
    },

    play(name) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      switch (name) {
        case 'click': this.tone(660, 0.05, 'triangle', 0.05, t, 520); break;
        case 'hit': this.noise(0.09, 0.10, t, 1200); this.tone(150, 0.08, 'square', 0.05, t, 90); break;
        case 'crit': this.noise(0.12, 0.14, t, 2400); this.tone(240, 0.1, 'sawtooth', 0.07, t, 120); break;
        case 'hurt': this.tone(180, 0.16, 'sawtooth', 0.08, t, 70); this.noise(0.1, 0.07, t, 700); break;
        case 'coin': this.tone(880, 0.06, 'triangle', 0.06, t); this.tone(1320, 0.09, 'triangle', 0.05, t + 0.05); break;
        case 'level': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.08, t + i * 0.11)); break;
        case 'skill': this.tone(300, 0.18, 'sawtooth', 0.07, t, 900); break;
        case 'heal': [660, 880, 1100].forEach((f, i) => this.tone(f, 0.18, 'sine', 0.06, t + i * 0.06)); break;
        case 'death': [330, 262, 196, 147].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.08, t + i * 0.16)); break;
        case 'dungeon': [110, 98, 87].forEach((f, i) => this.tone(f, 0.8, 'sine', 0.06, t + i * 0.3)); break;
        case 'open': this.tone(440, 0.06, 'triangle', 0.04, t, 660); break;
        case 'error': this.tone(140, 0.16, 'square', 0.06, t, 110); break;
        case 'buy': this.tone(700, 0.08, 'triangle', 0.06, t); this.tone(1000, 0.12, 'triangle', 0.05, t + 0.07); break;
        case 'dodge': this.noise(0.07, 0.05, t, 2200); this.tone(520, 0.10, 'sine', 0.045, t, 780); break;
        case 'warn': this.tone(330, 0.24, 'sawtooth', 0.045, t, 180); break;
        case 'status': this.tone(220, 0.18, 'square', 0.045, t, 150); break;
      }
    },

    musicTimer: null,
    musicOn: false,
    startMusic() {
      this.init();
      if (!this.ctx || this.musicOn) return;
      this.musicOn = true;
      let step = 0;
      const scale = [0, 2, 3, 5, 7, 9, 10, 12];
      const root = 110;
      const tick = () => {
        if (!this.musicOn || !this.ctx) return;
        const now = this.ctx.currentTime;
        const degree = scale[(step * 3) % scale.length];
        const freq = root * Math.pow(2, degree / 12);
        // pad
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.045, now + 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        o.connect(g); g.connect(this.music);
        o.start(now); o.stop(now + 2.3);
        // arpejo suave
        if (step % 2 === 0) {
          const o2 = this.ctx.createOscillator();
          const g2 = this.ctx.createGain();
          o2.type = 'triangle';
          o2.frequency.value = freq * 2;
          g2.gain.setValueAtTime(0.0001, now);
          g2.gain.exponentialRampToValueAtTime(0.022, now + 0.05);
          g2.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
          o2.connect(g2); g2.connect(this.music);
          o2.start(now); o2.stop(now + 1.2);
        }
        step++;
      };
      tick();
      this.musicTimer = setInterval(tick, 1400);
    },
    stopMusic() {
      this.musicOn = false;
      if (this.musicTimer) clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  };

})(window.A);
