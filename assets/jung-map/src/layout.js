export const STATION_IDS = ['persona', 'gaze', 'projection', 'complex', 'shadow', 'anima', 'self'];
const N = STATION_IDS.length;
export const HEIGHT = 34;
export const R_OUT = 42;
const TURNS = 1.15;
export const CENTER = { x: 0, y: 0 - HEIGHT / 2, z: 0 };

export const clamp01 = x => Math.min(1, Math.max(0, x));
export const easeInOut = t => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const lerp = (a, b, t) => a + (b - a) * t;
export const FOV = 50;
export const TAN = Math.tan((FOV / 2) * Math.PI / 180);

// 全图的默认距离：竖屏时拉远，保证螺旋外沿（半径 R_OUT）完整落在可见宽度内
export const fitOverviewDist = aspect => Math.max(84, (R_OUT * 1.15) / (TAN * aspect));

// 窄屏顶部要给小地图与站点条留出空间
export const topMarginPx = vw => (vw <= 700 ? 112 : 12);

// 与 three.js 相机 lookAt（up = +y）一致的投影，返回归一化设备坐标（可见范围 [-1,1]）
export function projectPoint(p, pose, aspect) {
  const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
  const norm = a => { const l = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / l, y: a.y / l, z: a.z / l }; };
  const f = norm(sub(pose.target, pose.pos)), r = norm(cross(f, { x: 0, y: 1, z: 0 })), u = cross(r, f);
  const d = sub(p, pose.pos), z = dot(d, f);
  if (z <= 0) return { x: Infinity, y: Infinity, z };
  return { x: dot(d, r) / (z * TAN * aspect), y: dot(d, u) / (z * TAN), z };
}

export function spiralPoint(t) {
  const u = clamp01(t);
  const a = u * TURNS * 2 * Math.PI + 0.6;
  const r = R_OUT * Math.pow(1 - u, 0.7);
  return { x: Math.cos(a) * r, y: 0 - u * HEIGHT, z: Math.sin(a) * r };
}
export const stationPosition = i => spiralPoint(i / (N - 1));

export function outward(i) {
  const p = stationPosition(i), len = Math.hypot(p.x, p.z);
  return len < 1e-6 ? { x: 0, z: 1 } : { x: p.x / len, z: p.z / len };
}
const rightOf = n => ({ x: n.z, z: 0 - n.x });

// 站内：画面靠右、文字在左，仅当文字（最宽 480px，左边距 5vw 夹在 16–64px）与画面在像素上不相交时成立。
// 画面基准尺寸 14.2 x 8、相机距离 14、fov 50（可见半宽 = 6.53 * aspect，可见宽 = 13.06 * aspect）。
export function sideFits(aspect, vw, vh) {
  if (aspect < 1.6 || vh < 520) return false;
  const W = 13.06 * aspect;
  const paintLeftPx = vw * (1 - 11.76 / W);
  const textRightPx = Math.max(16, Math.min(64, 0.05 * vw)) + Math.min(480, vw - 32);
  return paintLeftPx >= textRightPx + 24;
}

export function stageLayout(aspect, vw = 1920, vh = 1080, textH = 0) {
  const visHalfW = 6.53 * aspect;
  if (sideFits(aspect, vw, vh)) {
    const scale = 0.8;
    return { x: visHalfW - 7.1 * scale - 0.4, y: 0.4, scale };
  }
  let scale = Math.min(0.8, (visHalfW * 2 * 0.94) / 14.2), y = 2.6;
  if (textH > 0) {
    // 上下布局：画面只用文字面板上方的空间（文字面板底边距与 CSS 的 clamp(1rem,8vh,4rem) 一致）
    const u = 13.06 / vh, top = topMarginPx(vw);
    const textTopPx = vh - Math.max(16, Math.min(0.08 * vh, 64)) - textH;
    const availPx = Math.max(0, textTopPx - top);
    scale = Math.max(0.3, Math.min(scale, (availPx * u) / 8));
    y = Math.min((vh / 2 - (top + availPx / 2)) * u, 6.53 - 4 * scale);
  }
  return { x: 0, y, scale };
}

export function stationCameraPose(i, view, dist = 14) {
  const P = stationPosition(i), n = outward(i), r = rightOf(n), L = stageLayout(view.aspect, view.vw, view.vh, view.textH || 0);
  return {
    pos: { x: P.x + n.x * dist, y: P.y, z: P.z + n.z * dist },
    target: { x: P.x - r.x * L.x, y: P.y - L.y, z: P.z - r.z * L.x },
  };
}

export function overviewPose(yaw, pitch, dist) {
  const cp = Math.cos(pitch);
  return {
    pos: { x: CENTER.x + Math.sin(yaw) * cp * dist, y: CENTER.y + Math.sin(pitch) * dist, z: CENTER.z + Math.cos(yaw) * cp * dist },
    target: { ...CENTER },
  };
}

export function flyPose(a, b, t, arc = 10) {
  const e = easeInOut(t);
  const mix = (p, q) => ({ x: lerp(p.x, q.x, e), y: lerp(p.y, q.y, e), z: lerp(p.z, q.z, e) });
  const pos = mix(a.pos, b.pos);
  pos.y += Math.sin(Math.PI * e) * arc;
  return { pos, target: mix(a.target, b.target) };
}

// 情绪词排在画面上沿的带状区域里，随画面的位置与大小走，保证在任何视口下都落在屏幕内
export function emotionPositions(i, count, layout) {
  const P = stationPosition(i), n = outward(i), r = rightOf(n);
  const w = 14.2 * layout.scale, cy = 4 * layout.scale - 0.8 * layout.scale;
  return Array.from({ length: count }, (_, k) => {
    const cx = ((k + 1) / (count + 1) - 0.5) * w * 0.9;
    return { x: P.x + r.x * cx + n.x * 0.5, y: P.y + cy - (k % 2) * 1.1 * layout.scale, z: P.z + r.z * cx + n.z * 0.5 };
  });
}

export const minimapPoint = p => ({ x: (p.x / R_OUT) * 0.46 + 0.5, y: (p.z / R_OUT) * 0.46 + 0.5 });

export function pickNode(points, x, y, radius = 36) {
  let best = -1, bd = radius;
  points.forEach((p, i) => {
    if (!p || !p.visible) return;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}
