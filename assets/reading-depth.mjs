// Reading-depth diagrams: decorative schema only, never employee or result data.
const main = document.querySelector('main');
const route = location.pathname;
if (main && (route === '/' || route.startsWith('/projects/'))) {
  const sheet = document.createElement('link');
  sheet.rel = 'stylesheet'; sheet.href = '/assets/reading-depth.css';
  document.head.append(sheet);
  const labels = route.includes('hris')
    ? [['MASTER DATA','EMPLOYEE ID','EMPTY FIELDS'],['SOURCE FILE','IDENTITY MATCH','FIELD EXTRACTION'],['HUMAN REVIEW','CONFLICT CHECK','APPROVED WRITE']]
    : route.includes('campus-delivery')
    ? [['ORDERS','PK order_id','FK merchant_id'],['ORDER ITEMS','FK order_id','quantity · unit_price'],['PAYMENTS','FK order_id','amount_cents']]
    : [['INPUT','SOURCE','STRUCTURE'],['PROCESS','CHECK','TRANSFORM'],['OUTPUT','EVIDENCE','REVIEW']];
  const layer = document.createElement('div');
  layer.className = 'reading-depth'; layer.setAttribute('aria-hidden','true');
  layer.innerHTML = labels.map((words,i)=>`<div class="depth-diagram" data-depth="${i}"><svg viewBox="0 0 440 280" fill="none"><rect x="36" y="36" width="320" height="196" rx="24"/><path d="M36 98H356M36 160H356M356 130H414V264H254"/><circle cx="414" cy="130" r="6"/><circle cx="254" cy="264" r="6"/><rect class="depth-accent" x="58" y="58" width="10" height="10" rx="2"/><g fill="currentColor" stroke="none" font-family="monospace" font-size="18"><text x="84" y="75">${words[0]}</text><text x="60" y="137">${words[1]}</text><text x="60" y="199">${words[2]}</text></g></svg></div>`).join('');
  main.prepend(layer); main.classList.add('has-reading-depth');
  const diagrams = [...layer.children];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  let px=0, py=0, frame=0;
  function draw() {
    frame=0;
    const box=main.getBoundingClientRect();
    const progress=Math.max(0,Math.min(1,-box.top/Math.max(1,box.height-innerHeight)));
    diagrams.forEach((el,i)=>{
      const phase=Math.max(0,1-Math.abs(progress-i/2)*1.7);
      const x=reduced.matches?0:px*(12+i*6);
      const y=reduced.matches?0:py*12+(progress-i/2)*-110;
      el.style.transform=`translate3d(${x}px,${y}px,0) rotate(${reduced.matches?0:(i-1)*5+px*2}deg)`;
      el.style.opacity=String(.07+phase*.13);
    });
  }
  function schedule(){if(!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('pointermove',event=>{if(fine.matches&&!reduced.matches){px=event.clientX/innerWidth-.5;py=event.clientY/innerHeight-.5;schedule();}},{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{px=py=0;schedule();});
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',schedule);
  draw();
}
