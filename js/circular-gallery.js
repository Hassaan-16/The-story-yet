/**
 * Circular Gallery Component
 * Ported from React Bits (https://www.reactbits.dev/components/circular-gallery)
 * Powered by OGL (Minimal WebGL Library)
 *
 * Muhammad Hassaan Bin Saqib // Overview Showcase
 */

import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';

export const CIRCULAR_GALLERY_ITEMS = [
  {
    image: 'assets/circular-gallery/item-1.jpg',
    text: 'Cogent Labs // DocSphere',
    title: 'Cogent Labs // Backend Engineering & DocSphere',
    desc: 'Engineered DocSphere subscription SaaS platform with Django, DRF, JWT authentication, Celery background queues, Docker, and Stripe billing.',
    link: 'https://lnkd.in/p/gDpRj_v7'
  },
  {
    image: 'assets/circular-gallery/item-2.jpg',
    text: 'Devsinc // Campus Ambassador',
    title: 'Devsinc // Campus Ambassador (Devstronaut 3.0)',
    desc: 'Representing Devsinc at FAST-NUCES Lahore; drafted anti-corruption software architecture proposals selected among nationwide finalists.',
    link: 'https://lnkd.in/p/gm3mkpah'
  },
  {
    image: 'assets/circular-gallery/item-3.jpg',
    text: 'FinTech Society // PR Head',
    title: 'NUCES FinTech Society // Head of Public Relations',
    desc: 'Commanded PR, registration and executive relations for the FAST-NUCES FinTech Summit 2026 hosting State Bank of Pakistan and fintech CEOs.',
    link: 'https://lnkd.in/p/gCUq_aVJ'
  },
  {
    image: 'assets/circular-gallery/item-4.jpg',
    text: 'Manafa // Industry Immersion',
    title: 'Manafa Technologies // Corporate Tech Immersion',
    desc: 'Academic-industry immersion focusing on Agile development lifecycles, scalable fintech architectures, and regulatory cybersecurity compliance.',
    link: 'https://lnkd.in/p/geZktYHf'
  },
  {
    image: 'assets/circular-gallery/item-5.jpg',
    text: 'Cogent Labs // Software Intern',
    title: 'Cogent Labs // Software Engineering Intern Induction',
    desc: 'Inducted into the Cogent Labs engineering cohort, transitioning from independent client solutions into high-throughput collaborative backends.',
    link: 'https://lnkd.in/p/gh2paNt2'
  },
  {
    image: 'assets/circular-gallery/item-6-pdf.jpg',
    text: 'Stanford // Machine Learning',
    title: 'Stanford Online // Machine Learning Specialization',
    desc: 'Completed advanced 3-course Stanford Online & DeepLearning.AI curriculum under Andrew Ng covering Supervised, Neural, and Unsupervised Systems.',
    link: 'https://lnkd.in/p/gNjmvZUe'
  },
  {
    image: 'assets/circular-gallery/item-7.jpg',
    text: 'IBM // Data Science',
    title: 'IBM // Data Science Professional Specialization',
    desc: 'Exhaustive 10-course professional curriculum spanning Python data science methodology, SQL database architectures, and predictive modeling.',
    link: 'https://lnkd.in/p/gHSwWpjz'
  },
  {
    image: 'assets/circular-gallery/item-8.jpg',
    text: 'ISC2 // Cybersecurity (CC)',
    title: 'ISC2 // Certified in Cybersecurity (CC)',
    desc: 'International certification in Enterprise Information Security across access control, network defense, incident response, and BCP/DRP governance.',
    link: 'https://www.linkedin.com/posts/muhammad-hassaan-bin-saqib-_isc2-cybersecurity-cc-activity-7225564821969149952-sL-E?utm_source=share&utm_medium=member_desktop&rcm=ACoAADmN148B89lSiLmqZUKKeK2JP4oGK64HNbg'
  }
];

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1, p2, t) {
  return p1 + (p2 - p1) * t;
}

function autoBind(instance) {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto).forEach(key => {
    if (key !== 'constructor' && typeof instance[key] === 'function') {
      instance[key] = instance[key].bind(instance);
    }
  });
}

function createTextTexture(gl, text, font = 'bold 24px "Plus Jakarta Sans", sans-serif', color = '#0a0a0a') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = 32;
  canvas.width = textWidth + 24;
  canvas.height = textHeight + 16;
  
  context.font = font;
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // High contrast white halo so dark text is readable over the page background
  context.shadowColor = 'rgba(255, 255, 255, 0.95)';
  context.shadowBlur = 5;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 1;
  
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

class Title {
  constructor({ gl, plane, renderer, text, textColor = '#0a0a0a', font = 'bold 24px "Plus Jakarta Sans", sans-serif' }) {
    autoBind(this);
    this.gl = gl;
    this.plane = plane;
    this.renderer = renderer;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.createMesh();
  }

  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeight = this.plane.scale.y * 0.12;
    const textWidth = textHeight * aspect;
    this.mesh.scale.set(textWidth, textHeight, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.08;
    this.mesh.setParent(this.plane);
  }
}

class Media {
  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    renderer,
    scene,
    screen,
    text,
    title,
    desc,
    link,
    itemIndex,
    viewport,
    bend,
    textColor,
    borderRadius = 0.05,
    font
  }) {
    this.extra = 0;
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.title = title;
    this.desc = desc;
    this.link = link;
    this.itemIndex = itemIndex;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;

    this.createShader();
    this.createMesh();
    this.createTitle();
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, {
      generateMipmaps: true
    });

    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.08 + uSpeed * 0.4);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;
        
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        
        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          
          float edgeSmooth = 0.0025;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          
          // Crisp comic border around floating card
          float borderThick = 0.012;
          float innerAlpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d + borderThick);
          vec3 borderColor = vec3(0.04, 0.04, 0.04);
          vec3 finalColor = mix(borderColor, color.rgb, innerAlpha);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius }
      },
      transparent: true
    });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.image;
    img.onload = () => {
      if (this.image.endsWith('.svg')) {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1080;
        canvas.height = img.naturalHeight || 810;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        texture.image = canvas;
        this.program.uniforms.uImageSizes.value = [canvas.width, canvas.height];
      } else {
        texture.image = img;
        this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
      }
    };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });
    this.plane.setParent(this.scene);
  }

  createTitle() {
    this.titleMesh = new Title({
      gl: this.gl,
      plane: this.plane,
      renderer: this.renderer,
      text: this.text,
      textColor: this.textColor,
      font: this.font
    });
  }

  update(scroll, direction) {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.035;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }

  onResize({ screen, viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height];
      }
    }
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (960 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (760 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2.0;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

export class CircularGalleryApp {
  constructor(container, {
    items = CIRCULAR_GALLERY_ITEMS,
    bend = 2.4,
    textColor = '#0a0a0a',
    borderRadius = 0.05,
    font = 'bold 22px "Plus Jakarta Sans", sans-serif',
    scrollSpeed = 2,
    scrollEase = 0.06,
    onActiveChange = null
  } = {}) {
    this.container = container;
    this.items = items;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;
    this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onActiveChange = onActiveChange;
    this.lastReportedIndex = -1;

    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);
    this.init();
  }

  init() {
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias();
    this.update();
    this.addEventListeners();
    this.reportActiveItem();
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100
    });
  }

  createMedias() {
    // Duplicate items to ensure smooth infinite wrap
    this.mediasData = this.items.concat(this.items);
    this.medias = this.mediasData.map((data, index) => {
      const originalIndex = index % this.items.length;
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        index,
        length: this.mediasData.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        text: data.text,
        title: data.title,
        desc: data.desc,
        link: data.link,
        itemIndex: originalIndex,
        viewport: this.viewport,
        bend: this.bend,
        textColor: this.textColor,
        borderRadius: this.borderRadius,
        font: this.font
      });
    });
  }

  onTouchDown(e) {
    this.isDown = true;
    this.isDragging = false;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    this.startX = clientX;
    this.startY = clientY;
    this.startTime = performance.now();
    this.scroll.position = this.scroll.current;
  }

  onTouchMove(e) {
    if (!this.isDown) {
      this.checkHover(e);
      return;
    }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dist = Math.hypot(clientX - this.startX, clientY - this.startY);
    if (dist > 5) {
      this.isDragging = true;
    }
    const distance = (this.startX - clientX) * (this.scrollSpeed * 0.025);
    this.scroll.target = this.scroll.position + distance;
  }

  onTouchUp(e) {
    if (!this.isDown) return;
    this.isDown = false;

    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const elapsed = performance.now() - this.startTime;
    const dist = (clientX != null && this.startX != null) ? Math.hypot(clientX - this.startX, clientY - this.startY) : 999;

    if (!this.isDragging && dist < 8 && elapsed < 400) {
      this.handlePointerClick(clientX, clientY);
    }
    this.onCheck();
  }

  handlePointerClick(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    if (localX < 0 || localX > rect.width || localY < 0 || localY > rect.height) return;

    // Convert local screen coordinates to world viewport coordinates
    const mouseWx = (localX / this.screen.width - 0.5) * this.viewport.width;
    const mouseWy = (0.5 - localY / this.screen.height) * this.viewport.height;

    let clicked = null;
    let closestDist = Infinity;

    for (const media of this.medias) {
      const hw = media.plane.scale.x * 0.5;
      const hh = media.plane.scale.y * 0.5;
      const th = media.plane.scale.y * 0.28;
      const px = media.plane.position.x;
      const py = media.plane.position.y;

      if (mouseWx >= px - hw && mouseWx <= px + hw &&
          mouseWy >= py - hh - th && mouseWy <= py + hh) {
        const d = Math.hypot(mouseWx - px, mouseWy - py);
        if (d < closestDist) {
          closestDist = d;
          clicked = media;
        }
      }
    }

    if (clicked && clicked.link) {
      window.open(clicked.link, '_blank', 'noopener,noreferrer');
    }
  }

  checkHover(e) {
    if (!this.container || this.isDown) return;
    const rect = this.container.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    if (localX < 0 || localX > rect.width || localY < 0 || localY > rect.height) {
      this.container.style.cursor = 'grab';
      return;
    }

    const mouseWx = (localX / this.screen.width - 0.5) * this.viewport.width;
    const mouseWy = (0.5 - localY / this.screen.height) * this.viewport.height;

    let hit = false;
    for (const media of this.medias) {
      const hw = media.plane.scale.x * 0.5;
      const hh = media.plane.scale.y * 0.5;
      const th = media.plane.scale.y * 0.28;
      const px = media.plane.position.x;
      const py = media.plane.position.y;

      if (mouseWx >= px - hw && mouseWx <= px + hw &&
          mouseWy >= py - hh - th && mouseWy <= py + hh) {
        hit = true;
        break;
      }
    }
    this.container.style.cursor = hit ? 'pointer' : 'grab';
  }

  onWheel(e) {
    const delta = e.deltaY || e.wheelDelta || e.detail;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.22;
    this.onCheckDebounce();
  }

  onKeyDown(e) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        this.scroll.target += this.scrollSpeed * 4;
        this.onCheckDebounce();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.scroll.target -= this.scrollSpeed * 4;
        this.onCheckDebounce();
        break;
      case 'Home':
        e.preventDefault();
        this.scroll.target = 0;
        this.onCheckDebounce();
        break;
      default:
        break;
    }
  }

  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(this.scroll.target / width);
    this.scroll.target = width * itemIndex;
  }

  onResize() {
    this.screen = {
      width: this.container.clientWidth || window.innerWidth,
      height: this.container.clientHeight || 520
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) {
      this.medias.forEach(media => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }

  reportActiveItem() {
    if (!this.medias || this.medias.length === 0) return;
    let closestMedia = null;
    let minDist = Infinity;

    for (const media of this.medias) {
      const dist = Math.abs(media.plane.position.x);
      if (dist < minDist) {
        minDist = dist;
        closestMedia = media;
      }
    }

    if (closestMedia && closestMedia.itemIndex !== this.lastReportedIndex) {
      this.lastReportedIndex = closestMedia.itemIndex;
      if (this.onActiveChange) {
        this.onActiveChange({
          index: closestMedia.itemIndex,
          total: this.items.length,
          item: this.items[closestMedia.itemIndex]
        });
      }
    }
  }

  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    if (this.medias) {
      this.medias.forEach(media => media.update(this.scroll, direction));
      this.reportActiveItem();
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);

    window.addEventListener('resize', this.boundOnResize);
    window.addEventListener('wheel', this.boundOnWheel, { passive: true });
    this.container.addEventListener('mousedown', this.boundOnTouchDown);
    window.addEventListener('mousemove', this.boundOnTouchMove);
    window.addEventListener('mouseup', this.boundOnTouchUp);
    this.container.addEventListener('touchstart', this.boundOnTouchDown, { passive: true });
    window.addEventListener('touchmove', this.boundOnTouchMove, { passive: true });
    window.addEventListener('touchend', this.boundOnTouchUp, { passive: true });
    this.container.addEventListener('keydown', this.boundOnKeyDown);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.boundOnResize);
    window.removeEventListener('wheel', this.boundOnWheel);
    if (this.container) {
      this.container.removeEventListener('mousedown', this.boundOnTouchDown);
      this.container.removeEventListener('touchstart', this.boundOnTouchDown);
      this.container.removeEventListener('keydown', this.boundOnKeyDown);
    }
    window.removeEventListener('mousemove', this.boundOnTouchMove);
    window.removeEventListener('mouseup', this.boundOnTouchUp);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchUp);
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

// Auto-boot if container is present on overview page
export function initOverviewCircularGallery() {
  const container = document.getElementById('circularGalleryContainer');
  if (!container) return;

  const titleEl = document.getElementById('galleryActiveTitle');
  const descEl = document.getElementById('galleryActiveDesc');
  const linkEl = document.getElementById('galleryActiveLink');
  const indexEl = document.getElementById('galleryActiveIndex');

  const gallery = new CircularGalleryApp(container, {
    items: CIRCULAR_GALLERY_ITEMS,
    bend: 2.2,
    textColor: '#0a0a0a',
    borderRadius: 0.05,
    scrollSpeed: 2,
    scrollEase: 0.06,
    onActiveChange: ({ index, total, item }) => {
      if (titleEl) titleEl.textContent = item.title;
      if (descEl) descEl.textContent = item.desc;
      if (linkEl) {
        linkEl.href = item.link;
        linkEl.title = `View dispatch: ${item.title}`;
      }
      if (indexEl) {
        const currentNum = String(index + 1).padStart(2, '0');
        const totalNum = String(total).padStart(2, '0');
        indexEl.textContent = `${currentNum} / ${totalNum}`;
      }
    }
  });

  return gallery;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initOverviewCircularGallery());
  } else {
    initOverviewCircularGallery();
  }
}
