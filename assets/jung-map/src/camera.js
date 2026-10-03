import { overviewPose, stationCameraPose, flyPose, fitOverviewDist } from './layout.js';

// 全图：拖动旋转、滚轮/双指缩放、空闲自转；站内：固定在站前；两者之间用弧线飞行。
export function createController({ camera, canvas, count, reduced, getView, onFocus, onPick }) {
  const s = { mode: 'overview', focus: -1, yaw: 0.9, pitch: 0.62, dist: 84, userZoom: false, idleMs: 0, flight: null, drag: null, after: 'overview' };
  const fit = () => fitOverviewDist(getView().aspect);
  const maxDist = () => Math.max(150, fit() * 1.3);
  let cur = overviewPose(s.yaw, s.pitch, s.dist);

  function fly(to, dur, after, focus) {
    s.focus = focus; s.after = after; onFocus(focus);
    if (reduced) { cur = to; s.mode = after; s.flight = null; return; }
    s.flight = { from: cur, to, t: 0, dur }; s.mode = 'fly';
  }

  const api = {
    state: s,
    goTo(i) {
      if (!Number.isInteger(i) || i < 0 || i >= count) return;
      if (s.mode === 'station' && s.focus === i && !s.flight) return;
      fly(stationCameraPose(i, getView()), 2.2, 'station', i);
    },
    overview() {
      if (s.mode === 'overview' && !s.flight) return;
      if (!s.userZoom) s.dist = fit();
      s.idleMs = 0;
      fly(overviewPose(s.yaw, s.pitch, s.dist), 2.0, 'overview', -1);
    },
    next() { api.goTo(s.focus < 0 ? 0 : Math.min(count - 1, s.focus + 1)); },
    prev() { if (s.focus > 0) api.goTo(s.focus - 1); },
    update(dt) {
      if (s.flight) {
        s.flight.t += dt / s.flight.dur;
        const t = Math.min(1, s.flight.t);
        cur = flyPose(s.flight.from, s.flight.to, t);
        if (t >= 1) { cur = s.flight.to; s.mode = s.after; s.flight = null; }
      } else if (s.mode === 'overview') {
        if (!s.userZoom) s.dist = fit();                 // 没手动缩放过：随窗口宽高比自动取景
        s.idleMs += dt * 1000;
        if (!reduced && !s.drag && s.idleMs > 2500) s.yaw += dt * 0.05;
        cur = overviewPose(s.yaw, s.pitch, s.dist);
      } else if (s.mode === 'station') {
        cur = stationCameraPose(s.focus, getView());     // 窗口尺寸或方向变化后重新取位
      }
      camera.position.set(cur.pos.x, cur.pos.y, cur.pos.z);
      camera.lookAt(cur.target.x, cur.target.y, cur.target.z);
    },
  };

  // 指针：单指/鼠标拖动旋转，双指捏合缩放；触屏的点击容差比鼠标大
  const pointers = new Map();
  let pinch = null, pinched = false;
  const span = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
  const slop = e => (e.pointerType === 'touch' ? 12 : 6);

  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture?.(e.pointerId);
    s.idleMs = 0;
    if (pointers.size === 2) { pinch = { d0: span(), dist0: s.dist }; pinched = true; s.drag = null; }
    else if (pointers.size === 1) { pinched = false; s.drag = { x: e.clientX, y: e.clientY, moved: 0 }; }
  });
  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    s.idleMs = 0;
    if (pointers.size === 2 && pinch) {
      if (s.mode === 'overview') { s.dist = Math.max(45, Math.min(maxDist(), pinch.dist0 * pinch.d0 / span())); s.userZoom = true; }
      return;
    }
    if (!s.drag) return;
    const dx = e.clientX - s.drag.x, dy = e.clientY - s.drag.y;
    s.drag.moved += Math.abs(dx) + Math.abs(dy); s.drag.x = e.clientX; s.drag.y = e.clientY;
    if (s.mode === 'overview') { s.yaw -= dx * 0.006; s.pitch = Math.max(-0.2, Math.min(1.2, s.pitch + dy * 0.004)); }
  });
  const end = (e, click) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    const d = s.drag;
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) {
      s.drag = null;
      if (click && d && !pinched && d.moved < slop(e) && s.mode === 'overview') onPick(e.clientX, e.clientY);
    }
  };
  canvas.addEventListener('pointerup', e => end(e, true));
  canvas.addEventListener('pointercancel', e => end(e, false));
  canvas.addEventListener('wheel', e => {
    if (s.mode !== 'overview') return;
    e.preventDefault();
    s.dist = Math.max(45, Math.min(maxDist(), s.dist * Math.exp(e.deltaY * 0.001))); s.userZoom = true; s.idleMs = 0;
  }, { passive: false });
  return api;
}
