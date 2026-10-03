import { stationPosition } from './layout.js';

const VERT = `
attribute vec3 aSeed; attribute vec3 aTarget;
uniform float uTime, uWeight, uConverge, uKind, uSize;
varying vec3 vCol; varying float vShade;
float h(float x){ return fract(sin(x*127.1)*43758.5453); }
vec3 behave(float k, vec3 s, float t){
  vec3 p = s * 6.;
  if (k < .5) {            // 人格面具：整齐的阵列，轻微漂移
    p = vec3(floor(s.x*5.+.5)*1.8, floor(s.y*3.+.5)*1.5, 0.)
      + (vec3(h(s.y*13.+s.z*7.), h(s.x*11.+s.z*5.), h(s.x*3.+s.y*17.)) - .5) * vec3(.3,.3,.5);
    p.x += sin(t*.4 + s.y*9.)*.08; p.y += sin(t*.3 + s.x*9.)*.08;
  } else if (k < 1.5) {    // 他者的凝视：向中心旋转收拢的漩涡
    float r = 6.*fract(length(s.xy)*.9 - t*.07);
    float a = atan(s.y, s.x) + t*.25 + 2./(r+.5);
    p = vec3(cos(a)*r, sin(a)*r*.6, s.z*1.5);
  } else if (k < 2.5) {    // 投射：一团被另一团缓慢吸走
    vec3 A = vec3(-4.,0.,0.) + normalize(s+.001)*2.*h(s.x+s.y);
    vec3 B = vec3(4.,.5,-1.) + normalize(s.zyx+.001)*2.*h(s.z+s.y);
    float pull = smoothstep(0.,1., fract(t*.12 + (s.x*.5+.5)*.8)*1.3 - .2);
    p = mix(A, B, pull);
  } else if (k < 3.5) {    // 情结：缓慢收紧，随后崩开
    float ph = fract(t/7.);
    float c = ph < .8 ? mix(1., .12, ph/.8) : mix(.12, 5., pow((ph-.8)/.2, 2.));
    p = normalize(s+.001) * 3. * c * (.6 + .4*h(s.x*3.));
  } else if (k < 4.5) {    // 阴影：向外漫开的暗流
    float spread = .35 + uWeight*.65;
    p = vec3(s.x*9.*spread + sin(t*.3 + s.y*4.)*.8, s.y*3.5 + sin(t*.4 + s.x*5.)*.6, s.z*2.);
  } else if (k < 5.5) {    // 阿尼玛 / 阿尼姆斯：互相靠近，又保持距离
    float side = s.x < 0. ? -1. : 1.;
    float gap = 1.6 + (1.-uWeight)*4.;
    p = vec3(side*gap, 0., 0.) + normalize(vec3(s.y,s.z,s.x)+.001)*1.4*h(s.y+s.z) + vec3(0., sin(t*.5+side)*.2, 0.);
  } else {                 // 自性：收束成转身的人形
    vec3 tgt = aTarget * vec3(7.1, 4., .6);  // 与画面同一坐标：画面基准尺寸 14.2 x 8
    p = mix(s*7., tgt, uConverge);
  }
  return p;
}
void main(){
  vec3 p = behave(uKind, aSeed, uTime);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uSize * 40. / -mv.z, 1., 12.);
  float red = step(.55, h(aSeed.x*7. + 1.));
  vec3 base = mix(vec3(.10,.16,.55), vec3(.66,.2,.17), red) * .8;
  vCol = mix(base, vec3(.78,.80,.84), uKind > 5.5 ? uConverge * (1.-red) : 0.);
  // 自性站：粒子聚拢成人形后淡出，把最后的画面留给素脸（K6b）
  vShade = uWeight * .5 * (uKind > 5.5 ? 1. - smoothstep(.8, 1., uConverge) : 1.);
}`;
const FRAG = `
varying vec3 vCol; varying float vShade;
void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(vCol, smoothstep(.5, 0., d) * vShade); }`;

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// 每站一朵粒子云，以节点为中心：全图时是节点周围淡淡的云，站内（聚焦度升高）时加强。
export function createFields(THREE, scene, tier, selfTargets, reduced, hasPainting) {
  const count = tier === 'high' ? 12000 : 4000;
  const fields = [];
  for (let kind = 0; kind < 7; kind++) {
    const geo = new THREE.BufferGeometry();
    const seed = new Float32Array(count * 3);
    for (let i = 0; i < seed.length; i++) seed[i] = Math.random() * 2 - 1;
    // 没有目标图时，目标取自 seed，不会全部收向原点
    const target = kind === 6 && selfTargets ? new Float32Array(count * 3).map((_, i) => selfTargets[i % selfTargets.length]) : seed.slice();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
    geo.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.NormalBlending,
      uniforms: { uTime: { value: 0 }, uWeight: { value: 0 }, uConverge: { value: 0 }, uKind: { value: kind }, uSize: { value: tier === 'high' ? 1 : 1.4 } } });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    scene.add(pts);
    fields.push({ pts, mat, dwell: 0 });
  }
  const dir = new THREE.Vector3();
  return {
    update({ focus, camera, layout, time, dt }) {
      const maxF = Math.max(...focus);
      fields.forEach((f, i) => {
        const fo = focus[i], p = stationPosition(i);
        // 朝相机偏移，让粒子云浮在画面前面；自性站与画面贴合，聚拢出的人形才会落在画面里的人形上
        dir.set(camera.position.x - p.x, camera.position.y - p.y, camera.position.z - p.z).normalize();
        const off = i === 6 ? 0.3 : hasPainting[i] ? 3 : 6;
        f.pts.position.set(p.x + dir.x * off, p.y + dir.y * off, p.z + dir.z * off);
        f.pts.scale.setScalar(i === 6 ? lerp(1.0, layout.scale, fo) : lerp(1.2, layout.scale / 0.8, fo));
        f.mat.uniforms.uTime.value = time;
        // 站内：当前站的云加强（有画面的站收敛一些，免得盖住画面），其余站的云退到看不见
        const stationWeight = hasPainting[i] ? 0.6 : 1;
        f.mat.uniforms.uWeight.value = lerp(0.35, stationWeight, fo) * (1 - maxF * (1 - fo));
        f.pts.visible = !(reduced && i === 6);   // 减少动态：自性站不做聚拢动画，直接显示素脸
        if (fo > 0.95) f.dwell += dt; else if (fo < 0.3) f.dwell = 0;
        if (i === 6) f.mat.uniforms.uConverge.value = smooth(0.5, 5, f.dwell);
      });
    },
  };
}
