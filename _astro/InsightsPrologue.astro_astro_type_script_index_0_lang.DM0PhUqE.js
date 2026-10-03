import{t as e}from"./insights.yw1tnCcR.js";var t=[1,.24,.055],n=[.93,.89,.84],r=[.3,.09,.04],i=(e,t)=>[e[0]*t,e[1]*t,e[2]*t],a=(e,t,n)=>[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n],o=e=>({pos:new Float32Array(e*3),col:new Float32Array(e*3)});function s(e,t){let n=e.pos.length/3;for(let r=n-1;r>0;r--){let n=Math.floor(t()*(r+1));for(let t of[e.pos,e.col])for(let e=0;e<3;e++){let i=t[r*3+e];t[r*3+e]=t[n*3+e],t[n*3+e]=i}}return e}function c(e,r){let a=o(e),s=()=>(r()+r()+r()-1.5)/1.5;for(let o=0;o<e;o++){let e=.12+r()**.75*3.2,c=o%3*Math.PI*2/3+e*1.35+s()*(.5/(e+.35));a.pos.set([Math.cos(c)*e+s()*.1,s()*.14*(1.4-e/3.4),Math.sin(c)*e+s()*.1],o*3);let l=Math.max(0,1-e/1.4);a.col.set(r()<.35+l*.5?t:i(n,.5+l*.5),o*3)}return a}function l(e,r,i,a,s,c){let l=o(a),u=Math.floor(e.length/2);if(!u)return l;for(let o=0;o<a;o++){let a=Math.floor(s()*u)*2;l.pos.set([((e[a]+s()*2)/r-.5)*3.3*c,-((e[a+1]+s()*2)/i-.5)*1.16*c,(s()-.5)*.26],o*3),l.col.set(s()<.92?t:n,o*3)}return l}var u=(e,t)=>-.65+e/Math.max(1,t)*1.25;function d(e,n,i,c){let l=o(e),d=new Map(n.map(e=>[Number(e[0])*24+Number(e[1]),Number(e[2])])),f=Math.max(1,...d.values()),p=[];for(let e=0;e<7;e++)for(let t=0;t<24;t++)p.push({d:e,h:t,v:d.get(e*24+t)??0});let m=p.map(e=>.6+e.v),h=m.reduce((e,t)=>e+t,0),g=0;return p.forEach((n,o)=>{let s=o===p.length-1?e-g:Math.round(e*m[o]/h),d=u(n.v,f),_=n.v/f;for(let o=0;o<s&&g<e;o++,g++){let e=i()**.55;l.pos.set([((n.h+.1+i()*.8)/24-.5)*3.2*c,-.65+e*(d+.65),((n.d+.1+i()*.8)/7-.5)*1.1],g*3),l.col.set(a(r,t,Math.min(1,_*1.4)*(.55+.45*e)),g*3)}}),s(l,i)}function f(e){let t=Math.max(1,...e);return e.map(e=>.05+e/t)}function p(e,r,a,c){let l=o(e),u=Math.max(1,...r),d=f(r),p=d.reduce((e,t)=>e+t,0),m=0;return r.forEach((o,s)=>{let f=s===r.length-1?e-m:Math.round(e*d[s]/p),h=1.35*o/u,g=(s/Math.max(1,r.length-1)-.5)*2.9*c;for(let r=0;r<f&&m<e;r++,m++)l.pos.set([g+(a()-.5)*.17*c,-.68+a()*h,(a()-.5)*.17],m*3),l.col.set(s<3?t:i(n,.7),m*3)}),s(l,a)}var m=[{yaw:.4,pitch:.62,dist:5.2},{yaw:0,pitch:0,dist:3.2},{yaw:-.38,pitch:.58,dist:2.75},{yaw:.28,pitch:.1,dist:3.3}],h=[1,1.9,1.1],g=[0,.9,-.5],_=e=>e*e*(3-2*e);function ee(e){let t=Math.min(3,Math.max(0,e)),n=Math.min(2,Math.floor(t)),r=Math.min(1,t-n),i=_(r),a=m[n],o=m[n+1],s=Math.sin(Math.PI*r);return{yaw:a.yaw+(o.yaw-a.yaw)*i+g[n]*s,pitch:a.pitch+(o.pitch-a.pitch)*i,dist:a.dist+(o.dist-a.dist)*i-h[n]*s}}function te(e,t,n){return Math.max(0,Math.min(1,-e/Math.max(1,t-n)))*3}function ne(e,t){return e<800||t?5e4:2e5}function re(e){return e<20?`static`:e<40?`reduced`:`full`}var ie={frames:0,time:0,done:!1};function ae(e,t){if(e.done||t<=0||t>100)return{next:e,fps:null};let n={frames:e.frames+1,time:e.time+t,done:!1};return n.frames>=90||n.time>=2e3?{next:{...n,done:!0},fps:n.frames*1e3/n.time}:{next:n,fps:null}}var oe=`#version 300 es
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
}`,v=`#version 300 es
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
}`;function y(e,t){if(matchMedia(`(prefers-reduced-motion: reduce)`).matches)return;let n=e.querySelector(`canvas`);if(!n)return;let r=null;try{r=n.getContext(`webgl2`,{antialias:!1,alpha:!1,powerPreference:`high-performance`})}catch{r=null}if(!r)return;let i=r;(e=>`requestIdleCallback`in window?window.requestIdleCallback(e,{timeout:600}):window.setTimeout(e,60))(()=>{C(e,n,i,t).catch(t=>{console.error(t),x(e,i)})})}function b(e,t){let n=e.nextElementSibling,r=e.getBoundingClientRect(),i=r.top<0&&r.bottom>0,a=n?.getBoundingClientRect().top??0;if(t(),!n)return;if(i&&e.dataset.state===`static`){window.scrollTo(0,e.offsetTop);return}let o=n.getBoundingClientRect().top-a;Math.abs(o)>1&&window.scrollBy(0,o)}function x(e,t){b(e,()=>{e.dataset.state=`static`}),e.dispatchEvent(new CustomEvent(`prologue:static`)),t.isContextLost()||t.getExtension(`WEBGL_lose_context`)?.loseContext()}function de(e){let t=1600,n=document.createElement(`canvas`);n.width=t,n.height=560;let r=n.getContext(`2d`);r.font=`700 470px Barlow, 'Arial Narrow', sans-serif`,r.textAlign=`center`,r.textBaseline=`middle`,r.fillStyle=`#fff`,r.fillText(e,t/2,280);let i=r.getImageData(0,0,t,560).data,a=[];for(let e=0;e<560;e+=2)for(let n=0;n<t;n+=2)i[(e*t+n)*4+3]>128&&a.push(n,e);return{px:a,cw:t,ch:560}}function S(e,t,n){let r=e.createProgram();for(let[i,a]of[[e.VERTEX_SHADER,t],[e.FRAGMENT_SHADER,n]]){let t=e.createShader(i);if(e.shaderSource(t,a),e.compileShader(t),!e.getShaderParameter(t,e.COMPILE_STATUS))throw Error(e.getShaderInfoLog(t)??`shader`);e.attachShader(r,t)}if(e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))throw Error(e.getProgramInfoLog(r)??`link`);let i=new Map;return{p:r,u:t=>(i.has(t)||i.set(t,e.getUniformLocation(r,t)),i.get(t))}}async function C(e,t,n,r){await Promise.race([document.fonts.load(`700 400px Barlow`),new Promise(e=>setTimeout(e,1500))]),b(e,()=>{e.dataset.state=`live`});let i=ne(innerWidth,matchMedia(`(pointer: coarse)`).matches),a=i<2e5;e.dataset.particles=String(i),e.querySelector(`[data-hud-count]`).textContent=i.toLocaleString(`en-US`);let o=Math.min(1,t.clientWidth/Math.max(1,t.clientHeight)/1.5),s=de(r.label),u=Math.random,f=[c(i,u),l(s.px,s.cw,s.ch,i,u,o),d(i,r.heat,u,o),p(i,r.nets,u,o)],m=!!n.getExtension(`EXT_color_buffer_float`),h=S(n,oe,se),g=S(n,v,ce),_=S(n,v,le),y=S(n,v,ue),C=n.createVertexArray();n.bindVertexArray(C);let w=(e,t,r)=>{let i=n.getAttribLocation(h.p,e);if(i<0)return;let a=n.createBuffer();n.bindBuffer(n.ARRAY_BUFFER,a),n.bufferData(n.ARRAY_BUFFER,t,n.STATIC_DRAW),n.enableVertexAttribArray(i),n.vertexAttribPointer(i,r,n.FLOAT,!1,0,0)};f.forEach((e,t)=>{w(`aP${t}`,e.pos,3),w(`aC${t}`,e.col,3)});let T=new Float32Array(i);for(let e=0;e<i;e++)T[e]=u();w(`aSeed`,T,1);let E=n.createVertexArray(),D=(e,t)=>{let r=n.createTexture();n.bindTexture(n.TEXTURE_2D,r),n.texImage2D(n.TEXTURE_2D,0,m?n.RGBA16F:n.RGBA8,e,t,0,n.RGBA,m?n.HALF_FLOAT:n.UNSIGNED_BYTE,null);for(let[e,t]of[[n.TEXTURE_MIN_FILTER,n.LINEAR],[n.TEXTURE_MAG_FILTER,n.LINEAR],[n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE],[n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE]])n.texParameteri(n.TEXTURE_2D,e,t);let i=n.createFramebuffer();return n.bindFramebuffer(n.FRAMEBUFFER,i),n.framebufferTexture2D(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,r,0),{tex:r,fbo:i,w:e,h:t}},O=1,k=1,A=1,j=1,M=null,N=()=>{O=Math.min(devicePixelRatio||1,a?1:1.5),k=Math.max(4,Math.round(t.clientWidth*O)),A=Math.max(4,Math.round(t.clientHeight*O)),t.width=k,t.height=A,j=k/A,M&&Object.values(M).forEach(e=>{n.deleteTexture(e.tex),n.deleteFramebuffer(e.fbo)}),M={scene:D(k,A),h1:D(k>>1,A>>1),h2:D(k>>1,A>>1),q1:D(k>>2,A>>2),q2:D(k>>2,A>>2)}};N(),addEventListener(`resize`,N);let P=(e,t,r,i)=>{n.bindFramebuffer(n.FRAMEBUFFER,t?t.fbo:null),n.viewport(0,0,t?t.w:k,t?t.h:A),n.useProgram(e.p),n.bindVertexArray(E),n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,r),n.uniform1i(e.u(`uTex`),0),i?.(),n.drawArrays(n.TRIANGLES,0,3)},F=(e,t,r)=>{P(_,t,e.tex,()=>n.uniform2f(_.u(`uDir`),r/e.w,0)),P(_,e,t.tex,()=>n.uniform2f(_.u(`uDir`),0,r/e.h))},I=0,L=0,R=0,z=0,B=0,V=0,fe=0,pe=-99,me=-99,H=[9,9],U=[9,9],W=null,he=()=>{let t=e.getBoundingClientRect();L=te(t.top,t.height,innerHeight)};addEventListener(`scroll`,he,{passive:!0}),he(),I=L;let ge=e=>{let n=t.getBoundingClientRect();return[(e.clientX-n.left)/n.width*2-1,-((e.clientY-n.top)/n.height*2-1)]};t.addEventListener(`pointerdown`,e=>{W={x:e.clientX,y:e.clientY,yaw:R,pitch:z,moved:!1},e.pointerType!==`touch`&&t.setPointerCapture(e.pointerId)}),t.addEventListener(`pointermove`,e=>{H=ge(e),W?(Math.abs(e.clientX-W.x)+Math.abs(e.clientY-W.y)>4&&(W.moved=!0,e.pointerType!==`touch`&&(t.classList.add(`drag`),V=0)),W.moved&&e.pointerType!==`touch`&&(R=W.yaw+(e.clientX-W.x)*.006,z=Math.max(-.5,Math.min(.7,W.pitch+(e.clientY-W.y)*.004)))):V=1}),t.addEventListener(`pointerup`,e=>{W&&!W.moved&&(U=ge(e),me=performance.now()/1e3),W=null,t.classList.remove(`drag`)}),t.addEventListener(`pointercancel`,()=>{W=null,t.classList.remove(`drag`)}),t.addEventListener(`pointerleave`,()=>V=0);let _e=[...e.querySelectorAll(`[data-cap]`)],ve=e.querySelector(`[data-hud-fps]`),ye=i,G=a?0:.5,K=!1,q=!0,J=0,Y=ie,X=0,Z=0,Q=performance.now(),be=()=>{K=!0,cancelAnimationFrame(J)};t.addEventListener(`webglcontextlost`,t=>{t.preventDefault(),be(),x(e,n)}),new IntersectionObserver(e=>{q=e[0].isIntersecting,q&&!K&&!J&&(J=requestAnimationFrame($))}).observe(e);function $(t){if(J=0,K||!q||!M)return;let r=t/1e3;I+=(L-I)*.06,B+=(V-B)*.1,W||(R*=.985,z*=.985);let o=Math.round(I);Math.abs(I-o)<.03&&o!==fe&&(fe=o,pe=r);let s=ee(I);n.bindFramebuffer(n.FRAMEBUFFER,M.scene.fbo),n.viewport(0,0,k,A),n.clearColor(0,0,0,1),n.clear(n.COLOR_BUFFER_BIT),n.useProgram(h.p),n.bindVertexArray(C),n.enable(n.BLEND),n.blendFunc(n.ONE,n.ONE),n.disable(n.DEPTH_TEST);let c=h.u;if(n.uniform1f(c(`uState`),I),n.uniform1f(c(`uTime`),r),n.uniform1f(c(`uAspect`),j),n.uniform1f(c(`uDpr`),O),n.uniform1f(c(`uYaw`),s.yaw+R+Math.sin(r*.25)*.08),n.uniform1f(c(`uPitch`),s.pitch+z),n.uniform1f(c(`uDist`),s.dist),n.uniform2f(c(`uMouse`),H[0],H[1]),n.uniform1f(c(`uMouseOn`),B),n.uniform1f(c(`uGain`),a?.26:.13),n.uniform1f(c(`uPulse`),r-pe),n.uniform2f(c(`uBoom`),U[0],U[1]),n.uniform1f(c(`uBoomT`),r-me),n.drawArrays(n.POINTS,0,ye),n.disable(n.BLEND),P(g,M.h1,M.scene.tex),G>0&&(F(M.h1,M.h2,1),F(M.h1,M.h2,2)),P(_,M.q1,M.h1.tex,()=>n.uniform2f(_.u(`uDir`),0,0)),F(M.q1,M.q2,1.5),F(M.q1,M.q2,3),n.bindFramebuffer(n.FRAMEBUFFER,null),n.viewport(0,0,k,A),n.useProgram(y.p),n.bindVertexArray(E),[M.scene,M.h1,M.q1].forEach((e,t)=>{n.activeTexture(n.TEXTURE0+t),n.bindTexture(n.TEXTURE_2D,e.tex)}),n.uniform1i(y.u(`uScene`),0),n.uniform1i(y.u(`uB1`),1),n.uniform1i(y.u(`uB2`),2),n.uniform1f(y.u(`uTime`),r),n.uniform2f(y.u(`uRes`),k,A),n.uniform1f(y.u(`uB1Gain`),G),n.drawArrays(n.TRIANGLES,0,3),_e.forEach((e,t)=>{let n=Math.max(0,1-Math.abs(I-t)*2.2);e.style.opacity=String(n),e.style.transform=`translateY(${(1-n)*16}px)`}),e.dataset.chapter=String(o),!Y.done){let r=ae(Y,X?t-X:0);if(Y=r.next,r.fps!==null){let t=re(r.fps);if(e.dataset.quality=t,t===`static`){be(),x(e,n);return}t===`reduced`&&(ye=i>>1,G=0)}}X=t,Z++,t-Q>500&&(ve.textContent=String(Math.round(Z*1e3/(t-Q))),Z=0,Q=t),J=requestAnimationFrame($)}t.dataset.ready=``,J=requestAnimationFrame($)}var w=document.querySelector(`[data-prologue]`);w&&y(w,{heat:e.results.heatmap.values,nets:e.results.merchants.values.map(e=>Number(e[3])),label:w.dataset.label??``});