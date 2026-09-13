// Native, bounded feedback only. No scroll interception, cursor loops or motion dependency.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const active=new Set();
function acknowledge(element){
 if(reduced.matches||!element.animate)return;
 element.getAnimations().forEach(a=>a.cancel());
 const animation=element.animate([{backgroundColor:'#d1ffca'},{backgroundColor:'transparent'}],{duration:380,easing:'ease-out'});
 active.add(animation);
 animation.finished.catch(()=>{}).finally(()=>active.delete(animation));
}
for(const id of ['metrics','agent-score','agent-facts']){
 const target=document.getElementById(id);
 if(!target)continue;
 let previous=target.textContent;
 new MutationObserver(()=>{
  const current=target.textContent;
  if(current!==previous&&previous.trim()){
   if(id==='metrics')target.querySelectorAll('strong').forEach(acknowledge);
   else acknowledge(target);
  }
  previous=current;
 }).observe(target,{childList:true,subtree:true,characterData:true});
}
reduced.addEventListener('change',()=>{if(reduced.matches)active.forEach(a=>a.cancel());});
document.addEventListener('visibilitychange',()=>{if(document.hidden)active.forEach(a=>a.cancel());});
