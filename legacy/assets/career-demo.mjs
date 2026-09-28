const $=id=>document.getElementById(id);
const labels={matched:'已匹配',gap:'证据缺口',unknown:'待确认',passes:'满足',fails:'不满足',confirmed:'已确认',needs_confirmation:'待确认',capability_gap:'能力缺口',manual_input:'本人填写',documented:'有文档依据',user_confirmed:'用户已确认',strongly_recommend:'强烈推荐',recommend:'推荐',try:'可以尝试',low_priority:'低优先级'};
let demo,selected;
function el(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);return node;}
function table(id,rows){
 const headers={'agent-matches':['要求','状态','依据','说明'],'agent-gates':['JD 原文','判断','原因'],'agent-review':['检查项','状态','处理说明','阻止提交']}[id];
 $(id).replaceChildren(...rows.map(row=>{const tr=el('tr');row.forEach(value=>tr.append(el('td',value)));return tr;}));
 $(id+'-mobile').replaceChildren(...rows.map(row=>{
  const record=el('dl');record.className='mobile-record';
  row.forEach((value,i)=>{record.append(el('dt',headers[i]),el('dd',value));});
  return record;
 }));
}
function draft(){const value=selected.pack.materials[$('agent-material').value];$('agent-draft').textContent=Array.isArray(value)?value.map((x,i)=>`${i+1}. ${x}`).join('\n'):value;}
function render(){
  selected=demo.scenarios.find(s=>s.id===`${$('agent-days').value}-${$('agent-evidence').value}`);
  if(!selected)throw Error('未找到这组范例');
  const {match,pack,profile}=selected;
  $('agent-status').textContent=`当前回放：${selected.days===null?'到岗天数未知':`每周 ${selected.days} 天`} / Tableau ${selected.tableauConfirmed?'已确认':'尚未确认'}。由原 Python 引擎计算，页面不调用大模型。`;
  $('agent-jd').textContent=demo.jd;
  $('agent-profile').replaceChildren(...profile.experiences[0].facts.map(f=>{const p=el('p');const status=el('span',labels[f.status]);status.className='tag';p.append(status,el('br'),el('span',f.statement),el('br'),el('small',f.id));return p;}));
  $('agent-score').textContent=match.overall_score;
  $('agent-facts').textContent=pack.evidence.length;
  $('agent-blocks').textContent=pack.review_checklist.filter(x=>x.blocks_submission).length;
  $('agent-recommendation').textContent=labels[match.recommendation];
  $('agent-observation').textContent=(selected.days===3?'到岗天数不满足硬门槛，总分被限制在 59。':selected.days===null?'到岗天数未知，保留人工确认，不自动补成满足。':'到岗条件满足，但“熟练使用 SQL”仍需人工核验。')+(selected.tableauConfirmed?' 已确认的 Tableau 事实进入材料；综合分不一定上升，因为硬门槛上限仍然有效。':' Tableau 尚未确认，不能据此写入材料。');
  const names={role_direction:'岗位方向 / 20',skills:'技能 / 30',experience:'经历 / 25',education:'学历 / 10',logistics:'地点与到岗 / 10',preferences:'偏好 / 5'};
  $('agent-breakdown').replaceChildren(...Object.entries(match.score_breakdown).map(([k,v])=>{const div=el('div');div.append(el('dt',names[k]),el('dd',v));return div;}));
  $('agent-reasons').replaceChildren(...[...match.why_fit,...match.why_not_fit].map(x=>el('li',x)));
  table('agent-matches',match.evidence.map(x=>[x.requirement,labels[x.status],x.profile_fact_ids.join(', ')||'无已确认证据',x.explanation]));
  table('agent-gates',match.hard_gates.map(x=>[x.requirement,labels[x.status],x.explanation]));
  table('agent-review',pack.review_checklist.map(x=>[x.item,labels[x.status]||x.status,x.detail,x.blocks_submission?'是':'否']));
  draft();
}
async function load(){
  $('agent-retry').hidden=true;
  try{const response=await fetch('/assets/job-agent-demo.json');if(!response.ok)throw Error();demo=await response.json();if(!Array.isArray(demo.scenarios)||demo.scenarios.length!==6)throw Error();render();$('agent-results').hidden=false;$('agent-days').disabled=false;$('agent-evidence').disabled=false;}
  catch{$('agent-status').textContent='范例暂时未能加载，请重试。也可以直接下载下方的完整输入与结果。';$('agent-retry').hidden=false;}
}
['agent-days','agent-evidence'].forEach(id=>$(id).onchange=render);
$('agent-material').onchange=draft;$('agent-retry').onclick=load;
$('agent-export').onclick=()=>{if(!selected)return;const content={disclaimer:demo.disclaimer,sourceCommit:demo.sourceCommit,sourceHashes:demo.sourceHashes,...selected};const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download=`job-agent-example-${selected.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
load();
