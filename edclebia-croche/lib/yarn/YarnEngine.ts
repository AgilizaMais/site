import {
  Color,
  DataTexture,
  FloatType,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Float32BufferAttribute,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  NearestFilter,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';
import { sampleCurve, writeFrames } from './spine';
import {
  bakedFragment,
  bakedVertex,
  doilyFragment,
  doilyVertex,
  occluderFragment,
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
/** duração da entrada dos fios (ms, relógio real — não desacelera se o fps cair) */
const INTRO_MS = 1350;

/**
 * Qualidade por aparelho. A amostragem é adaptativa (spine.ts), então o laço do
 * coração continua redondo mesmo com menos amostras no total.
 */
const QUALITY: Record<Tier, { samples: number; along: number; radial: number; dpr: number; aa: boolean }> = {
  high: { samples: 280, along: 560, radial: 14, dpr: 2, aa: true },
  mid: { samples: 240, along: 460, radial: 12, dpr: 2, aa: true },
  low: { samples: 180, along: 340, radial: 10, dpr: 1.5, aa: true },
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

type Doily = {
  mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  def: DoilyDef;
  rt: WebGLRenderTarget;
  bx: number;
  by: number;
};

const tmpColor = new Color();
const tmpVec = new Vector3();

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
  private dpr = 1;

  private threads: ThreadState[] = [];
  private spineData: Float32Array<ArrayBuffer> = new Float32Array(4);
  private spineTex: DataTexture | null = null;
  private yarnMesh: Mesh<InstancedBufferGeometry, ShaderMaterial> | null = null;
  private yarnMat: ShaderMaterial;

  private doilies: Doily[] = [];
  private photo: Mesh<PlaneGeometry, ShaderMaterial> | null = null;
  private photoTex: Texture | null = null;
  private photoTarget = 0;
  /** caixa da foto em coordenadas normalizadas do canvas (medida só quando muda) */
  private photoBox = { cx: 0.5, cy: 0.5, w: 0, h: 0 };

  private time = 0;
  private last = 0;
  private raf = 0;
  private running = false;
  private ready = false;
  private visible = true;
  private disposed = false;

  private pointer = { vx: 0, vy: 0, active: 0, has: false };
  private ndc = { x: 0, y: 0 };
  private rect = { left: 0, top: 0, width: 1, height: 1 };
  private rectDirty = true;
  private scrollBoost = 0;
  private progress = 0;
  private progressTarget = 0;
  private draw = 0;
  private introAt = 0;
  private camOffsetY = 0;
  private skipIntro = false;

  // resolução adaptativa
  private frameEma = 16.7;
  private slowFrames = 0;
  /** piso da resolução adaptativa: em tela retina nunca cai abaixo de 1.5 (fio serrilhado) */
  private minDpr = 1;

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
    this.dpr = Math.min(window.devicePixelRatio || 1, this.q.dpr);
    this.minDpr = Math.min(this.dpr, 1.5);
    this.renderer.setPixelRatio(this.dpr);
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
    this.draw = this.skipIntro ? 1 : 0;
    this.introAt = performance.now();

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(
      ([entry]) => {
        this.visible = !!entry?.isIntersecting;
        this.rectDirty = true;
        this.updateLoop();
      },
      { rootMargin: '80px' },
    );
    this.io.observe(canvas);

    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    if (opts.interactive !== false && !opts.reduced) {
      window.addEventListener('pointermove', this.onPointer, { passive: true });
      window.addEventListener('pointerdown', this.onPointer, { passive: true });
    }

    this.resize();
    if (opts.photo) this.loadPhoto(opts.photo);

    // compila os shaders antes do primeiro quadro animado (sem engasgo na entrada)
    const done = () => {
      if (this.disposed) return;
      this.ready = true;
      this.introAt = performance.now();
      this.updateLoop();
    };
    this.renderer.compileAsync(this.scene, this.camera).then(done, done);
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

  /** Velocidade de scroll em px/s — agita os fios de leve. */
  setScrollVelocity(v: number) {
    this.scrollBoost = Math.max(this.scrollBoost, Math.min(Math.abs(v) / 2400, 0.7));
  }

  /** Paralaxe: desloca a câmera (fração da altura visível). */
  setCameraOffset(y: number) {
    this.camOffsetY = y;
  }

  /** Reinicia a animação de entrada dos fios. */
  playIntro() {
    if (this.skipIntro) return;
    this.draw = 0;
    this.introAt = performance.now();
  }

  /** Mede de novo a caixa do <img> (chamar quando o layout/paralaxe do DOM mudar). */
  syncPhoto() {
    this.measurePhoto();
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
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('pointermove', this.onPointer);
    window.removeEventListener('pointerdown', this.onPointer);
    this.yarnMesh?.geometry.dispose();
    this.yarnMat.dispose();
    this.spineTex?.dispose();
    this.disposeDoilies();
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
    this.rectDirty = true;
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
    this.measurePhoto();
    this.renderOnce();
  }

  /** px CSS → unidades de mundo (no plano z = 0) */
  private px(v: number) {
    return (v * this.visH) / this.height;
  }

  private build() {
    const def = this.opts.scene(this.width / this.height);
    const S = this.q.samples;

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

    this.buildDoilies(def.doilies);
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
    const idx = new Uint32Array(L * R * 6);
    let k = 0;
    for (let i = 0; i < L; i++) {
      for (let j = 0; j < R; j++) {
        const a = i * (R + 1) + j;
        const b = a + R + 1;
        idx[k++] = a;
        idx[k++] = b;
        idx[k++] = a + 1;
        idx[k++] = b;
        idx[k++] = b + 1;
        idx[k++] = a + 1;
      }
    }
    const geo = new InstancedBufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
    geo.setIndex(Array.from(idx));
    return geo;
  }

  /**
   * As toalhinhas são procedurais e caras de calcular — então são desenhadas UMA
   * vez numa textura. Depois disso só giram (rotação do plano), custo quase zero.
   */
  private buildDoilies(defs: DoilyDef[]) {
    this.disposeDoilies();
    if (!defs.length) return;

    const bakeScene = new Scene();
    const bakeCam = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 10);
    bakeCam.position.set(0, 0, 5);
    const quad = new Mesh(new PlaneGeometry(1, 1));
    bakeScene.add(quad);

    this.doilies = defs.map((d) => {
      const px = d.size * this.height * this.dpr;
      const size = Math.min(1024, Math.max(256, 2 ** Math.ceil(Math.log2(px))));
      const rt = new WebGLRenderTarget(size, size, {
        generateMipmaps: true,
        minFilter: LinearMipmapLinearFilter,
        magFilter: LinearFilter,
      });
      const bakeMat = new ShaderMaterial({
        vertexShader: doilyVertex,
        fragmentShader: doilyFragment,
        blending: NoBlending,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uColA: { value: new Color(d.colA) },
          uColB: { value: new Color(d.colB) },
          uOpacity: { value: 1 },
          uSpin: { value: 0 },
          ...lightUniforms(),
        },
      });
      quad.material = bakeMat;
      this.renderer.setRenderTarget(rt);
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.clear();
      this.renderer.render(bakeScene, bakeCam);
      this.renderer.setRenderTarget(null);
      bakeMat.dispose();

      const mat = new ShaderMaterial({
        vertexShader: bakedVertex,
        fragmentShader: bakedFragment,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        uniforms: { uMap: { value: rt.texture }, uOpacity: { value: d.opacity } },
      });
      const mesh = new Mesh(new PlaneGeometry(1, 1), mat);
      mesh.frustumCulled = false;
      mesh.renderOrder = -1;
      const scale = d.size * this.visH * ((CAM_Z - d.z) / CAM_Z);
      mesh.scale.set(scale, scale, 1);
      const k = (CAM_Z - d.z) / CAM_Z;
      const bx = (d.nx - 0.5) * this.visW * k;
      const by = (0.5 - d.ny) * this.visH * k;
      mesh.position.set(bx, by, d.z);
      this.scene.add(mesh);
      return { mesh, def: d, rt, bx, by };
    });

    quad.geometry.dispose();
  }

  private disposeDoilies() {
    this.doilies.forEach((d) => {
      this.scene.remove(d.mesh);
      d.mesh.geometry.dispose();
      d.mesh.material.dispose();
      d.rt.dispose();
    });
    this.doilies = [];
  }

  private loadPhoto(p: PhotoOptions) {
    new TextureLoader().load(p.src, (tex) => {
      if (this.disposed) return;
      tex.colorSpace = SRGBColorSpace;
      tex.minFilter = LinearFilter;
      tex.generateMipmaps = false;
      this.photoTex = tex;
      const mat = new ShaderMaterial({
        vertexShader: photoVertex,
        fragmentShader: occluderFragment,
        colorWrite: false,
        depthWrite: true,
        uniforms: { uMap: { value: tex }, uFade: { value: p.fade } },
      });
      this.photo = new Mesh(new PlaneGeometry(1, 1), mat);
      this.photo.frustumCulled = false;
      this.photo.renderOrder = -2; // antes dos fios: a profundidade já está lá quando eles chegam
      this.scene.add(this.photo);
      // sobe a textura e compila o shader agora, fora do quadro animado
      this.renderer.initTexture(tex);
      this.renderer.compileAsync(this.scene, this.camera).finally(() => {
        if (this.disposed) return;
        this.measurePhoto();
        this.opts.onPhotoReady?.();
      });
    });
  }

  /** Lê o layout do <img> — só em resize, handoff e scroll; nunca a cada quadro. */
  private measurePhoto() {
    const p = this.opts.photo;
    if (!p) return;
    const c = this.canvas.getBoundingClientRect();
    const r = p.el.getBoundingClientRect();
    if (!r.width || !c.width) return;
    // object-fit: contain → caixa real da imagem dentro do elemento
    const ar = (p.el.naturalWidth || 853) / (p.el.naturalHeight || 1536);
    let w = r.width;
    let h = r.height;
    if (w / h > ar) w = h * ar;
    else h = w / ar;
    const left = r.left + (r.width - w) / 2 - c.left;
    const top = r.top + (r.height - h) - c.top; // ancorada na base (object-position: bottom)
    this.photoBox.cx = (left + w / 2) / c.width;
    this.photoBox.cy = (top + h / 2) / c.height;
    this.photoBox.w = w / c.width;
    this.photoBox.h = h / c.height;
  }

  /* ---------------------------------------------------------------- */
  /* Loop                                                             */
  /* ---------------------------------------------------------------- */

  private onVisibility = () => this.updateLoop();

  private onScroll = () => {
    this.rectDirty = true;
  };

  private onPointer = (e: PointerEvent) => {
    if (!this.visible) return;
    if (this.rectDirty) {
      const c = this.canvas.getBoundingClientRect();
      this.rect.left = c.left;
      this.rect.top = c.top;
      this.rect.width = c.width || 1;
      this.rect.height = c.height || 1;
      this.rectDirty = false;
    }
    const x = ((e.clientX - this.rect.left) / this.rect.width) * 2 - 1;
    const y = -(((e.clientY - this.rect.top) / this.rect.height) * 2 - 1);
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
    const should =
      this.ready && this.running && this.visible && !document.hidden && !this.opts.reduced && !this.disposed;
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
    const ms = now - this.last;
    this.last = now;
    this.adapt(ms);
    this.step(Math.min(0.05, ms / 1000), now);
    this.renderer.render(this.scene, this.camera);
  };

  /** Resolução adaptativa: se o aparelho não acompanha, reduz o DPR do canvas. */
  private adapt(ms: number) {
    if (ms > 200) return; // aba voltou do segundo plano etc.
    this.frameEma += (ms - this.frameEma) * 0.08;
    if (this.frameEma > 21 && this.dpr > this.minDpr) {
      if (++this.slowFrames > 40) {
        this.dpr = Math.max(this.minDpr, this.dpr - 0.25);
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(this.width, this.height, false);
        this.slowFrames = 0;
        this.frameEma = 16.7;
      }
    } else {
      this.slowFrames = Math.max(0, this.slowFrames - 1);
    }
  }

  renderOnce() {
    if (this.disposed) return;
    this.step(0, performance.now());
    this.renderer.render(this.scene, this.camera);
  }

  private step(dt: number, now: number) {
    this.time += dt;
    const t = this.time;

    // entrada pelo relógio real: mesma duração em qualquer aparelho
    if (!this.skipIntro && this.ready) this.draw = Math.min(1, (now - this.introAt) / INTRO_MS);
    if (this.skipIntro) this.draw = 1;
    this.progress += (this.progressTarget - this.progress) * Math.min(1, dt * 4);
    this.scrollBoost *= Math.pow(0.08, dt);
    this.pointer.vx *= Math.pow(0.02, dt);
    this.pointer.vy *= Math.pow(0.02, dt);
    this.pointer.active *= Math.pow(0.6, dt);

    this.camera.position.y = -this.camOffsetY * this.visH;
    this.camera.updateMatrixWorld();

    this.yarnMat.uniforms.uTime!.value = t;
    this.yarnMat.uniforms.uDraw!.value = this.draw;

    // posição do ponteiro no mundo, por profundidade
    const ray = tmpVec.set(this.ndc.x, this.ndc.y, 0.5).unproject(this.camera).sub(this.camera.position).normalize();

    const S = this.q.samples;
    const amp = 1 + this.scrollBoost * 1.3;

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
        // o laço do coração ondula em bloco (mesma fase), sem se deformar
        const wi = d.rigid && i >= d.rigid[0] && i <= d.rigid[1] ? d.rigid[0] : i;
        const wv = t * sp + wi * 0.85 + ph;
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

      // molas firmes: o fio acompanha o desenho sem "arrastar";
      // o ponteiro empurra e puxa, e o fio volta com um leve balanço
      const ptr = this.pointer;
      const strength = ptr.has ? 26 * ptr.active : 0;

      if (!th.init || dt === 0) {
        th.pos.set(th.target);
        th.vel.fill(0);
        th.init = true;
      } else {
        const tz = (th.zMean - this.camera.position.z) / ray.z;
        const cxw = this.camera.position.x + ray.x * tz;
        const cyw = this.camera.position.y + ray.y * tz;
        const R = this.visH * (this.wide ? 0.11 : 0.09);
        const R2 = R * R;
        const dragX = ptr.vx * this.visW * 6;
        const dragY = ptr.vy * this.visH * 6;
        const kS = 110;
        const kD = 16;
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
      dl.mesh.rotation.z = t * dl.def.spin;
      dl.mesh.position.x = dl.bx - this.ndc.x * 0.12;
      dl.mesh.position.y = dl.by - this.ndc.y * 0.08;
    }

    if (this.photo && this.photoBox.w > 0) {
      this.photo.visible = this.photoTarget > 0;
      const b = this.photoBox;
      this.photo.position.set((b.cx - 0.5) * this.visW, (0.5 - b.cy) * this.visH + this.camera.position.y, 0);
      this.photo.scale.set(b.w * this.visW, b.h * this.visH, 1);
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
