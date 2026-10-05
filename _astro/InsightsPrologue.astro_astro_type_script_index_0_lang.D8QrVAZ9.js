import{t as e}from"./insights.yw1tnCcR.js";import{i as t,n,r,t as i}from"./quality.BRsqJYkT.js";var a=[1,.24,.055],o=[.93,.89,.84],s=[.3,.09,.04],c=(e,t)=>[e[0]*t,e[1]*t,e[2]*t],l=(e,t,n)=>[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n],u=e=>({pos:new Float32Array(e*3),col:new Float32Array(e*3)});function d(e,t){let n=e.pos.length/3;for(let r=n-1;r>0;r--){let n=Math.floor(t()*(r+1));for(let t of[e.pos,e.col])for(let e=0;e<3;e++){let i=t[r*3+e];t[r*3+e]=t[n*3+e],t[n*3+e]=i}}return e}function f(e,t){let n=u(e),r=()=>(t()+t()+t()-1.5)/1.5;for(let i=0;i<e;i++){let e=.12+t()**.75*3.2,s=i%3*Math.PI*2/3+e*1.35+r()*(.5/(e+.35));n.pos.set([Math.cos(s)*e+r()*.1,r()*.14*(1.4-e/3.4),Math.sin(s)*e+r()*.1],i*3);let l=Math.max(0,1-e/1.4);n.col.set(t()<.35+l*.5?a:c(o,.5+l*.5),i*3)}return n}function p(e,t,n,r,i,s){let c=u(r),l=Math.floor(e.length/2);if(!l)return c;for(let u=0;u<r;u++){let r=Math.floor(i()*l)*2;c.pos.set([((e[r]+i()*2)/t-.5)*3.3*s,-((e[r+1]+i()*2)/n-.5)*1.16*s,(i()-.5)*.26],u*3),c.col.set(i()<.92?a:o,u*3)}return c}var m=(e,t)=>-.65+e/Math.max(1,t)*1.25;function h(e,t,n,r){let i=u(e),o=new Map(t.map(e=>[Number(e[0])*24+Number(e[1]),Number(e[2])])),c=Math.max(1,...o.values()),f=[];for(let e=0;e<7;e++)for(let t=0;t<24;t++)f.push({d:e,h:t,v:o.get(e*24+t)??0});let p=f.map(e=>.6+e.v),h=p.reduce((e,t)=>e+t,0),g=0;return f.forEach((t,o)=>{let u=o===f.length-1?e-g:Math.round(e*p[o]/h),d=m(t.v,c),ee=t.v/c;for(let o=0;o<u&&g<e;o++,g++){let e=n()**.55;i.pos.set([((t.h+.1+n()*.8)/24-.5)*3.2*r,-.65+e*(d+.65),((t.d+.1+n()*.8)/7-.5)*1.1],g*3),i.col.set(l(s,a,Math.min(1,ee*1.4)*(.55+.45*e)),g*3)}}),d(i,n)}function g(e){let t=Math.max(1,...e);return e.map(e=>.05+e/t)}function ee(e,t,n,r){let i=u(e),s=Math.max(1,...t),l=g(t),f=l.reduce((e,t)=>e+t,0),p=0;return t.forEach((u,d)=>{let m=d===t.length-1?e-p:Math.round(e*l[d]/f),h=1.35*u/s,g=(d/Math.max(1,t.length-1)-.5)*2.9*r;for(let t=0;t<m&&p<e;t++,p++)i.pos.set([g+(n()-.5)*.17*r,-.68+n()*h,(n()-.5)*.17],p*3),i.col.set(d<3?a:c(o,.7),p*3)}),d(i,n)}var _=[{yaw:.4,pitch:.62,dist:5.2},{yaw:0,pitch:0,dist:3.2},{yaw:-.38,pitch:.58,dist:2.75},{yaw:.28,pitch:.1,dist:3.3}],v=[1,1.9,1.1],te=[0,.9,-.5],y=e=>e*e*(3-2*e);function ne(e){let t=Math.min(3,Math.max(0,e)),n=Math.min(2,Math.floor(t)),r=Math.min(1,t-n),i=y(r),a=_[n],o=_[n+1],s=Math.sin(Math.PI*r);return{yaw:a.yaw+(o.yaw-a.yaw)*i+te[n]*s,pitch:a.pitch+(o.pitch-a.pitch)*i,dist:a.dist+(o.dist-a.dist)*i-v[n]*s}}function re(e,t,n){return Math.max(0,Math.min(1,-e/Math.max(1,t-n)))*3}var ie=`#version 300 es
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
}`,ae=`#version 300 es
precision highp float;
in vec3 vColor;
out vec4 o;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d);
  if (r > 0.25) discard;
  o = vec4(vColor * smoothstep(0.25, 0.0, r), 1.0);
}`,b=`#version 300 es
out vec2 vUv;
void main() { vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0); vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`,oe=`#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTex; out vec4 o;
void main() { vec3 c = texture(uTex, vUv).rgb; float b = max(c.r, max(c.g, c.b)); o = vec4(c * smoothstep(0.45, 1.6, b), 1.0); }`,se=`#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTex; uniform vec2 uDir; out vec4 o;
void main() {
  vec3 c = texture(uTex, vUv).rgb * 0.227027;
  c += (texture(uTex, vUv + uDir * 1.3846).rgb + texture(uTex, vUv - uDir * 1.3846).rgb) * 0.3162162;
  c += (texture(uTex, vUv + uDir * 3.2308).rgb + texture(uTex, vUv - uDir * 3.2308).rgb) * 0.0702703;
  o = vec4(c, 1.0);
}`,ce=`#version 300 es
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
}`;function x(e,t){let n=()=>{e.dataset.state===`pending`&&S(e,()=>{e.dataset.state=`static`})};if(matchMedia(`(prefers-reduced-motion: reduce)`).matches)return n();let r=e.querySelector(`canvas`);if(!r)return n();let i=null;try{i=r.getContext(`webgl2`,{antialias:!1,alpha:!1,powerPreference:`high-performance`})}catch{i=null}if(!i)return n();let a=i;(e=>`requestIdleCallback`in window?window.requestIdleCallback(e,{timeout:600}):window.setTimeout(e,60))(()=>{T(e,r,a,t).catch(t=>{console.error(t),C(e,a)})})}function S(e,t){let n=e.nextElementSibling,r=e.getBoundingClientRect(),i=r.top<0&&r.bottom>0,a=n?.getBoundingClientRect().top??0;if(t(),!n)return;if(i&&e.dataset.state===`static`){window.scrollTo(0,e.offsetTop);return}let o=n.getBoundingClientRect().top-a;Math.abs(o)>1&&window.scrollBy(0,o)}function C(e,t){S(e,()=>{e.dataset.state=`static`}),e.dispatchEvent(new CustomEvent(`prologue:static`)),t.isContextLost()||t.getExtension(`WEBGL_lose_context`)?.loseContext()}function le(e){let t=1600,n=document.createElement(`canvas`);n.width=t,n.height=560;let r=n.getContext(`2d`);r.font=`700 470px Barlow, 'Arial Narrow', sans-serif`,r.textAlign=`center`,r.textBaseline=`middle`,r.fillStyle=`#fff`,r.fillText(e,t/2,280);let i=r.getImageData(0,0,t,560).data,a=[];for(let e=0;e<560;e+=2)for(let n=0;n<t;n+=2)i[(e*t+n)*4+3]>128&&a.push(n,e);return{px:a,cw:t,ch:560}}function w(e,t,n){let r=e.createProgram();for(let[i,a]of[[e.VERTEX_SHADER,t],[e.FRAGMENT_SHADER,n]]){let t=e.createShader(i);if(e.shaderSource(t,a),e.compileShader(t),!e.getShaderParameter(t,e.COMPILE_STATUS))throw Error(e.getShaderInfoLog(t)??`shader`);e.attachShader(r,t)}if(e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))throw Error(e.getProgramInfoLog(r)??`link`);let i=new Map;return{p:r,u:t=>(i.has(t)||i.set(t,e.getUniformLocation(r,t)),i.get(t))}}async function T(e,a,o,s){await Promise.race([document.fonts.load(`700 400px Barlow`),new Promise(e=>setTimeout(e,1500))]),S(e,()=>{e.dataset.state=`live`});let c=r(innerWidth,matchMedia(`(pointer: coarse)`).matches),l=c<2e5;e.dataset.particles=String(c),e.querySelector(`[data-hud-count]`).textContent=c.toLocaleString(`en-US`);let u=Math.min(1,a.clientWidth/Math.max(1,a.clientHeight)/1.5),d=le(s.label),m=Math.random,g=[f(c,m),p(d.px,d.cw,d.ch,c,m,u),h(c,s.heat,m,u),ee(c,s.nets,m,u)],_=!!o.getExtension(`EXT_color_buffer_float`),v=w(o,ie,ae),te=w(o,b,oe),y=w(o,b,se),x=w(o,b,ce),T=o.createVertexArray();o.bindVertexArray(T);let E=(e,t,n)=>{let r=o.getAttribLocation(v.p,e);if(r<0)return;let i=o.createBuffer();o.bindBuffer(o.ARRAY_BUFFER,i),o.bufferData(o.ARRAY_BUFFER,t,o.STATIC_DRAW),o.enableVertexAttribArray(r),o.vertexAttribPointer(r,n,o.FLOAT,!1,0,0)};g.forEach((e,t)=>{E(`aP${t}`,e.pos,3),E(`aC${t}`,e.col,3)});let D=new Float32Array(c);for(let e=0;e<c;e++)D[e]=m();E(`aSeed`,D,1);let ue=o.createVertexArray(),O=(e,t)=>{let n=o.createTexture();o.bindTexture(o.TEXTURE_2D,n),o.texImage2D(o.TEXTURE_2D,0,_?o.RGBA16F:o.RGBA8,e,t,0,o.RGBA,_?o.HALF_FLOAT:o.UNSIGNED_BYTE,null);for(let[e,t]of[[o.TEXTURE_MIN_FILTER,o.LINEAR],[o.TEXTURE_MAG_FILTER,o.LINEAR],[o.TEXTURE_WRAP_S,o.CLAMP_TO_EDGE],[o.TEXTURE_WRAP_T,o.CLAMP_TO_EDGE]])o.texParameteri(o.TEXTURE_2D,e,t);let r=o.createFramebuffer();return o.bindFramebuffer(o.FRAMEBUFFER,r),o.framebufferTexture2D(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,n,0),{tex:n,fbo:r,w:e,h:t}},k=1,A=1,j=1,de=1,M=null,fe=()=>{k=Math.min(devicePixelRatio||1,l?1:1.5),A=Math.max(4,Math.round(a.clientWidth*k)),j=Math.max(4,Math.round(a.clientHeight*k)),a.width=A,a.height=j,de=A/j,M&&Object.values(M).forEach(e=>{o.deleteTexture(e.tex),o.deleteFramebuffer(e.fbo)}),M={scene:O(A,j),h1:O(A>>1,j>>1),h2:O(A>>1,j>>1),q1:O(A>>2,j>>2),q2:O(A>>2,j>>2)}};fe(),addEventListener(`resize`,fe);let N=(e,t,n,r)=>{o.bindFramebuffer(o.FRAMEBUFFER,t?t.fbo:null),o.viewport(0,0,t?t.w:A,t?t.h:j),o.useProgram(e.p),o.bindVertexArray(ue),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,n),o.uniform1i(e.u(`uTex`),0),r?.(),o.drawArrays(o.TRIANGLES,0,3)},P=(e,t,n)=>{N(y,t,e.tex,()=>o.uniform2f(y.u(`uDir`),n/e.w,0)),N(y,e,t.tex,()=>o.uniform2f(y.u(`uDir`),0,n/e.h))},F=0,I=0,L=0,R=0,z=0,B=0,pe=0,me=-99,he=-99,V=[9,9],H=[9,9],U=null,ge=()=>{let t=e.getBoundingClientRect();I=re(t.top,t.height,innerHeight)};addEventListener(`scroll`,ge,{passive:!0}),ge(),F=I;let _e=e=>{let t=a.getBoundingClientRect();return[(e.clientX-t.left)/t.width*2-1,-((e.clientY-t.top)/t.height*2-1)]};a.addEventListener(`pointerdown`,e=>{U={x:e.clientX,y:e.clientY,yaw:L,pitch:R,moved:!1},e.pointerType!==`touch`&&a.setPointerCapture(e.pointerId)}),a.addEventListener(`pointermove`,e=>{V=_e(e),U?(Math.abs(e.clientX-U.x)+Math.abs(e.clientY-U.y)>4&&(U.moved=!0,e.pointerType!==`touch`&&(a.classList.add(`drag`),B=0)),U.moved&&e.pointerType!==`touch`&&(L=U.yaw+(e.clientX-U.x)*.006,R=Math.max(-.5,Math.min(.7,U.pitch+(e.clientY-U.y)*.004)))):B=1}),a.addEventListener(`pointerup`,e=>{U&&!U.moved&&(H=_e(e),he=performance.now()/1e3),U=null,a.classList.remove(`drag`)}),a.addEventListener(`pointercancel`,()=>{U=null,a.classList.remove(`drag`)}),a.addEventListener(`pointerleave`,()=>B=0);let ve=[...e.querySelectorAll(`[data-cap]`)],ye=e.querySelector(`[data-hud-fps]`),W=c,G=l?0:.5,K=!1,q=!0,J=0,Y=i,X=0,Z=0,Q=performance.now(),be=()=>{K=!0,cancelAnimationFrame(J)};a.addEventListener(`webglcontextlost`,t=>{t.preventDefault(),be(),C(e,o)}),new IntersectionObserver(e=>{q=e[0].isIntersecting,q&&!K&&!J&&(J=requestAnimationFrame($))}).observe(e);function $(r){if(J=0,K||!q||!M)return;let i=r/1e3;F+=(I-F)*.06,z+=(B-z)*.1,U||(L*=.985,R*=.985);let a=Math.round(F);Math.abs(F-a)<.03&&a!==pe&&(pe=a,me=i);let s=ne(F);o.bindFramebuffer(o.FRAMEBUFFER,M.scene.fbo),o.viewport(0,0,A,j),o.clearColor(0,0,0,1),o.clear(o.COLOR_BUFFER_BIT),o.useProgram(v.p),o.bindVertexArray(T),o.enable(o.BLEND),o.blendFunc(o.ONE,o.ONE),o.disable(o.DEPTH_TEST);let u=v.u;if(o.uniform1f(u(`uState`),F),o.uniform1f(u(`uTime`),i),o.uniform1f(u(`uAspect`),de),o.uniform1f(u(`uDpr`),k),o.uniform1f(u(`uYaw`),s.yaw+L+Math.sin(i*.25)*.08),o.uniform1f(u(`uPitch`),s.pitch+R),o.uniform1f(u(`uDist`),s.dist),o.uniform2f(u(`uMouse`),V[0],V[1]),o.uniform1f(u(`uMouseOn`),z),o.uniform1f(u(`uGain`),l?.26:.13),o.uniform1f(u(`uPulse`),i-me),o.uniform2f(u(`uBoom`),H[0],H[1]),o.uniform1f(u(`uBoomT`),i-he),o.drawArrays(o.POINTS,0,W),o.disable(o.BLEND),N(te,M.h1,M.scene.tex),G>0&&(P(M.h1,M.h2,1),P(M.h1,M.h2,2)),N(y,M.q1,M.h1.tex,()=>o.uniform2f(y.u(`uDir`),0,0)),P(M.q1,M.q2,1.5),P(M.q1,M.q2,3),o.bindFramebuffer(o.FRAMEBUFFER,null),o.viewport(0,0,A,j),o.useProgram(x.p),o.bindVertexArray(ue),[M.scene,M.h1,M.q1].forEach((e,t)=>{o.activeTexture(o.TEXTURE0+t),o.bindTexture(o.TEXTURE_2D,e.tex)}),o.uniform1i(x.u(`uScene`),0),o.uniform1i(x.u(`uB1`),1),o.uniform1i(x.u(`uB2`),2),o.uniform1f(x.u(`uTime`),i),o.uniform2f(x.u(`uRes`),A,j),o.uniform1f(x.u(`uB1Gain`),G),o.drawArrays(o.TRIANGLES,0,3),ve.forEach((e,t)=>{let n=Math.max(0,1-Math.abs(F-t)*2.2);e.style.opacity=String(n),e.style.transform=`translateY(${(1-n)*16}px)`}),e.dataset.chapter=String(a),!Y.done){let i=t(Y,X?r-X:0);if(Y=i.next,i.fps!==null){let t=n(i.fps);if(e.dataset.quality=t,t===`static`){be(),C(e,o);return}t===`reduced`&&(W=c>>1,G=0)}}X=r,Z++,r-Q>500&&(ye.textContent=String(Math.round(Z*1e3/(r-Q))),Z=0,Q=r),J=requestAnimationFrame($)}a.dataset.ready=``,J=requestAnimationFrame($)}var E=document.querySelector(`[data-prologue]`);E&&x(E,{heat:e.results.heatmap.values,nets:e.results.merchants.values.map(e=>Number(e[3])),label:E.dataset.label??``});