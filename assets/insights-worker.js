importScripts('/assets/vendor/sql-wasm.js');
// sql.js also rejects an internal promise when the wasm fails to load; the failure is already reported via postMessage below.
addEventListener('unhandledrejection', e => e.preventDefault());
let db;
onmessage = async ({ data: m }) => {
  try {
    if (m.action === 'init') {
      const SQL = await initSqlJs({ locateFile: () => '/assets/vendor/sql-wasm.wasm' });
      const res = await fetch('/assets/insights/campus-term.sqlite');
      if (!res.ok) throw Error('HTTP ' + res.status);
      db = new SQL.Database(new Uint8Array(await res.arrayBuffer()));
      db.run('PRAGMA query_only = ON');
      postMessage({ id: m.id, ok: true, results: {} });
      return;
    }
    if (!db) throw Error('database not loaded');
    const results = {};
    for (const q of m.queries) {
      const s = db.prepare(q.sql);
      try {
        s.bind(m.params);
        const values = [];
        while (s.step()) values.push(s.get());
        results[q.id] = { columns: s.getColumnNames(), values };
      } finally {
        s.free();
      }
    }
    postMessage({ id: m.id, ok: true, results });
  } catch (e) {
    postMessage({ id: m.id, ok: false, error: String((e && e.message) || e) });
  }
};
