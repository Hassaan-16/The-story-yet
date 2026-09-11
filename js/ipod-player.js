import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

(function () {
  'use strict';

  // Playlist configuration
  const PLAYLIST = [
    {
      title: 'Attention',
      artist: 'Charlie Puth',
      album: 'Voicenotes',
      src: encodeURI('assets/audio/Charlie Puth - Attention [Official Video].mp3')
    }
  ];

  let currentTrackIndex = 0;
  let isPlaying = false;
  let currentMode = 'nowPlaying'; // 'nowPlaying' or 'menu'
  let selectedMenuItem = 0;
  const menuItems = ['Now Playing', 'Play / Pause', 'Next Track', 'Restart Track'];

  // Audio setup
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = PLAYLIST[0].src;

  // Three.js instances
  let scene, camera, renderer, controls;
  let ipodGroup, clickwheelMesh, screenMesh, innerPanelGroup;
  let canvas, ctx, canvasTexture;
  let container;
  let raycaster, mouse;
  let lastMouseDownTime = 0;
  let mouseDownPos = { x: 0, y: 0 };
  let feedbackMessage = '';
  let feedbackTimer = null;

  // Initialize Canvas for iPod LCD Screen (512x416 matches physical 5.82x4.72 screen aspect)
  function initScreenCanvas() {
    canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 416;
    ctx = canvas.getContext('2d');
    canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;
    renderScreen();
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function showFeedback(msg) {
    feedbackMessage = msg;
    if (feedbackTimer) clearTimeout(feedbackTimer);
    renderScreen();
    feedbackTimer = setTimeout(() => {
      feedbackMessage = '';
      renderScreen();
    }, 1400);
  }

  // Draw the authentic Apple iPod Classic LCD Screen
  function renderScreen() {
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const track = PLAYLIST[currentTrackIndex];

    // Background: Soft authentic backlit LCD with slight Apple blue-gray tint
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 1. Top Status Bar
    const statusH = 42;
    const statusGrad = ctx.createLinearGradient(0, 0, 0, statusH);
    statusGrad.addColorStop(0, '#ffffff');
    statusGrad.addColorStop(0.5, '#e2e8f0');
    statusGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = statusGrad;
    ctx.fillRect(0, 0, w, statusH);

    // Bottom hairline for status bar
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, statusH);
    ctx.lineTo(w, statusH);
    ctx.stroke();

    // Play/Pause icon (left)
    ctx.fillStyle = '#0f172a';
    if (isPlaying) {
      // Play triangle
      ctx.beginPath();
      ctx.moveTo(22, 14);
      ctx.lineTo(35, 21);
      ctx.lineTo(22, 28);
      ctx.closePath();
      ctx.fill();
    } else {
      // Pause two bars
      ctx.fillRect(20, 14, 4.5, 14);
      ctx.fillRect(28, 14, 4.5, 14);
    }

    // Title text in status bar (center)
    ctx.font = '700 18px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(currentMode === 'menu' ? 'iPod' : 'Now Playing', w / 2, 21);

    // Battery icon (right side of status bar)
    const battX = w - 54;
    const battY = 14;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(battX, battY, 30, 14);
    // Positive terminal cap
    ctx.fillStyle = '#334155';
    ctx.fillRect(battX + 30, battY + 4, 3, 6);
    // Battery segmented charge fill (iconic classic iPod green)
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(battX + 3, battY + 3, 22, 8);

    // 2. Main Screen Area
    if (currentMode === 'nowPlaying') {
      // Left: Album Art Box
      const artX = 30;
      const artY = 65;
      const artSize = 180;

      // Drop shadow for album art
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(artX + 4, artY + 4, artSize, artSize);

      // Artwork frame
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(artX, artY, artSize, artSize);
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3;
      ctx.strokeRect(artX, artY, artSize, artSize);

      // Vinyl record circle inside art
      ctx.beginPath();
      ctx.arc(artX + artSize / 2, artY + artSize / 2, 72, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Vinyl grooves
      ctx.beginPath();
      ctx.arc(artX + artSize / 2, artY + artSize / 2, 50, 0, Math.PI * 2);
      ctx.strokeStyle = '#1f2937';
      ctx.stroke();

      // Center yellow record label
      ctx.beginPath();
      ctx.arc(artX + artSize / 2, artY + artSize / 2, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe500';
      ctx.fill();
      ctx.strokeStyle = '#0a0a0a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center spindle hole
      ctx.beginPath();
      ctx.arc(artX + artSize / 2, artY + artSize / 2, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Right: Track Information
      const infoX = 232;
      ctx.textAlign = 'left';

      // Title
      ctx.font = '800 26px "Newsreader", Georgia, serif';
      ctx.fillStyle = '#0a0a0a';
      ctx.fillText(track.title, infoX, 90);

      // Artist
      ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#004225';
      ctx.fillText(track.artist, infoX, 124);

      // Album
      ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#4b5825';
      ctx.fillText(track.album, infoX, 152);

      // Track counter
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`TRACK ${currentTrackIndex + 1} OF ${PLAYLIST.length}`, infoX, 185);

      // Status pill / feedback badge
      if (feedbackMessage) {
        ctx.fillStyle = '#ffe500';
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(infoX, 204, 210, 30, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = '800 13px "JetBrains Mono", monospace';
        ctx.fillStyle = '#0a0a0a';
        ctx.fillText(`✦ ${feedbackMessage} ✦`, infoX + 12, 224);
      } else {
        ctx.font = '700 12px "JetBrains Mono", monospace';
        ctx.fillStyle = isPlaying ? '#059669' : '#d97706';
        ctx.fillText(isPlaying ? '● PLAYING (320kbps)' : '❚❚ PAUSED (CLICK ▶)', infoX, 224);
      }

      // 3. Bottom Scrubber / Timeline
      const barX = 30;
      const barY = 285;
      const barW = w - 60;
      const barH = 14;

      const duration = audio.duration || 211;
      const currentTime = audio.currentTime || 0;
      const progress = Math.min(1, Math.max(0, currentTime / duration));

      // Bar track
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 4);
      ctx.fill();
      ctx.stroke();

      // Bar fill (classic blue gradient)
      if (progress > 0) {
        const fillW = Math.max(8, barW * progress);
        const fillGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
        fillGrad.addColorStop(0, '#38bdf8');
        fillGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, fillW, barH, 4);
        ctx.fill();
      }

      // Time indicators
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'left';
      ctx.fillText(formatTime(currentTime), barX, barY + 35);

      ctx.textAlign = 'right';
      const remaining = duration - currentTime;
      ctx.fillText(`-${formatTime(remaining)}`, barX + barW, barY + 35);

      // Bottom guidance note
      ctx.textAlign = 'center';
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('CLICK WHEEL: BOTTOM = PLAY/PAUSE | TOP = MENU | SIDES = SKIP', w / 2, h - 22);

    } else {
      // Menu Mode (Classic iPod list)
      const listTop = 55;
      const itemH = 46;

      menuItems.forEach((item, index) => {
        const itemY = listTop + index * itemH;
        const isSelected = index === selectedMenuItem;

        if (isSelected) {
          // Iconic Apple Blue selection bar
          const barGrad = ctx.createLinearGradient(0, itemY, 0, itemY + itemH);
          barGrad.addColorStop(0, '#0284c7');
          barGrad.addColorStop(1, '#0369a1');
          ctx.fillStyle = barGrad;
          ctx.fillRect(0, itemY, w, itemH);

          ctx.fillStyle = '#ffffff';
          ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
        }

        ctx.textAlign = 'left';
        ctx.fillText(item, 35, itemY + 28);

        // Arrow > on the right
        ctx.textAlign = 'right';
        ctx.fillText('›', w - 35, itemY + 28);
      });

      // Split line preview on bottom
      ctx.textAlign = 'center';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`NOW SELECTED: ${menuItems[selectedMenuItem]} (PRESS CENTER TO SELECT)`, w / 2, h - 26);
    }

    if (canvasTexture) {
      canvasTexture.needsUpdate = true;
    }
  }

  // Audio controls
  function togglePlay() {
    if (audio.paused) {
      audio.play().then(() => {
        isPlaying = true;
        showFeedback('PLAYING ▶');
      }).catch((e) => {
        console.warn('Audio play request blocked:', e);
      });
    } else {
      audio.pause();
      isPlaying = false;
      showFeedback('PAUSED ❚❚');
    }
    renderScreen();
  }

  function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % PLAYLIST.length;
    audio.src = PLAYLIST[currentTrackIndex].src;
    audio.currentTime = 0;
    if (isPlaying) {
      audio.play().catch(() => {});
    }
    showFeedback('NEXT TRACK ▶▶');
    renderScreen();
  }

  function prevTrack() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      showFeedback('RESTART ◀◀');
    } else {
      currentTrackIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
      audio.src = PLAYLIST[currentTrackIndex].src;
      audio.currentTime = 0;
      if (isPlaying) {
        audio.play().catch(() => {});
      }
      showFeedback('PREV TRACK ◀◀');
    }
    renderScreen();
  }

  function toggleMenu() {
    currentMode = currentMode === 'nowPlaying' ? 'menu' : 'nowPlaying';
    showFeedback(currentMode === 'menu' ? 'MENU' : 'NOW PLAYING');
    renderScreen();
  }

  function handleCenterButton() {
    if (currentMode === 'menu') {
      if (selectedMenuItem === 0) {
        currentMode = 'nowPlaying';
      } else if (selectedMenuItem === 1) {
        togglePlay();
      } else if (selectedMenuItem === 2) {
        nextTrack();
      } else if (selectedMenuItem === 3) {
        audio.currentTime = 0;
        if (audio.paused) togglePlay();
        showFeedback('REPEATING');
      }
    } else {
      togglePlay();
    }
    renderScreen();
  }

  // Set up Three.js scene
  function initThree() {
    container = document.getElementById('ipodContainer');
    if (!container) return;

    container.innerHTML = '';

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera (calibrated for comfortable ~65% framing with generous margin)
    camera = new THREE.PerspectiveCamera(35, width / height, 1, 1500);
    camera.position.set(0, 0, -340);

    // 3. Renderer with PBR environment and sRGB color space
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Studio Environment Lighting (HDRI IBL - restores mirror chrome shine & reflections)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Immediate sharp RoomEnvironment fallback while studio.hdr loads
    const roomEnv = new RoomEnvironment(renderer);
    const fallbackEnv = pmremGenerator.fromScene(roomEnv).texture;
    scene.environment = fallbackEnv;

    // Load authentic Photorealistic Studio HDR
    new RGBELoader().load(
      'assets/studio.hdr',
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        fallbackEnv.dispose();
        pmremGenerator.dispose();
      },
      undefined,
      (err) => {
        console.warn('Could not load studio.hdr, using RoomEnvironment:', err);
      }
    );

    // Subtle physical key light (for sharp specular glint and soft contact shadow)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(-80, 150, -220);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Subtle rim light from behind (for chrome mirror edge brilliance)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.9);
    rimLight.position.set(80, 50, 220);
    scene.add(rimLight);

    // 5. OrbitControls (strictly locked position and zoom)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;   // Position strictly locked (cannot move or pan)
    controls.enableZoom = false;  // Size strictly locked (cannot zoom)
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.85;
    controls.target.set(0, 0, 0); // Focus strictly on centered iPod
    controls.minPolarAngle = Math.PI * 0.15;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.NONE,
      RIGHT: THREE.MOUSE.NONE
    };

    // Prevent double-click repositioning entirely
    container.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // 6. Initialize Screen Canvas Texture
    initScreenCanvas();

    // 7. Load 3D iPod Model
    const loader = new GLTFLoader();
    loader.load(
      'assets/ipod_scroll_wheel.glb',
      (gltf) => {
        ipodGroup = gltf.scene;

        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

        // Traverse meshes: preserve original PBR textures, enhance anisotropy, find target nodes
        ipodGroup.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Retain original PBR textures with maximum sharpness and studio reflection
            if (child.material) {
              if (child.material.map) child.material.map.anisotropy = maxAnisotropy;
              if (child.material.normalMap) child.material.normalMap.anisotropy = maxAnisotropy;
              if (child.material.roughnessMap) child.material.roughnessMap.anisotropy = maxAnisotropy;
              if (child.material.metalnessMap) child.material.metalnessMap.anisotropy = maxAnisotropy;
              child.material.envMapIntensity = 1.25;
              child.material.needsUpdate = true;
            }

            if (child.name && (child.name.toLowerCase().includes('clickwheel') || child.name === 'Object_6')) {
              clickwheelMesh = child;
            }

            if (child.name && (child.name.toLowerCase().includes('inner_plastic') || child.name === 'Object_14')) {
              innerPanelGroup = child.parent || child;
            }

            if (child.name && (child.name.toLowerCase().includes('transparent') || child.name === 'Object_22')) {
              // Glass panel renders on top of the recessed screen
              child.renderOrder = 2;
              if (child.material) {
                child.material.depthWrite = false;
                child.material.transparent = true;
                child.material.roughness = 0.08;
                child.material.envMapIntensity = 1.35;
              }
            }
          }
        });

        // Fallback for clickwheel mesh
        if (!clickwheelMesh) {
          ipodGroup.traverse((child) => {
            if (child.isMesh && !clickwheelMesh) {
              clickwheelMesh = child;
            }
          });
        }

        // Attach dynamic LCD screen mesh flush inside the plastic screen recess
        // Exact screen bed bounds: X: [-2.891, 2.907], Y: [2.092, 6.807], Z = -0.9678
        // Width: 5.82, Height: 4.74 centered at X = 0.008, Y = 4.450, Z = -0.969
        // Custom BufferGeometry with normal (0, 0, -1) facing camera (-Z)
        // Note: For camera positioned at -Z looking toward +Z, screen Left is +X and screen Right is -X.
        const screenGeo = new THREE.BufferGeometry();
        const halfW = 5.82 / 2;
        const halfH = 4.74 / 2;
        const vertices = new Float32Array([
           halfW,  halfH, 0, // 0: Top-Left (Screen Left: +X)
          -halfW,  halfH, 0, // 1: Top-Right (Screen Right: -X)
           halfW, -halfH, 0, // 2: Bottom-Left (Screen Left: +X)
          -halfW, -halfH, 0  // 3: Bottom-Right (Screen Right: -X)
        ]);
        const uvs = new Float32Array([
          0, 1, // 0: Top-Left
          1, 1, // 1: Top-Right
          0, 0, // 2: Bottom-Left
          1, 0  // 3: Bottom-Right
        ]);
        const normals = new Float32Array([
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1
        ]);
        const indices = [
          0, 2, 1,
          1, 2, 3
        ];
        screenGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        screenGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        screenGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        screenGeo.setIndex(indices);

        const screenMat = new THREE.MeshBasicMaterial({
          map: canvasTexture,
          toneMapped: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
          side: THREE.FrontSide
        });

        screenMesh = new THREE.Mesh(screenGeo, screenMat);
        screenMesh.renderOrder = 1;

        const targetParent = innerPanelGroup || (clickwheelMesh ? clickwheelMesh.parent : ipodGroup);
        screenMesh.position.set(0.008, 4.450, -0.969);
        screenMesh.rotation.set(0, 0, 0); // Direct un-mirrored face towards -Z
        targetParent.add(screenMesh);

        // Center the entire iPod perfectly at (0, 0, 0)
        ipodGroup.position.set(-1.78, -3.35, -0.03);
        scene.add(ipodGroup);

        renderScreen();
      },
      undefined,
      (err) => {
        console.error('Error loading iPod GLB:', err);
      }
    );

    // 8. Raycasting and Click-Wheel Button Interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    container.addEventListener('pointerdown', (e) => {
      lastMouseDownTime = Date.now();
      mouseDownPos = { x: e.clientX, y: e.clientY };
    });

    container.addEventListener('pointerup', (e) => {
      const duration = Date.now() - lastMouseDownTime;
      const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);

      // Distinguish pure click from drag (less than 7 pixels move, duration under 450ms)
      if (dist < 7 && duration < 450) {
        handlePointerClick(e);
      }
    });

    // Hover cursor feedback on clickable zones
    container.addEventListener('pointermove', (e) => {
      if (!container || !camera || !ipodGroup) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(ipodGroup.children, true);
      if (intersects.length > 0 && clickwheelMesh) {
        const localPt = clickwheelMesh.worldToLocal(intersects[0].point.clone());
        const dy = localPt.y - (-2.263);
        const r = Math.hypot(localPt.x, dy);
        if (r <= 3.9 || (localPt.y >= 2.0 && localPt.y <= 6.8 && Math.abs(localPt.x) <= 3.0)) {
          container.style.cursor = 'pointer';
          return;
        }
      }
      container.style.cursor = 'grab';
    });

    // Animate Loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Window Resize Handling
    window.addEventListener('resize', onWindowResize);
  }

  function onWindowResize() {
    if (!container || !renderer || !camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Handle Button Raycasting on Click Wheel
  function handlePointerClick(event) {
    if (!container || !camera || !ipodGroup) return;

    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(ipodGroup.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0];

      // If user clicked directly on the screen mesh
      if (hit.object === screenMesh) {
        toggleMenu();
        return;
      }

      const target = clickwheelMesh || ipodGroup;
      // Convert hit point to click wheel local coordinates
      const localPt = target.worldToLocal(hit.point.clone());

      // Click Wheel Center is at (X: 0.0, Y: -2.263)
      const wheelCenterY = -2.263;
      const dx = localPt.x;
      const dy = localPt.y - wheelCenterY;
      const r = Math.hypot(dx, dy);

      // Check if click occurred in Click Wheel zone
      if (r <= 3.95) {
        if (r < 1.3) {
          // Center Button
          handleCenterButton();
        } else {
          // Outer Click Wheel buttons: Calculate angle in degrees
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          if (angle >= 45 && angle <= 135) {
            // TOP: MENU
            if (currentMode === 'menu') {
              selectedMenuItem = (selectedMenuItem - 1 + menuItems.length) % menuItems.length;
              renderScreen();
            } else {
              toggleMenu();
            }
          } else if (angle <= -45 && angle >= -135) {
            // BOTTOM: PLAY / PAUSE
            togglePlay();
          } else if (angle > 135 || angle < -135) {
            // LEFT: PREVIOUS
            prevTrack();
          } else {
            // RIGHT: NEXT
            nextTrack();
          }
        }
      } else if (localPt.y >= 2.0 && localPt.y <= 6.8 && Math.abs(localPt.x) <= 3.0) {
        // Screen area tapped
        toggleMenu();
      }
    }
  }

  // Audio Event Listeners
  audio.addEventListener('timeupdate', () => {
    renderScreen();
  });

  audio.addEventListener('ended', () => {
    nextTrack();
  });

  audio.addEventListener('play', () => {
    isPlaying = true;
    renderScreen();
  });

  audio.addEventListener('pause', () => {
    isPlaying = false;
    renderScreen();
  });

  // Attempt autoplay immediately on landing & unlock on first user interaction
  function setupAutoplay() {
    audio.play().then(() => {
      isPlaying = true;
      renderScreen();
    }).catch(() => {
      // Browser autoplay policy requires user interaction; listen for first gesture
      const unlockAudio = () => {
        audio.play().then(() => {
          isPlaying = true;
          renderScreen();
        }).catch(() => {});
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('click', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });
    });
  }

  // DOM Loaded / Module execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initThree();
      setupAutoplay();
    });
  } else {
    initThree();
    setupAutoplay();
  }
})();
