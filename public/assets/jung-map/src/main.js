import { stationPosition, emotionPositions, stageLayout, pickNode } from './layout.js';
import { chooseTier } from './tier.js';
import { loadContent } from './content.js';
import { sampleTargets } from './targets.js';
import { buildStory, updateStory } from './story.js';
import { createNodes } from './nodes.js';
import { createFields } from './particles.js';
import { createPost } from './post.js';
import { createRoute } from './route.js';
import { createController } from './camera.js';
import { createUI } from './ui.js';

const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let tier = chooseTier({
  webgl2: !!document.createElement('canvas').getContext('webgl2'),
  reducedMotion: reduced,
  coarse: matchMedia('(pointer: coarse)').matches,
  cores: navigator.hardwareConcurrency || 4,
  override: params.get('tier'),
});
const local = ['localhost', '127.0.0.1'].includes(location.hostname);

const api = { tier, state: null, goTo: () => {}, overview: () => {}, screenOf: () => null, focus: -1 };
window.__jung = api;

const done = mode => { api.tier = tier = mode; document.documentElement.dataset.mode = mode; document.getElementById('loading')?.remove(); };
const fail = msg => { const e = document.getElementById('err'); e.textContent = msg; e.hidden = false; };

try {
  const stations = await loadContent('./content/public.content.json', { draft: local });
  const res = await fetch('./assets/manifest.json');
  if (!res.ok) throw new Error(`manifest 加载失败：${res.status}`);
  const manifest = await res.json();
  buildStory(stations, manifest.images);
  if (tier === 'none') {
    done('none');
  } else {
    try {
      await start(stations, manifest);
      done(tier);
    } catch (e) {
      console.warn('三维视图启动失败，改用静态版：', e);
      fail('三维视图暂时无法加载，已切换为静态阅读版。');
      done('none');
    }
  }
} catch (e) {
  console.warn(e);
  fail('内容加载失败，请稍后重试。');
  done('none');
}

async function loadSelfTargets(manifest, count) {
  if (!manifest.images.includes('K6')) return null;
  const img = new Image(); img.src = './assets/K6.webp'; await img.decode();
  const c = document.createElement('canvas'); c.width = 320; c.height = 180;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, 320, 180);
  return sampleTargets(g.getImageData(0, 0, 320, 180).data, 320, 180, count, { threshold: 0.2, seed: 7 });
}

async function start(stations, manifest) {
  const THREE = await import('../vendor/three.module.min.js');
  THREE.ColorManagement.enabled = false;
  const canvas = document.getElementById('stage');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070f);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 600);

  const count = stations.length;
  const particleCount = tier === 'high' ? 12000 : 4000;
  const nodes = await createNodes(THREE, scene, stations, manifest.images, reduced);
  const fields = createFields(THREE, scene, tier, await loadSelfTargets(manifest, particleCount), reduced,
    stations.map(s => s.keyframes.some(k => manifest.images.includes(k))));
  const route = createRoute(THREE, scene, tier);
  const post = tier === 'high' ? createPost(THREE, renderer) : null;

  const focus = new Array(count).fill(0);       // 每站聚焦度 0..1
  const visited = new Set();
  const screen = stations.map(() => ({ x: 0, y: 0, visible: false }));
  const emoScreen = stations.map(s => s.emotions.map(() => ({ x: 0, y: 0, visible: false })));
  const v = new THREE.Vector3();
  const project = (p, out) => {
    v.set(p.x, p.y, p.z).project(camera);
    out.x = (v.x * 0.5 + 0.5) * innerWidth; out.y = (-v.y * 0.5 + 0.5) * innerHeight;
    out.visible = v.z > -1 && v.z < 1 && out.x > -50 && out.x < innerWidth + 50 && out.y > -50 && out.y < innerHeight + 50;
  };
  // 文字面板的实际高度：上下布局时，画面只能用面板上方的空间
  const stationEls = [...document.querySelectorAll('#story .station')];
  let textH = 0;
  const getView = () => ({ aspect: camera.aspect, vw: innerWidth, vh: innerHeight, textH });

  const controller = createController({
    camera, canvas, count, reduced, getView,
    onFocus: i => { if (i >= 0) visited.add(i); },
    onPick: (x, y) => { const i = pickNode(screen, x, y, 40); if (i >= 0) controller.goTo(i); },
  });
  const ui = createUI({ stations, controller });
  ui.miniEl.addEventListener('click', e => { const i = ui.minimapPick(e.clientX, e.clientY); if (i >= 0) controller.goTo(i); });

  Object.assign(api, {
    state: controller.state, goTo: i => controller.goTo(i), overview: () => controller.overview(),
    screenOf: i => ({ ...screen[i] }),
  });
  // Object.assign 会把 getter 求值成一个固定值，这里必须用 defineProperty 保留实时读取
  Object.defineProperty(api, 'focus', { get: () => controller.state.focus, configurable: true });

  const resize = () => {
    renderer.setPixelRatio(Math.min(devicePixelRatio, tier === 'high' ? 1.5 : 1));
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); post?.resize();
    textH = Math.max(0, ...stationEls.map(el => el.offsetHeight));
  };
  addEventListener('resize', resize); resize();

  let last = performance.now(), time = 0, reveal = reduced ? 1 : 0;
  const tick = now => {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    if (!reduced) time += dt;                                         // 减少动态：冻结装饰性动画的时间
    reveal = reduced ? 1 : Math.min(1, reveal + dt / 3.5);            // 开场组装
    const st = controller.state;
    controller.update(dt);
    for (let i = 0; i < count; i++) {                                 // 聚焦度：飞向某站时升高，离开时降低
      const goal = st.focus === i ? 1 : 0, rate = reduced ? 1 : 2.2 * dt;
      focus[i] += Math.max(-rate, Math.min(rate, goal - focus[i]));
    }
    const view = getView(), layout = stageLayout(view.aspect, view.vw, view.vh);
    const arrival = st.focus >= 0 ? focus[st.focus] : 0;
    const beaconIndex = st.focus >= 0 ? st.focus : ([...Array(count).keys()].find(i => !visited.has(i)) ?? -1);
    const curT = st.focus >= 0 ? st.focus / (count - 1) : 0;

    route.update({ time, reveal, curT });
    nodes.update({ focus, camera, layout, time, dt, beaconIndex });   // dt 始终是真实时间，停留触发的内容在减少动态下也会出现
    fields.update({ focus, camera, layout, time, dt });
    updateStory(st.focus >= 0 && st.mode !== 'overview' ? { index: st.focus, weight: arrival } : { index: -1, weight: 0 });

    camera.updateMatrixWorld();
    stations.forEach((_, i) => project(stationPosition(i), screen[i]));
    emoScreen.forEach(list => list.forEach(o => { o.visible = false; }));
    if (st.focus >= 0) emotionPositions(st.focus, stations[st.focus].emotions.length, layout).forEach((p, k) => project(p, emoScreen[st.focus][k]));
    ui.update({ screen, emoScreen, focus: st.focus, mode: st.mode, visited, arrival });

    post ? post.render(scene, camera, time) : renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(tick);

  // 嵌在作品集页面里时，父页面会告诉我们是否在视口内：离屏就停止绘制，回来时从原状态继续（相机与已访问记录都保留）
  let paused = false;
  const setPaused = p => {
    if (p === paused) return;
    paused = p;
    if (p) renderer.setAnimationLoop(null);
    else { last = performance.now(); renderer.setAnimationLoop(tick); }
  };
  addEventListener('message', e => {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'jung-map:visibility') return;
    setPaused(!e.data.visible);
  });
  Object.defineProperty(api, 'paused', { get: () => paused, configurable: true });
}
