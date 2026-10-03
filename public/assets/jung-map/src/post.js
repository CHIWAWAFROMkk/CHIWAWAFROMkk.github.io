const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
const FRAG = `
precision highp float; varying vec2 vUv; uniform sampler2D tScene; uniform float uTime; uniform vec2 uRes;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
void main(){
  vec2 uv = vUv;
  // 笔触扭曲：低频块面 + 高频细纹
  uv += (vec2(noise(uv*vec2(38.,21.)+uTime*.03), noise(uv*vec2(38.,21.)+7.)) - .5) * .0035;
  uv += (vec2(noise(uv*95.), noise(uv*95.+5.)) - .5) * .0016;
  vec3 c = texture2D(tScene, uv).rgb;
  // 画布颗粒（随时间轻微抖动）与织纹
  float g = hash(floor(uv*uRes/1.6) + floor(uTime*6.));
  c *= 1. + (g - .5) * .09;
  c += sin(uv.x*uRes.x*1.1) * sin(uv.y*uRes.y*1.1) * .012;
  // 暗角，亮度整体压低
  float v = smoothstep(1.05, .32, length(vUv-.5) * 1.25);
  c *= mix(.5, 1., v);
  gl_FragColor = vec4(c, 1.);
}`;

export function createPost(THREE, renderer) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.UnsignedByteType, depthBuffer: true });
  rt.texture.colorSpace = THREE.NoColorSpace;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false,
    uniforms: { tScene: { value: rt.texture }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(size.x, size.y) } } });
  const quad = new THREE.Mesh(geo, mat); quad.frustumCulled = false;
  const postScene = new THREE.Scene(); postScene.add(quad);
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return {
    render(scene, camera, time) {
      mat.uniforms.uTime.value = time;
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    },
    resize() {
      const s = renderer.getDrawingBufferSize(new THREE.Vector2());
      rt.setSize(s.x, s.y); mat.uniforms.uRes.value.set(s.x, s.y);
    },
  };
}
