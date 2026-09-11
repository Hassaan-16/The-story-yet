/**
 * React Bits SplitFlapText port for vanilla JavaScript
 * Source: https://www.reactbits.dev/text-animations/split-flap-text
 */
(function () {
  'use strict';

  const CHARSETS = {
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ',
    numeric: '0123456789 ',
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '
  };

  class SplitFlapText {
    constructor(element, options = {}) {
      this.element = element;
      this.words = options.words || (options.text ? [options.text] : ['GALLERY', 'OPTICS', 'ARCHIVE']);
      this.flipDuration = options.flipDuration || 0.12; // in seconds
      this.stagger = options.stagger !== undefined ? options.stagger : 0.05; // in seconds
      this.cycleDelay = options.cycleDelay || 3200; // in ms
      this.flipsPerChar = options.flipsPerChar || 6;
      this.charset = typeof options.charset === 'string' && CHARSETS[options.charset] 
        ? CHARSETS[options.charset] 
        : (options.charset || CHARSETS.alphanumeric);
      this.tileColor = options.tileColor || '#101016';
      this.textColor = options.textColor || '#ffe500';
      this.tileRadius = options.tileRadius !== undefined ? options.tileRadius : 6;
      this.gap = options.gap !== undefined ? options.gap : 5;
      this.fontSize = options.fontSize || 'inherit';
      this.loop = options.loop !== undefined ? options.loop : true;
      this.padTo = options.padTo || Math.max(...this.words.map(w => w.length));

      this.currentPhraseIndex = 0;
      this.tiles = [];
      this.rafId = null;
      this.cycleTimer = null;
      this.isAnimating = false;

      this.init();
    }

    init() {
      this.element.classList.add('split-flap-text');
      this.element.style.setProperty('--split-flap-tile-color', this.tileColor);
      this.element.style.setProperty('--split-flap-text-color', this.textColor);
      this.element.style.setProperty('--split-flap-radius', typeof this.tileRadius === 'number' ? `${this.tileRadius}px` : this.tileRadius);
      this.element.style.setProperty('--split-flap-gap', typeof this.gap === 'number' ? `${this.gap}px` : this.gap);
      if (this.fontSize !== 'inherit') {
        this.element.style.setProperty('--split-flap-font-size', typeof this.fontSize === 'number' ? `${this.fontSize}px` : this.fontSize);
      }
      this.element.style.setProperty('--split-flap-flip-duration', `${Math.max(0.04, this.flipDuration)}s`);

      // Pad initial phrase
      const initialPhrase = this.padPhrase(this.words[0]);

      // Build DOM tiles
      this.element.innerHTML = '';
      this.tiles = [];

      for (let i = 0; i < this.padTo; i++) {
        const char = initialPhrase[i] || ' ';
        const tileEl = document.createElement('span');
        tileEl.className = 'split-flap-text__tile';
        tileEl.setAttribute('aria-hidden', 'true');

        tileEl.innerHTML = `
          <span class="split-flap-text__half split-flap-text__half--top">
            <span class="split-flap-text__char">${char === ' ' ? '&nbsp;' : char}</span>
          </span>
          <span class="split-flap-text__half split-flap-text__half--bottom">
            <span class="split-flap-text__char">${char === ' ' ? '&nbsp;' : char}</span>
          </span>
        `;

        this.element.appendChild(tileEl);
        this.tiles.push({
          el: tileEl,
          topCharEl: tileEl.querySelector('.split-flap-text__half--top .split-flap-text__char'),
          bottomCharEl: tileEl.querySelector('.split-flap-text__half--bottom .split-flap-text__char'),
          current: char,
          next: char,
          flipping: false,
          flapFront: null,
          flapBack: null
        });
      }

      this.element.setAttribute('role', 'text');
      this.element.setAttribute('aria-label', initialPhrase.trim());

      // If more than 1 phrase or loop, schedule next transition
      if (this.words.length > 1) {
        this.scheduleNext(this.cycleDelay);
      }
    }

    padPhrase(phrase) {
      const clean = (phrase || '').toUpperCase();
      return clean.padEnd(this.padTo, ' ').slice(0, this.padTo);
    }

    getRandomChar(exclude) {
      const filtered = this.charset.replace(exclude, '');
      const pool = filtered.length > 0 ? filtered : this.charset;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    animateTo(targetPhrase) {
      const padded = this.padPhrase(targetPhrase);
      const safeFlipMs = Math.max(40, this.flipDuration * 1000);
      const startTime = performance.now();

      // Create plans for each tile
      const plans = [];
      for (let i = 0; i < this.padTo; i++) {
        const from = this.tiles[i].current;
        const target = padded[i] || ' ';

        if (from === target) {
          plans.push({ index: i, sequence: [], target, start: 0, done: true });
          continue;
        }

        const count = Math.max(1, this.flipsPerChar);
        const sequence = [];
        let prev = from;

        for (let s = 0; s < count - 1; s++) {
          const nextRandom = this.getRandomChar(prev);
          sequence.push(nextRandom);
          prev = nextRandom;
        }
        sequence.push(target);

        const start = i * (this.stagger * 1000);
        plans.push({
          index: i,
          from,
          sequence,
          target,
          start,
          step: -1,
          done: false
        });
      }

      const totalDuration = Math.max(...plans.map(p => p.start + p.sequence.length * safeFlipMs), 0);

      const tick = (now) => {
        const elapsed = now - startTime;
        let shouldContinue = false;

        plans.forEach((plan) => {
          if (plan.done) return;

          const localElapsed = elapsed - plan.start;
          if (localElapsed < 0) {
            shouldContinue = true;
            return;
          }

          const step = Math.floor(localElapsed / safeFlipMs);

          if (step < plan.sequence.length) {
            shouldContinue = true;
            if (step !== plan.step) {
              plan.step = step;
              const cur = step === 0 ? plan.from : plan.sequence[step - 1];
              const nxt = plan.sequence[step];
              this.setTileFlip(plan.index, cur, nxt);
            }
          } else {
            plan.done = true;
            this.settleTile(plan.index, plan.target);
          }
        });

        if (shouldContinue) {
          this.rafId = requestAnimationFrame(tick);
        } else {
          this.element.setAttribute('aria-label', padded.trim());
          this.rafId = null;
        }
      };

      this.rafId = requestAnimationFrame(tick);
      return totalDuration;
    }

    setTileFlip(index, currentChar, nextChar) {
      const tile = this.tiles[index];
      if (!tile) return;

      tile.current = currentChar;
      tile.next = nextChar;

      // Update static bottom half to reveal next character once flap falls
      tile.bottomCharEl.textContent = nextChar === ' ' ? '\u00A0' : nextChar;
      tile.topCharEl.textContent = currentChar === ' ' ? '\u00A0' : currentChar;

      // Remove existing animated flaps
      if (tile.flapFront) tile.flapFront.remove();
      if (tile.flapBack) tile.flapBack.remove();

      // Create new front and back flaps
      const front = document.createElement('span');
      front.className = 'split-flap-text__flap split-flap-text__flap--front';
      front.innerHTML = `<span class="split-flap-text__char">${currentChar === ' ' ? '&nbsp;' : currentChar}</span>`;

      const back = document.createElement('span');
      back.className = 'split-flap-text__flap split-flap-text__flap--back';
      back.innerHTML = `<span class="split-flap-text__char">${nextChar === ' ' ? '&nbsp;' : nextChar}</span>`;

      tile.el.appendChild(front);
      tile.el.appendChild(back);

      tile.flapFront = front;
      tile.flapBack = back;
    }

    settleTile(index, targetChar) {
      const tile = this.tiles[index];
      if (!tile) return;

      tile.current = targetChar;
      tile.next = targetChar;

      tile.topCharEl.textContent = targetChar === ' ' ? '\u00A0' : targetChar;
      tile.bottomCharEl.textContent = targetChar === ' ' ? '\u00A0' : targetChar;

      if (tile.flapFront) {
        tile.flapFront.remove();
        tile.flapFront = null;
      }
      if (tile.flapBack) {
        tile.flapBack.remove();
        tile.flapBack = null;
      }
    }

    scheduleNext(delay) {
      if (this.cycleTimer) clearTimeout(this.cycleTimer);

      this.cycleTimer = setTimeout(() => {
        const nextIndex = this.currentPhraseIndex + 1;
        if (nextIndex >= this.words.length && !this.loop) return;

        this.currentPhraseIndex = nextIndex % this.words.length;
        const animationDuration = this.animateTo(this.words[this.currentPhraseIndex]);
        this.scheduleNext(this.cycleDelay + animationDuration);
      }, delay);
    }

    destroy() {
      if (this.cycleTimer) clearTimeout(this.cycleTimer);
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.element.innerHTML = '';
    }
  }

  window.SplitFlapText = SplitFlapText;

  // Auto-init helper on elements with [data-split-flap]
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-split-flap]').forEach((el) => {
      const rawWords = el.getAttribute('data-split-flap');
      const words = rawWords ? rawWords.split(',').map(s => s.trim()) : ['GALLERY'];
      const fontSize = el.getAttribute('data-font-size') || undefined;
      const tileColor = el.getAttribute('data-tile-color') || undefined;
      const textColor = el.getAttribute('data-text-color') || undefined;

      new SplitFlapText(el, {
        words,
        fontSize,
        tileColor,
        textColor,
        cycleDelay: 3500,
        flipDuration: 0.11,
        flipsPerChar: 5,
        stagger: 0.05
      });
    });
  });
})();
