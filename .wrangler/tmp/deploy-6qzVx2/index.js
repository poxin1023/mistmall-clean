var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/index.ts
function withCorsHeaders(init = {}) {
  return {
    ...init,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
      ...init.headers || {}
    }
  };
}
__name(withCorsHeaders, "withCorsHeaders");
function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), withCorsHeaders({
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers || {}
    }
  }));
}
__name(json, "json");
function html(body, init = {}) {
  return new Response(body, withCorsHeaders({
    ...init,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...init.headers || {}
    }
  }));
}
__name(html, "html");
function readBearerToken(req) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  return m[1].trim();
}
__name(readBearerToken, "readBearerToken");
function requireAdmin(req, env) {
  const t = readBearerToken(req);
  if (!t || t !== env.ADMIN_TOKEN) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
__name(requireAdmin, "requireAdmin");
var ADMIN_HTML = `<!doctype html>
  <html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>MistMall /admin</title>
    <style>
      :root { font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
      body { margin: 0; background: #f6f7fb; color: #111; }
      header { position: sticky; top: 0; background: #fff; border-bottom: 1px solid #e8e8ee; }
      .wrap { max-width: 1100px; margin: 0 auto; padding: 14px; }
      .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
      .card { background: #fff; border: 1px solid #e8e8ee; border-radius: 12px; }
      .pad { padding: 12px; }
      input, button { font: inherit; }
      input { padding: 10px 12px; border: 1px solid #d9d9e3; border-radius: 10px; width: 320px; }
      button { padding: 10px 12px; border: 1px solid #d9d9e3; background: #fff; border-radius: 10px; cursor: pointer; }
      button.primary { background: #111; color: #fff; border-color: #111; }
      button.danger { background: #fff; color: #b00020; border-color: #f0c6cd; }
      .muted { color: #666; font-size: 13px; }
      .grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 12px; margin-top: 12px; }
      @media (max-width: 980px){ .grid { grid-template-columns: 1fr; } input { width: 100%; } }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; vertical-align: top; }
      th { font-size: 13px; color: #444; background: #fafafa; }
      tr:hover td { background: #fcfcff; }
      .pill { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 999px; font-size: 12px; border: 1px solid #e8e8ee; }
      .pill.pending { background: #fff7db; border-color: #f5d58a; }
      .pill.paid { background: #e8f5ff; border-color: #b8dcff; }
      .pill.shipped { background: #e9f8ef; border-color: #bfe9cc; }
      .pill.cancelled { background: #fdecec; border-color: #f3b8b8; }
      .k { font-size: 12px; color: #666; }
      .v { font-weight: 650; }
      .mono { font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace; }
      .toast { position: fixed; right: 14px; bottom: 14px; background: #111; color: #fff; padding: 10px 12px; border-radius: 10px; opacity: 0; transform: translateY(8px); transition: .18s; }
      .toast.show { opacity: 1; transform: translateY(0); }
      .small { font-size: 12px; }
      .btnbar { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
      .box { border: 1px solid #eee; border-radius: 10px; padding: 10px; background: #fafafa; }
    </style>
  </head>
  <body>
  <header>
    <div class="wrap">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div style="font-weight:800; font-size:16px;">MistMall \u5F8C\u53F0</div>
          <div class="muted">\u7528\u700F\u89BD\u5668\u770B\u8A02\u55AE\uFF1A/admin\uFF08\u4E0D\u9700\u8981 Thunder / SQL\uFF09</div>
        </div>
        <div class="row">
          <input id="token" class="mono" placeholder="\u8CBC\u4E0A ADMIN_TOKEN\uFF08\u53EA\u5B58\u5728\u4F60\u700F\u89BD\u5668 localStorage\uFF09" />
          <button id="saveToken" class="primary">\u5132\u5B58 Token</button>
          <button id="clearToken" class="danger">\u6E05\u9664</button>
        </div>
      </div>
    </div>
  </header>
  
  <main class="wrap">
    <div class="card pad">
      <div class="row">
        <button id="refresh" class="primary">\u91CD\u65B0\u8F09\u5165</button>
        <input id="q" placeholder="\u641C\u5C0B\uFF1A\u8A02\u55AE\u865F / \u59D3\u540D / \u96FB\u8A71" />
        <span id="stat" class="muted"></span>
      </div>
      <div class="muted small" style="margin-top:8px;">
        \u82E5\u770B\u5230 401\uFF1A\u8868\u793A Token \u672A\u5B58\u6216\u4E0D\u6B63\u78BA\u3002\u9019\u662F\u6B63\u5E38\u7684\u5B89\u5168\u6A5F\u5236\u3002
      </div>
    </div>
  
    <div class="grid">
      <section class="card">
        <div class="pad" style="border-bottom:1px solid #eee;">
          <div style="font-weight:800;">\u8A02\u55AE\u5217\u8868</div>
          <div class="muted small">pending \u6703\u512A\u5148\u6392\u5E8F</div>
        </div>
        <div class="pad" style="padding-top:0;">
          <table>
            <thead>
              <tr>
                <th style="width:160px;">\u8A02\u55AE\u865F</th>
                <th style="width:110px;">\u72C0\u614B</th>
                <th>\u6536\u4EF6\u4EBA</th>
                <th style="width:170px;">\u5EFA\u7ACB\u6642\u9593</th>
              </tr>
            </thead>
            <tbody id="list"></tbody>
          </table>
        </div>
      </section>
  
      <aside class="card">
        <div class="pad" style="border-bottom:1px solid #eee;">
          <div style="font-weight:800;">\u8A02\u55AE\u8A73\u60C5</div>
          <div id="detailHint" class="muted small">\u9EDE\u5DE6\u908A\u4E00\u7B46\u8A02\u55AE\u67E5\u770B</div>
        </div>
        <div class="pad" id="detail"></div>
      </aside>
    </div>
  </main>
  
  <div id="toast" class="toast"></div>
  
  <script>
    const $ = (id) => document.getElementById(id);
    const TOKEN_KEY = 'mistmall_admin_token';
  
    function toast(msg){
      const t = $('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 1200);
    }
  
    function getToken(){ return localStorage.getItem(TOKEN_KEY) || ''; }
    function setToken(v){ localStorage.setItem(TOKEN_KEY, (v || '').trim()); }
    function clearToken(){ localStorage.removeItem(TOKEN_KEY); }
  
    function statusRank(s){
      const x = (s || '').toLowerCase();
      if (x === 'pending') return 0;
      if (x === 'paid') return 1;
      if (x === 'shipped') return 2;
      if (x === 'cancelled') return 3;
      return 9;
    }
    function pill(status){
      const s = (status || '').toLowerCase();
      const cls = ['pill', s].join(' ');
      return '<span class="' + cls + '">' + (status || '-') + '</span>';
    }
    function fmtTime(v){
      if (!v) return '-';
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toLocaleString();
      return String(v);
    }
  
    async function api(path){
      const token = getToken();
      const headers = {};
      if (token) headers['Authorization'] = 'Bearer ' + token;
      const res = await fetch(path, { headers });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
      if (!res.ok){
        const err = new Error('HTTP ' + res.status);
        err.status = res.status;
        err.body = data;
        throw err;
      }
      return data;
    }
  
    function escapeHtml(s){
      return String(s ?? '').replace(/[&<>"']/g, (c) => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
      }[c]));
    }
  
    function renderList(rows){
      const q = ($('q').value || '').trim();
      let filtered = rows;
      if (q){
        const qq = q.toLowerCase();
        filtered = rows.filter(o =>
          String(o.order_no || '').toLowerCase().includes(qq) ||
          String(o.name || '').toLowerCase().includes(qq) ||
          String(o.phone || '').toLowerCase().includes(qq)
        );
      }
      filtered.sort((a,b) => {
        const ra = statusRank(a.status), rb = statusRank(b.status);
        if (ra !== rb) return ra - rb;
        // created_at desc
        return String(b.created_at||'').localeCompare(String(a.created_at||''));
      });
  
      const tbody = $('list');
      tbody.innerHTML = filtered.map(o => {
        const who = [o.name, o.phone].filter(Boolean).join(' / ') || '-';
        return \`
          <tr data-order="\${escapeHtml(o.order_no)}" style="cursor:pointer;">
            <td class="mono">\${escapeHtml(o.order_no)}</td>
            <td>\${pill(o.status)}</td>
            <td>\${escapeHtml(who)}<div class="muted small">\${escapeHtml(o.store_name || '')}</div></td>
            <td>\${escapeHtml(fmtTime(o.created_at))}</td>
          </tr>
        \`;
      }).join('');
  
      $('stat').textContent = \`\u986F\u793A \${filtered.length} / \${rows.length}\`;
      Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
        tr.addEventListener('click', () => loadDetail(tr.getAttribute('data-order')));
      });
    }
  
    function renderDetail(order){
      const d = $('detail');
      $('detailHint').textContent = '';
  
      const info = {
        orderNo: order.order?.order_no || order.order?.orderNo || '',
        status: order.order?.status || '',
        createdAt: order.order?.created_at || '',
        name: order.order?.name || '',
        phone: order.order?.phone || '',
        storeNo: order.order?.store_no || '',
        storeName: order.order?.store_name || '',
        storeAddress: order.order?.store_address || '',
        amount: order.order?.amount ?? ''
      };
  
      const items = order.items || [];
      const itemsHtml = items.length ? items.map(it => \`
        <div class="box" style="margin-top:8px;">
          <div class="v">\${escapeHtml(it.product_name || it.productName || '-')}</div>
          <div class="muted small">\${escapeHtml(it.variant_text || it.variantText || '')}</div>
          <div class="muted small">qty: \${escapeHtml(it.qty)} / unit: \${escapeHtml(it.unit_price)} / total: \${escapeHtml(it.line_total)}</div>
        </div>
      \`).join('') : '<div class="muted small">\uFF08\u7121\u5546\u54C1\u660E\u7D30\uFF09</div>';
  
      const shipText =
  \`\u8A02\u55AE\u865F\uFF1A\${info.orderNo}
  \u72C0\u614B\uFF1A\${info.status}
  \u5EFA\u7ACB\uFF1A\${fmtTime(info.createdAt)}
  
  \u6536\u4EF6\u4EBA\uFF1A\${info.name}
  \u96FB\u8A71\uFF1A\${info.phone}
  
  7-11\u9580\u5E02\uFF1A\${info.storeName}\uFF08\${info.storeNo}\uFF09
  \u9580\u5E02\u5730\u5740\uFF1A\${info.storeAddress}
  
  \u91D1\u984D\uFF1A\${info.amount}\`;
  
      d.innerHTML = \`
        <div class="box">
          <div class="k">\u8A02\u55AE\u865F</div><div class="v mono">\${escapeHtml(info.orderNo)}</div>
          <div class="k" style="margin-top:6px;">\u72C0\u614B</div><div class="v">\${pill(info.status)}</div>
          <div class="k" style="margin-top:6px;">\u5EFA\u7ACB\u6642\u9593</div><div class="v">\${escapeHtml(fmtTime(info.createdAt))}</div>
        </div>
  
        <div class="box" style="margin-top:10px;">
          <div class="k">\u6536\u4EF6\u4EBA</div><div class="v">\${escapeHtml(info.name)}</div>
          <div class="k" style="margin-top:6px;">\u96FB\u8A71</div><div class="v mono">\${escapeHtml(info.phone)}</div>
          <div class="k" style="margin-top:6px;">\u9580\u5E02</div><div class="v">\${escapeHtml(info.storeName)} <span class="muted small">(\${escapeHtml(info.storeNo)})</span></div>
          <div class="k" style="margin-top:6px;">\u9580\u5E02\u5730\u5740</div><div class="v">\${escapeHtml(info.storeAddress)}</div>
          <div class="k" style="margin-top:6px;">\u91D1\u984D</div><div class="v">\${escapeHtml(info.amount)}</div>
  
          <div class="btnbar">
            <button id="copyShip" class="primary">\u4E00\u9375\u8907\u88FD\u5BC4\u4EF6\u8CC7\u8A0A</button>
            <button id="copyOrderNo">\u8907\u88FD\u8A02\u55AE\u865F</button>
          </div>
        </div>
  
        <div style="margin-top:10px;">
          <div style="font-weight:800; margin-bottom:6px;">\u5546\u54C1\u660E\u7D30</div>
          \${itemsHtml}
        </div>
      \`;
  
      $('copyShip').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(shipText);
          toast('\u5DF2\u8907\u88FD\u5BC4\u4EF6\u8CC7\u8A0A');
        } catch {
          // fallback
          const ta = document.createElement('textarea');
          ta.value = shipText;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          toast('\u5DF2\u8907\u88FD\u5BC4\u4EF6\u8CC7\u8A0A');
        }
      });
  
      $('copyOrderNo').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(info.orderNo);
          toast('\u5DF2\u8907\u88FD\u8A02\u55AE\u865F');
        } catch {
          toast('\u8907\u88FD\u5931\u6557\uFF08\u700F\u89BD\u5668\u9650\u5236\uFF09');
        }
      });
    }
  
    async function loadList(){
      $('stat').textContent = '\u8F09\u5165\u4E2D...';
      try {
        const res = await api('/api/admin/orders');
        renderList(res.orders || []);
      } catch (e){
        $('list').innerHTML = '';
        $('stat').textContent = '';
        $('detail').innerHTML = '<div class="muted small">\u7121\u6CD5\u8F09\u5165\uFF08\u53EF\u80FD\u672A\u8A2D\u5B9A Token \u6216 Token \u932F\u8AA4\uFF09</div>';
        if (e && e.status) toast('\u932F\u8AA4\uFF1AHTTP ' + e.status);
        else toast('\u8F09\u5165\u5931\u6557');
      }
    }
  
    async function loadDetail(orderNo){
      if (!orderNo) return;
      try {
        const res = await api('/api/admin/orders/' + encodeURIComponent(orderNo));
        renderDetail(res);
      } catch (e){
        $('detail').innerHTML = '<div class="muted small">\u7121\u6CD5\u8F09\u5165\u8A73\u60C5</div>';
        if (e && e.status) toast('\u932F\u8AA4\uFF1AHTTP ' + e.status);
        else toast('\u8F09\u5165\u5931\u6557');
      }
    }
  
    $('saveToken').addEventListener('click', () => {
      setToken($('token').value);
      toast('\u5DF2\u5132\u5B58 Token');
      loadList();
    });
    $('clearToken').addEventListener('click', () => {
      clearToken();
      $('token').value = '';
      toast('\u5DF2\u6E05\u9664 Token');
    });
    $('refresh').addEventListener('click', loadList);
    $('q').addEventListener('input', () => loadList());
  
    // init
    $('token').value = getToken();
    loadList();
  <\/script>
  </body>
  </html>`;
var index_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return json({ ok: true });
    if (url.pathname === "/admin" || url.pathname === "/admin/") {
      return html(ADMIN_HTML);
    }
    if (url.pathname === "/api/health") {
      return json({ ok: true });
    }
    if (url.pathname === "/api/orders" && req.method === "POST") {
      const body = await req.json();
      const orderNo = "ORD" + Date.now();
      const createdAt = (/* @__PURE__ */ new Date()).toISOString();
      await env.DB.prepare(
        `INSERT INTO orders
          (order_no, created_at, status, name, phone, store_no, store_name, store_address, amount)
          VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`
      ).bind(
        orderNo,
        createdAt,
        body.name,
        body.phone,
        body.storeNo,
        body.storeName,
        body.storeAddress,
        body.amount
      ).run();
      for (const it of body.items || []) {
        await env.DB.prepare(
          `INSERT INTO order_items
            (order_no, product_name, variant_text, qty, unit_price, line_total)
            VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          orderNo,
          it.productName,
          Array.isArray(it.specs) ? it.specs.join(" / ") : String(it.specs ?? ""),
          it.qty,
          it.unitPrice,
          it.subtotal
        ).run();
      }
      return json({ ok: true, orderNo });
    }
    if (url.pathname === "/api/admin/orders" && req.method === "GET") {
      const deny = requireAdmin(req, env);
      if (deny) return deny;
      const orders = await env.DB.prepare(
        `SELECT
            order_no,
            created_at,
            status,
            name,
            phone,
            store_no,
            store_name,
            store_address,
            amount
          FROM orders
          ORDER BY created_at DESC`
      ).all();
      return json({ ok: true, orders: orders.results });
    }
    if (req.method === "GET" && url.pathname.startsWith("/api/admin/orders/")) {
      const deny = requireAdmin(req, env);
      if (deny) return deny;
      const orderNo = decodeURIComponent(url.pathname.replace("/api/admin/orders/", "").trim());
      if (!orderNo) return json({ ok: false, error: "Bad Request" }, { status: 400 });
      const order = await env.DB.prepare(
        `SELECT
            order_no,
            created_at,
            status,
            name,
            phone,
            store_no,
            store_name,
            store_address,
            amount
          FROM orders
          WHERE order_no = ?
          LIMIT 1`
      ).bind(orderNo).first();
      if (!order) return json({ ok: false, error: "Not Found" }, { status: 404 });
      const items = await env.DB.prepare(
        `SELECT
            order_no,
            product_name,
            variant_text,
            qty,
            unit_price,
            line_total
          FROM order_items
          WHERE order_no = ?
          ORDER BY rowid ASC`
      ).bind(orderNo).all();
      return json({ ok: true, order, items: items.results });
    }
    if (url.pathname === "/admin/orders" && req.method === "GET") {
      const token = url.searchParams.get("token");
      if (token !== env.ADMIN_TOKEN) {
        return json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
      const orders = await env.DB.prepare(
        `SELECT
            order_no,
            created_at,
            status,
            name,
            phone,
            store_no,
            store_name,
            store_address,
            amount
          FROM orders
          ORDER BY created_at DESC`
      ).all();
      return json({ ok: true, orders: orders.results });
    }
    return json({ ok: false, error: "Not Found" }, { status: 404 });
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
