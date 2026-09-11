import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

(function () {
  'use strict';

  let scene, camera, renderer, controls;
  let cameraGroup = null;
  let container = null;
  let reqId = null;
  let isAutoRotating = true;
  let userInteracting = false;
  let userInteractionTimeout = null;

  const DEFAULT_CAM_POS = new THREE.Vector3(0, 0.035, 0.36);
  const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

  function initCameraViewer() {
    container = document.getElementById('cameraCanvasContainer');
    if (!container) return;

    container.innerHTML = '';

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera
    camera = new THREE.PerspectiveCamera(36, width / height, 0.05, 50);
    camera.position.copy(DEFAULT_CAM_POS);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Lighting & Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Sharp RoomEnvironment fallback
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
        console.warn('Could not load studio.hdr for camera, using RoomEnvironment:', err);
      }
    );

    // Dynamic directional lights to accentuate metallic and glass details
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(-0.6, 1.2, 0.8);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x88c0ff, 1.8);
    rimLight.position.set(0.8, 0.5, -0.6);
    scene.add(rimLight);

    const bottomGlint = new THREE.DirectionalLight(0xffe5aa, 1.0);
    bottomGlint.position.set(0.2, -0.8, 0.5);
    scene.add(bottomGlint);

    const fillAmbient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(fillAmbient);

    // 5. OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.85;
    controls.zoomSpeed = 0.9;
    controls.minDistance = 0.16;
    controls.maxDistance = 0.65;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.autoRotate = isAutoRotating;
    controls.autoRotateSpeed = 1.1;
    controls.target.copy(DEFAULT_TARGET);

    // Pause auto-rotation temporarily when dragging
    controls.addEventListener('start', () => {
      userInteracting = true;
      controls.autoRotate = false;
      if (userInteractionTimeout) clearTimeout(userInteractionTimeout);
    });

    controls.addEventListener('end', () => {
      userInteractionTimeout = setTimeout(() => {
        userInteracting = false;
        if (isAutoRotating) {
          controls.autoRotate = true;
        }
      }, 3500);
    });

    // 6. UI Controls Hookup
    initControlsUI();

    // 7. Load nikon_camera.glb
    loadCameraModel();

    // 8. Animation Loop
    function animate() {
      reqId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // 9. Resize Handling
    window.addEventListener('resize', handleResize);
  }

  function loadCameraModel() {
    const loaderBox = document.getElementById('cameraLoaderBox');
    const progressBar = document.getElementById('cameraProgressBar');
    const loaderText = document.getElementById('cameraLoaderText');

    const loader = new GLTFLoader();
    loader.load(
      'assets/nikon_camera.glb',
      (gltf) => {
        cameraGroup = new THREE.Group();
        const model = gltf.scene;

        // Compute Bounding Box and center the camera model at (0, 0, 0)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Enhance materials
        const maxAnisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 8;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              child.material.envMapIntensity = 1.35;
              if (child.material.map) child.material.map.anisotropy = maxAnisotropy;
              if (child.material.metalnessMap) child.material.metalnessMap.anisotropy = maxAnisotropy;
              if (child.material.roughnessMap) child.material.roughnessMap.anisotropy = maxAnisotropy;
              child.material.needsUpdate = true;
            }
          }
        });

        cameraGroup.add(model);

        // Initial photogenic 3/4 hero angle
        cameraGroup.rotation.y = -Math.PI * 0.18;
        cameraGroup.rotation.x = Math.PI * 0.04;

        scene.add(cameraGroup);

        // Hide loader overlay
        if (progressBar) progressBar.style.width = '100%';
        if (loaderText) loaderText.textContent = 'OPTICAL CHASSIS READY';
        setTimeout(() => {
          if (loaderBox) loaderBox.classList.add('is-hidden');
        }, 400);
      },
      (xhr) => {
        if (xhr.lengthComputable && xhr.total > 0) {
          const percent = Math.min(Math.round((xhr.loaded / xhr.total) * 100), 99);
          if (progressBar) progressBar.style.width = percent + '%';
          if (loaderText) loaderText.textContent = `LOADING NIKON 35MM [${percent}%]`;
        }
      },
      (error) => {
        console.error('Error loading nikon_camera.glb:', error);
        if (loaderText) loaderText.textContent = 'OPTICAL LOAD ERROR';
      }
    );
  }

  function initControlsUI() {
    const autoRotateBtn = document.getElementById('cameraAutoRotateBtn');
    const resetBtn = document.getElementById('cameraResetBtn');

    if (autoRotateBtn) {
      autoRotateBtn.addEventListener('click', () => {
        isAutoRotating = !isAutoRotating;
        controls.autoRotate = isAutoRotating;
        autoRotateBtn.classList.toggle('is-active', isAutoRotating);
        const statusSpan = autoRotateBtn.querySelector('.rotate-status');
        if (statusSpan) {
          statusSpan.textContent = isAutoRotating ? 'ON' : 'OFF';
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        // Reset camera position smoothly
        camera.position.copy(DEFAULT_CAM_POS);
        controls.target.copy(DEFAULT_TARGET);
        if (cameraGroup) {
          cameraGroup.rotation.set(Math.PI * 0.04, -Math.PI * 0.18, 0);
        }
        controls.update();
      });
    }
  }

  function handleResize() {
    if (!container || !renderer || !camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCameraViewer);
  } else {
    initCameraViewer();
  }
})();
