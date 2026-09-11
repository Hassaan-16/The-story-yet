/**
 * React Bits DriftWall port for vanilla JavaScript
 * Source: https://www.reactbits.dev/components/drift-wall
 */
(function () {
  'use strict';

  // Curated showcase items for Muhammad Hassaan's photography archive
  // Uses 'assets/banana_hero.jpg' as the reliable placeholder until real pictures load or are placed
  const DEFAULT_DRIFT_ITEMS = [
    {
      id: 'frame-1',
      title: 'Chiaroscuro Alleyway',
      location: 'Rawalpindi Sector 4',
      specs: 'f/1.8 · 1/800s · ISO 100 · 35mm',
      image: 'assets/showcase_1.jpg',
      placeholder: 'assets/banana_hero.jpg'
    },
    {
      id: 'frame-2',
      title: 'Brutalist Monolith',
      location: 'National Monument Complex',
      specs: 'f/2.8 · 1/640s · ISO 200 · 50mm',
      image: 'assets/showcase_2.jpg',
      placeholder: 'assets/banana_hero.jpg'
    },
    {
      id: 'frame-3',
      title: 'Mechanical Shutter Dial',
      location: 'Studio Optics Bench',
      specs: 'f/1.4 · 1/250s · ISO 400 · 85mm',
      image: 'assets/showcase_3.jpg',
      placeholder: 'assets/banana_hero.jpg'
    },
    {
      id: 'frame-4',
      title: 'Margalla Ridge Crest',
      location: 'Foothill Ridge // 1,100m',
      specs: 'f/4.0 · 1/400s · ISO 160 · 28mm',
      image: 'assets/showcase_4.jpg',
      placeholder: 'assets/banana_hero.jpg'
    },
    {
      id: 'frame-5',
      title: 'Midnight Telemetry',
      location: 'Expressway Overpass Arterial',
      specs: 'f/8.0 · 4.0s · ISO 100 · 35mm',
      image: 'assets/showcase_5.jpg',
      placeholder: 'assets/banana_hero.jpg'
    },
    {
      id: 'frame-6',
      title: 'Contemplative Silhouette',
      location: 'Faizabad Concourse',
      specs: 'f/2.0 · 1/320s · ISO 320 · 50mm',
      image: 'assets/showcase_6.jpg',
      placeholder: 'assets/banana_hero.jpg'
    },
    {
      id: 'frame-7',
      title: 'Asphalt Rain Reflections',
      location: 'Blue Area Commercial Spine',
      specs: 'f/1.8 · 1/500s · ISO 400 · 35mm',
      image: 'assets/showcase_7.jpg',
      placeholder: 'assets/banana_hero.jpg'
    },
    {
      id: 'frame-8',
      title: 'Rawal Lake Mirage',
      location: 'Waterline Basin Promenade',
      specs: 'f/5.6 · 1/1200s · ISO 100 · 70mm',
      image: 'assets/showcase_8.jpg',
      placeholder: 'assets/banana_hero.jpg'
    },
    {
      id: 'frame-9',
      title: 'Vintage Film Grain Study',
      location: 'Darkroom Archive',
      specs: 'f/2.0 · 1/250s · ISO 800 · 50mm',
      image: 'assets/showcase_9.jpg',
      placeholder: 'assets/banana_hero.jpg'
    },
    {
      id: 'frame-10',
      title: 'High-Contrast Concrete',
      location: 'Sectors G-9 Brutalism',
      specs: 'f/4.0 · 1/1000s · ISO 100 · 35mm',
      image: 'assets/showcase_10.jpg',
      placeholder: 'assets/banana_hero.jpg'
    },
    {
      id: 'frame-11',
      title: 'Nocturnal Neon Glow',
      location: 'Commercial Market Arcade',
      specs: 'f/1.4 · 1/125s · ISO 1600 · 50mm',
      image: 'assets/showcase_11.jpg',
      placeholder: 'assets/banana_hero.jpg'
    },
    {
      id: 'frame-12',
      title: 'Golden Hour Glass Glint',
      location: 'Margalla Highway Overlook',
      specs: 'f/2.8 · 1/1600s · ISO 100 · 85mm',
      image: 'assets/showcase_12.jpg',
      placeholder: 'assets/banana_hero.jpg'
    }
  ];

  const columnFactor = (index, variance) => {
    const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
    return 1 + variance * pseudo;
  };

  class DriftWall {
    constructor(container, options = {}) {
      this.container = container;
      this.items = options.items || DEFAULT_DRIFT_ITEMS;
      this.columns = options.columns || (window.innerWidth < 640 ? 3 : window.innerWidth < 1024 ? 4 : 5);
      this.tileWidth = options.tileWidth || (window.innerWidth < 640 ? 150 : 210);
      this.tileHeight = options.tileHeight || (window.innerWidth < 640 ? 100 : 138);
      this.gap = options.gap || 18;
      this.radius = options.radius || 14;
      this.tilt = options.tilt !== undefined ? options.tilt : 16;
      this.turn = options.turn !== undefined ? options.turn : -14;
      this.roll = options.roll !== undefined ? options.roll : 0;
      this.perspective = options.perspective || 1200;
      this.depth = options.depth || 120;
      this.speed = options.speed || 38;
      this.direction = options.direction || 'up';
      this.variance = options.variance || 0.45;
      this.parallax = options.parallax !== undefined ? options.parallax : 0.6;
      this.pauseOnHover = options.pauseOnHover || false;
      this.lift = options.lift || 64;
      this.fade = options.fade !== undefined ? options.fade : 0.6;
      this.dim = options.dim !== undefined ? options.dim : 0.55;
      this.grayscale = options.grayscale || false;
      this.overlayColor = options.overlayColor || '#060010';

      this.planeEl = null;
      this.trackEls = [];
      this.offsets = [];
      this.velocities = [];
      this.columnMeta = [];
      this.columnItems = [];
      this.rafId = null;
      this.lastTs = null;

      this.pointer = { x: 0, y: 0 };
      this.pointerDamped = { x: 0, y: 0 };
      this.wallHovered = false;
      this.activeTileId = null;

      this.init();
    }

    init() {
      this.container.classList.add('drift-wall');
      this.container.style.setProperty('--dw-tile-w', `${this.tileWidth}px`);
      this.container.style.setProperty('--dw-tile-h', `${this.tileHeight}px`);
      this.container.style.setProperty('--dw-gap', `${this.gap}px`);
      this.container.style.setProperty('--dw-radius', `${this.radius}px`);
      this.container.style.setProperty('--dw-perspective', `${this.perspective}px`);
      this.container.style.setProperty('--dw-lift', `${this.lift}px`);
      this.container.style.setProperty('--dw-dim', this.dim);
      this.container.style.setProperty('--dw-gray', this.grayscale ? 1 : 0);
      this.container.style.setProperty('--dw-overlay', this.overlayColor);
      this.container.style.setProperty('--dw-edge', `${Math.max(0, (1 - this.fade) * 100)}%`);

      // 1. Split items into columns
      this.columnItems = Array.from({ length: this.columns }, () => []);
      this.items.forEach((item, i) => {
        this.columnItems[i % this.columns].push(item);
      });

      const containerH = this.container.clientHeight || 640;
      const unit = this.tileHeight + this.gap;

      this.columnMeta = this.columnItems.map((col) => {
        const copyHeight = Math.max(unit, col.length * unit);
        const copies = Math.max(2, Math.ceil((containerH * 1.8) / copyHeight) + 1);
        return { copyHeight, copies };
      });

      // 2. Base velocities
      const dirSign = this.direction === 'up' ? 1 : -1;
      this.velocities = this.columnItems.map((_, c) => {
        const altSign = c % 2 === 0 ? 1 : -1;
        return this.speed * columnFactor(c, this.variance) * dirSign * altSign;
      });

      this.offsets = this.columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));

      // 3. Build DOM
      this.container.innerHTML = '';
      this.planeEl = document.createElement('div');
      this.planeEl.className = 'drift-wall__plane';
      this.container.appendChild(this.planeEl);

      this.trackEls = [];
      this.columnItems.forEach((col, c) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'drift-wall__col';

        const trackDiv = document.createElement('div');
        trackDiv.className = 'drift-wall__track';

        const meta = this.columnMeta[c];
        for (let copy = 0; copy < meta.copies; copy++) {
          col.forEach((item, itemIdx) => {
            const tileId = `${c}-${copy}-${itemIdx}`;
            const tileEl = document.createElement('div');
            tileEl.className = 'drift-wall__tile';
            tileEl.setAttribute('data-tile-id', tileId);
            tileEl.setAttribute('data-col', c);
            tileEl.setAttribute('tabindex', '0');
            tileEl.setAttribute('role', 'button');
            tileEl.setAttribute('aria-label', `${item.title} — ${item.location}`);

            // Preload test: default to placeholder, swap if loaded
            tileEl.innerHTML = `
              <span class="drift-wall__inner">
                <img 
                  src="${item.placeholder}" 
                  alt="${item.title}" 
                  loading="lazy" 
                  decoding="async" 
                  draggable="false" 
                  onerror="this.onerror=null; this.src='assets/banana_hero.jpg';"
                />
                <span class="drift-wall__overlay" aria-hidden="true"></span>
              </span>
            `;

            // Background test image loader
            const testImg = new Image();
            testImg.onload = () => {
              const img = tileEl.querySelector('img');
              if (img) img.src = item.image;
            };
            testImg.src = item.image;

            // Click listener for Lightbox preview
            tileEl.addEventListener('click', () => {
              if (window.openGalleryLightbox) {
                window.openGalleryLightbox(item, tileEl.querySelector('img')?.src || item.placeholder);
              }
            });

            trackDiv.appendChild(tileEl);
          });
        }

        colDiv.appendChild(trackDiv);
        this.planeEl.appendChild(colDiv);
        this.trackEls.push(trackDiv);
      });

      this.applyPlaneTransform(0, 0);

      // 4. Pointer Events
      this.container.addEventListener('pointerenter', () => {
        this.wallHovered = true;
      });

      this.container.addEventListener('pointermove', (e) => {
        const rect = this.container.getBoundingClientRect();
        if (!rect) return;

        if (this.parallax > 0) {
          this.pointer.x = (e.clientX - rect.left) / rect.width - 0.5;
          this.pointer.y = (e.clientY - rect.top) / rect.height - 0.5;
        }

        // Active tile detection
        const hit = document.elementFromPoint(e.clientX, e.clientY);
        const tile = hit && hit.closest ? hit.closest('[data-tile-id]') : null;
        if (tile) {
          const id = tile.dataset.tileId;
          if (id !== this.activeTileId) {
            this.clearActive();
            this.activeTileId = id;
            tile.classList.add('is-active');
          }
        } else {
          this.clearActive();
        }
      });

      this.container.addEventListener('pointerleave', () => {
        this.wallHovered = false;
        this.pointer = { x: 0, y: 0 };
        this.clearActive();
      });

      // 5. Start animation loop
      this.animate = this.animate.bind(this);
      this.rafId = requestAnimationFrame(this.animate);
    }

    clearActive() {
      if (this.activeTileId) {
        const active = this.container.querySelector(`.drift-wall__tile[data-tile-id="${this.activeTileId}"]`);
        if (active) active.classList.remove('is-active');
        this.activeTileId = null;
      }
    }

    applyPlaneTransform(px, py) {
      if (!this.planeEl) return;
      this.planeEl.style.transform =
        `translate(-50%, -50%) scale(1.18) ` +
        `rotateX(${this.tilt + py}deg) rotateY(${this.turn + px}deg) rotateZ(${this.roll}deg) ` +
        `translateZ(${-this.depth}px)`;
    }

    animate(now) {
      if (this.lastTs === null) {
        this.lastTs = now;
      }
      const dt = Math.min((now - this.lastTs) / 1000, 0.1);
      this.lastTs = now;

      // Parallax easing
      if (this.parallax > 0) {
        this.pointerDamped.x += (this.pointer.x - this.pointerDamped.x) * 0.08;
        this.pointerDamped.y += (this.pointer.y - this.pointerDamped.y) * 0.08;
        this.applyPlaneTransform(this.pointerDamped.x * 12, -this.pointerDamped.y * 12);
      }

      // Column tracks drift
      for (let c = 0; c < this.trackEls.length; c++) {
        const track = this.trackEls[c];
        const meta = this.columnMeta[c];
        if (!track || !meta) continue;

        let v = this.velocities[c];
        if (this.pauseOnHover && this.wallHovered) {
          v = 0;
        }

        let next = this.offsets[c] + v * dt;
        next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
        this.offsets[c] = next;

        track.style.transform = `translate3d(0, ${-next}px, 0)`;
      }

      this.rafId = requestAnimationFrame(this.animate);
    }

    destroy() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.container.innerHTML = '';
    }
  }

  window.DriftWall = DriftWall;

  // Mount DriftWall on #driftWallContainer
  // Retrieve dynamic gallery photos from manifest or fallback to defaults
  function getActiveDriftItems() {
    if (typeof window !== 'undefined' && Array.isArray(window.__GALLERY_PHOTOS__) && window.__GALLERY_PHOTOS__.length > 0) {
      return window.__GALLERY_PHOTOS__;
    }
    return DEFAULT_DRIFT_ITEMS;
  }

  // Mount DriftWall on #driftWallContainer
  document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('driftWallContainer');
    if (container) {
      let items = getActiveDriftItems();

      // If window.__GALLERY_PHOTOS__ was empty, attempt to fetch assets/gallery/manifest.json
      if (items === DEFAULT_DRIFT_ITEMS) {
        try {
          const resp = await fetch('assets/gallery/manifest.json');
          if (resp.ok) {
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 0) {
              items = data;
            }
          }
        } catch (e) {
          // Keep default showcase items
        }
      }

      new DriftWall(container, {
        items,
        speed: 36,
        tilt: 16,
        turn: -14,
        parallax: 0.65,
        lift: 68,
        dim: 0.58
      });
    }

    // Lightbox modal bridge
    const modal = document.getElementById('galleryLightbox');
    const closeBtn = document.getElementById('lightboxCloseBtn');
    const imgEl = document.getElementById('lightboxImg');
    const titleEl = document.getElementById('lightboxTitle');
    const specsEl = document.getElementById('lightboxSpecs');

    window.openGalleryLightbox = (item, currentSrc) => {
      if (!modal || !imgEl) return;
      imgEl.src = currentSrc || item.placeholder;
      imgEl.alt = item.title;
      if (titleEl) titleEl.textContent = `${item.title} — ${item.location}`;
      if (specsEl) specsEl.textContent = item.specs;
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };

    function closeLightbox() {
      if (!modal) return;
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeLightbox();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (modal && modal.classList.contains('is-open') && e.key === 'Escape') {
        closeLightbox();
      }
    });

    // Animated chevron smooth scroll down into Drift Wall
    const chevronBtn = document.getElementById('galleryChevronBtn');
    if (chevronBtn) {
      chevronBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById('driftWallContainer') || document.getElementById('gallerySection');
        if (target) {
          if (window.lenis) {
            window.lenis.scrollTo(target, {
              offset: -40,
              duration: 1.4,
              easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
          } else {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    }
  });
})();
