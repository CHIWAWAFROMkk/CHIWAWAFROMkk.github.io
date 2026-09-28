// CSV Lab 1.0.0 — identical calculation module in the browser and Node.js.
export const VERSION = '1.0.0';
export const LIMIT = 2 * 1024 * 1024;
export function parseCSV(input, delimiter = 'auto') {
  if (new TextEncoder().encode(input).length > LIMIT) throw Error('文件超过 2 MB，请先拆分数据。');
  const text = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!text.trim()) throw Error('没有数据。请上传 CSV，或粘贴包含表头的数据。');
  if (delimiter === 'auto') {
    let quoted = false, counts = {',': 0, ';': 0, '\t': 0};
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') { if (quoted && text[i + 1] === '"') i++; else quoted = !quoted; }
      if (!quoted && c === '\n') break;
      if (!quoted && c in counts) counts[c]++;
    }
    delimiter = Object.keys(counts).sort((a,b) => counts[b] - counts[a])[0];
  }
  if (![',',';','\t'].includes(delimiter)) throw Error('不支持的分隔符。');
  let rows = [], row = [], cell = '', quoted = false, closed = false;
  const pushCell = () => { row.push(cell); cell = ''; closed = false; };
  const pushRow = () => { pushCell(); if (row.some(x => x.trim() !== '')) rows.push(row); row = []; if (rows.length > 20001) throw Error('最多支持 20,000 行数据。'); };
  for (let i=0; i<text.length; i++) {
    const c=text[i];
    if (quoted) {
      if (c === '"' && text[i+1] === '"') { cell+='"'; i++; }
      else if (c === '"') { quoted=false; closed=true; }
      else cell+=c;
    } else if (c === delimiter) pushCell();
    else if (c === '\n') pushRow();
    else if (c === '"' && cell === '' && !closed) quoted=true;
    else if (c === '"' || (closed && c.trim())) throw Error('引号格式不正确。含分隔符的内容请用双引号包围。');
    else if (!closed) cell+=c;
  }
  if (quoted) throw Error('存在未闭合的双引号，请检查 CSV。');
  pushRow();
  const headers=rows.shift()?.map(x=>x.trim());
  if (!headers?.length || headers.length>100) throw Error('需要表头，且最多支持 100 列。');
  if (headers.some(x=>!x) || new Set(headers).size!==headers.length) throw Error('表头不能为空或重复，请修改后再导入。');
  if (!rows.length) throw Error('只有表头，没有数据行。');
  const bad=rows.findIndex(r=>r.length!==headers.length);
  if (bad>=0) throw Error(`第 ${bad+1} 条数据记录的列数与表头不一致，请检查分隔符或缺失的逗号。`);
  return {headers, rows, delimiter};
}
export function numeric(value) {
  const s=value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s)) return null;
  const n=Number(s);
  return Number.isFinite(n) && Math.abs(n)<=1e100 ? n : null;
}
export function quantile(sorted,p) {
  if (!sorted.length) return null;
  const at=(sorted.length-1)*p, lo=Math.floor(at);
  return sorted[lo]+(sorted[Math.ceil(at)]-sorted[lo])*(at-lo);
}
export function stats(values) {
  const sorted=values.slice().sort((a,b)=>a-b), n=sorted.length;
  if (!n) return {count:0,min:null,max:null,mean:null,median:null,sd:null,q1:null,q3:null,outliers:0};
  const mean=sorted.reduce((a,b)=>a+b/n,0), q1=quantile(sorted,.25), q3=quantile(sorted,.75), iqr=q3-q1;
  return {count:n,min:sorted[0],max:sorted[n-1],mean,median:quantile(sorted,.5),sd:n>1?Math.sqrt(sorted.reduce((a,b)=>a+(b-mean)**2,0)/(n-1)):null,q1,q3,outliers:sorted.filter(x=>x<q1-1.5*iqr||x>q3+1.5*iqr).length};
}
export function analyze(data,options={}) {
  const seen=new Set(); let duplicates=0, removedDuplicates=0, removedMissing=0;
  const rows=data.rows.filter(row=>{
    const key=JSON.stringify(row), dup=seen.has(key); seen.add(key);
    if (dup) duplicates++;
    if (options.deduplicate && dup) { removedDuplicates++; return false; }
    if (options.dropMissing && row.some(x=>!x.trim())) { removedMissing++; return false; }
    return true;
  });
  const columns=data.headers.map((name,i)=>{
    const values=rows.map(r=>r[i]), present=values.filter(x=>x.trim()), nums=present.map(numeric), valid=nums.filter(x=>x!==null);
    // IDs with leading zeros stay text; numeric values remain inspectable on selection.
    const type=present.length && valid.length===present.length && !present.some(x=>/^0\d+$/.test(x.trim()))?'数值':'文本';
    return {name,type,missing:values.length-present.length,unique:new Set(present).size,invalidNumeric:present.length-valid.length,...stats(valid)};
  });
  return {rows,columns,inputRows:data.rows.length,duplicates,removedDuplicates,removedMissing,missingCells:columns.reduce((a,c)=>a+c.missing,0)};
}
export function histogram(values) {
  if (!values.length) return [];
  const {min,max}=stats(values), n=min===max?1:Math.min(10,Math.ceil(Math.sqrt(values.length))), width=(max-min)/n;
  const bins=Array.from({length:n},(_,i)=>({low:min+i*width,high:i===n-1?max:min+(i+1)*width,count:0}));
  values.forEach(v=>bins[min===max?0:Math.min(n-1,Math.floor((v-min)/width))].count++);
  return bins;
}
export function csvExport(headers,rows) {
  // Prefix spreadsheet formulas. Export intentionally changes these cells for safe opening.
  const escape=x=>'"'+String(/^[\s]*[=+@-]/.test(x)&&numeric(x)===null?"'"+x:x).replaceAll('"','""')+'"';
  return '\uFEFF'+[headers,...rows].map(r=>r.map(escape).join(',')).join('\r\n');
}
