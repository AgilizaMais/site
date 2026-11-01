import {
  Color,
  DataTexture,
  FloatType,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Float32BufferAttribute,
  Mesh,
  NearestFilter,
  PerspectiveCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  LinearFilter,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three';
import { sampleCurve, writeFrames } from './spine';
import {
  doilyFragment,
  doilyVertex,
  photoFragment,
  photoVertex,
  yarnFragment,
  yarnVertex,
} from './shaders';
import type { DoilyDef, SceneDef, ThreadDef } from './presets';

export type Tier = 'high' | 'mid' | 'low';

export type PhotoOptions = {
  /** Elemento <img> do DOM cuja caixa o plano 3D replica (e substitui). */
  el: HTMLImageElement;
  src: string;
  /** região das franjas em uv: x0, x1, topo, base (a partir do topo) */
  fringe: [number, number, number, number];
  /** fração da altura que dissolve na base */
  fade: number;
};

export type EngineOptions = {
  scene: (aspect: number) => SceneDef;
  tier: Tier;
  reduced: boolean;
  photo?: PhotoOptions;
  /** Interação com o cursor/dedo */
  interactive?: boolean;
  /** Avisado quando a foto 3D está pronta para assumir o lugar da do DOM */
  onPhotoReady?: () => void;
};

const CAM_Z = 14;
const FOV = 30;

const QUALITY: Record<Tier, { samples: number; along: number; radial: number; dpr: number; aa: boolean }> = {
  high: { samples: 240, along: 560, radial: 16, dpr: 2, aa: true },
  mid: { samples: 200, along: 420, radial: 14, dpr: 1.6, aa: true },
  low: { samples: 150, along: 280, radial: 10, dpr: 1.25, aa: false },
};

type ThreadState = {
  def: ThreadDef;
  K: number;
  ctrl: Float32Array; // K*3 (mundo)
  target: Float32Array; // S*3
  pos: Float32Array; // S*3
  vel: Float32Array; // S*3
  zMean: number;
  init: boolean;
};

const tmpColor = new Color();

export class YarnEngine {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  private opts: EngineOptions;
  private q: (typeof QUALITY)[Tier];

  private width = 1;
  private height = 1;
  private visH = 1;
  private visW = 1;
  private wide = true;

  private threads: ThreadState[] = [];
  private spineData: Float32Array<ArrayBuffer> = new Float32Array(4);
  private spineTex: DataTexture | null = null;
  private yarnMesh: Mesh<InstancedBufferGeometry, ShaderMaterial> | null = null;
  private yarnMat: ShaderMaterial;

  private doilies: { mesh: Mesh<PlaneGeometry, ShaderMaterial>; def: DoilyDef }[] = [];
  private photo: Mesh<PlaneGeometry, ShaderMaterial> | null = null;
  private photoTex: Texture | null = null;
  private photoAlpha = 0;
  private photoTarget = 0;

  private time = 0;
  private last = 0;
  private raf = 0;
  private running = false;
  private visible = true;
  private disposed = false;

  private pointer = { x: 0, y: 0, vx: 0, vy: 0, active: 0, has: false };
  private ndc = { x: 0, y: 0 };
  private scrollBoost = 0;
  private progress = 0;
  private progressTarget = 0;
  private draw = 0;
  private drawTarget = 1;
  private camOffsetY = 0;
  private skipIntro = false;

  private ro: ResizeObserver;
  private io: IntersectionObserver;

  constructor(private canvas: HTMLCanvasElement, opts: EngineOptions) {
    this.opts = opts;
    this.q = QUALITY[opts.tier];

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: this.q.aa,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.q.dpr));
    this.camera.position.set(0, 0, CAM_Z);

    this.yarnMat = new ShaderMaterial({
      vertexShader: yarnVertex,
      fragmentShader: yarnFragment,
      uniforms: {
        uSpine: { value: null },
        uSamples: { value: this.q.samples },
        uTime: { value: 0 },
        uDraw: { value: 0 },
        uOpacity: { value: 1 },
        ...lightUniforms(),
      },
    });

    // ?nointro: pula a entrada (útil para capturas de tela e QA)
    this.skipIntro = opts.reduced || new URLSearchParams(window.location.search).has('nointro');
    if (this.skipIntro) this.draw = this.drawTarget = 1;

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(
      ([entry]) => {
        this.visible = !!entry?.isIntersecting;
        this.updateLoop();
      },
      { rootMargin: '120px' },
    );
    this.io.observe(canvas);

    document.addEventListener('visibilitychange', this.onVisibility);
    if (opts.interactive !== false && !opts.reduced) {
      window.addEventListener('pointermove', this.onPointer, { passive: true });
      window.addEventListener('pointerdown', this.onPointer, { passive: true });
    }

    this.resize();
    if (opts.photo) this.loadPhoto(opts.photo);
  }

  /* ---------------------------------------------------------------- */
  /* API pública                                                      */
  /* ---------------------------------------------------------------- */

  start() {
    this.running = true;
    this.updateLoop();
  }

  /** 0..1 — interpola os fios entre `pts` e `ptsB` (ex.: virar coração). */
  setProgress(p: number) {
    this.progressTarget = Math.min(1, Math.max(0, p));
    if (this.opts.reduced) {
      this.progress = this.progressTarget;
      this.renderOnce();
    }
  }

  /** Velocidade de scroll em px/s — agita os fios. */
  setScrollVelocity(v: number) {
    this.scrollBoost = Math.max(this.scrollBoost, Math.min(Math.abs(v) / 1800, 1.4));
  }

  /** Paralaxe: desloca a câmera (fração da altura visível). */
  setCameraOffset(y: number) {
    this.camOffsetY = y;
  }

  /** Reinicia a animação de entrada dos fios. */
  playIntro() {
    if (this.skipIntro) return;
    this.draw = 0;
    this.drawTarget = 1;
  }

  /** Ajusta a foto 3D à caixa atual do <img> (após layout/animações do DOM). */
  syncPhoto() {
    this.layoutPhoto();
  }

  showPhoto() {
    this.photoTarget = 1;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pointermove', this.onPointer);
    window.removeEventListener('pointerdown', this.onPointer);
    this.yarnMesh?.geometry.dispose();
    this.yarnMat.dispose();
    this.spineTex?.dispose();
    this.doilies.forEach((d) => {
      d.mesh.geometry.dispose();
      d.mesh.material.dispose();
    });
    this.photo?.geometry.dispose();
    this.photo?.material.dispose();
    this.photoTex?.dispose();
    this.renderer.dispose();
  }

  /* ---------------------------------------------------------------- */
  /* Montagem                                                         */
  /* ---------------------------------------------------------------- */

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (w === this.width && h === this.height && this.threads.length) return;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.visH = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 360);
    this.visW = this.visH * this.camera.aspect;
    this.wide = w / h >= 0.95;
    this.build();
    this.layoutPhoto();
    this.renderOnce();
  }

  /** px CSS → unidades de mundo (no plano z = 0) */
  private px(v: number) {
    return (v * this.visH) / this.height;
  }

  private build() {
    const def = this.opts.scene(this.width / this.height);
    const S = this.q.samples;

    // fios
    this.threads = def.threads.map((t) => {
      const K = t.pts.length;
      return {
        def: t,
        K,
        ctrl: new Float32Array(K * 3),
        target: new Float32Array(S * 3),
        pos: new Float32Array(S * 3),
        vel: new Float32Array(S * 3),
        zMean: t.pts.reduce((a, p) => a + p[2], 0) / K,
        init: false,
      };
    });

    const T = this.threads.length;
    this.spineData = new Float32Array(S * 4 * T * 3);
    this.spineTex?.dispose();
    this.spineTex = new DataTexture(this.spineData, S, T * 3, RGBAFormat, FloatType);
    this.spineTex.minFilter = NearestFilter;
    this.spineTex.magFilter = NearestFilter;
    this.spineTex.generateMipmaps = false;
    this.spineTex.needsUpdate = true;
    this.yarnMat.uniforms.uSpine!.value = this.spineTex;

    if (this.yarnMesh) {
      this.scene.remove(this.yarnMesh);
      this.yarnMesh.geometry.dispose();
    }
    const geo = this.buildTubeGeometry();
    const iRow = new Float32Array(T);
    const iRadius = new Float32Array(T);
    const iColA = new Float32Array(T * 3);
    const iColB = new Float32Array(T * 3);
    const iParams = new Float32Array(T * 4);
    const iFlow = new Float32Array(T);
    const iDelay = new Float32Array(T);
    this.threads.forEach((th, i) => {
      const d = th.def;
      iRow[i] = i;
      iRadius[i] = this.px(d.radius);
      tmpColor.set(d.colA);
      iColA.set([tmpColor.r, tmpColor.g, tmpColor.b], i * 3);
      tmpColor.set(d.colB);
      iColB.set([tmpColor.r, tmpColor.g, tmpColor.b], i * 3);
      iParams.set(
        [d.plies ?? (d.kind === 'cord' ? 5 : 3), d.twist ?? 0.62, d.kind === 'cord' ? 1 : 0, (i * 0.618) % 1],
        i * 4,
      );
      iFlow[i] = d.flow ?? 0;
      iDelay[i] = d.delay ?? 0;
    });
    geo.setAttribute('iRow', new InstancedBufferAttribute(iRow, 1));
    geo.setAttribute('iRadius', new InstancedBufferAttribute(iRadius, 1));
    geo.setAttribute('iColA', new InstancedBufferAttribute(iColA, 3));
    geo.setAttribute('iColB', new InstancedBufferAttribute(iColB, 3));
    geo.setAttribute('iParams', new InstancedBufferAttribute(iParams, 4));
    geo.setAttribute('iFlow', new InstancedBufferAttribute(iFlow, 1));
    geo.setAttribute('iDelay', new InstancedBufferAttribute(iDelay, 1));
    geo.instanceCount = T;

    this.yarnMesh = new Mesh(geo, this.yarnMat);
    this.yarnMesh.frustumCulled = false;
    this.scene.add(this.yarnMesh);

    // toalhinhas
    this.doilies.forEach((d) => {
      this.scene.remove(d.mesh);
      d.mesh.geometry.dispose();
      d.mesh.material.dispose();
    });
    this.doilies = def.doilies.map((d) => {
      const mat = new ShaderMaterial({
        vertexShader: doilyVertex,
        fragmentShader: doilyFragment,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        uniforms: {
          uColA: { value: new Color(d.colA) },
          uColB: { value: new Color(d.colB) },
          uOpacity: { value: d.opacity },
          uSpin: { value: 0 },
          ...lightUniforms(),
        },
      });
      const mesh = new Mesh(new PlaneGeometry(1, 1), mat);
      mesh.frustumCulled = false;
      mesh.renderOrder = -1;
      this.scene.add(mesh);
      return { mesh, def: d };
    });
    this.layoutDoilies();
  }

  private buildTubeGeometry() {
    const L = this.q.along;
    const R = this.q.radial;
    const verts = new Float32Array((L + 1) * (R + 1) * 3);
    let o = 0;
    for (let i = 0; i <= L; i++) {
      for (let j = 0; j <= R; j++) {
        verts[o++] = i / L;
        verts[o++] = j / R;
        verts[o++] = 0;
      }
    }
    const idx: number[] = [];
    for (let i = 0; i < L; i++) {
      for (let j = 0; j < R; j++) {
        const a = i * (R + 1) + j;
        const b = a + R + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geo = new InstancedBufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    return geo;
  }

  private layoutDoilies() {
    for (const d of this.doilies) {
      const scale = d.def.size * this.visH * ((CAM_Z - d.def.z) / CAM_Z);
      d.mesh.scale.set(scale, scale, 1);
      const p = this.toWorld(d.def.nx, d.def.ny, d.def.z);
      d.mesh.position.copy(p);
    }
  }

  private loadPhoto(p: PhotoOptions) {
    new TextureLoader().load(p.src, (tex) => {
      if (this.disposed) return;
      tex.colorSpace = SRGBColorSpace;
      tex.minFilter = LinearFilter;
      tex.generateMipmaps = false;
      tex.anisotropy = 4;
      this.photoTex = tex;
      const mat = new ShaderMaterial({
        vertexShader: photoVertex,
        fragmentShader: photoFragment,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        uniforms: {
          uMap: { value: tex },
          uTime: { value: 0 },
          uSway: { value: this.opts.reduced ? 0 : 1 },
          uFade: { value: p.fade },
          uAlpha: { value: 0 },
          uFringe: { value: p.fringe },
        },
      });
      this.photo = new Mesh(new PlaneGeometry(1, 1), mat);
      this.photo.frustumCulled = false;
      this.scene.add(this.photo);
      this.layoutPhoto();
      this.renderOnce();
      this.opts.onPhotoReady?.();
    });
  }

  private layoutPhoto() {
    const p = this.opts.photo;
    if (!p || !this.photo) return;
    const c = this.canvas.getBoundingClientRect();
    const r = p.el.getBoundingClientRect();
    if (!r.width || !c.width) return;
    // object-fit: contain → caixa real da imagem dentro do elemento
    const ar = (p.el.naturalWidth || 894) / (p.el.naturalHeight || 1534);
    let w = r.width;
    let h = r.height;
    if (w / h > ar) w = h * ar;
    else h = w / ar;
    const left = r.left + (r.width - w) / 2 - c.left;
    const top = r.top + (r.height - h) - c.top; // ancorada na base (object-position: bottom)
    const cx = (left + w / 2) / c.width;
    const cy = (top + h / 2) / c.height;
    const pos = this.toWorld(cx, cy, 0);
    this.photo.position.set(pos.x, pos.y + this.camera.position.y, 0);
    this.photo.scale.set((w / c.width) * this.visW, (h / c.height) * this.visH, 1);
  }

  private toWorld(nx: number, ny: number, z: number) {
    // mantém o enquadramento: pontos com z ≠ 0 são escalados pela perspectiva
    const k = (CAM_Z - z) / CAM_Z;
    return new Vector3((nx - 0.5) * this.visW * k, (0.5 - ny) * this.visH * k, z);
  }

  /* ---------------------------------------------------------------- */
  /* Loop                                                             */
  /* ---------------------------------------------------------------- */

  private onVisibility = () => this.updateLoop();

  private onPointer = (e: PointerEvent) => {
    const c = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - c.left) / c.width) * 2 - 1;
    const y = -(((e.clientY - c.top) / c.height) * 2 - 1);
    if (this.pointer.has) {
      this.pointer.vx += (x - this.ndc.x) * 0.5;
      this.pointer.vy += (y - this.ndc.y) * 0.5;
    }
    this.ndc.x = x;
    this.ndc.y = y;
    this.pointer.has = true;
    this.pointer.active = 1;
  };

  private updateLoop() {
    const should = this.running && this.visible && !document.hidden && !this.opts.reduced && !this.disposed;
    if (should && !this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    } else if (!should && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.step(dt);
    this.renderer.render(this.scene, this.camera);
  };

  renderOnce() {
    if (this.disposed) return;
    this.step(0);
    this.renderer.render(this.scene, this.camera);
  }

  private step(dt: number) {
    this.time += dt;
    const t = this.time;

    // entradas suavizadas
    this.draw = Math.min(this.drawTarget, this.draw + dt / 2.6);
    if (this.opts.reduced) this.draw = 1;
    this.progress += (this.progressTarget - this.progress) * Math.min(1, dt * 3.2);
    this.scrollBoost *= Math.pow(0.12, dt);
    this.pointer.vx *= Math.pow(0.02, dt);
    this.pointer.vy *= Math.pow(0.02, dt);
    this.pointer.active *= Math.pow(0.6, dt);

    this.camera.position.y = -this.camOffsetY * this.visH;

    this.yarnMat.uniforms.uTime!.value = t;
    this.yarnMat.uniforms.uDraw!.value = this.draw;

    // posição do ponteiro no mundo, por profundidade
    const ray = new Vector3(this.ndc.x, this.ndc.y, 0.5).unproject(this.camera).sub(this.camera.position).normalize();

    const S = this.q.samples;
    const amp = 1 + this.scrollBoost * 2.2;

    for (let k = 0; k < this.threads.length; k++) {
      const th = this.threads[k]!;
      const d = th.def;
      const sp = d.speed ?? 0.4;
      const ph = d.phase ?? 0;
      const a = (d.amp ?? 0.012) * amp;
      const pB = d.ptsB;
      // cada fio entra no coração com um pequeno atraso próprio
      const pk = pB ? easeInOut(clamp01(this.progress * 1.35 - (d.delay ?? 0) * 0.9)) : 0;

      for (let i = 0; i < th.K; i++) {
        const pa = d.pts[i]!;
        let nx = pa[0];
        let ny = pa[1];
        let z = pa[2];
        if (pB) {
          // pontos ao longo do fio se enrolam em sequência
          const local = easeInOut(clamp01(pk * 1.6 - (i / th.K) * 0.6));
          const pb = pB[i]!;
          nx += (pb[0] - nx) * local;
          ny += (pb[1] - ny) * local;
          z += (pb[2] - z) * local;
        }
        const wv = t * sp + i * 0.85 + ph;
        // ondas viajando ao longo do fio + respiração lenta
        const damp = pB ? 1 - pk * 0.75 : 1;
        ny += Math.sin(wv) * a * damp + Math.sin(t * 0.21 + ph) * a * 0.5 * damp;
        nx += Math.cos(wv * 0.73 + 1.3) * a * 0.45 * damp;
        z += Math.sin(wv * 0.61 + ph * 2) * 0.25 * damp;
        const kz = (CAM_Z - z) / CAM_Z;
        th.ctrl[i * 3] = (nx - 0.5) * this.visW * kz;
        th.ctrl[i * 3 + 1] = (0.5 - ny) * this.visH * kz;
        th.ctrl[i * 3 + 2] = z;
      }

      sampleCurve(th.ctrl, th.K, th.target, S);

      // molas: cada amostra persegue o alvo; o ponteiro empurra e arrasta os fios
      const ptr = this.pointer;
      const tz = (th.zMean - this.camera.position.z) / ray.z;
      const cxw = this.camera.position.x + ray.x * tz;
      const cyw = this.camera.position.y + ray.y * tz;
      const R = this.visH * (this.wide ? 0.11 : 0.09);
      const R2 = R * R;
      const strength = ptr.has ? 20 * ptr.active : 0;
      const dragX = ptr.vx * this.visW * 6;
      const dragY = ptr.vy * this.visH * 6;

      if (!th.init || dt === 0) {
        th.pos.set(th.target);
        th.vel.fill(0);
        th.init = true;
      } else {
        const kS = 46;
        const kD = 8.5;
        for (let i = 0; i < S; i++) {
          const o = i * 3;
          let fx = (th.target[o]! - th.pos[o]!) * kS - th.vel[o]! * kD;
          let fy = (th.target[o + 1]! - th.pos[o + 1]!) * kS - th.vel[o + 1]! * kD;
          const fz = (th.target[o + 2]! - th.pos[o + 2]!) * kS - th.vel[o + 2]! * kD;
          if (strength > 0.01) {
            const dx = th.pos[o]! - cxw;
            const dy = th.pos[o + 1]! - cyw;
            const d2 = dx * dx + dy * dy;
            if (d2 < R2 * 6) {
              const f = Math.exp(-d2 / R2) * strength;
              const inv = 1 / Math.sqrt(d2 + 1e-3);
              fx += dx * inv * f + dragX * f * 0.5;
              fy += dy * inv * f + dragY * f * 0.5;
            }
          }
          th.vel[o] = th.vel[o]! + fx * dt;
          th.vel[o + 1] = th.vel[o + 1]! + fy * dt;
          th.vel[o + 2] = th.vel[o + 2]! + fz * dt;
          th.pos[o] = th.pos[o]! + th.vel[o]! * dt;
          th.pos[o + 1] = th.pos[o + 1]! + th.vel[o + 1]! * dt;
          th.pos[o + 2] = th.pos[o + 2]! + th.vel[o + 2]! * dt;
        }
      }

      writeFrames(th.pos, S, this.spineData, k * 3, d.taper ?? 0);
    }
    if (this.spineTex) this.spineTex.needsUpdate = true;

    // toalhinhas: giro lento + leve paralaxe com o ponteiro
    for (const dl of this.doilies) {
      const u = dl.mesh.material.uniforms;
      u.uSpin!.value = t * dl.def.spin;
      const base = this.toWorld(dl.def.nx, dl.def.ny, dl.def.z);
      dl.mesh.position.set(base.x - this.ndc.x * 0.12, base.y - this.ndc.y * 0.08, dl.def.z);
    }

    if (this.photo) {
      this.photoAlpha += (this.photoTarget - this.photoAlpha) * Math.min(1, dt * 4 + (this.opts.reduced ? 1 : 0));
      const u = this.photo.material.uniforms;
      u.uTime!.value = t;
      u.uAlpha!.value = this.photoAlpha;
      this.layoutPhoto();
    }
  }
}

function lightUniforms() {
  return {
    uKeyDir: { value: new Vector3(-0.55, 0.75, 0.6) },
    uKeyCol: { value: new Color(1.0, 0.9, 0.82).multiplyScalar(1.05) },
    uFillDir: { value: new Vector3(0.7, -0.2, 0.5) },
    uFillCol: { value: new Color(0.95, 0.62, 0.72).multiplyScalar(0.32) },
    uAmbient: { value: new Color(0.42, 0.33, 0.36) },
    uRimCol: { value: new Color(1.0, 0.85, 0.8).multiplyScalar(0.5) },
  };
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
