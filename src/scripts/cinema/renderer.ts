import { galaxy, textFromPixels, terrain, bars, type Cloud } from './shapes';
import { cam, stateFromScroll } from './camera';
import { particleBudget, decideQuality } from './quality';
import { POINT_VS, POINT_FS, QUAD_VS, BRIGHT_FS, BLUR_FS, COMP_FS } from './shaders';
import type { Rows } from '../morph';

export interface PrologueData { heat: Rows; nets: number[]; label: string }
interface Prog { p: WebGLProgram; u: (name: string) => WebGLUniformLocation | null }
interface Target { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number }

/** Upgrades the static prologue to the particle film when this device can take it; otherwise the static opening stays. */
export function startPrologue(root: HTMLElement, data: PrologueData): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) return;
  let gl: WebGL2RenderingContext | null = null;
  try { gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch { gl = null; }
  if (!gl) return;
  const ctx = gl;
  const later = (fn: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 600 }) : window.setTimeout(fn, 60));
  later(() => { build(root, canvas, ctx, data).catch(err => { console.error(err); toStatic(root, ctx); }); });
}

function toStatic(root: HTMLElement, gl: WebGL2RenderingContext): void {
  root.dataset.state = 'static';
  root.dispatchEvent(new CustomEvent('prologue:static'));
  if (!gl.isContextLost()) gl.getExtension('WEBGL_lose_context')?.loseContext();
}

function textPixels(label: string) {
  const cw = 1600, ch = 560, o = document.createElement('canvas');
  o.width = cw; o.height = ch;
  const g = o.getContext('2d')!;
  g.font = `700 470px Barlow, 'Arial Narrow', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  g.fillText(label, cw / 2, ch / 2);
  const img = g.getImageData(0, 0, cw, ch).data, px: number[] = [];
  for (let y = 0; y < ch; y += 2) for (let x = 0; x < cw; x += 2) if (img[(y * cw + x) * 4 + 3] > 128) px.push(x, y);
  return { px, cw, ch };
}

function program(gl: WebGL2RenderingContext, vs: string, fs: string): Prog {
  const p = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s) ?? 'shader');
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(p) ?? 'link');
  const cache = new Map<string, WebGLUniformLocation | null>();
  return { p, u: n => (cache.has(n) ? cache.get(n)! : (cache.set(n, gl.getUniformLocation(p, n)), cache.get(n)!)) };
}

async function build(root: HTMLElement, canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, data: PrologueData): Promise<void> {
  await Promise.race([document.fonts.load('700 400px Barlow'), new Promise(r => setTimeout(r, 1500))]);
  root.dataset.state = 'live'; // lays out the sticky stage so the canvas has a size
  const N = particleBudget(innerWidth, matchMedia('(pointer: coarse)').matches);
  const lite = N < 200000;
  root.dataset.particles = String(N);
  root.querySelector('[data-hud-count]')!.textContent = N.toLocaleString('en-US');
  const sx = Math.min(1, canvas.clientWidth / Math.max(1, canvas.clientHeight) / 1.5);
  const t = textPixels(data.label), rand = Math.random;
  const clouds: Cloud[] = [galaxy(N, rand), textFromPixels(t.px, t.cw, t.ch, N, rand, sx), terrain(N, data.heat, rand, sx), bars(N, data.nets, rand, sx)];

  const hdr = !!gl.getExtension('EXT_color_buffer_float');
  const pts = program(gl, POINT_VS, POINT_FS), bright = program(gl, QUAD_VS, BRIGHT_FS), blur = program(gl, QUAD_VS, BLUR_FS), comp = program(gl, QUAD_VS, COMP_FS);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const attr = (name: string, arr: Float32Array, size: number) => {
    const loc = gl.getAttribLocation(pts.p, name);
    if (loc < 0) return;
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  clouds.forEach((c, k) => { attr(`aP${k}`, c.pos, 3); attr(`aC${k}`, c.col, 3); });
  const seeds = new Float32Array(N); for (let i = 0; i < N; i++) seeds[i] = rand();
  attr('aSeed', seeds, 1);
  const quad = gl.createVertexArray();

  const makeTarget = (w: number, h: number): Target => {
    const tex = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, hdr ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, hdr ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    const fbo = gl.createFramebuffer()!; gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo, w, h };
  };
  let dpr = 1, W = 1, H = 1, aspect = 1;
  let T: Record<'scene' | 'h1' | 'h2' | 'q1' | 'q2', Target> | null = null;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, lite ? 1 : 1.5);
    W = Math.max(4, Math.round(canvas.clientWidth * dpr)); H = Math.max(4, Math.round(canvas.clientHeight * dpr));
    canvas.width = W; canvas.height = H; aspect = W / H;
    if (T) Object.values(T).forEach(x => { gl.deleteTexture(x.tex); gl.deleteFramebuffer(x.fbo); });
    T = { scene: makeTarget(W, H), h1: makeTarget(W >> 1, H >> 1), h2: makeTarget(W >> 1, H >> 1), q1: makeTarget(W >> 2, H >> 2), q2: makeTarget(W >> 2, H >> 2) };
  };
  size();
  addEventListener('resize', size);

  const pass = (prog: Prog, target: Target | null, tex: WebGLTexture, setup?: () => void) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, target ? target.w : W, target ? target.h : H);
    gl.useProgram(prog.p); gl.bindVertexArray(quad);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(prog.u('uTex'), 0);
    setup?.();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const blurPair = (a: Target, b: Target, spread: number) => {
    pass(blur, b, a.tex, () => gl.uniform2f(blur.u('uDir'), spread / a.w, 0));
    pass(blur, a, b.tex, () => gl.uniform2f(blur.u('uDir'), 0, spread / a.h));
  };

  // Scroll, pointer, click
  let state = 0, target = 0, dragYaw = 0, dragPitch = 0, mouseOn = 0, mouseOnTarget = 0, settled = 0, pulseStart = -99, boomStart = -99;
  let mouse: [number, number] = [9, 9], boom: [number, number] = [9, 9];
  let drag: { x: number; y: number; yaw: number; pitch: number; moved: boolean } | null = null;
  const onScroll = () => { const r = root.getBoundingClientRect(); target = stateFromScroll(r.top, r.height, innerHeight); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll(); state = target;
  const toNdc = (e: PointerEvent): [number, number] => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)]; };
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: dragYaw, pitch: dragPitch, moved: false }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    mouse = toNdc(e);
    if (drag) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) { drag.moved = true; canvas.classList.add('drag'); mouseOnTarget = 0; }
      if (drag.moved) { dragYaw = drag.yaw + (e.clientX - drag.x) * 0.006; dragPitch = Math.max(-0.5, Math.min(0.7, drag.pitch + (e.clientY - drag.y) * 0.004)); }
    } else mouseOnTarget = 1;
  });
  canvas.addEventListener('pointerup', e => { if (drag && !drag.moved) { boom = toNdc(e); boomStart = performance.now() / 1000; } drag = null; canvas.classList.remove('drag'); });
  canvas.addEventListener('pointerleave', () => (mouseOnTarget = 0));

  const caps = [...root.querySelectorAll<HTMLElement>('[data-cap]')];
  const fpsEl = root.querySelector<HTMLElement>('[data-hud-fps]')!;
  let drawCount = N, b1Gain = lite ? 0 : 0.5, stopped = false, visible = true, raf = 0;
  let probe = 0, probeStart = 0, frames = 0, last = performance.now();
  const stop = () => { stopped = true; cancelAnimationFrame(raf); };
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); toStatic(root, gl); });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !stopped && !raf) raf = requestAnimationFrame(frame); }).observe(root);

  function frame(nowMs: number) {
    raf = 0;
    if (stopped || !visible || !T) return;
    const now = nowMs / 1000;
    state += (target - state) * 0.06;
    mouseOn += (mouseOnTarget - mouseOn) * 0.1;
    if (!drag) { dragYaw *= 0.985; dragPitch *= 0.985; }
    const near = Math.round(state);
    if (Math.abs(state - near) < 0.03 && near !== settled) { settled = near; pulseStart = now; }
    const c = cam(state);

    gl.bindFramebuffer(gl.FRAMEBUFFER, T.scene.fbo); gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(pts.p); gl.bindVertexArray(vao);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.disable(gl.DEPTH_TEST);
    const u = pts.u;
    gl.uniform1f(u('uState'), state); gl.uniform1f(u('uTime'), now); gl.uniform1f(u('uAspect'), aspect); gl.uniform1f(u('uDpr'), dpr);
    gl.uniform1f(u('uYaw'), c.yaw + dragYaw + Math.sin(now * 0.25) * 0.08); gl.uniform1f(u('uPitch'), c.pitch + dragPitch); gl.uniform1f(u('uDist'), c.dist);
    gl.uniform2f(u('uMouse'), mouse[0], mouse[1]); gl.uniform1f(u('uMouseOn'), mouseOn); gl.uniform1f(u('uGain'), lite ? 0.26 : 0.13);
    gl.uniform1f(u('uPulse'), now - pulseStart); gl.uniform2f(u('uBoom'), boom[0], boom[1]); gl.uniform1f(u('uBoomT'), now - boomStart);
    gl.drawArrays(gl.POINTS, 0, drawCount);
    gl.disable(gl.BLEND);

    pass(bright, T.h1, T.scene.tex);
    if (b1Gain > 0) { blurPair(T.h1, T.h2, 1.0); blurPair(T.h1, T.h2, 2.0); }
    pass(blur, T.q1, T.h1.tex, () => gl.uniform2f(blur.u('uDir'), 0, 0));
    blurPair(T.q1, T.q2, 1.5); blurPair(T.q1, T.q2, 3.0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(comp.p); gl.bindVertexArray(quad);
    [T.scene, T.h1, T.q1].forEach((x, k) => { gl.activeTexture(gl.TEXTURE0 + k); gl.bindTexture(gl.TEXTURE_2D, x.tex); });
    gl.uniform1i(comp.u('uScene'), 0); gl.uniform1i(comp.u('uB1'), 1); gl.uniform1i(comp.u('uB2'), 2);
    gl.uniform1f(comp.u('uTime'), now); gl.uniform2f(comp.u('uRes'), W, H); gl.uniform1f(comp.u('uB1Gain'), b1Gain);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    caps.forEach((el, k) => { const v = Math.max(0, 1 - Math.abs(state - k) * 2.2); el.style.opacity = String(v); el.style.transform = `translateY(${(1 - v) * 16}px)`; });
    root.dataset.chapter = String(near);

    // Probe the frame rate once (frames 10–100 while visible), then step down if the device struggles.
    if (probe < 100) {
      probe++;
      if (probe === 10) probeStart = nowMs;
      if (probe === 100) {
        const q = decideQuality(90000 / Math.max(1, nowMs - probeStart));
        root.dataset.quality = q;
        if (q === 'static') { stop(); toStatic(root, gl); return; }
        if (q === 'reduced') { drawCount = N >> 1; b1Gain = 0; }
      }
    }
    frames++;
    if (nowMs - last > 500) { fpsEl.textContent = String(Math.round(frames * 1000 / (nowMs - last))); frames = 0; last = nowMs; }
    raf = requestAnimationFrame(frame);
  }
  canvas.dataset.ready = '';
  raf = requestAnimationFrame(frame);
}
