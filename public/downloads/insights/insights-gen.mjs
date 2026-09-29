// Synthetic term for the campus delivery insights page.
// Every pattern the page "finds" is set here on purpose: the page demonstrates the method, not real findings.
// Deterministic: the same seed and script always produce the same database, byte for byte.

export const PARAMS = {
  seed: 20250901,
  termStart: '2025-09-01', // a Monday
  weeks: 16,
  students: 600,
  // [dorm area, base delivery minutes, share of students]
  areas: [['东区', 18, 0.3], ['西区', 20, 0.3], ['南区', 22, 0.25], ['北区', 32, 0.15]],
  // Share of students whose first order falls in the first two weeks, and how weekly ordering decays after joining.
  freshmanShare: 0.6,
  retention: { fresh: [0.55, 0.45, 6], later: [0.3, 0.7, 2.5] }, // floor + span * exp(-weeksSinceJoining / timeConstant)
  // [orders per week at full interest, share of students]
  appetite: [[0.6, 0.5], [1.1, 0.35], [2.0, 0.15]],
  dayWeights: [1, 1, 1, 1, 1.1, 1.2, 1.1], // Monday … Sunday
  hourWeights: { 7: 2, 8: 3, 9: 1, 10: 2, 11: 14, 12: 16, 13: 5, 14: 2, 15: 2, 16: 3, 17: 12, 18: 13, 19: 6, 20: 4, 21: 6, 22: 5, 23: 3 },
  lateBoost: 1.8, // Friday and Saturday, 21:00 onwards
  peakHours: [11, 12, 17, 18],
  peakExtraMinutes: 9,
  spreadMinutes: 6,
  cancel: { base: 0.02, peak: 0.035, far: 0.02 }, // far = the 北区 dorms
  reasons: {
    peak: [['等待太久', 0.55], ['点错了', 0.2], ['商家缺货', 0.15], ['临时有事', 0.1]],
    calm: [['等待太久', 0.25], ['点错了', 0.3], ['商家缺货', 0.2], ['临时有事', 0.25]],
  },
  // [name, popularity weight, three set-meal prices in cents]
  merchants: [
    ['南门小厨', 26, [1600, 1800, 2200]], ['二食堂面馆', 20, [1200, 1400, 1600]], ['麻辣香锅', 15, [2400, 2800, 3200]],
    ['黄焖鸡米饭', 11, [1800, 2000, 2200]], ['川味小馆', 8, [1600, 2000, 2400]], ['粤式烧腊', 6, [2000, 2400, 2600]],
    ['韩式拌饭', 4, [1800, 2200, 2600]], ['轻食窗口', 3, [1400, 2000, 2200]], ['西北面食', 2.5, [1400, 1600, 1800]],
    ['煎饼果子', 2, [800, 1000, 1200]], ['校园茶点', 1.5, [600, 800, 1200]], ['夜宵烧烤', 1, [2000, 3000, 4000]],
  ],
  nightMerchant: 11, // 夜宵烧烤, much more popular from 21:00
  nightBoost: 12,
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Builds the term through the course project's schema, constraints and triggers. Returns the open database and its bytes. */
export function generate(SQL, schema, P = PARAMS) {
  const r = mulberry32(P.seed);
  const pick = weights => {
    let s = weights.reduce((a, w) => a + w, 0) * r();
    for (let i = 0; i < weights.length; i++) { s -= weights[i]; if (s < 0) return i; }
    return weights.length - 1;
  };
  const poisson = lambda => { const L = Math.exp(-lambda); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; };
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const start = Date.parse(`${P.termStart}T00:00:00Z`);
  const stamp = ms => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');

  const db = new SQL.Database();
  db.run(schema);
  db.run('BEGIN');
  P.merchants.forEach(([name], i) => db.run('INSERT INTO merchants VALUES(?,?)', [i + 1, name]));
  P.merchants.forEach(([name, , prices], i) => prices.forEach((price, j) =>
    db.run('INSERT INTO dishes VALUES(?,?,?,?,?)', [i * 3 + j + 1, i + 1, `${name} 套餐 ${'ABC'[j]}`, price, 1000000])));

  const students = [];
  for (let id = 1; id <= P.students; id++) {
    const area = pick(P.areas.map(a => a[2]));
    const fresh = r() < P.freshmanShare;
    const join = fresh ? 1 + Math.floor(r() * 2) : 3 + Math.floor(r() * 10);
    const appetite = P.appetite[pick(P.appetite.map(a => a[1]))][0];
    students.push({ id, area, fresh, join, appetite });
    db.run('INSERT INTO students VALUES(?,?,?)', [id, `同学 ${String(id).padStart(3, '0')}`, `${P.areas[area][0]}${1 + Math.floor(r() * 6)}栋`]);
  }

  const hours = Object.keys(P.hourWeights).map(Number);
  const orders = [];
  for (const st of students) {
    const [floor, span, timeConstant] = st.fresh ? P.retention.fresh : P.retention.later;
    for (let week = st.join; week <= P.weeks; week++) {
      const k = week - st.join;
      let n = poisson(st.appetite * (floor + span * Math.exp(-k / timeConstant)));
      if (k === 0 && n === 0) n = 1; // joining means ordering in that week
      for (let i = 0; i < n; i++) {
        const dow = pick(P.dayWeights);
        const late = dow === 4 || dow === 5;
        const hour = hours[pick(hours.map(h => P.hourWeights[h] * (late && h >= 21 ? P.lateBoost : 1)))];
        const at = start + (((week - 1) * 7 + dow) * 24 + hour) * 3600000 + Math.floor(r() * 60) * 60000;
        const m = pick(P.merchants.map((x, j) => x[1] * (hour >= 21 && j === P.nightMerchant ? P.nightBoost : 1)));
        const lines = [];
        const kinds = 1 + (r() < 0.3 ? 1 : 0);
        for (let j = 0; j < kinds; j++) {
          const dish = m * 3 + Math.floor(r() * 3) + 1;
          if (!lines.some(l => l[0] === dish)) lines.push([dish, 1 + (r() < 0.2 ? 1 : 0), P.merchants[m][2][dish - m * 3 - 1]]);
        }
        const peak = P.peakHours.includes(hour);
        const cancel = r() < P.cancel.base + (peak ? P.cancel.peak : 0) + (st.area === 3 ? P.cancel.far : 0);
        const reasons = peak ? P.reasons.peak : P.reasons.calm;
        orders.push({
          at, student: st.id, m, lines, cancel,
          reason: reasons[pick(reasons.map(x => x[1]))][0],
          after: 5 + Math.floor(r() * 21),
          minutes: Math.max(8, Math.round(P.areas[st.area][1] + (peak ? P.peakExtraMinutes : 0) + normal() * P.spreadMinutes)),
          rider: `骑手 ${String(1 + Math.floor(r() * 12)).padStart(2, '0')}`,
        });
      }
    }
  }

  // Ids follow time, like a real system.
  orders.sort((a, b) => a.at - b.at || a.student - b.student);
  orders.forEach((o, i) => {
    const id = i + 1;
    const total = o.lines.reduce((s, [, q, p]) => s + q * p, 0);
    db.run('INSERT INTO orders VALUES(?,?,?,?,?,?)', [id, o.student, o.m + 1, 'paid', stamp(o.at), total]);
    for (const [dish, q, p] of o.lines) db.run('INSERT INTO order_items VALUES(?,?,?,?,?)', [id, dish, o.m + 1, q, p]);
    db.run('INSERT INTO payments(order_id,amount_cents,paid_at) VALUES(?,?,?)', [id, total, stamp(o.at)]);
    db.run('INSERT INTO deliveries(order_id,rider) VALUES(?,?)', [id, o.rider]);
    if (o.cancel) {
      db.run('INSERT INTO refunds(order_id,amount_cents,reason,refunded_at) VALUES(?,?,?,?)', [id, total, o.reason, stamp(o.at + o.after * 60000)]);
    } else {
      db.run("UPDATE orders SET status='delivered' WHERE id=?", [id]);
      db.run('UPDATE deliveries SET delivered_at=? WHERE order_id=?', [stamp(o.at + o.minutes * 60000), id]);
    }
  });
  db.run('COMMIT');
  db.run('VACUUM');
  return { db, bytes: db.export() };
}
