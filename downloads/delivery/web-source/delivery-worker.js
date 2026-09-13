importScripts('/assets/vendor/sql-wasm.js');
let db,SQL,core;
onmessage=async({data:m})=>{
 try{
  if(m.action==='init'){
   SQL=await initSqlJs({locateFile:()=>'/assets/vendor/sql-wasm.wasm'});
   core=await import('./delivery-core.mjs');
   const bytes=m.backup||new Uint8Array(await(await fetch('/downloads/delivery/campus.sqlite')).arrayBuffer());
   if(db)db.close();db=new SQL.Database(bytes);db.run('PRAGMA foreign_keys=ON');
  }
  if(!db)throw Error('数据库尚未载入');
  let result=[],order;
  if(m.action==='query'){
   if(!m.sql.trim()||m.sql.length>12000)throw Error('请输入 1–12000 字符的 SQL');
   // A disposable database isolates all user-written SQL from the business demo.
   const sandbox=new SQL.Database(db.export());
   try{
    sandbox.run('PRAGMA foreign_keys=ON');let count=0,statements=0;
    for(const stmt of sandbox.iterateStatements(m.sql)){
     if(++statements>10)throw Error('一次最多执行 10 条语句');
     const columns=stmt.getColumnNames(),values=[];
     while(stmt.step()){if(++count>500)break;values.push(stmt.get());}
     if(columns.length)result.push({columns,values});
     if(count>500){result.push({truncated:true});break;}
    }
   }finally{sandbox.close();}
  }
  if(m.action==='place')order=core.place(db,m.input);
  if(m.action==='refund')order=core.refund(db,m.order);
  const state=core.snapshot(db);
  const backup=m.action!=='query'?db.export():null;
  postMessage({id:m.id,ok:true,result,state,order,backup});
 }catch(e){postMessage({id:m.id,ok:false,error:e.message});}
};
