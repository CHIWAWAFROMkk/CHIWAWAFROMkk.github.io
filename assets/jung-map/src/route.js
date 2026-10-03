import { spiralPoint, HEIGHT } from './layout.js';

const VERT = `
attribute float aT;
uniform float uTime, uReveal, uCur, uPx;
varying vec3 vCol; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mv;
  float ph = fract(aT*3. - uTime*.12);
  float pulse = smoothstep(.0, .1, ph) * (1. - smoothstep(.1, .22, ph));
  float near = exp(-abs(aT - uCur) * 7.);
  gl_PointSize = clamp(uPx * (3.4 + 5.*pulse + 3.*near) * 80. / -mv.z, 1.5, 11.);
  vCol = mix(vec3(.14,.24,.62), vec3(.72,.22,.17), clamp(pulse + near*.6, 0., 1.));
  vA = (aT <= uReveal ? 1. : 0.) * (.6 + .4*pulse + .3*near);
}`;
const FRAG = `
varying vec3 vCol; varying float vA;
void main(){ float d = length(gl_PointCoord - .5); if (d > .5 || vA <= 0.) discard; gl_FragColor = vec4(vCol, smoothstep(.5, 0., d) * vA); }`;

const DUST_VERT = `
uniform float uReveal, uPx; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uPx * 1.6 * 80. / -mv.z, 1., 4.);
  vA = .5 * uReveal;
}`;
const DUST_FRAG = 'varying float vA; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(.35,.42,.7, smoothstep(.5,0.,d) * vA); }';

// 发光路线（沿螺旋的点，带流动的脉冲）与背景尘埃；reveal 为 0..1 的开场组装进度
export function createRoute(THREE, scene, tier) {
  const n = tier === 'high' ? 3600 : 1400;
  const pos = new Float32Array(n * 3), aT = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1), p = spiralPoint(t);
    pos[k * 3] = p.x + (Math.random() - 0.5) * 0.9; pos[k * 3 + 1] = p.y + (Math.random() - 0.5) * 0.9; pos[k * 3 + 2] = p.z + (Math.random() - 0.5) * 0.9;
    aT[k] = t;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
  const px = tier === 'high' ? 1 : 1.3;
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uCur: { value: 0 }, uPx: { value: px } } });
  const line = new THREE.Points(geo, mat); line.frustumCulled = false; scene.add(line);

  const m = tier === 'high' ? 5000 : 1800;
  const dp = new Float32Array(m * 3);
  for (let k = 0; k < m; k++) {
    const a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 60;
    dp[k * 3] = Math.cos(a) * r; dp[k * 3 + 1] = -HEIGHT / 2 + (Math.random() - 0.5) * (HEIGHT + 30); dp[k * 3 + 2] = Math.sin(a) * r;
  }
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dmat = new THREE.ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false,
    uniforms: { uReveal: { value: 0 }, uPx: { value: px } } });
  const dust = new THREE.Points(dgeo, dmat); dust.frustumCulled = false; scene.add(dust);

  return {
    update({ time, reveal, curT }) {
      mat.uniforms.uTime.value = time; mat.uniforms.uReveal.value = reveal; mat.uniforms.uCur.value = curT;
      dmat.uniforms.uReveal.value = reveal; dust.rotation.y = time * 0.01;
    },
  };
}
