// Multi-page transitions: ordinary document navigation, no router or fetched-page replacement.
const preference=matchMedia('(prefers-reduced-motion: reduce)');
let navigationTimer,recoveryTimer;
function reset(){
 clearTimeout(navigationTimer);clearTimeout(recoveryTimer);
 document.body.classList.remove('page-leaving');
}
document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||preference.matches)return;
 const link=event.target.closest?.('a[href]');
 if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
 const url=new URL(link.href,location.href);
 if(url.origin!==location.origin||!/^https?:$/.test(url.protocol))return;
 if(url.pathname===location.pathname&&url.search===location.search)return;
 if(!url.pathname.endsWith('/')&&!url.pathname.endsWith('.html'))return;
 event.preventDefault();
 reset();
 document.body.classList.add('page-leaving');
 navigationTimer=setTimeout(()=>{
  // Recover the readable page if a navigation is cancelled or cannot complete.
  recoveryTimer=setTimeout(reset,1500);
  try{location.assign(url.href);}catch{reset();}
 },220);
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')reset();});
addEventListener('pageshow',event=>{
 reset();
 if(event.persisted&&!preference.matches&&document.querySelector('main')?.animate){
  document.querySelector('main').animate([{opacity:.35},{opacity:1}],{duration:240,easing:'ease-out'});
 }
});
preference.addEventListener('change',()=>{if(preference.matches)reset();});
