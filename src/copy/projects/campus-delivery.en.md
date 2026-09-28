## Data model

![Order-centred relationships (diagram in Chinese)](/assets/editorial/delivery-relations.svg)

Everything revolves around the order, with each business object in its own table. Primary keys identify records, foreign keys enforce ownership, and order items keep the unit price at the time of sale. The diagram is a simplified view of the core entities and the direction of records; the SQL source is the authority for every field, key and transaction constraint.

| Table | Role | Key fields |
|---|---|---|
| STUDENTS | a student → many orders | id · name · dorm |
| MERCHANTS | a merchant → many dishes / many orders | id · name |
| DISHES | a dish → many order items | merchant_id · price_cents · stock |
| ORDERS | each order belongs to exactly one student and one merchant | student_id · merchant_id · status · total_cents |
| ORDER_ITEMS | join table of orders × dishes | order_id + dish_id · quantity · unit_price_cents |
| PAYMENTS | an order → one payment record | UNIQUE(order_id) · amount_cents |
| DELIVERIES | an order → one delivery record | order_id · rider · delivered_at |
| REFUNDS | an order → zero or one full refund | UNIQUE(order_id) · amount_cents |

## Key decisions

The business rules live in the table structure, constraints, triggers and transactions.

### Money is stored in cents

Unit prices, order totals, payments and refunds are all integer cents, converted to yuan only for display, so floating-point errors never accumulate.

### One order, one merchant

Orders and dishes both carry composite unique keys. Order items use two composite foreign keys on merchant_id, so a dish from another merchant cannot be put into an order.

### Stock and payment commit together

BEGIN IMMEDIATE wraps creating the order, deducting stock, writing items, recording payment and delivery. If stock runs out, the student does not exist or the amounts disagree, the whole transaction rolls back.

### A refund happens only once

Undelivered orders can be cancelled in full. A unique key on the refunds table rejects a second refund; a trigger checks the amount, updates the status and restores stock. Delivered orders never enter this cancellation flow.

### Revenue without double joins

Net revenue joins payments and refunds at order level; dish sales are aggregated separately from the items, so a one-to-many join never doubles the money.

### Indexes follow the queries

Composite indexes on student + time and merchant + time. The query plan in the workbench shows the access path SQLite actually chose.

## Deliverables

- [Download the full source](/downloads/delivery/campus-sql-source.zip)
- [Schema and data SQL](/downloads/delivery/init.sql)
- [Sample database](/downloads/delivery/campus.sqlite)
- [Design and run notes (Chinese)](/downloads/delivery/README.md)

To run it locally, unzip the source package and run `node verify.mjs` in that folder. Needs Node.js 20.11 or later; dependencies are included. Engine: sql.js 1.14.2 · SQLite transactions.
