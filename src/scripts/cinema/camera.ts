/** Camera path through the prologue: one keyframe per shape; between shapes it swoops (dist dips) and swings (yaw arcs). */
export interface Cam { yaw: number; pitch: number; dist: number }

export const CAM: Cam[] = [
  { yaw: 0.4, pitch: 0.62, dist: 5.2 },   // galaxy, from above
  { yaw: 0, pitch: 0, dist: 3.2 },        // the number, face on
  { yaw: -0.38, pitch: 0.58, dist: 2.75 }, // terrain, looking down the ridges
  { yaw: 0.28, pitch: 0.1, dist: 3.3 },   // bars
];
export const DIVE = [1.0, 1.9, 1.1];
export const SWING = [0, 0.9, -0.5];

const smooth = (t: number) => t * t * (3 - 2 * t);

export function cam(state: number): Cam {
  const s = Math.min(3, Math.max(0, state));
  const i = Math.min(2, Math.floor(s)), f = Math.min(1, s - i), t = smooth(f), a = CAM[i], b = CAM[i + 1], arc = Math.sin(Math.PI * f);
  return { yaw: a.yaw + (b.yaw - a.yaw) * t + SWING[i] * arc, pitch: a.pitch + (b.pitch - a.pitch) * t, dist: a.dist + (b.dist - a.dist) * t - DIVE[i] * arc };
}

/** How far the prologue has been scrolled (its top, its height, the viewport height) → story state 0–3. */
export function stateFromScroll(top: number, height: number, viewport: number): number {
  return Math.max(0, Math.min(1, -top / Math.max(1, height - viewport))) * 3;
}
