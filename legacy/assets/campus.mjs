const stage=document.querySelector('.product-stage');
const main=document.querySelector('.campus-cinematic');
const slides=[...document.querySelectorAll('[data-product]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let pending=0;
function render(){
  pending=0;if(!stage||!main||document.hidden)return;
  const bounds=main.getBoundingClientRect();
  const travel=Math.max(1,bounds.height-innerHeight);
  const progress=Math.max(0,Math.min(1,-bounds.top/travel));
  const position=progress*(slides.length-1);
  const current=Math.round(position);
  stage.style.visibility=bounds.bottom>0&&bounds.top<innerHeight?'visible':'hidden';
  slides.forEach((slide,i)=>{
    const delta=i-position;
    const active=i===current;
    slide.inert=!active;slide.setAttribute('aria-hidden',String(!active));
    const visibility=Math.max(0,1-Math.abs(delta));
    slide.style.opacity=String(reduced.matches?(active?1:0):visibility*visibility*(3-2*visibility));
    slide.style.transform=reduced.matches?'none':`translate3d(0,${delta*innerHeight*.65}px,0)`;
    const window=slide.querySelector('.product-window');
    const title=slide.querySelector('h2');
    if(window)window.style.transform=reduced.matches?'none':`translate3d(${delta*45}px,${delta*innerHeight*.2}px,0) rotate(${delta*-8}deg) scale(${1-Math.abs(delta)*.08})`;
    if(title)title.style.transform=reduced.matches?'none':`translate3d(${delta*-90}px,0,0)`;
  });
}
function schedule(){if(!pending)pending=requestAnimationFrame(render);}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});addEventListener('pageshow',schedule);document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);schedule();
if(main)new ResizeObserver(schedule).observe(main);
