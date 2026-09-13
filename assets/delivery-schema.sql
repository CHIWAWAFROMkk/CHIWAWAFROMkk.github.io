PRAGMA foreign_keys = ON;
CREATE TABLE students(id INTEGER PRIMARY KEY, name TEXT NOT NULL, dorm TEXT NOT NULL);
CREATE TABLE merchants(id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE dishes(id INTEGER PRIMARY KEY, merchant_id INTEGER NOT NULL REFERENCES merchants(id), name TEXT NOT NULL, price_cents INTEGER NOT NULL CHECK(price_cents>0), stock INTEGER NOT NULL CHECK(stock>=0), UNIQUE(id,merchant_id));
CREATE TABLE orders(id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES students(id), merchant_id INTEGER NOT NULL REFERENCES merchants(id), status TEXT NOT NULL CHECK(status IN ('paid','delivered','refunded')), created_at TEXT NOT NULL, total_cents INTEGER NOT NULL CHECK(total_cents>0), UNIQUE(id,merchant_id));
CREATE TABLE order_items(order_id INTEGER NOT NULL, dish_id INTEGER NOT NULL, merchant_id INTEGER NOT NULL, quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 20), unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents>0), PRIMARY KEY(order_id,dish_id), FOREIGN KEY(order_id,merchant_id) REFERENCES orders(id,merchant_id), FOREIGN KEY(dish_id,merchant_id) REFERENCES dishes(id,merchant_id));
CREATE TABLE payments(id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id), amount_cents INTEGER NOT NULL CHECK(amount_cents>0), paid_at TEXT NOT NULL);
CREATE TABLE deliveries(order_id INTEGER PRIMARY KEY REFERENCES orders(id), rider TEXT NOT NULL, delivered_at TEXT);
CREATE TABLE refunds(id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id), amount_cents INTEGER NOT NULL CHECK(amount_cents>0), reason TEXT NOT NULL, refunded_at TEXT NOT NULL);
CREATE INDEX idx_orders_student_created ON orders(student_id,created_at);
CREATE INDEX idx_orders_merchant_created ON orders(merchant_id,created_at);
CREATE TRIGGER reserve_stock BEFORE INSERT ON order_items BEGIN
 SELECT CASE WHEN NEW.unit_price_cents != (SELECT price_cents FROM dishes WHERE id=NEW.dish_id) THEN RAISE(ABORT,'价格快照不一致') END;
 SELECT CASE WHEN (SELECT stock FROM dishes WHERE id=NEW.dish_id)<NEW.quantity THEN RAISE(ABORT,'库存不足') END;
 UPDATE dishes SET stock=stock-NEW.quantity WHERE id=NEW.dish_id;
END;
CREATE TRIGGER verify_payment BEFORE INSERT ON payments BEGIN
 SELECT CASE WHEN NEW.amount_cents!=(SELECT total_cents FROM orders WHERE id=NEW.order_id) OR NEW.amount_cents!=COALESCE((SELECT SUM(quantity*unit_price_cents) FROM order_items WHERE order_id=NEW.order_id),0) THEN RAISE(ABORT,'支付金额与明细不一致') END;
END;
CREATE TRIGGER verify_refund BEFORE INSERT ON refunds BEGIN
 SELECT CASE WHEN (SELECT status FROM orders WHERE id=NEW.order_id)!='paid' THEN RAISE(ABORT,'仅未送达订单可取消退款') END;
 SELECT CASE WHEN NEW.amount_cents!=COALESCE((SELECT amount_cents FROM payments WHERE order_id=NEW.order_id),0) THEN RAISE(ABORT,'退款金额不一致') END;
END;
CREATE TRIGGER apply_refund AFTER INSERT ON refunds BEGIN
 UPDATE orders SET status='refunded' WHERE id=NEW.order_id;
 UPDATE dishes SET stock=stock+COALESCE((SELECT quantity FROM order_items WHERE order_id=NEW.order_id AND dish_id=dishes.id),0) WHERE id IN (SELECT dish_id FROM order_items WHERE order_id=NEW.order_id);
END;
