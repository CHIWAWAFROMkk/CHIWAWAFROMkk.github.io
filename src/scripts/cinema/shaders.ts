/** Point sprites: each particle mixes four shape positions/colours by the story state, flies on a curl between shapes,
 *  rides the chapter shockwave, swirls round the pointer and blasts away from a click. */
export const POINT_VS = `#version 300 es
precision highp float;
in vec3 aP0, aP1, aP2, aP3;
in vec3 aC0, aC1, aC2, aC3;
in float aSeed;
uniform float uState, uTime, uAspect, uDpr, uYaw, uPitch, uDist, uMouseOn, uGain, uPulse, uBoomT;
uniform vec2 uMouse, uBoom;
out vec3 vColor;
float ease(float t) { return t * t * (3.0 - 2.0 * t); }
float seg(float k) { return ease(clamp((uState - k - aSeed * 0.35) / 0.65, 0.0, 1.0)); }
void main() {
  float t0 = seg(0.0), t1 = seg(1.0), t2 = seg(2.0);
  float spin = uTime * 0.12 + 0.6 * (1.0 - length(aP0.xz) / 3.3);
  vec3 g = vec3(cos(spin) * aP0.x - sin(spin) * aP0.z, aP0.y, sin(spin) * aP0.x + cos(spin) * aP0.z);
  vec3 p = mix(mix(mix(g, aP1, t0), aP2, t1), aP3, t2);
  vec3 c = mix(mix(mix(aC0, aC1, t0), aC2, t1), aC3, t2);
  float fly = t0 * (1.0 - t0) + t1 * (1.0 - t1) + t2 * (1.0 - t2);
  float a = aSeed * 6.2831 + uTime * 0.7;
  vec3 curl = vec3(sin(a * 1.3 + p.y * 3.1) + 0.5 * sin(p.z * 5.0 + uTime),
                   cos(a * 0.9 + p.x * 2.3) + 0.5 * cos(p.x * 4.0 - uTime * 1.3),
                   sin(a + p.z * 4.2) + 0.5 * sin(p.y * 6.0 + uTime * 0.8));
  p += fly * 2.4 * curl;
  p += 0.006 * vec3(sin(uTime * 1.3 + aSeed * 40.0), cos(uTime * 1.1 + aSeed * 31.0), sin(uTime * 0.9 + aSeed * 17.0));
  float wave = uPulse * 2.6;
  float ring = exp(-pow(length(p.xy) - wave, 2.0) * 14.0) * exp(-uPulse * 1.4);
  p += normalize(p + 1e-4) * ring * 0.16;
  float cy = cos(uYaw), sy = sin(uYaw), cp = cos(uPitch), sp = sin(uPitch);
  vec3 q = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  q = vec3(q.x, cp * q.y - sp * q.z, sp * q.y + cp * q.z);
  q.z -= uDist;
  float w = -q.z;
  if (w < 0.18) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vColor = vec3(0.0); return; }
  vec2 ndc = vec2(q.x * 1.6 / uAspect, q.y * 1.6) / w;
  vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
  float r = max(length(d), 1e-4), fall = uMouseOn * smoothstep(0.34, 0.0, r);
  vec2 dir = d / r, tang = vec2(-dir.y, dir.x);
  ndc += (dir * 0.10 + tang * 0.16) * fall * vec2(1.0 / uAspect, 1.0);
  vec2 bd = (ndc - uBoom) * vec2(uAspect, 1.0);
  float br = max(length(bd), 1e-4), boom = exp(-uBoomT * 2.2) * smoothstep(1.1, 0.0, br) * step(0.0, uBoomT);
  ndc += (bd / br) * boom * (0.35 + aSeed * 0.5) * vec2(1.0 / uAspect, 1.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
  gl_PointSize = min(uDpr * (1.4 + 2.6 * fly) * (3.2 / w), 14.0 * uDpr);
  vColor = c * uGain * (1.0 + 0.8 * fly + ring * 6.0 + boom * 3.0) * smoothstep(0.25, 1.6, w);
}`;

export const POINT_FS = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 o;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d);
  if (r > 0.25) discard;
  o = vec4(vColor * smoothstep(0.25, 0.0, r), 1.0);
}`;

export const QUAD_VS = `#version 300 es
out vec2 vUv;
void main() { vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0); vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

export const BRIGHT_FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTex; out vec4 o;
void main() { vec3 c = texture(uTex, vUv).rgb; float b = max(c.r, max(c.g, c.b)); o = vec4(c * smoothstep(0.45, 1.6, b), 1.0); }`;

export const BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTex; uniform vec2 uDir; out vec4 o;
void main() {
  vec3 c = texture(uTex, vUv).rgb * 0.227027;
  c += (texture(uTex, vUv + uDir * 1.3846).rgb + texture(uTex, vUv - uDir * 1.3846).rgb) * 0.3162162;
  c += (texture(uTex, vUv + uDir * 3.2308).rgb + texture(uTex, vUv - uDir * 3.2308).rgb) * 0.0702703;
  o = vec4(c, 1.0);
}`;

/** Tone map (ACES), chromatic fringe, vignette and film grain over the night background. */
export const COMP_FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uScene, uB1, uB2; uniform float uTime, uB1Gain; uniform vec2 uRes; out vec4 o;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec2 d = vUv - 0.5; float ca = 0.004 * length(d);
  vec3 s = vec3(texture(uScene, vUv + d * ca * 2.0).r, texture(uScene, vUv).g, texture(uScene, vUv - d * ca * 2.0).b);
  vec3 b = texture(uB1, vUv).rgb * uB1Gain + texture(uB2, vUv).rgb * 0.8;
  vec3 c = aces((s + b) * 0.9) + vec3(0.039, 0.035, 0.031);
  c *= mix(0.62, 1.0, smoothstep(0.9, 0.3, length(d)));
  c += (hash(vUv * uRes + fract(uTime * 7.0) * 91.0) - 0.5) * 0.04;
  o = vec4(c, 1.0);
}`;
