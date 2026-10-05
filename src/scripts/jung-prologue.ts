/** The Jung page's opening: the film's keyframes composited live in WebGL2 — the same idea as the film's renderer
 *  (two layers, crossfade or push-through, slow push-in), plus a little paint grain and a vignette.
 *  Falls back to the still picture when motion is reduced, WebGL2 is missing, the context is lost, or the device is slow. */
import { shotAt, segmentProgress } from './jung-prologue-timeline';
import { frameCap } from './frame-cap';
import { PROBE_START, probeStep, decideQuality, type Probe } from './cinema/quality';

interface Frame { src: string; quote?: { zh: string; en: string } }

const VERT = `#version 300 es
in vec2 p;
out vec2 vUv;
void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uA, uB;
uniform float uMix, uZoomA, uZoomB, uCanvasAspect, uImgAspect, uTime;
vec2 cover(vec2 p, float zoom) {
  vec2 uv = p;
  if (uCanvasAspect > uImgAspect) uv.y = (p.y - 0.5) * (uImgAspect / uCanvasAspect) + 0.5;
  else uv.x = (p.x - 0.5) * (uCanvasAspect / uImgAspect) + 0.5;
  return (uv - 0.5) / zoom + 0.5;
}
float hash(vec2 q) { return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 a = texture(uA, cover(vUv, uZoomA)).rgb;
  vec3 b = texture(uB, cover(vUv, uZoomB)).rgb;
  vec3 col = mix(a, b, uMix);
  vec2 c = (vUv - 0.5) * vec2(uCanvasAspect, 1.0);
  col *= mix(0.42, 1.0, smoothstep(1.05, 0.25, length(c)));         // vignette
  col *= 0.86;                                                       // keep the text above readable; never brighter than the film
  col += (hash(vUv * 900.0 + floor(uTime * 12.0)) - 0.5) * 0.035;    // paint grain
  outColor = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  await img.decode();
  return img;
}

export async function startJungPrologue(root: HTMLElement, frames: Frame[], lang: 'zh' | 'en'): Promise<void> {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;          // stays on the still picture
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const qEn = root.querySelector<HTMLElement>('[data-q="en"]'), qZh = root.querySelector<HTMLElement>('[data-q="zh"]');
  const bars = [...root.querySelectorAll<HTMLElement>('[data-jp-bar] b')];
  const fpsEl = root.querySelector<HTMLElement>('[data-jp-fps]');
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return;

  let images: HTMLImageElement[];
  try { images = await Promise.all(frames.map(f => loadImage(f.src))); } catch { return; }

  let program: WebGLProgram;
  try {
    program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  } catch { return; }
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const textures = images.map(img => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  });
  const u = (name: string) => gl.getUniformLocation(program, name);
  const U = { a: u('uA'), b: u('uB'), mix: u('uMix'), za: u('uZoomA'), zb: u('uZoomB'), ca: u('uCanvasAspect'), ia: u('uImgAspect'), time: u('uTime') };
  gl.uniform1i(U.a, 0);
  gl.uniform1i(U.b, 1);
  gl.uniform1f(U.ia, images[0].naturalWidth / images[0].naturalHeight);

  let scale = 1;                                   // drops to 0.6 on a slow device
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2) * scale;
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  let visible = true, stopped = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(root);
  const toStatic = () => { stopped = true; root.dataset.state = 'static'; };
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); toStatic(); });

  const cap = frameCap(60);
  let clock = 0, last = performance.now(), lastQuote = -1, probe: Probe = PROBE_START, frames60 = 0, fpsT = 0;
  // A line rises into place as it appears: the English first, the Chinese a beat later (Chinese page only).
  const place = (el: HTMLElement | null, q: number) => {
    if (!el) return;
    el.style.opacity = q.toFixed(3);
    el.style.transform = `translateY(${((1 - q) * 10).toFixed(2)}px)`;
    el.style.letterSpacing = `${((1 - q) * 0.06).toFixed(4)}em`;
  };

  const draw = (now: number) => {
    if (stopped) return;
    requestAnimationFrame(draw);
    const dtMs = now - last;
    if (!visible || document.hidden) { last = now; return; }        // paused: the clock does not advance offscreen
    if (!cap(now)) return;
    last = now;
    clock += Math.min(dtMs, 100) / 1000;

    const r = probeStep(probe, dtMs);
    probe = r.next;
    if (r.fps !== null) {
      const q = decideQuality(r.fps);
      if (q === 'static') { toStatic(); return; }
      if (q === 'reduced') { scale = 0.6; resize(); }
    }

    const s = shotAt(clock, frames.length);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, textures[s.a]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, textures[s.b]);
    gl.uniform1f(U.mix, s.mix);
    gl.uniform1f(U.za, s.zoomA);
    gl.uniform1f(U.zb, s.zoomB);
    gl.uniform1f(U.ca, canvas.width / canvas.height);
    gl.uniform1f(U.time, clock);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (s.a !== lastQuote) {
      const q = frames[s.a].quote;
      if (qEn) qEn.textContent = q ? q.en : '';
      if (qZh) qZh.textContent = q && lang === 'zh' ? q.zh : '';
      lastQuote = s.a;
    }
    {
      const q = frames[s.a].quote ? s.quote : 0;
      place(qEn, q);
      place(qZh, Math.min(1, Math.max(0, q * 1.35 - 0.35)));
      segmentProgress(clock, frames.length).forEach((v, i) => { if (bars[i]) bars[i].style.transform = `scaleX(${v.toFixed(4)})`; });
    }
    root.dataset.shot = String(s.a);
    if (root.dataset.state !== 'live') { root.dataset.state = 'live'; canvas.dataset.ready = ''; }

    frames60++; fpsT += dtMs;
    if (fpsEl && fpsT >= 500) { fpsEl.textContent = String(Math.round((frames60 * 1000) / fpsT)); frames60 = 0; fpsT = 0; }
  };
  requestAnimationFrame(draw);
}
