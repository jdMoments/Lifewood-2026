import { useRef, useEffect, useState } from 'react';
import {
  Clock,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  SRGBColorSpace,
  MathUtils,
  Vector2,
  Vector3,
  MeshPhysicalMaterial,
  ShaderChunk,
  Color,
  Object3D,
  InstancedMesh,
  PMREMGenerator,
  SphereGeometry,
  AmbientLight,
  PointLight,
  ACESFilmicToneMapping,
  Raycaster,
  Plane
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

class ThreeScene {
  #e: any;
  canvas!: HTMLCanvasElement;
  camera!: any;
  cameraMinAspect?: number;
  cameraMaxAspect?: number;
  cameraFov!: number;
  maxPixelRatio?: number;
  minPixelRatio?: number;
  scene!: Scene;
  renderer!: WebGLRenderer;
  #t: any;
  size = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 };
  render = this.#i;
  onBeforeRender = (h: any) => {};
  onAfterRender = (h: any) => {};
  onAfterResize = (s: any) => {};
  #s = false;
  #n = false;
  isDisposed = false;
  #o: any;
  #r: any;
  #a: any;
  #c = new Clock();
  #h = { elapsed: 0, delta: 0 };
  #l: any;
  constructor(params: any) {
    this.#e = { ...params };
    this.#m();
    this.#d();
    this.#p();
    this.resize();
    this.#g();
  }
  #m() {
    this.camera = new PerspectiveCamera();
    this.cameraFov = this.camera.fov;
  }
  #d() {
    this.scene = new Scene();
  }
  #p() {
    if (this.#e.canvas) {
      this.canvas = this.#e.canvas;
    } else if (this.#e.id) {
      this.canvas = document.getElementById(this.#e.id) as HTMLCanvasElement;
    } else {
      console.error('Three: Missing canvas or id parameter');
    }
    this.canvas.style.display = 'block';
    const options = {
      canvas: this.canvas,
      powerPreference: 'high-performance',
      ...(this.#e.rendererOptions ?? {})
    };
    this.renderer = new WebGLRenderer(options as any);
    this.renderer.outputColorSpace = SRGBColorSpace;
  }
  #g() {
    if (!(this.#e.size instanceof Object)) {
      window.addEventListener('resize', this.#f.bind(this));
      if (this.#e.size === 'parent' && this.canvas.parentNode) {
        this.#r = new ResizeObserver(this.#f.bind(this));
        this.#r.observe(this.canvas.parentNode as Element);
      }
    }
    this.#o = new IntersectionObserver(this.#u.bind(this), {
      root: null,
      rootMargin: '0px',
      threshold: 0
    });
    this.#o.observe(this.canvas);
    document.addEventListener('visibilitychange', this.#v.bind(this));
  }
  #y() {
    window.removeEventListener('resize', this.#f.bind(this));
    this.#r?.disconnect();
    this.#o?.disconnect();
    document.removeEventListener('visibilitychange', this.#v.bind(this));
  }
  #u(entries: any) {
    this.#s = entries[0].isIntersecting;
    this.#s ? this.#w() : this.#z();
  }
  #v() {
    if (this.#s) {
      document.hidden ? this.#z() : this.#w();
    }
  }
  #f() {
    if (this.#a) clearTimeout(this.#a);
    this.#a = setTimeout(this.resize.bind(this), 100);
  }
  resize() {
    let w, h;
    if (this.#e.size instanceof Object) {
      w = this.#e.size.width;
      h = this.#e.size.height;
    } else if (this.#e.size === 'parent' && this.canvas.parentNode) {
      w = (this.canvas.parentNode as HTMLElement).offsetWidth;
      h = (this.canvas.parentNode as HTMLElement).offsetHeight;
    } else {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    this.size.width = w;
    this.size.height = h;
    this.size.ratio = w / h;
    this.#x();
    this.#b();
    this.onAfterResize(this.size);
  }
  #x() {
    this.camera.aspect = this.size.width / this.size.height;
    if (this.camera.isPerspectiveCamera && this.cameraFov) {
      if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) {
        this.#A(this.cameraMinAspect);
      } else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) {
        this.#A(this.cameraMaxAspect);
      } else {
        this.camera.fov = this.cameraFov;
      }
    }
    this.camera.updateProjectionMatrix();
    this.updateWorldSize();
  }
  #A(aspect: number) {
    const t = Math.tan(MathUtils.degToRad(this.cameraFov / 2)) / (this.camera.aspect / aspect);
    this.camera.fov = 2 * MathUtils.radToDeg(Math.atan(t));
  }
  updateWorldSize() {
    if (this.camera.isPerspectiveCamera) {
      const fov = (this.camera.fov * Math.PI) / 180;
      this.size.wHeight = 2 * Math.tan(fov / 2) * this.camera.position.length();
      this.size.wWidth = this.size.wHeight * this.camera.aspect;
    } else if (this.camera.isOrthographicCamera) {
      this.size.wHeight = this.camera.top - this.camera.bottom;
      this.size.wWidth = this.camera.right - this.camera.left;
    }
  }
  #b() {
    this.renderer.setSize(this.size.width, this.size.height);
    this.#t?.setSize(this.size.width, this.size.height);
    let dpr = window.devicePixelRatio;
    if (this.maxPixelRatio && dpr > this.maxPixelRatio) {
      dpr = this.maxPixelRatio;
    } else if (this.minPixelRatio && dpr < this.minPixelRatio) {
      dpr = this.minPixelRatio;
    }
    this.renderer.setPixelRatio(dpr);
    this.size.pixelRatio = dpr;
  }
  get postprocessing() {
    return this.#t;
  }
  set postprocessing(val: any) {
    this.#t = val;
    this.render = val.render.bind(val);
  }
  #w() {
    if (this.#n) return;
    const animate = () => {
      this.#l = requestAnimationFrame(animate);
      this.#h.delta = this.#c.getDelta();
      this.#h.elapsed += this.#h.delta;
      this.onBeforeRender(this.#h);
      this.render();
      this.onAfterRender(this.#h);
    };
    this.#n = true;
    this.#c.start();
    animate();
  }
  #z() {
    if (this.#n) {
      cancelAnimationFrame(this.#l);
      this.#n = false;
      this.#c.stop();
    }
  }
  #i() {
    this.renderer.render(this.scene, this.camera);
  }
  clear() {
    this.scene.traverse((obj: any) => {
      if (obj.isMesh && typeof obj.material === 'object' && obj.material !== null) {
        Object.keys(obj.material).forEach(key => {
          const mat = obj.material[key];
          if (mat !== null && typeof mat === 'object' && typeof mat.dispose === 'function') {
            mat.dispose();
          }
        });
        obj.material.dispose();
        obj.geometry.dispose();
      }
    });
    this.scene.clear();
  }
  dispose() {
    this.#y();
    this.#z();
    this.clear();
    this.#t?.dispose();
    this.renderer.dispose();
    this.isDisposed = true;
  }
}

const interactionMap = new Map(),
  mousePos = new Vector2();
let interactionInitialized = false;
function setupInteraction(three: any) {
  const interaction = {
    position: new Vector2(),
    nPosition: new Vector2(),
    hover: false,
    touching: false,
    onEnter(i: any) {},
    onMove(i: any) {},
    onClick(i: any) {},
    onLeave(i: any) {},
    ...three
  };
  (function (elem, inter) {
    if (!interactionMap.has(elem)) {
      interactionMap.set(elem, inter);
      if (!interactionInitialized) {
        document.body.addEventListener('pointermove', onPointerMove);
        document.body.addEventListener('pointerleave', onPointerLeave);
        document.body.addEventListener('click', onPointerClick);

        document.body.addEventListener('touchstart', onTouchStart, { passive: false });
        document.body.addEventListener('touchmove', onTouchMove, { passive: false });
        document.body.addEventListener('touchend', onTouchEnd, { passive: false });
        document.body.addEventListener('touchcancel', onTouchEnd, { passive: false });

        interactionInitialized = true;
      }
    }
  })(three.domElement, interaction);
  interaction.dispose = () => {
    const elem = three.domElement;
    interactionMap.delete(elem);
    if (interactionMap.size === 0) {
      document.body.removeEventListener('pointermove', onPointerMove);
      document.body.removeEventListener('pointerleave', onPointerLeave);
      document.body.removeEventListener('click', onPointerClick);

      document.body.removeEventListener('touchstart', onTouchStart);
      document.body.removeEventListener('touchmove', onTouchMove);
      document.body.removeEventListener('touchend', onTouchEnd);
      document.body.removeEventListener('touchcancel', onTouchEnd);

      interactionInitialized = false;
    }
  };
  return interaction;
}

function onPointerMove(e: any) {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
  processInteraction();
}

function processInteraction() {
  for (const [elem, inter] of interactionMap) {
    const rect = elem.getBoundingClientRect();
    if (isInside(rect)) {
      updatePositions(inter, rect);
      if (!inter.hover) {
        inter.hover = true;
        inter.onEnter(inter);
      }
      inter.onMove(inter);
    } else if (inter.hover && !inter.touching) {
      inter.hover = false;
      inter.onLeave(inter);
    }
  }
}

function onPointerClick(e: any) {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
  for (const [elem, inter] of interactionMap) {
    const rect = elem.getBoundingClientRect();
    updatePositions(inter, rect);
    if (isInside(rect)) inter.onClick(inter);
  }
}

function onPointerLeave() {
  for (const inter of interactionMap.values()) {
    if (inter.hover) {
      inter.hover = false;
      inter.onLeave(inter);
    }
  }
}

function onTouchStart(e: any) {
  if (e.touches.length > 0) {
    e.preventDefault();
    mousePos.x = e.touches[0].clientX;
    mousePos.y = e.touches[0].clientY;

    for (const [elem, inter] of interactionMap) {
      const rect = elem.getBoundingClientRect();
      if (isInside(rect)) {
        inter.touching = true;
        updatePositions(inter, rect);
        if (!inter.hover) {
          inter.hover = true;
          inter.onEnter(inter);
        }
        inter.onMove(inter);
      }
    }
  }
}

function onTouchMove(e: any) {
  if (e.touches.length > 0) {
    e.preventDefault();
    mousePos.x = e.touches[0].clientX;
    mousePos.y = e.touches[0].clientY;

    for (const [elem, inter] of interactionMap) {
      const rect = elem.getBoundingClientRect();
      updatePositions(inter, rect);

      if (isInside(rect)) {
        if (!inter.hover) {
          inter.hover = true;
          inter.touching = true;
          inter.onEnter(inter);
        }
        inter.onMove(inter);
      } else if (inter.hover && inter.touching) {
        inter.onMove(inter);
      }
    }
  }
}

function onTouchEnd() {
  for (const [, inter] of interactionMap) {
    if (inter.touching) {
      inter.touching = false;
      if (inter.hover) {
        inter.hover = false;
        inter.onLeave(inter);
      }
    }
  }
}

function updatePositions(inter: any, rect: any) {
  const { position, nPosition } = inter;
  position.x = mousePos.x - rect.left;
  position.y = mousePos.y - rect.top;
  nPosition.x = (position.x / rect.width) * 2 - 1;
  nPosition.y = (-position.y / rect.height) * 2 + 1;
}
function isInside(rect: any) {
  const { x, y } = mousePos;
  const { left, top, width, height } = rect;
  return x >= left && x <= left + width && y >= top && y <= top + height;
}

const { randFloat, randFloatSpread } = MathUtils;
const vecA = new Vector3();
const vecB = new Vector3();
const vecC = new Vector3();
const vecD = new Vector3();
const vecE = new Vector3();
const vecF = new Vector3();
const vecG = new Vector3();
const vecH = new Vector3();
const vecI = new Vector3();
const vecJ = new Vector3();

class Physics {
  config: any;
  positionData: Float32Array;
  velocityData: Float32Array;
  sizeData: Float32Array;
  center: Vector3;
  constructor(config: any) {
    this.config = config;
    this.positionData = new Float32Array(3 * config.count).fill(0);
    this.velocityData = new Float32Array(3 * config.count).fill(0);
    this.sizeData = new Float32Array(config.count).fill(1);
    this.center = new Vector3();
    this.#R();
    this.setSizes();
  }
  #R() {
    const { config, positionData } = this;
    this.center.toArray(positionData, 0);
    for (let i = 1; i < config.count; i++) {
      const s = 3 * i;
      positionData[s] = randFloatSpread(2 * config.maxX);
      positionData[s + 1] = randFloatSpread(2 * config.maxY);
      positionData[s + 2] = randFloatSpread(2 * config.maxZ);
    }
  }
  setSizes() {
    const { config, sizeData } = this;
    sizeData[0] = config.size0;
    for (let i = 1; i < config.count; i++) {
      sizeData[i] = randFloat(config.minSize, config.maxSize);
    }
  }
  update(h: any) {
    const { config, center, positionData, sizeData, velocityData } = this;
    let r = 0;
    if (config.controlSphere0) {
      r = 1;
      vecA.fromArray(positionData, 0);
      vecA.lerp(center, 0.1).toArray(positionData, 0);
      vecD.set(0, 0, 0).toArray(velocityData, 0);
    }
    for (let idx = r; idx < config.count; idx++) {
      const base = 3 * idx;
      vecB.fromArray(positionData, base);
      vecE.fromArray(velocityData, base);
      vecE.y -= h.delta * config.gravity * sizeData[idx];
      vecE.multiplyScalar(config.friction);
      vecE.clampLength(0, config.maxVelocity);
      vecB.add(vecE);
      vecB.toArray(positionData, base);
      vecE.toArray(velocityData, base);
    }
    for (let idx = r; idx < config.count; idx++) {
      const base = 3 * idx;
      vecB.fromArray(positionData, base);
      vecE.fromArray(velocityData, base);
      const radius = sizeData[idx];
      for (let jdx = idx + 1; jdx < config.count; jdx++) {
        const otherBase = 3 * jdx;
        vecC.fromArray(positionData, otherBase);
        vecF.fromArray(velocityData, otherBase);
        const otherRadius = sizeData[jdx];
        vecG.copy(vecC).sub(vecB);
        const dist = vecG.length();
        const sumRadius = radius + otherRadius;
        if (dist < sumRadius) {
          const overlap = sumRadius - dist;
          vecH.copy(vecG)
            .normalize()
            .multiplyScalar(0.5 * overlap);
          vecI.copy(vecH).multiplyScalar(Math.max(vecE.length(), 1));
          vecJ.copy(vecH).multiplyScalar(Math.max(vecF.length(), 1));
          vecB.sub(vecH);
          vecE.sub(vecI);
          vecB.toArray(positionData, base);
          vecE.toArray(velocityData, base);
          vecC.add(vecH);
          vecF.add(vecJ);
          vecC.toArray(positionData, otherBase);
          vecF.toArray(velocityData, otherBase);
        }
      }
      if (config.controlSphere0) {
        vecG.copy(vecA).sub(vecB);
        const dist = vecG.length();
        const sumRadius0 = radius + sizeData[0];
        if (dist < sumRadius0) {
          const diff = sumRadius0 - dist;
          vecH.copy(vecG.normalize()).multiplyScalar(diff);
          vecI.copy(vecH).multiplyScalar(Math.max(vecE.length(), 2));
          vecB.sub(vecH);
          vecE.sub(vecI);
        }
      }
      if (Math.abs(vecB.x) + radius > config.maxX) {
        vecB.x = Math.sign(vecB.x) * (config.maxX - radius);
        vecE.x = -vecE.x * config.wallBounce;
      }
      if (config.gravity === 0) {
        if (Math.abs(vecB.y) + radius > config.maxY) {
          vecB.y = Math.sign(vecB.y) * (config.maxY - radius);
          vecE.y = -vecE.y * config.wallBounce;
        }
      } else if (vecB.y - radius < -config.maxY) {
        vecB.y = -config.maxY + radius;
        vecE.y = -vecE.y * config.wallBounce;
      }
      const maxBoundary = Math.max(config.maxZ, config.maxSize);
      if (Math.abs(vecB.z) + radius > maxBoundary) {
        vecB.z = Math.sign(vecB.z) * (config.maxZ - radius);
        vecE.z = -vecE.z * config.wallBounce;
      }
      vecB.toArray(positionData, base);
      vecE.toArray(velocityData, base);
    }
  }
}

class CustomMaterial extends MeshPhysicalMaterial {
  uniforms: any;
  onBeforeCompile2: any;
  constructor(params: any) {
    super(params);
    this.uniforms = {
      thicknessDistortion: { value: 0.1 },
      thicknessAmbient: { value: 0 },
      thicknessAttenuation: { value: 0.1 },
      thicknessPower: { value: 2 },
      thicknessScale: { value: 10 }
    };
    this.defines = { ...this.defines, USE_UV: '' };
    this.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.fragmentShader =
        '\n        uniform float thicknessPower;\n        uniform float thicknessScale;\n        uniform float thicknessDistortion;\n        uniform float thicknessAmbient;\n        uniform float thicknessAttenuation;\n      ' +
        shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        '\n        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {\n          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));\n          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;\n          #ifdef USE_COLOR\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor.rgb;\n          #else\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;\n          #endif\n          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;\n        }\n\n        void main() {\n      '
      );
      const lightsFragmentBegin = ShaderChunk.lights_fragment_begin.replaceAll(
        'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
        '\n          RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n          RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);\n        '
      );
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', lightsFragmentBegin);
      if (this.onBeforeCompile2) this.onBeforeCompile2(shader);
    };
  }
}

const DEFAULT_CONFIG = {
  count: 200,
  colors: [0, 0, 0],
  ambientColor: 0xffffff,
  ambientIntensity: 1,
  lightIntensity: 200,
  materialParams: {
    metalness: 0.5,
    roughness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.15
  },
  minSize: 0.5,
  maxSize: 1,
  size0: 1,
  gravity: 0.5,
  friction: 0.9975,
  wallBounce: 0.95,
  maxVelocity: 0.15,
  maxX: 5,
  maxY: 5,
  maxZ: 2,
  controlSphere0: false,
  followCursor: true
};

const dummy = new Object3D();

class Spheres extends InstancedMesh {
  config: any;
  physics: Physics;
  ambientLight!: AmbientLight;
  light!: PointLight;
  constructor(renderer: WebGLRenderer, params = {}) {
    const config = { ...DEFAULT_CONFIG, ...params };
    const pmremGenerator = new PMREMGenerator(renderer);
    const envMap = pmremGenerator.fromScene(new Scene()).texture;
    const geometry = new SphereGeometry();
    const material = new CustomMaterial({ envMap, ...config.materialParams });
    material.envMapRotation.x = -Math.PI / 2;
    super(geometry, material, config.count);
    this.config = config;
    this.physics = new Physics(config);
    this.#S();
    this.setColors(config.colors);
  }
  #S() {
    this.ambientLight = new AmbientLight(this.config.ambientColor, this.config.ambientIntensity);
    this.add(this.ambientLight);
    this.light = new PointLight(this.config.colors[0], this.config.lightIntensity);
    this.add(this.light);
  }
  setColors(colors: any) {
    if (Array.isArray(colors) && colors.length > 1) {
      const colorManager = (function (cols) {
        let t: any, i: any;
        function setColors(c: any) {
          t = c;
          i = [];
          t.forEach((col: any) => {
            i.push(new Color(col));
          });
        }
        setColors(cols);
        return {
          setColors,
          getColorAt: function (ratio: number, out = new Color()) {
            const scaled = Math.max(0, Math.min(1, ratio)) * (t.length - 1);
            const idx = Math.floor(scaled);
            const start = i[idx];
            if (idx >= t.length - 1) return start.clone();
            const alpha = scaled - idx;
            const end = i[idx + 1];
            out.r = start.r + alpha * (end.r - start.r);
            out.g = start.g + alpha * (end.g - start.g);
            out.b = start.b + alpha * (end.b - start.b);
            return out;
          }
        };
      })(colors);
      for (let idx = 0; idx < this.count; idx++) {
        this.setColorAt(idx, colorManager.getColorAt(idx / this.count));
        if (idx === 0) {
          this.light.color.copy(colorManager.getColorAt(idx / this.count));
        }
      }
      if (this.instanceColor) this.instanceColor.needsUpdate = true;
    }
  }
  update(h: any) {
    this.physics.update(h);
    for (let idx = 0; idx < this.count; idx++) {
      dummy.position.fromArray(this.physics.positionData, 3 * idx);
      if (idx === 0 && this.config.followCursor === false) {
        dummy.scale.setScalar(0);
      } else {
        dummy.scale.setScalar(this.physics.sizeData[idx]);
      }
      dummy.updateMatrix();
      this.setMatrixAt(idx, dummy.matrix);
      if (idx === 0) this.light.position.copy(dummy.position);
    }
    this.instanceMatrix.needsUpdate = true;
  }
}

function createBallpit(canvas: HTMLCanvasElement, params = {}) {
  const three = new ThreeScene({
    canvas: canvas,
    size: 'parent',
    rendererOptions: { antialias: true, alpha: true }
  });
  let spheres: Spheres;
  three.renderer.toneMapping = ACESFilmicToneMapping;
  three.camera.position.set(0, 0, 20);
  three.camera.lookAt(0, 0, 0);
  three.cameraMaxAspect = 1.5;
  three.resize();
  
  const initialize = (p: any) => {
    if (spheres) {
      three.clear();
      three.scene.remove(spheres);
    }
    spheres = new Spheres(three.renderer, p);
    three.scene.add(spheres);
  };

  initialize(params);
  
  const raycaster = new Raycaster();
  const plane = new Plane(new Vector3(0, 0, 1), 0);
  const point = new Vector3();
  let paused = false;

  canvas.style.touchAction = 'none';
  canvas.style.userSelect = 'none';
  (canvas.style as any).webkitUserSelect = 'none';

  const interaction = setupInteraction({
    domElement: canvas,
    onMove() {
      raycaster.setFromCamera(interaction.nPosition, three.camera);
      three.camera.getWorldDirection(plane.normal);
      raycaster.ray.intersectPlane(plane, point);
      spheres.physics.center.copy(point);
      spheres.config.controlSphere0 = true;
    },
    onLeave() {
      spheres.config.controlSphere0 = false;
    }
  });
  
  three.onBeforeRender = h => {
    if (!paused) spheres.update(h);
  };
  three.onAfterResize = s => {
    spheres.config.maxX = s.wWidth / 2;
    spheres.config.maxY = s.wHeight / 2;
  };
  return {
    three: three,
    get spheres() {
      return spheres;
    },
    setCount(c: number) {
      initialize({ ...spheres.config, count: c });
    },
    togglePause() {
      paused = !paused;
    },
    dispose() {
      interaction.dispose();
      three.dispose();
    }
  };
}

const Ballpit = ({ className = '', followCursor = true, ...props }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spheresInstanceRef = useRef<any>(null);
  const [isRendererAvailable, setIsRendererAvailable] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      spheresInstanceRef.current = createBallpit(canvas, { followCursor, ...props });
      setIsRendererAvailable(true);
    } catch (error) {
      console.error('Ballpit initialization failed:', error);
      setIsRendererAvailable(false);
    }

    return () => {
      if (spheresInstanceRef.current) {
        try {
          spheresInstanceRef.current.dispose();
        } catch (disposeError) {
          console.error('Ballpit cleanup failed:', disposeError);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isRendererAvailable) {
    return null;
  }

  return <canvas className={className} ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default Ballpit;
