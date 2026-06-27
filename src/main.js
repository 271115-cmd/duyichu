/**
 * DUYICHU - Main Application Logic
 * Landing Page Preserved + Click Animation Added
 * + Smooth LOD Crossfade Logic Added
 */

 import * as THREE from 'three';
 import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
 import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
 import gsap from 'gsap';
 import { ScrollTrigger } from 'gsap/ScrollTrigger';
 import Lenis from 'lenis';
 import { t } from './i18n.js';
 import { playBell } from './sound.js';
 import { initReelStage } from './reelstage.js';
 import { initCommon } from './bootstrap.js';

 gsap.registerPlugin(ScrollTrigger);

 // Shared chrome (SW registration · console signature · page-transition · i18n ·
 // sound · scroll-progress) — identical on every page, lives in one module.
 initCommon();
 
 // ============================================
 // CONFIGURATION
 // ============================================
 const CONFIG = {
   colors: {
     bgPrimary: '#0a0a0a',
     accent: '#c9a962', // Assuming this is your gold color
     fgPrimary: '#f5f0e8',
   },
   cursor: { magneticStrength: 0.3, magneticRadius: 100 },
 };
 
 // ============================================
 // STATE
 // ============================================
 const state = {
   mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
   scroll: { velocity: 0, progress: 0 },
   loaded: false,
   isEntered: false, 
   isHoveringRed: false,
 };
 
 // ============================================
 // DOM ELEMENTS
 // ============================================
 const elements = {
   preloader: document.getElementById('preloader'),
   preloaderBar: document.querySelector('.preloader-bar'),
   preloaderPercent: document.querySelector('.preloader-percent'),
   cursor: document.getElementById('cursor'),
   cursorText: document.getElementById('cursor-text'),
   canvas: document.getElementById('webgl-canvas'),
   landingUI: document.getElementById('landing-ui'),
 };
 
 // ============================================
 // SHADERS
 // ============================================
 const vertexShader = `
   varying vec2 vUv;
   varying vec3 vPosition;
   void main() {
     vUv = uv;
     vPosition = position;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }
 `;
 
 const fluidFragmentShader = `
   uniform float uTime;
   uniform vec2 uResolution;
   uniform float uVelocity;
   varying vec2 vUv;
   varying vec3 vPosition;
 
   vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
   vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
   vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
   vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
   float snoise(vec3 v) { 
     const vec2 C = vec2(1.0/6.0, 1.0/3.0);
     const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
     vec3 i  = floor(v + dot(v, C.yyy));
     vec3 x0 = v - i + dot(i, C.xxx);
     vec3 g = step(x0.yzx, x0.xyz);
     vec3 l = 1.0 - g;
     vec3 i1 = min(g.xyz, l.zxy);
     vec3 i2 = max(g.xyz, l.zxy);
     vec3 x1 = x0 - i1 + C.xxx;
     vec3 x2 = x0 - i2 + C.yyy;
     vec3 x3 = x0 - D.yyy;
     i = mod289(i);
     vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
     float n_ = 0.142857142857;
     vec3 ns = n_ * D.wyz - D.xzx;
     vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
     vec4 x_ = floor(j * ns.z);
     vec4 y_ = floor(j - 7.0 * x_);
     vec4 x = x_ *ns.x + ns.yyyy;
     vec4 y = y_ *ns.x + ns.yyyy;
     vec4 h = 1.0 - abs(x) - abs(y);
     vec4 b0 = vec4(x.xy, y.xy);
     vec4 b1 = vec4(x.zw, y.zw);
     vec4 s0 = floor(b0)*2.0 + 1.0;
     vec4 s1 = floor(b1)*2.0 + 1.0;
     vec4 sh = -step(h, vec4(0.0));
     vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
     vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
     vec3 p0 = vec3(a0.xy,h.x);
     vec3 p1 = vec3(a0.zw,h.y);
     vec3 p2 = vec3(a1.xy,h.z);
     vec3 p3 = vec3(a1.zw,h.w);
     vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
     p0 *= norm.x;
     p1 *= norm.y;
     p2 *= norm.z;
     p3 *= norm.w;
     vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
     m = m * m;
     return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
   }
 
   void main() {
     vec2 uv = vUv;
     float aspect = uResolution.x / uResolution.y;
     float noise1 = snoise(vec3(uv * 2.2, uTime * 0.10)) * 0.5 + 0.5;
     float fluid = noise1 * (0.5 + uVelocity * 0.08);

     // Warm rice-paper tones
     vec3 color1 = vec3(0.925, 0.890, 0.824); // #ece3d2
     vec3 color2 = vec3(0.890, 0.843, 0.753); // #e3d7c0
     vec3 finalColor = mix(color1, color2, fluid);

     float vignette = 1.0 - length((uv - 0.5) * vec2(aspect, 1.0)) * 0.18;
     finalColor *= vignette;

     float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
     finalColor += (grain - 0.5) * 0.02;

     gl_FragColor = vec4(finalColor, 1.0);
   }
 `;
 
 // ============================================
 // THREE.JS SETUP
 // ============================================
 let scene, camera, renderer;
 let model, tinyModel, heroMesh, raycaster, mouseNDC, clock;
 let fluidPlane, uniforms;
 let interactiveMeshes = [];
 let originalMaterials = [];
 let lenis;
 let lastTime = 0;
 const heroCenter = new THREE.Vector3();   // world centre of the clickable building
 let enterHint = null, winkTimer = null;   // affordance: ring/label + periodic gold "wink"

 const COLORS = { GOLD: new THREE.Color(0xC9A227), GOLD_BRIGHT: new THREE.Color(0xE8C547) };
 
 function initThree() {
   clock = new THREE.Clock();
   raycaster = new THREE.Raycaster();
   mouseNDC = new THREE.Vector2();
   
   scene = new THREE.Scene();
   scene.background = new THREE.Color(CONFIG.colors.bgPrimary);
   
   camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
   camera.position.set(0, 5, 15);
   
   renderer = new THREE.WebGLRenderer({ canvas: elements.canvas, antialias: true, alpha: false });
   renderer.setSize(window.innerWidth, window.innerHeight);
   renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
   renderer.toneMapping = THREE.ACESFilmicToneMapping;
   // The home runs several GPU layers (this model + the cinematic props + Amap),
   // so guard against context loss: preventDefault lets the browser RESTORE the
   // context instead of permanently blanking the canvas, and we pause rendering
   // meanwhile so the lost context doesn't throw every frame.
   elements.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); state.contextLost = true; console.warn('[duyichu] WebGL context lost — pausing the 3D layer'); }, false);
   elements.canvas.addEventListener('webglcontextrestored', () => { state.contextLost = false; console.info('[duyichu] WebGL context restored'); }, false);
   
   scene.add(new THREE.AmbientLight(0xffffff, 0.5));
   const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
   mainLight.position.set(5, 10, 7);
   scene.add(mainLight);
   const fillLight = new THREE.DirectionalLight(0xC9A227, 0.6);
   fillLight.position.set(-5, 5, 3);
   scene.add(fillLight);
   
   uniforms = {
     uTime: { value: 0 },
     uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
     uMouse: { value: new THREE.Vector2(0.5, 0.5) },
     uVelocity: { value: 0 },
   };
   const fluidMat = new THREE.ShaderMaterial({ vertexShader, fragmentShader: fluidFragmentShader, uniforms });
   fluidPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fluidMat);
 
   loadModel();
   initGlobalCursorLogic();
 }
 
 // Extracted logic to find the reddest material and set up hover arrays
 function processModelData(targetModel, isHighRes) {
   let maxRedScore = 0.1;
   let currentHeroMesh = null;
   let newInteractiveMeshes = [];
   let newOriginalMaterials = [];
 
   targetModel.traverse((child) => {
     if (child.isMesh && child.material) {
       const mats = Array.isArray(child.material) ? child.material : [child.material];
       let meshScore = 0;
       mats.forEach(mat => {
         if (mat.color) meshScore = Math.max(meshScore, (mat.color.r - mat.color.g) + (mat.color.r - mat.color.b));
       });
       
       if (meshScore > maxRedScore) {
         maxRedScore = meshScore;
         currentHeroMesh = child;
       }
       
       if (meshScore > 0.1) {
         newInteractiveMeshes.push(child);
         child.material = child.material.clone();
         child.material.emissive = new THREE.Color(0x000000);
         child.material.emissiveIntensity = 1;
         newOriginalMaterials.push({ mesh: child, color: child.material.color.clone() });
       }
     }
   });
 
   // Bind hover/raycast state to the TINY model immediately. For the high-res
   // model we DON'T rebind here — it fades in over ~1.5s while the tiny model is
   // still the visible one, so hover and the gold "wink" must keep targeting the
   // tiny meshes until the crossfade finishes (loadHighResModel rebinds the
   // globals in its onComplete, once the high-res model is the visible one).
   if (!isHighRes) {
     interactiveMeshes = newInteractiveMeshes;
     originalMaterials = newOriginalMaterials;
   }

   // We only want to set the camera mathematically on the FIRST load (the tiny model)
   // so it doesn't jitter when the high-res one crossfades in
   if (!isHighRes && currentHeroMesh) {
     heroMesh = currentHeroMesh;
     const box = new THREE.Box3().setFromObject(heroMesh);
     const size = box.getSize(new THREE.Vector3());
     const center = box.getCenter(new THREE.Vector3());
     heroCenter.copy(center);          // anchor the "click to enter" hint here

     const fov = THREE.MathUtils.degToRad(camera.fov);
     let distance = size.y / (2 * Math.tan(fov / 2));
     distance *= 150.0; 
     
     const rotationAngle = -65 * (Math.PI / 180);
     const offset = new THREE.Vector3(0, 0, distance);
     offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationAngle);
     offset.y += size.y * 0.2;
     
     camera.position.copy(center).add(offset);
     camera.lookAt(center);
   }

   // Hand the freshly-built arrays back so the high-res crossfade can rebind
   // the globals to them only once it becomes the visible model.
   return { meshes: newInteractiveMeshes, mats: newOriginalMaterials };
 }

 function loadModel() {
   const loader = new GLTFLoader();
   const draco = new DRACOLoader();
   // Local Draco decoder (served from our own origin → works in China; no unpkg fetch)
   draco.setDecoderPath('/draco/');
   loader.setDRACOLoader(draco);
   
   // 1. Load the Potato First
   const tinyModelURL = '/model-tiny.glb';
   
   loader.load(tinyModelURL, (gltf) => {
     model = gltf.scene;
     tinyModel = gltf.scene; // Keep a reference so we can delete it later
     
     processModelData(model, false);
     
     scene.add(model);
     finishLoading();
 
     // 2. Secretly trigger the heavy 11.5MB file to load in the background
     loadHighResModel(loader);
 
   }, (xhr) => {
     // ProgressEvent.total is 0 when the response has no Content-Length
     // (gzip / chunked transfer) — guard so the label never reads "NaN%".
     if (!xhr.lengthComputable || !xhr.total) return;
     const progress = 10 + (xhr.loaded / xhr.total) * 60;
     elements.preloaderBar.style.width = `${Math.min(progress, 100)}%`;
     elements.preloaderPercent.textContent = `${Math.round(progress)}%`;
   }, (err) => {
     // The 3D intro is the single hard dependency of the home landing. If the
     // model can't load (404, Draco decode failure, a flaky mainland
     // connection), don't trap the visitor behind the preloader forever —
     // skip straight to the editorial content, sans 3D.
     console.warn('[duyichu] model-tiny.glb failed to load — entering without the 3D intro', err);
     state.isEntered = true;
     state.loaded = true;
     elements.landingUI?.classList.remove('active');
     elements.landingUI?.classList.add('hidden');
     elements.canvas?.classList.add('inactive');
     if (elements.preloader) elements.preloader.classList.add('loaded');
     showEditorial();
   });
 }
 
 function loadHighResModel(loader) {
   // The high-res model is an ~11 MB upgrade fetched in the background. On a
   // constrained connection (Save-Data, or a 2G/3G effective type) skip it and
   // keep the 6.4 MB tiny model as the final — the building still renders, just
   // lower-poly — rather than burning the visitor's data on a silent upgrade.
   const conn = navigator.connection || navigator.webkitConnection;
   if (conn && (conn.saveData || ['slow-2g', '2g', '3g'].includes(conn.effectiveType))) {
     console.info('[duyichu] constrained connection — keeping the lightweight 3D model');
     return;
   }
   const highResURL = '/duyichu-v2.glb';

   loader.load(highResURL, (gltf) => {
       // Abort if user clicked "Enter" while it was downloading
       if (state.isEntered) return; 
 
       const highResModel = gltf.scene;
 
       // Setup the materials but DONT move the camera (and DON'T rebind hover
       // yet — keep that captured until the crossfade completes below).
       const highResInteractive = processModelData(highResModel, true);
       
       const highResMaterials = [];
       highResModel.traverse((child) => {
           if (child.isMesh && child.material) {
               const mats = Array.isArray(child.material) ? child.material : [child.material];
               mats.forEach(mat => {
                   mat.transparent = true; 
                   mat.opacity = 0;        // Start invisible!
                   highResMaterials.push(mat);
               });
           }
       });
 
       scene.add(highResModel);
 
       // GSAP Crossfade!
       gsap.to(highResMaterials, {
           opacity: 1,
           duration: 1.5,
           ease: "power2.inOut",
           onComplete: () => {
               // Turn off transparency after fade for better performance
               highResMaterials.forEach(mat => { mat.transparent = false; });
               
               // Safely delete the tiny potato model
               if (tinyModel) {
                   scene.remove(tinyModel);
                   tinyModel.traverse((child) => {
                       if (child.isMesh) {
                           if (child.geometry) child.geometry.dispose();
                           if (child.material) {
                               const mats = Array.isArray(child.material) ? child.material : [child.material];
                               mats.forEach(mat => {
                                   if(mat.map) mat.map.dispose();
                                   mat.dispose();
                               });
                           }
                       }
                   });
                   tinyModel = null;
               }
               
               model = highResModel;

               // The high-res model is now THE visible model — rebind hover /
               // raycast / wink to its meshes (deferred from processModelData).
               interactiveMeshes = highResInteractive.meshes;
               originalMaterials = highResInteractive.mats;

               // Re-apply hover colors if the user was hovering during the swap
               if (state.isHoveringRed) {
                   animateMaterials(true);
               }
           }
       });
   }, undefined, (err) => {
       // The high-res model is a silent background upgrade — if it fails, the
       // lightweight model simply stays in place. No preloader / UI impact.
       console.warn('[duyichu] duyichu-v2.glb (high-res) failed to load — keeping the lightweight model', err);
   });
 }
 
 function finishLoading() {
   elements.preloaderBar.style.width = '100%';
   elements.preloaderPercent.textContent = 'Ready';
   setTimeout(() => {
     elements.preloader.classList.add('loaded');
     state.loaded = true;
     elements.landingUI.classList.add('active');
     ensureEnterHint();
     startWink();
   }, 500);
 }

 // ============================================
 // "CLICK THE RED HOUSE" AFFORDANCE
 // People of all ages struggled to realise the building is the way in.
 // Two cues: (1) a ring + arrow + label pinned over the building, and
 // (2) a periodic gold "wink" of the building itself, until they hover.
 // ============================================
 function ensureEnterHint() {
   if (enterHint) return;
   enterHint = document.createElement('div');
   enterHint.id = 'enter-hint';
   enterHint.setAttribute('aria-hidden', 'true');
   enterHint.innerHTML =
     '<span class="eh-label"><span class="eh-text"></span><span class="eh-arrow">▾</span></span>' +
     '<span class="eh-ring"></span><span class="eh-ring eh-ring2"></span>';
   document.body.appendChild(enterHint);
   setHintText();
 }
 function setHintText() { if (enterHint) enterHint.querySelector('.eh-text').textContent = t('ld.enter'); }
 document.addEventListener('langchange', setHintText);

 function startWink() {
   if (winkTimer) return;
   winkTimer = setInterval(() => {
     if (state.isEntered || state.isHoveringRed || !state.loaded) return;
     animateMaterials(true);                                   // building glows gold…
     setTimeout(() => { if (!state.isHoveringRed && !state.isEntered) animateMaterials(false); }, 750);
   }, 3600);
 }
 // tidy teardown on navigation away (defensive — full page loads drop it anyway)
 window.addEventListener('pagehide', () => { if (winkTimer) { clearInterval(winkTimer); winkTimer = null; } }, { once: true });

 function updateEnterHint() {
   if (!enterHint) return;
   if (state.isEntered || !state.loaded || !heroMesh) { enterHint.classList.remove('show'); return; }
   const v = heroCenter.clone().project(camera);
   if (v.z > 1) { enterHint.classList.remove('show'); return; }   // behind the camera
   enterHint.style.left = `${(v.x * 0.5 + 0.5) * window.innerWidth}px`;
   enterHint.style.top = `${(-v.y * 0.5 + 0.5) * window.innerHeight}px`;
   enterHint.classList.add('show');
   enterHint.classList.toggle('hot', state.isHoveringRed);       // brighten when the cursor is on it
 }
 
 // ============================================
 // INTERACTION & CURSOR
 // ============================================
 function initGlobalCursorLogic() {
   window.addEventListener('mousemove', onMouseMove);
   window.addEventListener('click', onClick);
   // keyboard path into the experience — Enter/Space enters without a mouse
   // (the building hover is mouse-only; this unblocks keyboard & switch users)
   window.addEventListener('keydown', (e) => {
     if (state.isEntered) return;
     if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
       const tag = (e.target && e.target.tagName) || '';
       if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return; // let real controls work
       e.preventDefault();
       triggerTransition();
     }
   });
 }
 
 function onMouseMove(e) {
   state.mouse.targetX = e.clientX;
   state.mouse.targetY = e.clientY;

   // Position the cursor directly too, so it tracks even if the rAF render loop
   // isn't driving it (e.g. on the editorial view with no 3D scene running).
   if (elements.cursor) { elements.cursor.style.left = `${e.clientX}px`; elements.cursor.style.top = `${e.clientY}px`; }
   if (elements.cursorText) { elements.cursorText.style.left = `${e.clientX}px`; elements.cursorText.style.top = `${e.clientY}px`; }

   if (!state.isEntered) {
     mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
     mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
     
     raycaster.setFromCamera(mouseNDC, camera);
     const intersects = raycaster.intersectObjects(interactiveMeshes);
     
     if (intersects.length > 0) {
       if (!state.isHoveringRed) {
         state.isHoveringRed = true;
         elements.cursor.classList.add('hovering');
         elements.cursorText.classList.add('visible');
         elements.cursorText.textContent = 'Enter';
         animateMaterials(true);
       }
     } else {
       if (state.isHoveringRed) {
         state.isHoveringRed = false;
         elements.cursor.classList.remove('hovering');
         elements.cursorText.classList.remove('visible');
         animateMaterials(false);
       }
     }
   } 
 }
 
 function animateMaterials(toGold) {
   originalMaterials.forEach(data => {
     const mat = data.mesh.material;
     const targetColor = toGold ? COLORS.GOLD : data.color;
     const targetEmissive = toGold ? COLORS.GOLD_BRIGHT : new THREE.Color(0x000000);
     gsap.to(mat.color, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 0.4 });
     gsap.to(mat.emissive, { r: targetEmissive.r, g: targetEmissive.g, b: targetEmissive.b, duration: 0.4 });
     gsap.to(mat, { emissiveIntensity: toGold ? 0.8 : 0, duration: 0.4 });
   });
 }
 
 function onClick(e) {
   // 1. Play global custom cursor click animation
   gsap.timeline()
     .to(elements.cursor, { 
       backgroundColor: '#ffffff', // Flashes white
       scale: 0.7,                 // Shrinks slightly
       duration: 0.1, 
       ease: 'power2.out' 
     })
     .to(elements.cursor, { 
       backgroundColor: CONFIG.colors.accent, // Returns to gold/accent
       scale: 1, 
       duration: 0.3, 
       ease: 'power2.out',
       clearProps: 'backgroundColor' // Clears inline style to respect CSS classes again
     });
 
   // 2. Handle landing page transition
   if (!state.isEntered && state.isHoveringRed) {
     triggerTransition();
   }
 }
 
 function triggerTransition() {
   state.isEntered = true;
   playBell();                         // a bell answers the entry (only if sound is on)
   if (winkTimer) { clearInterval(winkTimer); winkTimer = null; }
   if (enterHint) enterHint.classList.remove('show');
   elements.landingUI.classList.remove('active');
   elements.landingUI.classList.add('hidden');

   elements.cursor.classList.remove('hovering');
   elements.cursorText.classList.remove('visible');
   
   const targetPos = new THREE.Vector3(0, 2, 5);
   gsap.to(camera.position, {
     x: targetPos.x, y: targetPos.y, z: targetPos.z,
     duration: 2, ease: "power3.inOut",
     onUpdate: () => camera.lookAt(0, 0, 0),
     onComplete: showEditorial
   });
   animateMaterials(false);
 }
 
 // ============================================
 // SCENE TRANSITION
 // ============================================
 function showEditorial() {
   // The 3D model intro plays only once per session; mark it seen.
   try { sessionStorage.setItem('duyichu_entered', '1'); } catch (e) {}

   if (scene) {
     disposeModel();
     scene.background = null;
     scene.add(fluidPlane);
     camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
     camera.position.z = 1;
   }

   elements.canvas.classList.add('inactive');
   document.getElementById('reserve-cta')?.classList.add('show');   // booking now reachable

   // scroll affordance on the hero — revealed after entry, fades once the visitor moves
   const scrollCue = document.querySelector('.scroll-cue');
   if (scrollCue) {
     setTimeout(() => scrollCue.classList.add('show'), 900);
     window.addEventListener('scroll', () => scrollCue.classList.toggle('gone', window.scrollY > 40), { passive: true });
   }

   const currentContainer = document.querySelector('[data-barba="container"]');
   if(currentContainer) {
     currentContainer.classList.add('visible');
     // Clear the slide-up transform once it finishes — a lingering transform
     // would break position:sticky chapter stacking.
     setTimeout(() => currentContainer.classList.add('settled'), 1500);
     initLenis();
     // Home narrative — ONE pinned, scroll-scrubbed stage whose depth layers
     // zoom/slide past each other on overlapping ranges (continuous, not a
     // slideshow). Rebuilt from reference scroll-experience sites.
     initReelStage({ lenis });
     initCursorTheme();
     initDepth(currentContainer);
     playHeroIntro(currentContainer);
     initAnimations(currentContainer);
     rebindUI(currentContainer);
     // Navigation is intentionally full page loads (no SPA router) — so each
     // page replays its own hero prop + intro, and crawlers/China get plain
     // server-served HTML. The data-barba-* attributes are retained only as
     // page/namespace/container hooks (Barba itself has been removed).

     // Cinematic 3D scroll layer (lazy-loaded). Falls back silently to the
     // solid-colour chapters if WebGL is unavailable.
     import('./cinematic.js')
       .then(({ initCinematic }) => initCinematic({ root: currentContainer, lenis, hero: 'steamer' }))
       .catch((e) => console.warn('[duyichu] cinematic layer unavailable — falling back to flat chapters', e));

     // Full-screen map immersion (Chapter 04) — pinned; the framed map
     // expands to full bleed, then scroll tours the three houses.
     initMapImmersion(currentContainer);

     // Positions settle only after fonts load + the slide-up transition finishes.
     document.fonts.ready.then(() => ScrollTrigger.refresh());
     setTimeout(() => ScrollTrigger.refresh(), 1600);
   }
 }

 // ============================================
 // MAP IMMERSION — Chapter 04 (home)
 // The chapter pins for ~2.5 screens: the framed map card expands to
 // full bleed, then scroll walks the camera through the three branches.
 // ============================================
 function initMapImmersion(scope) {
   const chapterEl = scope.querySelector('.map-chapter');
   const mapEl = chapterEl?.querySelector('#locations-map');
   if (!chapterEl || !mapEl) return;

   // The same interactive China-legal Amap as the Visit page (with the keyless
   // drawn-map fallback when no key is set). Because it's a real pan/zoom map,
   // the old pinned scroll-tour (clip-path expansion + setProgress camera walk)
   // no longer applies — the houses are toured by clicking the cards (each one
   // flies to + centres that branch), and the map sits full-bleed in its 100vh
   // chapter, exactly like the Visit page.
   import('./amap.js')
     .then(({ initVisitMap }) => {
       const ctl = initVisitMap({ container: mapEl });
       chapterEl.querySelectorAll('.loc-card').forEach((card) => {
         card.addEventListener('click', () => ctl.focus(parseInt(card.dataset.loc, 10)));
       });
       ctl.overview();
       requestAnimationFrame(() => ctl.resize());
       window.addEventListener('pagehide', () => { try { ctl.dispose(); } catch (e) {} }, { once: true });
     })
     .catch(() => { /* map unavailable — the HUD copy still stands */ });
 }

 // Giant 都一处 hero — staggered mask reveal
 function playHeroIntro(container) {
   const chars = container.querySelectorAll('.hero-title .hero-char');
   if (chars.length) {
     gsap.to(chars, { y: '0%', duration: 1.4, ease: 'expo.out', stagger: 0.09, delay: 0.3 });
   }
 }

 // Spatial depth — planes separate in Z under the mouse AND drift on scroll,
 // so sections read as stacked, parallaxing layers as you travel down the page.
 // One transform writer per element (mouse + scroll combined) so nothing fights.
 function initDepth(scope) {
   if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
   if (window.matchMedia('(max-width: 768px)').matches) return;
   // d = mouse depth (px / unit mouse) · sd = scroll parallax gain (px / px scrolled)
   const groups = [
     { sel: '.arch-grid', d: -34, sd: 0.06 },
     { sel: '.story-seal, .huge-number', d: -52, sd: 0.11 },   // far decorative accents drift most
     { sel: '.float3d', d: 60, sd: 0.10 },
     { sel: '.hero-title', d: 26, sd: 0.05 },
     { sel: '.block-title, .block-display, .contact-brand', d: 18, sd: 0.035 }, // headlines — gentle, stay legible
     { sel: '.hero-eyebrow, .hero-sub, .block-label, .chapter-index, .chapter-tag', d: 10, sd: 0.02 },
     { sel: '.marquee', d: 30, sd: 0.07 },
   ];
   const items = [];
   groups.forEach(g => scope.querySelectorAll(g.sel).forEach(el => items.push({ el, d: g.d, sd: g.sd })));
   const tilt = scope.querySelector('.cube-tilt');
   // capture each element's natural document Y so scroll parallax is measured
   // from where it sits, not from wherever a transform last left it
   const docY = (el) => { let y = 0, n = el; while (n) { y += n.offsetTop; n = n.offsetParent; } return y; };
   const measure = () => items.forEach((it) => { it.base = docY(it.el); });
   measure();
   document.fonts?.ready.then(measure);
   window.addEventListener('resize', () => measure());
   window.addEventListener('load', measure);
   let tx = 0, ty = 0, x = 0, y = 0;
   window.addEventListener('mousemove', (e) => {
     tx = (e.clientX / window.innerWidth - 0.5) * 2;
     ty = (e.clientY / window.innerHeight - 0.5) * 2;
   });
   let rafId = 0;
   const loop = () => {
     x += (tx - x) * 0.07; y += (ty - y) * 0.07;
     const vh = window.innerHeight;
     const sc = window.scrollY + vh * 0.5;                    // viewport centre, in doc space
     for (const it of items) {
       // bounded so far-off sections never accumulate a giant offset
       const delta = Math.max(-vh, Math.min(vh, sc - (it.base || 0)));
       const sp = delta * it.sd;
       it.el.style.transform = `translate3d(${(x * it.d).toFixed(2)}px, ${(y * it.d + sp).toFixed(2)}px, 0)`;
     }
     if (tilt) tilt.style.transform = `rotateY(${(x * 14).toFixed(2)}deg) rotateX(${(-y * 14).toFixed(2)}deg)`;
     rafId = requestAnimationFrame(loop);
   };
   // run only while the tab is visible; stop cleanly on navigation away
   const start = () => { if (!rafId) rafId = requestAnimationFrame(loop); };
   const stop = () => { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } };
   start();
   document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
   window.addEventListener('pagehide', stop, { once: true });
 }

 // Custom cursor recolours to match the chapter at viewport centre
 function initCursorTheme() {
   const chapters = [...document.querySelectorAll('[data-cursor]')];
   if (!chapters.length) return;
   const root = document.documentElement;
   let current = '';
   const update = () => {
     const mid = window.innerHeight / 2;
     for (const ch of chapters) {
       const r = ch.getBoundingClientRect();
       if (r.top <= mid && r.bottom >= mid) {
         const c = ch.getAttribute('data-cursor');
         if (c && c !== current) { current = c; root.style.setProperty('--cursor-color', c); }
         break;
       }
     }
   };
   // Coalesce to one layout-reading pass per frame — Lenis emits scroll events
   // at frame rate, and update() reads getBoundingClientRect() per chapter.
   let ticking = false;
   const onScroll = () => {
     if (ticking) return;
     ticking = true;
     requestAnimationFrame(() => { update(); ticking = false; });
   };
   window.addEventListener('scroll', onScroll, { passive: true });
   update();
 }

 function disposeModel() {
   // Helper to destroy materials safely
   const cleanup = (m) => {
     if (!m) return;
     m.traverse((child) => {
       if (child.isMesh) {
         if (child.geometry) child.geometry.dispose();
         if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(mat => {
              if(mat.map) mat.map.dispose();
              mat.dispose();
            });
         }
       }
     });
     scene.remove(m);
   };
 
   // Safely cleanup whichever models are active (in case they clicked during crossfade)
   cleanup(model);
   if (tinyModel && tinyModel !== model) {
     cleanup(tinyModel);
   }
 
   model = null;
   tinyModel = null;
   interactiveMeshes = [];
   originalMaterials = [];
 }
 
 // (Barba.js SPA router removed — navigation is intentional full page loads.)

 // ============================================
 // UI BINDING
 // ============================================
 function rebindUI(container) {
   const magneticElements = container.querySelectorAll('[data-magnetic]');
   
   magneticElements.forEach((el) => {
     const newEl = el.cloneNode(true);
     el.parentNode.replaceChild(newEl, el);
     
     newEl.addEventListener('mouseenter', () => {
       if (!state.isEntered) return;
       elements.cursor.classList.add('hovering');
       elements.cursorText.classList.add('visible');
       if (newEl.classList.contains('product-card')) elements.cursorText.textContent = 'View';
       else if (newEl.classList.contains('nav-link')) elements.cursorText.textContent = 'Go';
       else elements.cursorText.textContent = 'Explore';
     });
     
     newEl.addEventListener('mouseleave', () => {
       if (!state.isEntered) return;
       elements.cursor.classList.remove('hovering');
       elements.cursorText.classList.remove('visible');
       gsap.to(newEl, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
     });
 
     newEl.addEventListener('mousemove', (e) => {
       if (!state.isEntered) return;
       const rect = newEl.getBoundingClientRect();
       const centerX = rect.left + rect.width / 2;
       const centerY = rect.top + rect.height / 2;
       const distX = e.clientX - centerX;
       const distY = e.clientY - centerY;
       const distance = Math.sqrt(distX * distX + distY * distY);
       
       if (distance < CONFIG.cursor.magneticRadius) {
         const strength = CONFIG.cursor.magneticStrength * (1 - distance / CONFIG.cursor.magneticRadius);
         gsap.to(newEl, { x: distX * strength, y: distY * strength, duration: 0.3, ease: 'power2.out' });
       }
     });
   });
 }
 
 // ============================================
 // ANIMATIONS & SCROLL
 // ============================================
 function initLenis() {
   if(lenis) lenis.destroy();
   lenis = new Lenis({ duration: 1.2, smooth: true });
   lenis.on('scroll', ScrollTrigger.update);
   gsap.ticker.add((time) => { lenis.raf(time * 1000); });
   gsap.ticker.lagSmoothing(0);

   // Scroll-velocity skew — marquees/ticker lean elastically with momentum
   const skewSetters = gsap.utils.toArray('.marquee-track, .ticker-track')
     .map((el) => gsap.quickTo(el, 'skewX', { duration: 0.5, ease: 'power3' }));
   lenis.on('scroll', () => {
     const sk = gsap.utils.clamp(-10, 10, lenis.velocity * 0.5);
     skewSetters.forEach((s) => s(sk));
   });
 }
 
 function initAnimations(container) {
   if(!container) return;
   const aboutLabels = container.querySelectorAll('.about-label');
   if (aboutLabels.length) gsap.from(aboutLabels, { scrollTrigger: { trigger: container.querySelector('.about'), start: 'top 80%', toggleActions: 'play none none reverse' }, opacity: 0, y: 30, duration: 0.8 });
   const aboutTitles = container.querySelectorAll('.about-title');
   if (aboutTitles.length) gsap.from(aboutTitles, { scrollTrigger: { trigger: container.querySelector('.about'), start: 'top 80%', toggleActions: 'play none none reverse' }, opacity: 0, y: 50, duration: 1, delay: 0.1 });
   const aboutTexts = container.querySelectorAll('.about-text p');
   if (aboutTexts.length) gsap.from(aboutTexts, { scrollTrigger: { trigger: container.querySelector('.about'), start: 'top 80%', toggleActions: 'play none none reverse' }, opacity: 0, y: 30, duration: 0.8, stagger: 0.15, delay: 0.2 });
   const aboutImages = container.querySelectorAll('.about-image');
   if (aboutImages.length) gsap.from(aboutImages, { scrollTrigger: { trigger: container.querySelector('.about'), start: 'top 80%', toggleActions: 'play none none reverse' }, opacity: 0, scale: 0.9, duration: 1.2, delay: 0.3 });
   
   const horizontalWrapper = container.querySelector('.horizontal-wrapper');
   const horizontalPanels = container.querySelectorAll('.horizontal-panel');
   if (horizontalWrapper && horizontalPanels.length > 1) {
     const totalWidth = horizontalPanels.length - 1;
     gsap.to(horizontalWrapper, { x: () => -totalWidth * window.innerWidth, ease: 'none', scrollTrigger: { trigger: container.querySelector('.horizontal-section'), start: 'top top', end: () => `+=${totalWidth * window.innerWidth}`, scrub: 1, pin: true, anticipatePin: 1 } });
     gsap.from(container.querySelectorAll('.panel-item'), { scrollTrigger: { trigger: container.querySelector('.horizontal-section'), start: 'top 80%' }, opacity: 0, y: 60, duration: 0.8, stagger: 0.15 });
   }
   
   const productsHeaders = container.querySelectorAll('.products-header');
   if (productsHeaders.length) gsap.from(productsHeaders, { scrollTrigger: { trigger: container.querySelector('.products'), start: 'top 80%' }, opacity: 0, y: 50, duration: 1 });
   const productCards = container.querySelectorAll('.product-card');
   if (productCards.length) gsap.from(productCards, { scrollTrigger: { trigger: container.querySelector('.products-grid'), start: 'top 80%' }, opacity: 0, y: 80, duration: 0.8, stagger: 0.1 });
   
   animateTextReveal(container);
 }
 
 function animateTextReveal(container) {
      if(!container) return;
      // Hero characters are handled separately by playHeroIntro
      const reveals = container.querySelectorAll('.reveal-text:not(.hero-char)');
      reveals.forEach((text) => {
          gsap.fromTo(text, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: text.parentElement, start: "top 92%", once: true } });
      });
 }
 
 // ============================================
 // RENDER LOOP
 // ============================================
 function render(time) {
   requestAnimationFrame(render);
   
   lastTime = time;
   
   state.mouse.x += (state.mouse.targetX - state.mouse.x) * 0.15;
   state.mouse.y += (state.mouse.targetY - state.mouse.y) * 0.15;
   
   elements.cursor.style.left = `${state.mouse.x}px`;
   elements.cursor.style.top = `${state.mouse.y}px`;
   elements.cursorText.style.left = `${state.mouse.x}px`;
   elements.cursorText.style.top = `${state.mouse.y}px`;
   
   if (uniforms) {
     uniforms.uTime.value = clock.getElapsedTime();
     uniforms.uMouse.value.set(state.mouse.x / window.innerWidth, 1 - state.mouse.y / window.innerHeight);
     uniforms.uVelocity.value = lenis ? lenis.velocity : 0;
   }
   
   if (!state.isEntered) updateEnterHint();

   // Draw the WebGL scene only while it is actually visible: during the 3D
   // intro and the no-cinematic fallback. Once cinematic.js takes over the
   // background (html.cinematic → #webgl-canvas{display:none}) the main canvas
   // is hidden, and on a backgrounded tab nothing is seen — so skip the draw
   // (the loop keeps running to drive the custom cursor either way).
   if (renderer && scene && camera && !document.hidden && !state.contextLost &&
       !document.documentElement.classList.contains('cinematic')) {
     renderer.render(scene, camera);
   }
 }

 // ============================================
 // INIT & EVENT LISTENERS
 // ============================================
 window.addEventListener('resize', () => {
   const w = window.innerWidth;
   const h = window.innerHeight;
   if(camera) { if(camera.isPerspectiveCamera) { camera.aspect = w / h; camera.updateProjectionMatrix(); } }
   if(renderer) renderer.setSize(w, h);
   if(uniforms) uniforms.uResolution.value.set(w, h);
 });
 
 document.addEventListener('visibilitychange', () => {
   if (!document.hidden && ScrollTrigger) {
     ScrollTrigger.refresh();
   }
 });
 
 let alreadyEntered = false;
 try { alreadyEntered = !!sessionStorage.getItem('duyichu_entered'); } catch (e) {}

 if (alreadyEntered) {
   // Returning visitor (e.g. clicked "Home") — skip the 3D model intro,
   // go straight to the editorial / cinematic scene.
   state.isEntered = true;
   if (elements.preloader) elements.preloader.style.display = 'none';
   elements.landingUI?.classList.remove('active');
   elements.landingUI?.classList.add('hidden');
   elements.canvas?.classList.add('inactive');
   // Editorial appears in place (no slide-up) — the page-transition cover handles
   // the entrance, so the screen animation never plays twice on the home page.
   const mc = document.getElementById('main-content');
   if (mc) { mc.style.transition = 'none'; mc.style.transform = 'none'; }
   initGlobalCursorLogic();          // keep the custom cursor + clicks working
   requestAnimationFrame(render);    // drives the cursor position (3D render stays guarded off)
   showEditorial();
 } else {
   initThree();
   requestAnimationFrame(render);
 }