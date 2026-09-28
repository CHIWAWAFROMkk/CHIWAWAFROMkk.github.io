## 关系模型

![以订单为中心的业务关系](/assets/editorial/delivery-relations.svg)

以订单为中心，业务对象独立建表。主键标识记录，外键约束归属，订单明细保留成交时的单价。关系图简化展示核心实体和记录方向；完整字段、主外键及事务约束以项目 SQL 源码为准。

| 表 | 作用 | 关键字段 |
|---|---|---|
| STUDENTS | 学生 → 多笔订单 | id · name · dorm |
| MERCHANTS | 商家 → 多个菜品 / 多笔订单 | id · name |
| DISHES | 菜品 → 多条订单明细 | merchant_id · price_cents · stock |
| ORDERS | 一笔订单只属于一个学生与商家 | student_id · merchant_id · status · total_cents |
| ORDER_ITEMS | 订单 × 菜品的关联表 | order_id + dish_id · quantity · unit_price_cents |
| PAYMENTS | 订单 → 一条支付记录 | UNIQUE(order_id) · amount_cents |
| DELIVERIES | 订单 → 一条配送记录 | order_id · rider · delivered_at |
| REFUNDS | 订单 → 零或一条全额退款 | UNIQUE(order_id) · amount_cents |

## 关键决策

业务规则落实在表结构、约束、触发器与事务中。

### 金额按分保存

单价、订单金额、支付与退款均使用整数分；显示时换算为元，避免浮点金额累计误差。

### 同一订单，不跨商家

订单与菜品都提供复合唯一键。明细通过两组复合外键约束 merchant_id，拒绝把另一家商户的菜品插入订单。

### 库存与支付，一起提交

BEGIN IMMEDIATE 包住创建订单、扣库存、写明细、登记支付及配送。库存不足、学生不存在或金额不符时回滚整笔事务。

### 退款有唯一性

未送达订单支持全额取消。退款表的唯一键拒绝重复退款；触发器校验金额、更新状态并恢复库存。已送达订单不进入该取消流程。

### 收入统计不重复连接

净收款按订单粒度连接支付与退款；菜品销量另按明细聚合，避免一对多连接导致金额翻倍。

### 索引从查询出发

学生与时间、商家与时间分别建立复合索引。工作台的查询计划直接显示 SQLite 选择的访问路径。

## 项目交付

- [下载完整源码](/downloads/delivery/campus-sql-source.zip)
- [建表与数据 SQL](/downloads/delivery/init.sql)
- [示例数据库](/downloads/delivery/campus.sqlite)
- [设计与运行说明](/downloads/delivery/README.md)

本地运行：解压源码包，在该目录执行 `node verify.mjs`。需要 Node.js 20.11 或以上版本；依赖随包提供。运行引擎：sql.js 1.14.2 · SQLite 事务。
