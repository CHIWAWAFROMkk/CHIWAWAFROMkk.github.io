import{n as e,r as t}from"./tool-i18n.DTurGXby.js";import{n}from"./countup.gTuuPpOj.js";var r={zh:[{name:`商家净收款`,note:`按支付减全额退款计算，不将订单明细直接连接到支付表，避免一单多菜放大金额。`,sql:`SELECT m.name AS 商家, COUNT(o.id) AS 订单数,
ROUND(COALESCE(SUM(p.amount_cents),0)/100.0,2) AS 支付元,
ROUND(COALESCE(SUM(r.amount_cents),0)/100.0,2) AS 退款元,
ROUND((COALESCE(SUM(p.amount_cents),0)-COALESCE(SUM(r.amount_cents),0))/100.0,2) AS 净收款元
FROM merchants m LEFT JOIN orders o ON o.merchant_id=m.id
LEFT JOIN payments p ON p.order_id=o.id
LEFT JOIN refunds r ON r.order_id=o.id
GROUP BY m.id,m.name ORDER BY 净收款元 DESC;`},{name:`菜品销量排行`,note:`排除已退款订单；按商家分组排名，使用历史成交价格而非当前菜单价格。`,sql:`WITH sales AS (
 SELECT m.name AS 商家,d.name AS 菜品,SUM(i.quantity) AS 份数,
 ROUND(SUM(i.quantity*i.unit_price_cents)/100.0,2) AS 金额元
 FROM order_items i JOIN orders o ON o.id=i.order_id
 JOIN dishes d ON d.id=i.dish_id JOIN merchants m ON m.id=i.merchant_id
 WHERE o.status!='refunded' GROUP BY m.id,d.id
)
SELECT *, DENSE_RANK() OVER(PARTITION BY 商家 ORDER BY 份数 DESC) AS 店内排名
FROM sales ORDER BY 商家,店内排名;`},{name:`学生复购`,note:`本数据集中至少两笔非退款订单的学生，视为区间复购；不是留存率。`,sql:`WITH counts AS (
 SELECT student_id,COUNT(*) AS n FROM orders
 WHERE status!='refunded' GROUP BY student_id
)
SELECT COUNT(*) AS 购买学生数,SUM(n>=2) AS 复购学生数,
ROUND(100.0*SUM(n>=2)/NULLIF(COUNT(*),0),2) AS 复购比例百分比
FROM counts;`},{name:`配送效率`,note:`仅计算已送达订单，从下单到送达的分钟数；超 40 分钟为本项目的超时口径。`,sql:`SELECT m.name AS 商家,COUNT(*) AS 已送达,
ROUND(AVG((julianday(d.delivered_at)-julianday(o.created_at))*1440),1) AS 平均分钟,
SUM((strftime('%s',d.delivered_at)-strftime('%s',o.created_at))>2400) AS 超时单数
FROM orders o JOIN deliveries d ON d.order_id=o.id
JOIN merchants m ON m.id=o.merchant_id
WHERE o.status='delivered' GROUP BY m.id;`},{name:`订单账实核对`,note:`检查订单、明细与支付三个金额是否一致；正常结果为零行。`,sql:`SELECT o.id AS 订单号,o.total_cents AS 订单分,
SUM(i.quantity*i.unit_price_cents) AS 明细分,p.amount_cents AS 支付分
FROM orders o LEFT JOIN order_items i ON i.order_id=o.id
LEFT JOIN payments p ON p.order_id=o.id GROUP BY o.id
HAVING o.total_cents!=COALESCE(SUM(i.quantity*i.unit_price_cents),0)
OR o.total_cents!=COALESCE(p.amount_cents,0);`},{name:`查询计划`,note:`复合索引服务于“学生 + 时间”查询；读取 SQLite 实际执行计划。`,sql:`EXPLAIN QUERY PLAN
SELECT id,status,total_cents FROM orders
WHERE student_id=3 AND created_at>='2024-04-01'
ORDER BY created_at;`},{name:`── 经营分析 ── 总体概况`,note:`GMV = 所有支付金额之和；净收入 = GMV − 退款总额；退款率 = 退款笔数 ÷ 总订单数。对应经营分析区块「总体概况」。`,sql:`SELECT
  COUNT(*)                                             AS 总订单数,
  SUM(o.status='delivered')                           AS 已配送,
  SUM(o.status='refunded')                            AS 已退款,
  SUM(o.status='paid')                                AS 待配送,
  ROUND(SUM(p.amount_cents)/100.0,2)                 AS GMV_元,
  ROUND(COALESCE(SUM(r.amount_cents),0)/100.0,2)     AS 退款额_元,
  ROUND((SUM(p.amount_cents)
        -COALESCE(SUM(r.amount_cents),0))/100.0,2)   AS 净收入_元,
  ROUND(100.0*SUM(o.status='refunded')/COUNT(*),1)   AS 退款率_百分比
FROM orders o
JOIN  payments p ON p.order_id=o.id
LEFT JOIN refunds  r ON r.order_id=o.id;`},{name:`── 经营分析 ── 菜品 GMV 排行`,note:`排除退款单；按历史成交价（unit_price_cents）而非当前菜单价格计算，避免改价影响历史统计。对应「菜品 GMV Top 5」。`,sql:`SELECT
  d.name                                               AS 菜品,
  m.name                                               AS 商家,
  SUM(i.quantity)                                      AS 总销量,
  ROUND(d.price_cents/100.0,2)                        AS 当前单价_元,
  ROUND(SUM(i.quantity*i.unit_price_cents)/100.0,2)   AS 菜品GMV_元
FROM order_items i
JOIN orders    o ON o.id=i.order_id
JOIN dishes    d ON d.id=i.dish_id
JOIN merchants m ON m.id=i.merchant_id
WHERE o.status != 'refunded'
GROUP BY d.id,d.name,m.name,d.price_cents
ORDER BY 菜品GMV_元 DESC;`},{name:`── 经营分析 ── 学生消费明细`,note:`客单价 = 消费总额 ÷ 下单次数；退款次数 > 1 可作为风控标记阈值。`,sql:`SELECT
  s.name                                               AS 学生,
  s.dorm                                               AS 宿舍,
  COUNT(o.id)                                          AS 下单次数,
  SUM(o.status='refunded')                             AS 退款次数,
  ROUND(SUM(p.amount_cents)/100.0,2)                  AS 消费总额_元,
  ROUND(AVG(p.amount_cents)/100.0,2)                  AS 平均客单价_元
FROM students s
JOIN orders   o ON o.student_id=s.id
JOIN payments p ON p.order_id=o.id
GROUP BY s.id,s.name,s.dorm
ORDER BY 消费总额_元 DESC;`},{name:`── 经营分析 ── 退款风险识别`,note:`退款 ≥ 2 次的学生在本数据集中出现。真实场景应触发人工核查而非直接封号。`,sql:`WITH refund_counts AS (
  SELECT o.student_id, COUNT(*) AS n
  FROM orders o
  WHERE o.status='refunded'
  GROUP BY o.student_id
)
SELECT
  s.name    AS 学生,
  s.dorm    AS 宿舍,
  rc.n      AS 退款次数,
  CASE WHEN rc.n>=2 THEN '⚠ 建议核查' ELSE '正常' END AS 风险标记
FROM refund_counts rc
JOIN students s ON s.id=rc.student_id
ORDER BY rc.n DESC;`}],en:[{name:`Net revenue by merchant`,note:`Payments minus full refunds. Order items are not joined to payments, so multi-dish orders are not double-counted.`,sql:`SELECT m.name AS merchant, COUNT(o.id) AS orders,
ROUND(COALESCE(SUM(p.amount_cents),0)/100.0,2) AS paid_yuan,
ROUND(COALESCE(SUM(r.amount_cents),0)/100.0,2) AS refunded_yuan,
ROUND((COALESCE(SUM(p.amount_cents),0)-COALESCE(SUM(r.amount_cents),0))/100.0,2) AS net_yuan
FROM merchants m LEFT JOIN orders o ON o.merchant_id=m.id
LEFT JOIN payments p ON p.order_id=o.id
LEFT JOIN refunds r ON r.order_id=o.id
GROUP BY m.id,m.name ORDER BY net_yuan DESC;`},{name:`Best-selling dishes`,note:`Refunded orders excluded; ranked within each merchant, using the price at the time of sale rather than today's menu price.`,sql:`WITH sales AS (
 SELECT m.name AS merchant,d.name AS dish,SUM(i.quantity) AS portions,
 ROUND(SUM(i.quantity*i.unit_price_cents)/100.0,2) AS amount_yuan
 FROM order_items i JOIN orders o ON o.id=i.order_id
 JOIN dishes d ON d.id=i.dish_id JOIN merchants m ON m.id=i.merchant_id
 WHERE o.status!='refunded' GROUP BY m.id,d.id
)
SELECT *, DENSE_RANK() OVER(PARTITION BY merchant ORDER BY portions DESC) AS rank_in_shop
FROM sales ORDER BY merchant,rank_in_shop;`},{name:`Repeat students`,note:`Students with at least two non-refunded orders in this dataset count as repeat buyers for the period; this is not a retention rate.`,sql:`WITH counts AS (
 SELECT student_id,COUNT(*) AS n FROM orders
 WHERE status!='refunded' GROUP BY student_id
)
SELECT COUNT(*) AS buying_students,SUM(n>=2) AS repeat_students,
ROUND(100.0*SUM(n>=2)/NULLIF(COUNT(*),0),2) AS repeat_percent
FROM counts;`},{name:`Delivery speed`,note:`Delivered orders only, minutes from order to delivery; over 40 minutes counts as late in this project.`,sql:`SELECT m.name AS merchant,COUNT(*) AS delivered,
ROUND(AVG((julianday(d.delivered_at)-julianday(o.created_at))*1440),1) AS avg_minutes,
SUM((strftime('%s',d.delivered_at)-strftime('%s',o.created_at))>2400) AS late_orders
FROM orders o JOIN deliveries d ON d.order_id=o.id
JOIN merchants m ON m.id=o.merchant_id
WHERE o.status='delivered' GROUP BY m.id;`},{name:`Order reconciliation`,note:`Checks that order, line-item and payment amounts agree; a healthy result is zero rows.`,sql:`SELECT o.id AS order_id,o.total_cents AS order_cents,
SUM(i.quantity*i.unit_price_cents) AS items_cents,p.amount_cents AS paid_cents
FROM orders o LEFT JOIN order_items i ON i.order_id=o.id
LEFT JOIN payments p ON p.order_id=o.id GROUP BY o.id
HAVING o.total_cents!=COALESCE(SUM(i.quantity*i.unit_price_cents),0)
OR o.total_cents!=COALESCE(p.amount_cents,0);`},{name:`Query plan`,note:`The composite index serves "student + time" lookups; this reads SQLite's actual plan.`,sql:`EXPLAIN QUERY PLAN
SELECT id,status,total_cents FROM orders
WHERE student_id=3 AND created_at>='2024-04-01'
ORDER BY created_at;`},{name:`── Analysis ── Overview`,note:`GMV = all payments; net revenue = GMV − refunds; refund rate = refunded orders ÷ all orders. Matches the "Overview" figures below.`,sql:`SELECT
  COUNT(*)                                             AS total_orders,
  SUM(o.status='delivered')                           AS delivered,
  SUM(o.status='refunded')                            AS refunded,
  SUM(o.status='paid')                                AS awaiting_delivery,
  ROUND(SUM(p.amount_cents)/100.0,2)                 AS gmv_yuan,
  ROUND(COALESCE(SUM(r.amount_cents),0)/100.0,2)     AS refunds_yuan,
  ROUND((SUM(p.amount_cents)
        -COALESCE(SUM(r.amount_cents),0))/100.0,2)   AS net_yuan,
  ROUND(100.0*SUM(o.status='refunded')/COUNT(*),1)   AS refund_rate_percent
FROM orders o
JOIN  payments p ON p.order_id=o.id
LEFT JOIN refunds  r ON r.order_id=o.id;`},{name:`── Analysis ── Dish GMV ranking`,note:`Refunds excluded; uses the price at the time of sale (unit_price_cents), so later price changes do not rewrite history. Matches "Dish GMV top 5".`,sql:`SELECT
  d.name                                               AS dish,
  m.name                                               AS merchant,
  SUM(i.quantity)                                      AS portions,
  ROUND(d.price_cents/100.0,2)                        AS current_price_yuan,
  ROUND(SUM(i.quantity*i.unit_price_cents)/100.0,2)   AS dish_gmv_yuan
FROM order_items i
JOIN orders    o ON o.id=i.order_id
JOIN dishes    d ON d.id=i.dish_id
JOIN merchants m ON m.id=i.merchant_id
WHERE o.status != 'refunded'
GROUP BY d.id,d.name,m.name,d.price_cents
ORDER BY dish_gmv_yuan DESC;`},{name:`── Analysis ── Spending by student`,note:`Average order value = total spend ÷ orders; more than one refund can serve as a risk flag.`,sql:`SELECT
  s.name                                               AS student,
  s.dorm                                               AS dorm,
  COUNT(o.id)                                          AS orders,
  SUM(o.status='refunded')                             AS refunds,
  ROUND(SUM(p.amount_cents)/100.0,2)                  AS total_yuan,
  ROUND(AVG(p.amount_cents)/100.0,2)                  AS avg_order_yuan
FROM students s
JOIN orders   o ON o.student_id=s.id
JOIN payments p ON p.order_id=o.id
GROUP BY s.id,s.name,s.dorm
ORDER BY total_yuan DESC;`},{name:`── Analysis ── Refund risk`,note:`Students with two or more refunds appear in this dataset. In practice this should trigger a manual check, not a ban.`,sql:`WITH refund_counts AS (
  SELECT o.student_id, COUNT(*) AS n
  FROM orders o
  WHERE o.status='refunded'
  GROUP BY o.student_id
)
SELECT
  s.name    AS student,
  s.dorm    AS dorm,
  rc.n      AS refunds,
  CASE WHEN rc.n>=2 THEN 'review' ELSE 'ok' END AS risk_flag
FROM refund_counts rc
JOIN students s ON s.id=rc.student_id
ORDER BY rc.n DESC;`}]},i={zh:{idle:`滚动到这里时载入 SQLite（约 700 KB）。`,loadFailed:`SQLite 引擎未能下载（网络较慢或被拦截）。请刷新重试，或下载建表 SQL 在本地运行。`,loading:`正在载入 SQLite…`,running:`正在执行 SQL…`,loadTimeout:`数据库加载超时，请刷新重试。`,runTimeout:`运行已停止：超过 3 秒限制。`,engineError:`运行引擎出错，已保留上次成功提交的数据。`,stopped:`已停止运行。`,busy:`请等待当前操作完成`,reload:` 请刷新页面重试。`,noSqlFile:`请下载建表与数据 SQL。`,rows:(e,t,n)=>`${e} 行 · ${t} ms${n?` · 已截取前 500 行`:``}${e===0?` · 查询成功，无匹配记录`:``}`,status:{paid:`已支付 · 未送达`,delivered:`已送达`,refunded:`已退款`},dishOption:(e,t,n,r)=>`${e} / ${t} · ¥${n} · 库存 ${r}`,student:e=>`同学 ${e}`,total:e=>`订单金额 ¥${e}`,totalInvalid:`请输入 1–20 份`,placed:e=>`订单 #${e} 已提交；明细、支付、配送记录及库存同步更新。`,placeFailed:e=>`下单未提交：${e}`,refunded:e=>`订单 #${e} 已全额退款，库存已恢复。`,refundButton:`取消退款`,reset:`已恢复初始演示订单。`,orderLine:(e,t,n)=>`#${e} ${t} · ¥${n}`},en:{idle:`SQLite (about 700 KB) loads when you scroll here.`,loadFailed:`The SQLite engine could not be downloaded (slow or blocked network). Refresh to try again, or download the schema SQL and run it locally.`,loading:`Loading SQLite…`,running:`Running SQL…`,loadTimeout:`The database took too long to load — please refresh.`,runTimeout:`Stopped: the 3-second limit was reached.`,engineError:`The engine failed; the last committed data is kept.`,stopped:`Stopped.`,busy:`Please wait for the current operation to finish`,reload:` Please refresh the page.`,noSqlFile:`Download the schema and data SQL instead.`,rows:(e,t,n)=>`${e} ${e===1?`row`:`rows`} · ${t} ms${n?` · first 500 rows shown`:``}${e===0?` · query succeeded, no matching records`:``}`,status:{paid:`paid · not delivered`,delivered:`delivered`,refunded:`refunded`},dishOption:(e,t,n,r)=>`${e} / ${t} · ¥${n} · stock ${r}`,student:e=>`同学 ${e}`,total:e=>`Order total ¥${e}`,totalInvalid:`Enter 1–20 portions`,placed:e=>`Order #${e} placed; items, payment, delivery and stock updated together.`,placeFailed:e=>`Order not placed: ${e}`,refunded:e=>`Order #${e} refunded in full; stock restored.`,refundButton:`Cancel & refund`,reset:`Initial demo orders restored.`,orderLine:(e,t,n)=>`#${e} ${t} · ¥${n}`}},a={place:[{zh:`创建订单`,en:`Create order`},{zh:`写明细 · 扣库存`,en:`Add items · deduct stock`},{zh:`登记支付`,en:`Record payment`},{zh:`生成配送`,en:`Create delivery`},{zh:`提交事务`,en:`Commit`}],refund:[{zh:`找到订单`,en:`Find the order`},{zh:`写退款（校验状态与金额）`,en:`Write the refund (status and amount checked)`},{zh:`改状态 · 恢复库存`,en:`Mark refunded · restore stock`}]},o={zh:{committed:`已提交`,rolledBack:`已回滚：整笔事务撤销`,rejected:`未进入事务：输入校验未通过`,replay:`按事务里语句的实际顺序回放。`,refundTitle:`取消退款的事务`},en:{committed:`Committed`,rolledBack:`Rolled back: the whole transaction was undone`,rejected:`Never started: the input failed validation`,replay:`Replayed in the order the transaction runs its statements.`,refundTitle:`The refund transaction`}},s={place:{"份数须为 1–20 的整数":-1,菜品不存在:0,价格快照不一致:1,库存不足:1,支付金额与明细不一致:2},refund:{订单不存在:0,仅未送达订单可取消退款:1,退款金额不一致:1}};function c(t,n){let r=e.find(([e,t])=>typeof e==`string`&&t===n)?.[0],i=typeof r==`string`?r:n;return i in s[t]?s[t][i]:null}function l(e,t){let n=a[e].length,r=e=>Array.from({length:n},(t,n)=>e(n));if(t===void 0)return[...Array.from({length:n},(e,t)=>({at:t*110,states:r(e=>e<=t?`on`:`idle`),result:``})),{at:n*110,states:r(()=>`on`),result:`committed`}];if(t===null)return[{at:0,states:r(()=>`idle`),result:`rolled-back`}];if(t<0)return[{at:0,states:r(()=>`idle`),result:`rejected`}];let i=Math.min(t,n-1),o=e=>r(t=>t===i?`fail`:t<e?`on`:`idle`),s=[];for(let e=0;e<i;e++)s.push({at:e*110,states:r(t=>t<=e?`on`:`idle`),result:``});s.push({at:i*110,states:o(i),result:``});for(let e=1;e<=i;e++)s.push({at:(i+e)*110,states:o(i-e),result:``});return s.push({at:(2*i+1)*110,states:o(0),result:`rolled-back`}),s}function u(e,t,n,r){let i=[...e.querySelectorAll(`[data-step]`)],a=e.querySelector(`[data-band-result]`),s=o[r],c={committed:s.committed,"rolled-back":s.rolledBack,rejected:s.rejected},u=String(Number(e.dataset.run??`0`)+1);e.dataset.run=u,e.hidden=!1;let d=t=>{t.states.forEach((e,t)=>{i[t]&&(i[t].dataset.state=e)}),e.dataset.result=t.result,a.textContent=t.result?c[t.result]:``},f=l(t,n);if(d({at:0,states:f[0].states.map(()=>`idle`),result:``}),matchMedia(`(prefers-reduced-motion: reduce)`).matches){d(f[f.length-1]);return}for(let t of f)setTimeout(()=>{e.dataset.run===u&&d(t)},t.at)}var d=e=>(e/100).toFixed(2);function f(a){let o=a.dataset.lang===`en`?`en`:`zh`,s=i[o],l=r[o],f=n=>t(n,o,e),p=e=>a.querySelector(`#${e}`),m=e=>p(e),h=[`run-query`,`place-order`,`reset-db`,`download-db`],g=a.querySelector(`[data-band="place"]`),_=a.querySelector(`[data-band="refund"]`),v=e=>e===s.busy||e===s.loadFailed,y=null,b=0,x=null,S=null,C=null,w=[],T=!1,E=!1,D=(e,t=!1)=>{let n=p(`sql-status`);n.textContent=e,n.dataset.error=String(t)},O=e=>{let t=p(`sql-status`);if(t.dataset.error=`false`,matchMedia(`(prefers-reduced-motion: reduce)`).matches){t.textContent=e;return}let r=document.createElement(`span`);r.className=`sr`,r.textContent=e;let i=document.createElement(`span`);i.setAttribute(`aria-hidden`,`true`),t.replaceChildren(r,i);let a=performance.now(),o=t=>{if(!i.isConnected)return;let s=Math.min(1,(t-a)/500);if(i.textContent=n(e,1-(1-s)**3),s<1){requestAnimationFrame(o);return}i.remove(),r.removeAttribute(`class`)};requestAnimationFrame(o)},k=e=>{h.forEach(t=>m(t).disabled=e),a.querySelectorAll(`[data-refund]`).forEach(t=>t.disabled=e),m(`cancel-query`).disabled=!e},A=e=>{E=!0,k(!0),m(`cancel-query`).disabled=!0,D(e,!0)},j=()=>{y=new Worker(`/assets/delivery-worker.js`),y.onmessage=({data:e})=>{if(!x||e.id!==x.id)return;clearTimeout(x.timer);let{resolve:t,reject:n}=x;x=null,k(!1),e.ok?(e.backup&&(S=e.backup),C=e.state,F(),t(e)):n(Error(f(e.error??``)))},y.onerror=e=>{e.preventDefault(),N(s.engineError)}},M=(e,t={})=>E?Promise.reject(Error(s.loadFailed)):x?Promise.reject(Error(s.busy)):(k(!0),new Promise((n,r)=>{let i=++b;x={id:i,action:e,resolve:n,reject:r,timer:window.setTimeout(()=>N(e===`init`?s.loadTimeout:s.runTimeout),e===`init`?2e4:3e3)},y.postMessage({id:i,action:e,...t})}));function N(e){if(!x)return;let t=x;if(clearTimeout(t.timer),x=null,y?.terminate(),t.reject(Error(e)),t.action===`init`)return A(e===s.loadTimeout?e:s.loadFailed);j(),M(`init`,{backup:S}).then(()=>D(e,!0)).catch(e=>A(e.message+s.reload))}let P=(e,t,n)=>{let r=URL.createObjectURL(new Blob([e],{type:n})),i=document.createElement(`a`);i.href=r,i.download=t,i.click(),setTimeout(()=>URL.revokeObjectURL(r),1e3)};function F(){if(!C)return;let e=p(`dish`),t=e.value;e.replaceChildren(...C.dishes.map(e=>new Option(s.dishOption(e.merchant,e.name,d(e.price_cents),e.stock),String(e.id)))),t&&(e.value=t),p(`order-list`).replaceChildren(...C.orders.map(e=>{let t=document.createElement(`div`);t.className=`order-row`;let n=document.createElement(`p`);n.textContent=s.orderLine(e.id,e.merchant,d(e.total_cents));let r=document.createElement(`small`);if(r.className=`status-${e.status}`,r.textContent=`${e.student} · ${s.status[e.status]}`,n.append(r),t.append(n),e.status===`paid`){let n=document.createElement(`button`);n.type=`button`,n.className=`secondary`,n.textContent=s.refundButton,n.dataset.refund=String(e.id),n.onclick=()=>z(e.id),t.append(n)}return t})),I()}function I(){let e=C?.dishes.find(e=>e.id===Number(p(`dish`).value)),t=Number(p(`quantity`).value);p(`order-total`).textContent=e&&Number.isInteger(t)&&t>0&&t<=20?s.total(d(e.price_cents*t)):s.totalInvalid}function L(e){let t=p(`sql-results`);t.replaceChildren(),w=[];let n=0;for(let r of e){if(r.truncated||!r.columns||!r.values)continue;w.length||(w=[r.columns,...r.values]);let e=document.createElement(`table`),i=document.createElement(`thead`),a=document.createElement(`tr`);r.columns.forEach(e=>{let t=document.createElement(`th`);t.scope=`col`,t.textContent=e,a.append(t)}),i.append(a),e.append(i);let o=document.createElement(`tbody`);r.values.forEach((e,t)=>{let n=document.createElement(`tr`);t<20&&(n.className=`drop`,n.style.setProperty(`--i`,String(t))),e.forEach(e=>{let t=document.createElement(`td`);t.textContent=e===null?`NULL`:String(e),n.append(t)}),o.append(n)}),e.append(o),t.append(e),n+=r.values.length}return m(`export-csv`).disabled=!w.length,n}async function R(){let e=performance.now();D(s.running),m(`export-csv`).disabled=!0;try{let t=await M(`query`,{sql:p(`sql-input`).value}),n=L(t.result);O(s.rows(n,Math.round(performance.now()-e),t.result.some(e=>e.truncated)))}catch(e){p(`sql-results`).replaceChildren(),w=[],D(e.message,!0)}}async function z(e){try{await M(`refund`,{order:e}),_&&u(_,`refund`,void 0,o),p(`order-status`).textContent=s.refunded(e),await R()}catch(e){let t=e.message;_&&!v(t)&&u(_,`refund`,c(`refund`,t),o),p(`order-status`).textContent=t}}let B=()=>{T||(T=!0,D(s.loading),j(),M(`init`).then(R).catch(e=>{E||(console.error(e),A(s.loadFailed))}))},V=p(`query-preset`);l.forEach((e,t)=>V.add(new Option(e.name,String(t))));let H=()=>{let e=l[Number(V.value)];p(`sql-input`).value=e.sql,p(`query-note`).textContent=e.note};V.onchange=H,H();let U=p(`student`);for(let e=1;e<=12;e++)U.add(new Option(s.student(String(e).padStart(2,`0`)),String(e)));D(s.idle),k(!0),m(`cancel-query`).disabled=!0,m(`run-query`).onclick=R,m(`cancel-query`).onclick=()=>N(s.stopped),p(`sql-input`).onkeydown=e=>{(e.ctrlKey||e.metaKey)&&e.key===`Enter`&&(e.preventDefault(),x||R())},p(`dish`).onchange=I,p(`quantity`).oninput=I,p(`order-form`).onsubmit=async e=>{e.preventDefault();try{let e=await M(`place`,{input:{student:Number(U.value),dish:Number(p(`dish`).value),quantity:Number(p(`quantity`).value)}});g&&u(g,`place`,void 0,o),p(`order-status`).textContent=s.placed(e.order),await R()}catch(e){let t=e.message;g&&!v(t)&&u(g,`place`,c(`place`,t),o),p(`order-status`).textContent=s.placeFailed(t)}},m(`reset-db`).onclick=async()=>{try{await M(`init`),p(`order-status`).textContent=s.reset,await R()}catch(e){D(e.message,!0)}},m(`download-db`).onclick=()=>{S&&P(S,`campus-delivery.sqlite`,`application/vnd.sqlite3`)},m(`export-csv`).onclick=()=>P(`﻿`+w.map(e=>e.map(e=>`"`+String(e??``).replace(/^[=+@-]/,`'$&`).replaceAll(`"`,`""`)+`"`).join(`,`)).join(`\r
`),`query-result.csv`,`text/csv;charset=utf-8`),a.querySelectorAll(`[data-jump]`).forEach(e=>e.addEventListener(`click`,()=>{V.value=e.dataset.jump??`0`,H(),a.querySelector(`#workbench`)?.scrollIntoView({behavior:matchMedia(`(prefers-reduced-motion: reduce)`).matches?`auto`:`smooth`}),B()})),fetch(`/assets/delivery-schema.sql`).then(e=>{if(!e.ok)throw Error();return e.text()}).then(e=>{p(`schema-source`).textContent=e}).catch(()=>{p(`schema-source`).textContent=s.noSqlFile}),new IntersectionObserver((e,t)=>{e.some(e=>e.isIntersecting)&&(t.disconnect(),B())},{rootMargin:`0px 0px -25% 0px`}).observe(a),a.addEventListener(`focusin`,B,{once:!0})}var p=`0123456789`;function m(e,t,n){if(t>=1)return e;let r=Math.floor(e.length*Math.max(0,t)),i=``;for(let t=0;t<e.length;t++)i+=t<r||!/\d/.test(e[t])?e[t]:p[Math.floor(n()*10)];return i}var h=()=>matchMedia(`(prefers-reduced-motion: reduce)`).matches,g=(e,t,n=`0px 0px -20% 0px`)=>{let r=new IntersectionObserver(e=>{e.some(e=>e.isIntersecting)&&(r.disconnect(),t())},{rootMargin:n});r.observe(e)};function _(e){if(h()||!(`IntersectionObserver`in window))return;let t=e.querySelector(`.an__kpi`);t&&(t.classList.add(`is-armed`),g(t,()=>{let e=[...t.querySelectorAll(`.kpi__v`)],n=[...t.querySelectorAll(`.kpi__k`)];e.forEach((e,r)=>{let i=r*400;e.animate([{transform:`scale(3.2) translateY(-8%)`,opacity:0,filter:`blur(12px)`},{transform:`scale(.93)`,opacity:1,filter:`blur(0)`,offset:.72},{transform:`none`,opacity:1,filter:`blur(0)`}],{duration:550,delay:i,easing:`cubic-bezier(.3,0,.2,1)`,fill:`backwards`}),t.animate([{transform:`none`},{transform:`translate(-6px,3px)`},{transform:`translate(5px,-2px)`},{transform:`translate(-2px,1px)`},{transform:`none`}],{duration:220,delay:i+400}),setTimeout(()=>n[r]?.classList.add(`is-hit`),i+420)}),t.classList.remove(`is-armed`)},`0px 0px -25% 0px`)),e.querySelectorAll(`.an__cards .table-wrap`).forEach(e=>g(e,()=>v(e)))}function v(e){let t=[...e.querySelectorAll(`tbody tr`)],n=document.createElement(`i`);n.className=`scanline`,n.setAttribute(`aria-hidden`,`true`),e.append(n);let r=e.clientHeight;n.animate([{transform:`translateY(0)`,opacity:1},{transform:`translateY(${r}px)`,opacity:1,offset:.92},{transform:`translateY(${r}px)`,opacity:0}],{duration:180*t.length+300,easing:`linear`,fill:`forwards`}).finished.catch(()=>void 0).then(()=>n.remove()),t.forEach((e,t)=>{let n=[...e.cells].filter(e=>e.childElementCount===0&&/\d/.test(e.textContent??``));setTimeout(()=>{t===0&&e.classList.add(`is-top`),n.forEach(y)},120+t*180)})}function y(e){let t=e.textContent??``,n=performance.now(),r=i=>{let a=Math.min(1,(i-n)/600);e.textContent=m(t,a*a,Math.random),a<1?requestAnimationFrame(r):e.textContent=t};requestAnimationFrame(r)}document.querySelectorAll(`[data-campus]`).forEach(f),document.querySelectorAll(`[data-campus] .an`).forEach(_);