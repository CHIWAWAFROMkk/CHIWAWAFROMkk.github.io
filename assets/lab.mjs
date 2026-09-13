import {parseCSV,analyze,numeric,histogram,csvExport,VERSION,LIMIT,stats} from './analysis-core.mjs';
const $=id=>document.getElementById(id), fmt=n=>n===null||n===undefined?'—':new Intl.NumberFormat('zh-CN',{maximumFractionDigits:4}).format(n);
let source=null, result=null, filename='', hash='', page=0, sortColumn=-1, ascending=true, generation=0;
const pageSize=15;
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function message(text,error=false){$('message').textContent=text;$('message').className='notice'+(error?' error':'');}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function load(text,name){
  const ticket=++generation;
  try{
    const next=parseCSV(text,$('delimiter').value);
    let digest='不可用';
    if(globalThis.crypto?.subtle) digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(x=>x.toString(16).padStart(2,'0')).join('');
    if(ticket!==generation)return;
    source=next;hash=digest;filename=name;page=0;sortColumn=-1;
    $('dedupe').checked=false;$('drop-missing').checked=false;$('search').value='';
    $('column').replaceChildren(...source.headers.map((h,i)=>{const o=node('option',h);o.value=i;return o;}));
    const preferred=source.headers.findIndex(h=>/^(close|收盘价|金额|销售额)$/i.test(h));
    const firstNumeric=analyze(source).columns.findIndex(c=>c.type==='数值');
    $('column').value=String(preferred>=0?preferred:Math.max(0,firstNumeric));
    $('results').hidden=false;$('empty').hidden=true;
    $('source-label').textContent=`${name} · ${source.headers.length} 列 · ${source.delimiter==='\t'?'制表符':source.delimiter===';'?'分号':'逗号'}分隔`;
    message(name==='sample.csv'?'当前为人工构造的行情结构示例，不是真实市场数据。可上传自己的 CSV 替换。':'已读取文件。计算在当前浏览器完成，数据不会上传到服务器。');
    render();
  }catch(e){if(ticket===generation)message(`${e.message}${source?' 原有分析结果已保留。':''}`,true);}
}
function render(){
  if(!source)return;
  result=analyze(source,{deduplicate:$('dedupe').checked,dropMissing:$('drop-missing').checked});
  $('metrics').replaceChildren(...[[result.rows.length,'当前数据行'],[source.headers.length,'字段'],[result.missingCells,'空白单元格'],[result.duplicates,'输入中的重复行']].map(([v,label])=>{const el=node('div',undefined,'metric');el.append(node('strong',fmt(v)),node('span',label));return el;}));
  $('audit').textContent=`输入 ${source.rows.length} 行 → 去重移除 ${result.removedDuplicates} 行 → 空值过滤移除 ${result.removedMissing} 行 → 保留 ${result.rows.length} 行。重复行按完整原始单元格逐项相同判定，保留首次出现。`;
  const tbody=$('quality-body');tbody.replaceChildren();
  result.columns.forEach(c=>{const tr=node('tr');[c.name,c.type,c.missing,c.unique,c.count,c.invalidNumeric].forEach(v=>tr.append(node('td',String(v))));tbody.append(tr);});
  renderStats();renderTable();
}
function renderStats(){
  if(!result)return;
  const index=Number($('column').value), c=result.columns[index], values=result.rows.map(r=>numeric(r[index])).filter(x=>x!==null);
  $('stats-title').textContent=`${c.name} · 数值分布`;
  $('stat-list').replaceChildren(...[['有效数值',c.count],['均值',c.mean],['中位数',c.median],['最小值',c.min],['最大值',c.max],['样本标准差',c.sd],['IQR 异常候选',c.outliers]].map(([k,v])=>{const div=node('div');div.append(node('dt',k),node('dd',fmt(v)));return div;}));
  $('numeric-note').textContent=`本列 ${c.missing} 个空白、${c.invalidNumeric} 个非数值未参与统计。编号与日期建议仅用于分组；数字型编号的数值统计没有业务含义。异常候选不会自动删除。`;
  const bins=histogram(values), max=Math.max(1,...bins.map(b=>b.count));
  $('histogram').replaceChildren(...bins.map((b,i)=>{const col=node('div',undefined,'bin'),bar=node('i');bar.style.height=`${b.count/max*130}px`;col.title=`${fmt(b.low)} ${i===bins.length-1?'≤ x ≤':'≤ x <'} ${fmt(b.high)}：${b.count} 行`;col.append(node('span',b.count),bar);return col;}));
  $('chart-empty').hidden=values.length>0;$('range-min').textContent=fmt(c.min);$('range-max').textContent=fmt(c.max);
  $('bins-body').replaceChildren(...bins.map((b,i)=>{const tr=node('tr');tr.append(node('td',`${fmt(b.low)} ≤ x ${i===bins.length-1?'≤':'<'} ${fmt(b.high)}`),node('td',b.count));return tr;}));
}
function renderTable(){
  if(!result)return;
  const query=$('search').value.toLocaleLowerCase(),rows=result.rows.filter(r=>!query||r.some(x=>x.toLocaleLowerCase().includes(query)));
  if(sortColumn>=0)rows.sort((a,b)=>{const x=numeric(a[sortColumn]),y=numeric(b[sortColumn]);return (x!==null&&y!==null?x-y:a[sortColumn].localeCompare(b[sortColumn],'zh-CN'))*(ascending?1:-1);});
  const maxPage=Math.max(0,Math.ceil(rows.length/pageSize)-1);page=Math.min(page,maxPage);
  const tr=node('tr');
  source.headers.forEach((h,i)=>{const th=node('th'),button=node('button',h+(sortColumn===i?(ascending?' ↑':' ↓'):''));th.scope='col';th.setAttribute('aria-sort',sortColumn===i?(ascending?'ascending':'descending'):'none');button.title=`按 ${h} 排序`;button.onclick=()=>{ascending=sortColumn===i?!ascending:true;sortColumn=i;renderTable();};th.append(button);tr.append(th);});
  $('data-head').replaceChildren(tr);
  $('data-body').replaceChildren(...rows.slice(page*pageSize,(page+1)*pageSize).map(r=>{const tr=node('tr');r.forEach(v=>{const td=node('td',v.trim()?v:'空白',v.trim()?'':'missing');td.title=v;tr.append(td);});return tr;}));
  $('table-empty').hidden=rows.length>0;$('page-info').textContent=`${rows.length? page*pageSize+1:0}–${Math.min((page+1)*pageSize,rows.length)} / ${rows.length} 行`;
  $('prev').disabled=page===0;$('next').disabled=page===maxPage;
}
$('file').onchange=async event=>{const file=event.target.files[0];if(!file)return;if(file.size>LIMIT){message('文件超过 2 MB，请先拆分。原有结果未改变。',true);return;}try{const buffer=await file.arrayBuffer(),text=new TextDecoder('utf-8',{fatal:true}).decode(buffer);await load(text,file.name);}catch{message('文件不是有效的 UTF-8 文本。请另存为 CSV UTF-8 后重试；暂不支持 Excel 工作簿。',true);}event.target.value='';};
$('paste-run').onclick=()=>load($('paste').value,'粘贴数据');
$('example').onclick=async()=>{try{message('正在读取示例…');const response=await fetch('/assets/sample.csv');if(!response.ok)throw Error();await load(await response.text(),'sample.csv');}catch{message('示例未能加载。请稍后重试，或粘贴自己的 CSV。',true);}};
['dedupe','drop-missing'].forEach(id=>$(id).onchange=()=>{page=0;render();});
$('column').onchange=renderStats;$('search').oninput=()=>{page=0;renderTable();};
$('prev').onclick=()=>{page--;renderTable();};$('next').onclick=()=>{page++;renderTable();};
$('export-csv').onclick=()=>{if(result)download('analyzed-data.csv',csvExport(source.headers,result.rows),'text/csv;charset=utf-8');};
$('export-json').onclick=()=>{
  if(!result)return;
  const report={version:VERSION,filename,inputSha256:hash,delimiter:source.delimiter,options:{deduplicate:$('dedupe').checked,dropMissing:$('drop-missing').checked},selectedColumn:source.headers[Number($('column').value)],audit:{inputRows:source.rows.length,outputRows:result.rows.length,duplicates:result.duplicates,removedDuplicates:result.removedDuplicates,removedMissing:result.removedMissing},columns:result.columns,method:'空白不填补；数值严格解析；分位数线性插值；标准差 n-1；异常值用 1.5×IQR。表格搜索/排序不改变统计与导出。'};
  download('analysis-report.json',JSON.stringify(report,null,2),'application/json');
};
$('example').click();
