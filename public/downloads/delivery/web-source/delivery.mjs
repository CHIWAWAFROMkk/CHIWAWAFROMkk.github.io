import {queries} from './delivery-core.mjs';
const $=id=>document.getElementById(id);
let worker,sequence=0,pending,backup,state,exportRows=[];
const controls=['run-query','place-order','reset-db','download-db'];
function busy(value){controls.forEach(id=>$(id).disabled=value);document.querySelectorAll('[data-refund]').forEach(x=>x.disabled=value);$('cancel-query').disabled=!value;}
function message(text,error=false){$('sql-status').textContent=text;$('sql-status').dataset.error=String(error);}
function start(){worker=new Worker('/assets/delivery-worker.js');worker.onmessage=({data})=>{if(!pending||data.id!==pending.id)return;clearTimeout(pending.timer);const {resolve,reject}=pending;pending=null;busy(false);if(data.ok){if(data.backup)backup=data.backup;state=data.state;renderState();resolve(data);}else reject(Error(data.error));};worker.onerror=()=>abort('运行引擎出错，已保留上次成功提交的数据。');}
function request(action,extra={}){if(pending)return Promise.reject(Error('请等待当前操作完成'));busy(true);return new Promise((resolve,reject)=>{const id=++sequence;pending={id,action,resolve,reject,timer:setTimeout(()=>abort(action==='init'?'数据库加载超时，请刷新重试。':'运行已停止：超过 3 秒限制。'),action==='init'?20000:3000)};worker.postMessage({id,action,...extra});});}
function abort(text){if(!pending)return;const task=pending;clearTimeout(task.timer);pending=null;worker.terminate();task.reject(Error(text));if(task.action==='init'){busy(true);$('cancel-query').disabled=true;message(text,true);return;}start();request('init',{backup}).then(()=>message(text,true)).catch(e=>{busy(true);$('cancel-query').disabled=true;message(e.message+' 请刷新页面重试。',true);});}
function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function renderState(){
 const selected=$('dish').value;$('dish').replaceChildren();
 state.dishes.forEach(d=>{const o=new Option(`${d.merchant} / ${d.name} · ¥${(d.price_cents/100).toFixed(2)} · 库存 ${d.stock}`,d.id);$('dish').add(o);});if(selected)$('dish').value=selected;
 $('order-list').replaceChildren();
 const status={paid:'已支付 · 未送达',delivered:'已送达',refunded:'已退款'};
 state.orders.forEach(o=>{const row=document.createElement('div');row.className='order-row';const p=document.createElement('p');p.textContent=`#${o.id} ${o.merchant} · ¥${(o.total_cents/100).toFixed(2)}`;const small=document.createElement('small');small.textContent=`${o.student} / ${status[o.status]}`;p.append(small);row.append(p);if(o.status==='paid'){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='取消退款';b.dataset.refund=o.id;b.onclick=()=>refundOrder(o.id);row.append(b);}$('order-list').append(row);});total();
}
function total(){const dish=state?.dishes.find(d=>d.id===Number($('dish').value)),q=Number($('quantity').value);$('order-total').textContent=dish&&Number.isInteger(q)&&q>0&&q<=20?`订单金额 ¥${(dish.price_cents*q/100).toFixed(2)}`:'请输入 1–20 份';}
function flash(){const flow=document.querySelector('.delivery-flow');flow.removeAttribute('data-done');requestAnimationFrame(()=>flow.setAttribute('data-done',''));}
function table(results){$('sql-results').replaceChildren();exportRows=[];let count=0;for(const r of results){if(r.truncated)continue;if(!exportRows.length)exportRows=[r.columns,...r.values];const t=document.createElement('table'),head=document.createElement('thead'),tr=document.createElement('tr');r.columns.forEach(c=>{const th=document.createElement('th');th.scope='col';th.textContent=c;tr.append(th);});head.append(tr);t.append(head);const tbody=document.createElement('tbody');r.values.forEach(v=>{const row=document.createElement('tr');v.forEach(x=>{const td=document.createElement('td');td.textContent=x===null?'NULL':String(x);row.append(td);});tbody.append(row);});t.append(tbody);$('sql-results').append(t);count+=r.values.length;}$('export-csv').disabled=!exportRows.length;return count;}
async function run(){const started=performance.now();message('正在执行 SQL…');$('export-csv').disabled=true;try{const data=await request('query',{sql:$('sql-input').value});const n=table(data.result);message(`${n} 行 · ${(performance.now()-started).toFixed(0)} ms${data.result.some(x=>x.truncated)?' · 已截取前 500 行':''}${n===0?' · 查询成功，无匹配记录':''}`);}catch(e){$('sql-results').replaceChildren();exportRows=[];message(e.message,true);}}
async function refundOrder(id){try{await request('refund',{order:id});$('order-status').textContent=`订单 #${id} 已全额退款，库存已恢复。`;flash();await run();}catch(e){$('order-status').textContent=e.message;}}
queries.forEach((q,i)=>$('query-preset').add(new Option(q.name,i)));
function preset(){const q=queries[Number($('query-preset').value)];$('sql-input').value=q.sql;$('query-note').textContent=q.note;}
$('query-preset').onchange=preset;preset();
for(let i=1;i<=12;i++)$('student').add(new Option('同学 '+String(i).padStart(2,'0'),i));
$('run-query').onclick=run;$('cancel-query').onclick=()=>abort('已停止运行。');
$('sql-input').onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();if(!pending)run();}};
$('dish').onchange=total;$('quantity').oninput=total;
$('order-form').onsubmit=async e=>{e.preventDefault();try{const data=await request('place',{input:{student:Number($('student').value),dish:Number($('dish').value),quantity:Number($('quantity').value)}});$('order-status').textContent=`订单 #${data.order} 已提交；明细、支付、配送记录及库存同步更新。`;flash();await run();}catch(error){$('order-status').textContent='下单未提交：'+error.message;}};
$('reset-db').onclick=async()=>{try{await request('init');$('order-status').textContent='已恢复 96 笔初始演示订单。';await run();}catch(e){message(e.message,true);}};
$('download-db').onclick=()=>{if(backup)download(backup,'campus-delivery.sqlite','application/vnd.sqlite3');};
$('export-csv').onclick=()=>download('\uFEFF'+exportRows.map(row=>row.map(v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"').join(',')).join('\r\n'),'query-result.csv','text/csv;charset=utf-8');
fetch('/assets/delivery-schema.sql').then(r=>{if(!r.ok)throw Error('SQL 文件未加载');return r.text();}).then(t=>$('schema-source').textContent=t).catch(()=>$('schema-source').textContent='请下载建表与数据 SQL。');
start();request('init').then(run).catch(e=>{busy(true);$('cancel-query').disabled=true;message(e.message+' 请刷新页面重试。',true);});
