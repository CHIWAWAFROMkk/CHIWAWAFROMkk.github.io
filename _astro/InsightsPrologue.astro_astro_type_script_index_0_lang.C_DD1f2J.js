import{l as e,s as t,u as n}from"./text-motion.C3q4FW00.js";import{t as r}from"./insights.yw1tnCcR.js";import{i,n as a,r as o,t as s}from"./quality.BRsqJYkT.js";var c=[1,.24,.055],l=[.93,.89,.84],u=[.3,.09,.04],d=(e,t)=>[e[0]*t,e[1]*t,e[2]*t],f=(e,t,n)=>[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n],p=e=>({pos:new Float32Array(e*3),col:new Float32Array(e*3)});function m(e,t){let n=e.pos.length/3;for(let r=n-1;r>0;r--){let n=Math.floor(t()*(r+1));for(let t of[e.pos,e.col])for(let e=0;e<3;e++){let i=t[r*3+e];t[r*3+e]=t[n*3+e],t[n*3+e]=i}}return e}function h(e,t){let n=p(e),r=()=>(t()+t()+t()-1.5)/1.5;for(let i=0;i<e;i++){let e=.12+t()**.75*3.2,a=i%3*Math.PI*2/3+e*1.35+r()*(.5/(e+.35));n.pos.set([Math.cos(a)*e+r()*.1,r()*.14*(1.4-e/3.4),Math.sin(a)*e+r()*.1],i*3);let o=Math.max(0,1-e/1.4);n.col.set(t()<.35+o*.5?c:d(l,.5+o*.5),i*3)}return n}function g(e,t,n,r,i,a){let o=p(r),s=Math.floor(e.length/2);if(!s)return o;for(let u=0;u<r;u++){let r=Math.floor(i()*s)*2;o.pos.set([((e[r]+i()*2)/t-.5)*3.3*a,-((e[r+1]+i()*2)/n-.5)*1.16*a,(i()-.5)*.26],u*3),o.col.set(i()<.92?c:l,u*3)}return o}var ee=(e,t)=>-.65+e/Math.max(1,t)*1.25;function te(e,t,n,r){let i=p(e),a=new Map(t.map(e=>[Number(e[0])*24+Number(e[1]),Number(e[2])])),o=Math.max(1,...a.values()),s=[];for(let e=0;e<7;e++)for(let t=0;t<24;t++)s.push({d:e,h:t,v:a.get(e*24+t)??0});let l=s.map(e=>.6+e.v),d=l.reduce((e,t)=>e+t,0),h=0;return s.forEach((t,a)=>{let p=a===s.length-1?e-h:Math.round(e*l[a]/d),m=ee(t.v,o),g=t.v/o;for(let a=0;a<p&&h<e;a++,h++){let e=n()**.55;i.pos.set([((t.h+.1+n()*.8)/24-.5)*3.2*r,-.65+e*(m+.65),((t.d+.1+n()*.8)/7-.5)*1.1],h*3),i.col.set(f(u,c,Math.min(1,g*1.4)*(.55+.45*e)),h*3)}}),m(i,n)}function _(e){let t=Math.max(1,...e);return e.map(e=>.05+e/t)}function ne(e,t,n,r){let i=p(e),a=Math.max(1,...t),o=_(t),s=o.reduce((e,t)=>e+t,0),u=0;return t.forEach((f,p)=>{let m=p===t.length-1?e-u:Math.round(e*o[p]/s),h=1.35*f/a,g=(p/Math.max(1,t.length-1)-.5)*2.9*r;for(let t=0;t<m&&u<e;t++,u++)i.pos.set([g+(n()-.5)*.17*r,-.68+n()*h,(n()-.5)*.17],u*3),i.col.set(p<3?c:d(l,.7),u*3)}),m(i,n)}var v=[{yaw:.4,pitch:.62,dist:5.2},{yaw:0,pitch:0,dist:3.2},{yaw:-.38,pitch:.58,dist:2.75},{yaw:.28,pitch:.1,dist:3.3}],re=[1,1.9,1.1],y=[0,.9,-.5],b=e=>e*e*(3-2*e);function ie(e){let t=Math.min(3,Math.max(0,e)),n=Math.min(2,Math.floor(t)),r=Math.min(1,t-n),i=b(r),a=v[n],o=v[n+1],s=Math.sin(Math.PI*r);return{yaw:a.yaw+(o.yaw-a.yaw)*i+y[n]*s,pitch:a.pitch+(o.pitch-a.pitch)*i,dist:a.dist+(o.dist-a.dist)*i-re[n]*s}}function ae(e,t,n){return Math.max(0,Math.min(1,-e/Math.max(1,t-n)))*3}var oe=`#version 300 es
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
}`,se=`#version 300 es
precision highp float;
in vec3 vColor;
out vec4 o;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d);
  if (r > 0.25) discard;
  o = vec4(vColor * smoothstep(0.25, 0.0, r), 1.0);
}`,x=`#version 300 es
out vec2 vUv;
void main() { vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0); vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`,ce=`#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTex; out vec4 o;
void main() { vec3 c = texture(uTex, vUv).rgb; float b = max(c.r, max(c.g, c.b)); o = vec4(c * smoothstep(0.45, 1.6, b), 1.0); }`,le=`#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTex; uniform vec2 uDir; out vec4 o;
void main() {
  vec3 c = texture(uTex, vUv).rgb * 0.227027;
  c += (texture(uTex, vUv + uDir * 1.3846).rgb + texture(uTex, vUv - uDir * 1.3846).rgb) * 0.3162162;
  c += (texture(uTex, vUv + uDir * 3.2308).rgb + texture(uTex, vUv - uDir * 3.2308).rgb) * 0.0702703;
  o = vec4(c, 1.0);
}`,ue=`#version 300 es
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
}`;function S(e,t){let r=()=>{e.dataset.state===`pending`&&C(e,()=>{e.dataset.state=`static`})};if(!n())return r();let i=e.querySelector(`canvas`);if(!i)return r();let a=null;try{a=i.getContext(`webgl2`,{antialias:!1,alpha:!1,powerPreference:`high-performance`})}catch{a=null}if(!a)return r();let o=a;(e=>`requestIdleCallback`in window?window.requestIdleCallback(e,{timeout:600}):window.setTimeout(e,60))(()=>{E(e,i,o,t).catch(t=>{console.error(t),w(e,o)})})}function C(e,t){let n=e.nextElementSibling,r=e.getBoundingClientRect(),i=r.top<0&&r.bottom>0,a=n?.getBoundingClientRect().top??0;if(t(),!n)return;if(i&&e.dataset.state===`static`){window.scrollTo(0,e.offsetTop);return}let o=n.getBoundingClientRect().top-a;Math.abs(o)>1&&window.scrollBy(0,o)}function w(e,t){C(e,()=>{e.dataset.state=`static`}),e.dispatchEvent(new CustomEvent(`prologue:static`)),t.isContextLost()||t.getExtension(`WEBGL_lose_context`)?.loseContext()}function de(e){let t=1600,n=document.createElement(`canvas`);n.width=t,n.height=560;let r=n.getContext(`2d`);r.font=`700 470px Barlow, 'Arial Narrow', sans-serif`,r.textAlign=`center`,r.textBaseline=`middle`,r.fillStyle=`#fff`,r.fillText(e,t/2,280);let i=r.getImageData(0,0,t,560).data,a=[];for(let e=0;e<560;e+=2)for(let n=0;n<t;n+=2)i[(e*t+n)*4+3]>128&&a.push(n,e);return{px:a,cw:t,ch:560}}function T(e,t,n){let r=e.createProgram();for(let[i,a]of[[e.VERTEX_SHADER,t],[e.FRAGMENT_SHADER,n]]){let t=e.createShader(i);if(e.shaderSource(t,a),e.compileShader(t),!e.getShaderParameter(t,e.COMPILE_STATUS))throw Error(e.getShaderInfoLog(t)??`shader`);e.attachShader(r,t)}if(e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))throw Error(e.getProgramInfoLog(r)??`link`);let i=new Map;return{p:r,u:t=>(i.has(t)||i.set(t,e.getUniformLocation(r,t)),i.get(t))}}async function E(n,r,c,l){await Promise.race([document.fonts.load(`700 400px Barlow`),new Promise(e=>setTimeout(e,1500))]),C(n,()=>{n.dataset.state=`live`});let u=o(innerWidth,matchMedia(`(pointer: coarse)`).matches),d=u<2e5;n.dataset.particles=String(u),n.querySelector(`[data-hud-count]`).textContent=u.toLocaleString(`en-US`);let f=Math.min(1,r.clientWidth/Math.max(1,r.clientHeight)/1.5),p=de(l.label),m=Math.random,ee=[h(u,m),g(p.px,p.cw,p.ch,u,m,f),te(u,l.heat,m,f),ne(u,l.nets,m,f)],_=!!c.getExtension(`EXT_color_buffer_float`),v=T(c,oe,se),re=T(c,x,ce),y=T(c,x,le),b=T(c,x,ue),S=c.createVertexArray();c.bindVertexArray(S);let E=(e,t,n)=>{let r=c.getAttribLocation(v.p,e);if(r<0)return;let i=c.createBuffer();c.bindBuffer(c.ARRAY_BUFFER,i),c.bufferData(c.ARRAY_BUFFER,t,c.STATIC_DRAW),c.enableVertexAttribArray(r),c.vertexAttribPointer(r,n,c.FLOAT,!1,0,0)};ee.forEach((e,t)=>{E(`aP${t}`,e.pos,3),E(`aC${t}`,e.col,3)});let D=new Float32Array(u);for(let e=0;e<u;e++)D[e]=m();E(`aSeed`,D,1);let fe=c.createVertexArray(),O=(e,t)=>{let n=c.createTexture();c.bindTexture(c.TEXTURE_2D,n),c.texImage2D(c.TEXTURE_2D,0,_?c.RGBA16F:c.RGBA8,e,t,0,c.RGBA,_?c.HALF_FLOAT:c.UNSIGNED_BYTE,null);for(let[e,t]of[[c.TEXTURE_MIN_FILTER,c.LINEAR],[c.TEXTURE_MAG_FILTER,c.LINEAR],[c.TEXTURE_WRAP_S,c.CLAMP_TO_EDGE],[c.TEXTURE_WRAP_T,c.CLAMP_TO_EDGE]])c.texParameteri(c.TEXTURE_2D,e,t);let r=c.createFramebuffer();return c.bindFramebuffer(c.FRAMEBUFFER,r),c.framebufferTexture2D(c.FRAMEBUFFER,c.COLOR_ATTACHMENT0,c.TEXTURE_2D,n,0),{tex:n,fbo:r,w:e,h:t}},k=1,A=1,j=1,pe=1,M=null,me=()=>{k=Math.min(devicePixelRatio||1,d?1:1.5),A=Math.max(4,Math.round(r.clientWidth*k)),j=Math.max(4,Math.round(r.clientHeight*k)),r.width=A,r.height=j,pe=A/j,M&&Object.values(M).forEach(e=>{c.deleteTexture(e.tex),c.deleteFramebuffer(e.fbo)}),M={scene:O(A,j),h1:O(A>>1,j>>1),h2:O(A>>1,j>>1),q1:O(A>>2,j>>2),q2:O(A>>2,j>>2)}};me(),addEventListener(`resize`,me);let N=(e,t,n,r)=>{c.bindFramebuffer(c.FRAMEBUFFER,t?t.fbo:null),c.viewport(0,0,t?t.w:A,t?t.h:j),c.useProgram(e.p),c.bindVertexArray(fe),c.activeTexture(c.TEXTURE0),c.bindTexture(c.TEXTURE_2D,n),c.uniform1i(e.u(`uTex`),0),r?.(),c.drawArrays(c.TRIANGLES,0,3)},P=(e,t,n)=>{N(y,t,e.tex,()=>c.uniform2f(y.u(`uDir`),n/e.w,0)),N(y,e,t.tex,()=>c.uniform2f(y.u(`uDir`),0,n/e.h))},F=0,I=0,L=0,R=0,z=0,B=0,V=0,he=-99,ge=-99,H=[9,9],U=[9,9],W=null,_e=()=>{let e=n.getBoundingClientRect();I=ae(e.top,e.height,innerHeight)};addEventListener(`scroll`,_e,{passive:!0}),_e(),F=I;let ve=e=>{let t=r.getBoundingClientRect();return[(e.clientX-t.left)/t.width*2-1,-((e.clientY-t.top)/t.height*2-1)]};r.addEventListener(`pointerdown`,e=>{W={x:e.clientX,y:e.clientY,yaw:L,pitch:R,moved:!1},e.pointerType!==`touch`&&r.setPointerCapture(e.pointerId)}),r.addEventListener(`pointermove`,e=>{H=ve(e),W?(Math.abs(e.clientX-W.x)+Math.abs(e.clientY-W.y)>4&&(W.moved=!0,e.pointerType!==`touch`&&(r.classList.add(`drag`),B=0)),W.moved&&e.pointerType!==`touch`&&(L=W.yaw+(e.clientX-W.x)*.006,R=Math.max(-.5,Math.min(.7,W.pitch+(e.clientY-W.y)*.004)))):B=1}),r.addEventListener(`pointerup`,e=>{W&&!W.moved&&(U=ve(e),ge=performance.now()/1e3),W=null,r.classList.remove(`drag`)}),r.addEventListener(`pointercancel`,()=>{W=null,r.classList.remove(`drag`)}),r.addEventListener(`pointerleave`,()=>B=0);let ye=[...n.querySelectorAll(`[data-cap]`)],be=n.querySelector(`[data-hud-fps]`),xe=u,G=d?0:.5,K=!1,q=!0,J=0,Y=s,X=0,Z=0,Q=performance.now(),Se=()=>{K=!0,cancelAnimationFrame(J)};r.addEventListener(`webglcontextlost`,e=>{e.preventDefault(),Se(),w(n,c)});let Ce=()=>{q&&!K&&!J&&e()!==`off`&&(J=requestAnimationFrame($))};new IntersectionObserver(e=>{q=e[0].isIntersecting,Ce()}).observe(n),document.addEventListener(t,Ce);function $(t){if(J=0,K||!q||!M||e()===`off`)return;let r=t/1e3;F+=(I-F)*.06,z+=(B-z)*.1,W||(L*=.985,R*=.985);let o=Math.round(F);Math.abs(F-o)<.03&&o!==V&&(V=o,he=r);let s=ie(F);c.bindFramebuffer(c.FRAMEBUFFER,M.scene.fbo),c.viewport(0,0,A,j),c.clearColor(0,0,0,1),c.clear(c.COLOR_BUFFER_BIT),c.useProgram(v.p),c.bindVertexArray(S),c.enable(c.BLEND),c.blendFunc(c.ONE,c.ONE),c.disable(c.DEPTH_TEST);let l=v.u;if(c.uniform1f(l(`uState`),F),c.uniform1f(l(`uTime`),r),c.uniform1f(l(`uAspect`),pe),c.uniform1f(l(`uDpr`),k),c.uniform1f(l(`uYaw`),s.yaw+L+Math.sin(r*.25)*.08),c.uniform1f(l(`uPitch`),s.pitch+R),c.uniform1f(l(`uDist`),s.dist),c.uniform2f(l(`uMouse`),H[0],H[1]),c.uniform1f(l(`uMouseOn`),z),c.uniform1f(l(`uGain`),d?.26:.13),c.uniform1f(l(`uPulse`),r-he),c.uniform2f(l(`uBoom`),U[0],U[1]),c.uniform1f(l(`uBoomT`),r-ge),c.drawArrays(c.POINTS,0,xe),c.disable(c.BLEND),N(re,M.h1,M.scene.tex),G>0&&(P(M.h1,M.h2,1),P(M.h1,M.h2,2)),N(y,M.q1,M.h1.tex,()=>c.uniform2f(y.u(`uDir`),0,0)),P(M.q1,M.q2,1.5),P(M.q1,M.q2,3),c.bindFramebuffer(c.FRAMEBUFFER,null),c.viewport(0,0,A,j),c.useProgram(b.p),c.bindVertexArray(fe),[M.scene,M.h1,M.q1].forEach((e,t)=>{c.activeTexture(c.TEXTURE0+t),c.bindTexture(c.TEXTURE_2D,e.tex)}),c.uniform1i(b.u(`uScene`),0),c.uniform1i(b.u(`uB1`),1),c.uniform1i(b.u(`uB2`),2),c.uniform1f(b.u(`uTime`),r),c.uniform2f(b.u(`uRes`),A,j),c.uniform1f(b.u(`uB1Gain`),G),c.drawArrays(c.TRIANGLES,0,3),ye.forEach((e,t)=>{let n=Math.max(0,1-Math.abs(F-t)*2.2);e.style.opacity=String(n),e.style.transform=`translateY(${(1-n)*16}px)`}),n.dataset.chapter=String(o),!Y.done){let e=i(Y,X?t-X:0);if(Y=e.next,e.fps!==null){let t=a(e.fps);if(n.dataset.quality=t,t===`static`){Se(),w(n,c);return}t===`reduced`&&(xe=u>>1,G=0)}}X=t,Z++,t-Q>500&&(be.textContent=String(Math.round(Z*1e3/(t-Q))),Z=0,Q=t),J=requestAnimationFrame($)}r.dataset.ready=``,J=requestAnimationFrame($)}var D=document.querySelector(`[data-prologue]`);D&&S(D,{heat:r.results.heatmap.values,nets:r.results.merchants.values.map(e=>Number(e[3])),label:D.dataset.label??``});