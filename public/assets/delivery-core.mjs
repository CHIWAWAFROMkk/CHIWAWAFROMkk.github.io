export const queries=[
 {name:'商家净收款',note:'按支付减全额退款计算，不将订单明细直接连接到支付表，避免一单多菜放大金额。',sql:`SELECT m.name AS 商家, COUNT(o.id) AS 订单数,
ROUND(COALESCE(SUM(p.amount_cents),0)/100.0,2) AS 支付元,
ROUND(COALESCE(SUM(r.amount_cents),0)/100.0,2) AS 退款元,
ROUND((COALESCE(SUM(p.amount_cents),0)-COALESCE(SUM(r.amount_cents),0))/100.0,2) AS 净收款元
FROM merchants m LEFT JOIN orders o ON o.merchant_id=m.id
LEFT JOIN payments p ON p.order_id=o.id
LEFT JOIN refunds r ON r.order_id=o.id
GROUP BY m.id,m.name ORDER BY 净收款元 DESC;`},
 {name:'菜品销量排行',note:'排除已退款订单；按商家分组排名，使用历史成交价格而非当前菜单价格。',sql:`WITH sales AS (
 SELECT m.name AS 商家,d.name AS 菜品,SUM(i.quantity) AS 份数,
 ROUND(SUM(i.quantity*i.unit_price_cents)/100.0,2) AS 金额元
 FROM order_items i JOIN orders o ON o.id=i.order_id
 JOIN dishes d ON d.id=i.dish_id JOIN merchants m ON m.id=i.merchant_id
 WHERE o.status!='refunded' GROUP BY m.id,d.id
)
SELECT *, DENSE_RANK() OVER(PARTITION BY 商家 ORDER BY 份数 DESC) AS 店内排名
FROM sales ORDER BY 商家,店内排名;`},
 {name:'学生复购',note:'本数据集中至少两笔非退款订单的学生，视为区间复购；不是留存率。',sql:`WITH counts AS (
 SELECT student_id,COUNT(*) AS n FROM orders
 WHERE status!='refunded' GROUP BY student_id
)
SELECT COUNT(*) AS 购买学生数,SUM(n>=2) AS 复购学生数,
ROUND(100.0*SUM(n>=2)/NULLIF(COUNT(*),0),2) AS 复购比例百分比
FROM counts;`},
 {name:'配送效率',note:'仅计算已送达订单，从下单到送达的分钟数；超 40 分钟为本项目的超时口径。',sql:`SELECT m.name AS 商家,COUNT(*) AS 已送达,
ROUND(AVG((julianday(d.delivered_at)-julianday(o.created_at))*1440),1) AS 平均分钟,
SUM((strftime('%s',d.delivered_at)-strftime('%s',o.created_at))>2400) AS 超时单数
FROM orders o JOIN deliveries d ON d.order_id=o.id
JOIN merchants m ON m.id=o.merchant_id
WHERE o.status='delivered' GROUP BY m.id;`},
 {name:'订单账实核对',note:'检查订单、明细与支付三个金额是否一致；正常结果为零行。',sql:`SELECT o.id AS 订单号,o.total_cents AS 订单分,
SUM(i.quantity*i.unit_price_cents) AS 明细分,p.amount_cents AS 支付分
FROM orders o LEFT JOIN order_items i ON i.order_id=o.id
LEFT JOIN payments p ON p.order_id=o.id GROUP BY o.id
HAVING o.total_cents!=COALESCE(SUM(i.quantity*i.unit_price_cents),0)
OR o.total_cents!=COALESCE(p.amount_cents,0);`},
 {name:'查询计划',note:'复合索引服务于“学生 + 时间”查询；读取 SQLite 实际执行计划。',sql:`EXPLAIN QUERY PLAN
SELECT id,status,total_cents FROM orders
WHERE student_id=3 AND created_at>='2024-04-01'
ORDER BY created_at;`},
 {name:'── 经营分析 ── 总体概况',note:'GMV = 所有支付金额之和；净收入 = GMV − 退款总额；退款率 = 退款笔数 ÷ 总订单数。对应经营分析区块「总体概况」。',sql:`SELECT
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
LEFT JOIN refunds  r ON r.order_id=o.id;`},
 {name:'── 经营分析 ── 菜品 GMV 排行',note:'排除退款单；按历史成交价（unit_price_cents）而非当前菜单价格计算，避免改价影响历史统计。对应「菜品 GMV Top 5」。',sql:`SELECT
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
ORDER BY 菜品GMV_元 DESC;`},
 {name:'── 经营分析 ── 学生消费明细',note:'客单价 = 消费总额 ÷ 下单次数；退款次数 > 1 可作为风控标记阈值。',sql:`SELECT
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
ORDER BY 消费总额_元 DESC;`},
 {name:'── 经营分析 ── 退款风险识别',note:'退款 ≥ 2 次的学生在本数据集中出现。真实场景应触发人工核查而非直接封号。',sql:`WITH refund_counts AS (
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
ORDER BY rc.n DESC;`}
];
export function rows(db,sql,params=[]){const s=db.prepare(sql);try{s.bind(params);const result=[];while(s.step())result.push(s.getAsObject());return result;}finally{s.free();}}
function transaction(db,fn){db.run('PRAGMA foreign_keys=ON; BEGIN IMMEDIATE');try{const r=fn();db.run('COMMIT');return r;}catch(e){db.run('ROLLBACK');throw e;}}
export function place(db,{student=1,dish=1,quantity=1,at='2024-04-29 12:00:00'}={}){
 if(!Number.isInteger(quantity)||quantity<1||quantity>20)throw Error('份数须为 1–20 的整数');
 return transaction(db,()=>{const item=rows(db,'SELECT * FROM dishes WHERE id=?',[dish])[0];if(!item)throw Error('菜品不存在');
 db.run('INSERT INTO orders(student_id,merchant_id,status,created_at,total_cents) VALUES(?,?,?,?,?)',[student,item.merchant_id,'paid',at,item.price_cents*quantity]);
 const id=rows(db,'SELECT last_insert_rowid() AS id')[0].id;
 db.run('INSERT INTO order_items VALUES(?,?,?,?,?)',[id,dish,item.merchant_id,quantity,item.price_cents]);
 db.run('INSERT INTO payments(order_id,amount_cents,paid_at) VALUES(?,?,?)',[id,item.price_cents*quantity,at]);
 db.run('INSERT INTO deliveries(order_id,rider) VALUES(?,?)',[id,'校园配送员 '+((id%3)+1)]);
 return id;});
}
export function refund(db,id){return transaction(db,()=>{const order=rows(db,'SELECT * FROM orders WHERE id=?',[id])[0];if(!order)throw Error('订单不存在');db.run('INSERT INTO refunds(order_id,amount_cents,reason,refunded_at) VALUES(?,?,?,?)',[id,order.total_cents,'取消订单','2024-04-29 12:05:00']);return id;});}
export function seed(db,schema){db.run(schema);transaction(db,()=>{
 ['南门小厨','二食堂面馆','轻食窗口','校园茶点'].forEach((name,i)=>db.run('INSERT INTO merchants VALUES(?,?)',[i+1,name]));
 for(let i=1;i<=12;i++)db.run('INSERT INTO students VALUES(?,?,?)',[i,'同学 '+String(i).padStart(2,'0'),(i%2?'东区':'西区')+(i%4+1)+'栋']);
 ['香菇鸡肉饭','番茄鸡蛋饭','土豆牛肉饭','牛肉面','番茄汤面','菌菇拌面','鸡肉沙拉','杂粮饭盒','蔬菜三明治','红茶','豆浆','鸡蛋饼'].forEach((name,i)=>db.run('INSERT INTO dishes VALUES(?,?,?,?,?)',[i+1,Math.floor(i/3)+1,name,[1600,1200,2200,1800,1400,1600,2000,1800,1000,600,400,800][i],100]));
 });
 for(let i=0;i<96;i++){
  const day=String(1+Math.floor(i/4)).padStart(2,'0'),hour=i%2?18:12;
  const id=place(db,{student:1+((i*7+Math.floor(i/12))%12),dish:i%12+1,quantity:i%3+1,at:`2024-04-${day} ${hour}:00:00`});
  if(i%8===0)refund(db,id);
  else if(i<88){const minutes=20+(i*7)%36;db.run("UPDATE orders SET status='delivered' WHERE id=?",[id]);db.run('UPDATE deliveries SET delivered_at=? WHERE order_id=?',[`2024-04-${day} ${hour}:${String(minutes).padStart(2,'0')}:00`,id]);}
 }
 db.run('PRAGMA optimize');
}
export function snapshot(db){return {
 summary:rows(db,`SELECT COUNT(*) AS orders, SUM(status='delivered') AS delivered,SUM(status='refunded') AS refunded FROM orders`)[0],
 dishes:rows(db,'SELECT d.*,m.name AS merchant FROM dishes d JOIN merchants m ON m.id=d.merchant_id'),
 orders:rows(db,`SELECT o.id,s.name AS student,m.name AS merchant,o.status,o.total_cents FROM orders o JOIN students s ON s.id=o.student_id JOIN merchants m ON m.id=o.merchant_id ORDER BY o.id DESC LIMIT 8`)
};}
