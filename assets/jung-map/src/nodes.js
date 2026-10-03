import { stationPosition, STATION_IDS } from './layout.js';

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }';
const FRAG = `
precision highp float; varying vec2 vUv; uniform sampler2D uA, uB; uniform float uMix, uOpacity, uLocal;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
// K6→K6b 只在脸部与脚下碎片区域过渡，其余区域的重绘底纹差异不会闪烁
float region(vec2 uv){
  float f = 1. - smoothstep(.07, .12, length((uv - vec2(.5,.86)) * vec2(1.78,1.)));
  float s = (1. - smoothstep(.11,.16,abs(uv.x-.49))) * (1. - smoothstep(.10,.16,abs(uv.y-.10)));
  return max(f, s);
}
void main(){
  float n = noise(vUv*7.) * .6 + noise(vUv*19.) * .4;
  float r = smoothstep(0., .15, uMix * 1.3 - n);
  r *= mix(1., region(vUv), uLocal);
  vec3 c = mix(texture2D(uA, vUv).rgb, texture2D(uB, vUv).rgb, r);
  gl_FragColor = vec4(mix(vec3(.02,.027,.06), c, uOpacity), 1.);   // 淡出到背景色，而不是纯黑
}`;

const REVEAL = { complex: [5, 7], self: [2.5, 6] };   // 停留后触发的过渡 [开始秒, 结束秒]
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const OVERVIEW_SCALE = 1.0;

export async function createNodes(THREE, scene, stations, imageNames, reduced) {
  const loader = new THREE.TextureLoader();
  const have = n => imageNames.includes(n);
  const names = [...new Set(stations.flatMap(s => s.keyframes.filter(have)))];
  const texs = Object.fromEntries(await Promise.all(names.map(async n => {
    const t = await loader.loadAsync(`./assets/${n}.webp`); t.colorSpace = THREE.NoColorSpace; return [n, t];
  })));

  const items = [], orbs = [];
  for (let i = 0; i < stations.length; i++) {
    const p = stationPosition(i), s = stations[i];
    const first = s.keyframes.find(have);
    // 光球：只给没有画面的站，让它们能被看见与点选；有画面的站由画面本身承担
    const orb = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48),
      new THREE.MeshBasicMaterial({ color: 0x2a3f9c, transparent: true, opacity: 0.55, depthWrite: false }));
    orb.position.set(p.x, p.y, p.z); orb.visible = !first; scene.add(orb); orbs.push(orb);
    if (!first) { items.push(null); continue; }
    const second = s.keyframes.slice(1).find(have);
    const a = texs[first], b = second ? texs[second] : a;
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: {
      uA: { value: a }, uB: { value: b }, uMix: { value: 0 }, uOpacity: { value: 0.9 }, uLocal: { value: STATION_IDS[i] === 'self' ? 1 : 0 } } });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(14.2, 8), mat);
    mesh.position.set(p.x, p.y, p.z); scene.add(mesh);
    items.push({ mesh, mat, id: STATION_IDS[i], dwell: 0, hasB: second != null });
  }
  const beacon = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.07, 64),
    new THREE.MeshBasicMaterial({ color: 0xb5372c, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
  scene.add(beacon);

  return {
    // dt 始终是真实时间：减少动态只冻结装饰性动画，停留触发的内容（K4、素脸）仍然会出现，只是瞬时切换
    update({ focus, camera, layout, time, dt, beaconIndex }) {
      const maxF = Math.max(...focus);
      items.forEach((it, i) => {
        orbs[i].quaternion.copy(camera.quaternion);
        // 没有画面的站：全图里是个光球，站内退成淡淡的背景，让粒子云成为主角
        orbs[i].scale.setScalar(it ? 1 : lerp(1 + 0.08 * Math.sin(time * 1.5 + i), 0.55, focus[i]));
        orbs[i].material.opacity = it ? 0.9 : lerp(0.55, 0.12, focus[i]) * (1 - 0.9 * maxF * (1 - focus[i]));   // 站内时其他站的光球几乎隐去
        if (!it) return;
        const f = focus[i];
        it.mesh.quaternion.copy(camera.quaternion);
        it.mesh.scale.setScalar(lerp(OVERVIEW_SCALE, layout.scale, f));
        it.mat.uniforms.uOpacity.value = f > 0.01 ? 1 : lerp(0.9, 0.25, maxF);
        if (f > 0.95) it.dwell += dt; else if (f < 0.3) it.dwell = 0;
        const r = REVEAL[it.id];
        it.mat.uniforms.uMix.value = r && it.hasB ? (reduced ? (it.dwell >= r[0] ? 1 : 0) : smooth(r[0], r[1], it.dwell)) : 0;
      });
      beacon.visible = beaconIndex >= 0 && maxF < 0.5;
      if (beacon.visible) {
        const p = stationPosition(beaconIndex), big = items[beaconIndex] ? 6.5 : 4.2;
        beacon.position.set(p.x, p.y, p.z); beacon.quaternion.copy(camera.quaternion);
        beacon.scale.setScalar(big * (1 + 0.07 * Math.sin(time * 3)));
        beacon.material.opacity = 0.55 + 0.35 * Math.sin(time * 3);
      }
    },
  };
}
