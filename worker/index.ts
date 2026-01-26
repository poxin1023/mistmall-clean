export interface Env {
    DB: D1Database
    ADMIN_TOKEN: string
  }
  
  function withCorsHeaders(init: ResponseInit = {}) {
    return {
      ...init,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "content-type,authorization",
        ...(init.headers || {})
      }
    } as ResponseInit
  }
  
  function json(data: any, init: ResponseInit = {}) {
    return new Response(JSON.stringify(data, null, 2), withCorsHeaders({
      ...init,
      headers: {
        "content-type": "application/json; charset=utf-8",
        ...(init.headers || {})
      }
    }))
  }
  
  function html(body: string, init: ResponseInit = {}) {
    return new Response(body, withCorsHeaders({
      ...init,
      headers: {
        "content-type": "text/html; charset=utf-8",
        ...(init.headers || {})
      }
    }))
  }
  
  function readBearerToken(req: Request): string | null {
    const h = req.headers.get("authorization") || req.headers.get("Authorization")
    if (!h) return null
    const m = h.match(/^Bearer\s+(.+)$/i)
    if (!m) return null
    return m[1].trim()
  }
  
  function requireAdmin(req: Request, env: Env): Response | null {
    const t = readBearerToken(req)
    if (!t || t !== env.ADMIN_TOKEN) {
      return json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }
    return null
  }
  
  function parseOrderNoFromPath(pathname: string, prefix: string) {
    // pathname: /api/admin/orders/{orderNo}...
    const raw = pathname.slice(prefix.length)
    const cleaned = raw.replace(/^\/+/, "").trim()
    return cleaned ? decodeURIComponent(cleaned.split("/")[0]) : ""
  }
  
  async function safeJson(req: Request) {
    try {
      return await req.json()
    } catch {
      return null
    }
  }
  
  const ADMIN_HTML = `<!doctype html>
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
      input, button, select { font: inherit; }
      input { padding: 10px 12px; border: 1px solid #d9d9e3; border-radius: 10px; width: 320px; }
      button { padding: 10px 12px; border: 1px solid #d9d9e3; background: #fff; border-radius: 10px; cursor: pointer; }
      button.primary { background: #111; color: #fff; border-color: #111; }
      button.danger { background: #fff; color: #b00020; border-color: #f0c6cd; }
      button.ok { background: #0f7b3a; color: #fff; border-color: #0f7b3a; }
      .muted { color: #666; font-size: 13px; }
      .grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 12px; margin-top: 12px; }
      @media (max-width: 980px){ .grid { grid-template-columns: 1fr; } input { width: 100%; } }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; vertical-align: top; }
      th { font-size: 13px; color: #444; background: #fafafa; }
      tr:hover td { background: #fcfcff; }
      .pill { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 999px; font-size: 12px; border: 1px solid #e8e8ee; }
      .pill.pending { background: #fff7db; border-color: #f5d58a; }
      .pill.shipped { background: #e9f8ef; border-color: #bfe9cc; }
      .pill.cancelled { background: #fdecec; border-color: #f3b8b8; }
      .pill.deleted { background: #f3f4f6; border-color: #e5e7eb; }
      .k { font-size: 12px; color: #666; }
      .v { font-weight: 650; }
      .mono { font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace; }
      .toast { position: fixed; right: 14px; bottom: 14px; background: #111; color: #fff; padding: 10px 12px; border-radius: 10px; opacity: 0; transform: translateY(8px); transition: .18s; }
      .toast.show { opacity: 1; transform: translateY(0); }
      .small { font-size: 12px; }
      .btnbar { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
      .box { border: 1px solid #eee; border-radius: 10px; padding: 10px; background: #fafafa; }
      .hr { height: 1px; background: #eee; margin: 10px 0; }
      .row2 { display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:space-between; }
      .select { padding: 10px 12px; border: 1px solid #d9d9e3; border-radius: 10px; background:#fff; }
    </style>
  </head>
  <body>
  <header>
    <div class="wrap">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div style="font-weight:800; font-size:16px;">MistMall 後台</div>
          <div class="muted">用瀏覽器看訂單：/admin（不需要 Thunder / SQL）</div>
        </div>
        <div class="row">
          <input id="token" class="mono" placeholder="貼上 ADMIN_TOKEN（只存在你瀏覽器 localStorage）" />
          <button id="saveToken" class="primary">儲存 Token</button>
          <button id="clearToken" class="danger">清除</button>
        </div>
      </div>
    </div>
  </header>
  
  <main class="wrap">
    <div class="card pad">
      <div class="row2">
        <div class="row">
          <button id="refresh" class="primary">重新載入</button>
          <input id="q" placeholder="搜尋：訂單號 / 姓名 / 電話" />
          <span id="stat" class="muted"></span>
        </div>
        <div class="row">
          <span class="muted small">顯示：</span>
          <select id="viewMode" class="select">
            <option value="active" selected>只看待處理（隱藏已刪除）</option>
            <option value="all">全部（包含已刪除）</option>
          </select>
        </div>
      </div>
      <div class="muted small" style="margin-top:8px;">
        若看到 401：表示 Token 未存或不正確。這是正常的安全機制。
      </div>
    </div>
  
    <div class="grid">
      <section class="card">
        <div class="pad" style="border-bottom:1px solid #eee;">
          <div style="font-weight:800;">訂單列表</div>
          <div class="muted small">待確認會優先排序</div>
        </div>
        <div class="pad" style="padding-top:0;">
          <table>
            <thead>
              <tr>
                <th style="width:160px;">訂單號</th>
                <th style="width:110px;">狀態</th>
                <th>收件人</th>
                <th style="width:170px;">建立時間</th>
              </tr>
            </thead>
            <tbody id="list"></tbody>
          </table>
        </div>
      </section>
  
      <aside class="card">
        <div class="pad" style="border-bottom:1px solid #eee;">
          <div style="font-weight:800;">訂單詳情</div>
          <div id="detailHint" class="muted small">點左邊一筆訂單查看</div>
        </div>
        <div class="pad" id="detail"></div>
      </aside>
    </div>
  </main>
  
  <div id="toast" class="toast"></div>
  
  <script>
    const $ = (id) => document.getElementById(id);
    const TOKEN_KEY = 'mistmall_admin_token';
    let currentOrderNo = '';
  
    function toast(msg){
      const t = $('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 1200);
    }
  
    function getToken(){ return localStorage.getItem(TOKEN_KEY) || ''; }
    function setToken(v){ localStorage.setItem(TOKEN_KEY, (v || '').trim()); }
    function clearToken(){ localStorage.removeItem(TOKEN_KEY); }
  
    const STATUS_ZH = {
      pending: '待確認',
      shipped: '已寄件',
      cancelled: '已取消',
      deleted: '已刪除'
    };
  
    function statusRank(s){
      const x = (s || '').toLowerCase();
      if (x === 'pending') return 0;
      if (x === 'shipped') return 1;
      if (x === 'cancelled') return 2;
      if (x === 'deleted') return 9;
      return 5;
    }
  
    function statusLabel(status){
      const s = (status || '').toLowerCase();
      return STATUS_ZH[s] || (status || '-');
    }
  
    function pill(status){
      const s = (status || '').toLowerCase();
      const cls = ['pill', s].join(' ');
      return '<span class="' + cls + '">' + statusLabel(status) + '</span>';
    }
  
    function fmtTime(v){
      if (!v) return '-';
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toLocaleString();
      return String(v);
    }
  
    async function api(path, opt = {}){
      const token = getToken();
      const headers = opt.headers ? opt.headers : {};
      if (token) headers['Authorization'] = 'Bearer ' + token;
      if (opt.json) headers['Content-Type'] = 'application/json; charset=utf-8';
  
      const res = await fetch(path, {
        method: opt.method || 'GET',
        headers,
        body: opt.json ? JSON.stringify(opt.json) : opt.body
      });
  
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
      const q = ($('q').value || '').trim().toLowerCase();
      const mode = $('viewMode').value || 'active';
  
      let filtered = rows || [];
  
      // 預設隱藏 deleted
      if (mode !== 'all'){
        filtered = filtered.filter(o => String(o.status || '').toLowerCase() !== 'deleted');
      }
  
      if (q){
        filtered = filtered.filter(o =>
          String(o.order_no || '').toLowerCase().includes(q) ||
          String(o.name || '').toLowerCase().includes(q) ||
          String(o.phone || '').toLowerCase().includes(q)
        );
      }
  
      filtered.sort((a,b) => {
        const ra = statusRank(a.status), rb = statusRank(b.status);
        if (ra !== rb) return ra - rb;
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
  
      $('stat').textContent = \`顯示 \${filtered.length} / \${(rows||[]).length}\`;
  
      Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
        tr.addEventListener('click', () => loadDetail(tr.getAttribute('data-order')));
      });
    }
  
    async function updateStatus(orderNo, nextStatus){
      if (!orderNo) return;
      await api('/api/admin/orders/' + encodeURIComponent(orderNo) + '/status', {
        method: 'PATCH',
        json: { status: nextStatus }
      });
    }
  
    async function deleteOrder(orderNo){
      if (!orderNo) return;
      await api('/api/admin/orders/' + encodeURIComponent(orderNo), {
        method: 'DELETE'
      });
    }
  
    function renderDetail(order){
      const d = $('detail');
      $('detailHint').textContent = '';
      currentOrderNo = order.order?.order_no || '';
  
      const info = {
        orderNo: order.order?.order_no || '',
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
          <div class="v">\${escapeHtml(it.product_name || '-')}</div>
          <div class="muted small">\${escapeHtml(it.variant_text || '')}</div>
          <div class="muted small">qty: \${escapeHtml(it.qty)} / unit: \${escapeHtml(it.unit_price)} / total: \${escapeHtml(it.line_total)}</div>
        </div>
      \`).join('') : '<div class="muted small">（無商品明細）</div>';
  
      const shipText =
  \`訂單號：\${info.orderNo}
  狀態：\${statusLabel(info.status)}
  建立：\${fmtTime(info.createdAt)}
  
  收件人：\${info.name}
  電話：\${info.phone}
  
  7-11門市：\${info.storeName}（\${info.storeNo}）
  門市地址：\${info.storeAddress}
  
  金額：\${info.amount}\`;
  
      d.innerHTML = \`
        <div class="box">
          <div class="k">訂單號</div><div class="v mono">\${escapeHtml(info.orderNo)}</div>
          <div class="k" style="margin-top:6px;">狀態</div><div class="v">\${pill(info.status)}</div>
          <div class="k" style="margin-top:6px;">建立時間</div><div class="v">\${escapeHtml(fmtTime(info.createdAt))}</div>
  
          <div class="hr"></div>
  
          <div class="row" style="justify-content: space-between;">
            <div class="muted small">出貨操作</div>
            <div class="row">
              <button id="markShipped" class="ok">標記已寄件</button>
              <button id="markPending">改回待確認</button>
              <button id="delOrder" class="danger">刪除此訂單</button>
            </div>
          </div>
          <div class="muted small" style="margin-top:6px;">
            刪除採用「安全刪除」：狀態會變成已刪除，預設不顯示。
          </div>
        </div>
  
        <div class="box" style="margin-top:10px;">
          <div class="k">收件人</div><div class="v">\${escapeHtml(info.name)}</div>
          <div class="k" style="margin-top:6px;">電話</div><div class="v mono">\${escapeHtml(info.phone)}</div>
          <div class="k" style="margin-top:6px;">門市</div><div class="v">\${escapeHtml(info.storeName)} <span class="muted small">(\${escapeHtml(info.storeNo)})</span></div>
          <div class="k" style="margin-top:6px;">門市地址</div><div class="v">\${escapeHtml(info.storeAddress)}</div>
          <div class="k" style="margin-top:6px;">金額</div><div class="v">\${escapeHtml(info.amount)}</div>
  
          <div class="btnbar">
            <button id="copyShip" class="primary">一鍵複製寄件資訊</button>
            <button id="copyOrderNo">複製訂單號</button>
          </div>
        </div>
  
        <div style="margin-top:10px;">
          <div style="font-weight:800; margin-bottom:6px;">商品明細</div>
          \${itemsHtml}
        </div>
      \`;
  
      $('copyShip').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(shipText);
          toast('已複製寄件資訊');
        } catch {
          const ta = document.createElement('textarea');
          ta.value = shipText;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          toast('已複製寄件資訊');
        }
      });
  
      $('copyOrderNo').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(info.orderNo);
          toast('已複製訂單號');
        } catch {
          toast('複製失敗（瀏覽器限制）');
        }
      });
  
      $('markShipped').addEventListener('click', async () => {
        try{
          await updateStatus(info.orderNo, 'shipped');
          toast('已標記：已寄件');
          await loadList();
          await loadDetail(info.orderNo);
        }catch(e){
          toast('操作失敗');
        }
      });
  
      $('markPending').addEventListener('click', async () => {
        try{
          await updateStatus(info.orderNo, 'pending');
          toast('已改回：待確認');
          await loadList();
          await loadDetail(info.orderNo);
        }catch(e){
          toast('操作失敗');
        }
      });
  
      $('delOrder').addEventListener('click', async () => {
        const ok = confirm('確定要刪除此訂單嗎？\\n\\n刪除後預設不顯示，但你仍可切到「全部（包含已刪除）」查看。');
        if (!ok) return;
        try{
          await deleteOrder(info.orderNo);
          toast('已刪除（已隱藏）');
          currentOrderNo = '';
          $('detail').innerHTML = '<div class="muted small">已刪除。可重新載入查看列表。</div>';
          await loadList();
        }catch(e){
          toast('刪除失敗');
        }
      });
    }
  
    async function loadList(){
      $('stat').textContent = '載入中...';
      try {
        const res = await api('/api/admin/orders');
        renderList(res.orders || []);
      } catch (e){
        $('list').innerHTML = '';
        $('stat').textContent = '';
        $('detail').innerHTML = '<div class="muted small">無法載入（可能未設定 Token 或 Token 錯誤）</div>';
        if (e && e.status) toast('錯誤：HTTP ' + e.status);
        else toast('載入失敗');
      }
    }
  
    async function loadDetail(orderNo){
      if (!orderNo) return;
      try {
        const res = await api('/api/admin/orders/' + encodeURIComponent(orderNo));
        renderDetail(res);
      } catch (e){
        $('detail').innerHTML = '<div class="muted small">無法載入詳情</div>';
        if (e && e.status) toast('錯誤：HTTP ' + e.status);
        else toast('載入失敗');
      }
    }
  
    $('saveToken').addEventListener('click', () => {
      setToken($('token').value);
      toast('已儲存 Token');
      loadList();
    });
    $('clearToken').addEventListener('click', () => {
      clearToken();
      $('token').value = '';
      toast('已清除 Token');
    });
    $('refresh').addEventListener('click', loadList);
    $('q').addEventListener('input', () => loadList());
    $('viewMode').addEventListener('change', () => loadList());
  
    // init
    $('token').value = getToken();
    loadList();
  </script>
  </body>
  </html>`
  
  export default {
    async fetch(req: Request, env: Env): Promise<Response> {
      const url = new URL(req.url)
  
      // Preflight
      if (req.method === "OPTIONS") return json({ ok: true })
  
      // 人性化後台頁面
      if (url.pathname === "/admin" || url.pathname === "/admin/") {
        return html(ADMIN_HTML)
      }
  
      // 健康檢查
      if (url.pathname === "/api/health") {
        return json({ ok: true })
      }
  
      // 客戶下單
      if (url.pathname === "/api/orders" && req.method === "POST") {
        const body = await safeJson(req) || {}
        const orderNo = "ORD" + Date.now()
        const createdAt = new Date().toISOString()
  
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
        ).run()
  
        for (const it of (body.items || [])) {
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
          ).run()
        }
  
        return json({ ok: true, orderNo })
      }
  
      // ✅ 後台：列出所有訂單（Authorization: Bearer）
      if (url.pathname === "/api/admin/orders" && req.method === "GET") {
        const deny = requireAdmin(req, env)
        if (deny) return deny
  
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
        ).all()
  
        return json({ ok: true, orders: orders.results })
      }
  
      // ✅ 後台：查詢單筆訂單（含 items）
      if (req.method === "GET" && url.pathname.startsWith("/api/admin/orders/") && !url.pathname.endsWith("/status")) {
        const deny = requireAdmin(req, env)
        if (deny) return deny
  
        const orderNo = parseOrderNoFromPath(url.pathname, "/api/admin/orders/")
        if (!orderNo) return json({ ok: false, error: "Bad Request" }, { status: 400 })
  
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
        ).bind(orderNo).first()
  
        if (!order) return json({ ok: false, error: "Not Found" }, { status: 404 })
  
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
        ).bind(orderNo).all()
  
        return json({ ok: true, order, items: items.results })
      }
  
      // ✅ 後台：更新狀態（pending / shipped / cancelled / deleted）
      // PATCH /api/admin/orders/{orderNo}/status  body: { status: "shipped" }
      if (req.method === "PATCH" && url.pathname.startsWith("/api/admin/orders/") && url.pathname.endsWith("/status")) {
        const deny = requireAdmin(req, env)
        if (deny) return deny
  
        const orderNo = parseOrderNoFromPath(url.pathname, "/api/admin/orders/")
        if (!orderNo) return json({ ok: false, error: "Bad Request" }, { status: 400 })
  
        const body = await safeJson(req) || {}
        const next = String(body.status || "").toLowerCase().trim()
        const allow = new Set(["pending", "shipped", "cancelled", "deleted"])
        if (!allow.has(next)) {
          return json({ ok: false, error: "Invalid status" }, { status: 400 })
        }
  
        const r = await env.DB.prepare(
          `UPDATE orders SET status = ? WHERE order_no = ?`
        ).bind(next, orderNo).run()
  
        return json({ ok: true, updated: r.meta?.changes ?? 0, status: next })
      }
  
      // ✅ 後台：刪除（安全刪除＝改成 deleted）
      // DELETE /api/admin/orders/{orderNo}
      if (req.method === "DELETE" && url.pathname.startsWith("/api/admin/orders/")) {
        const deny = requireAdmin(req, env)
        if (deny) return deny
  
        const orderNo = parseOrderNoFromPath(url.pathname, "/api/admin/orders/")
        if (!orderNo) return json({ ok: false, error: "Bad Request" }, { status: 400 })
  
        const r = await env.DB.prepare(
          `UPDATE orders SET status = 'deleted' WHERE order_no = ?`
        ).bind(orderNo).run()
  
        return json({ ok: true, deleted: r.meta?.changes ?? 0 })
      }
  
      // 🔁 相容保留：你舊的 /admin/orders?token=...（建議逐步淘汰）
      if (url.pathname === "/admin/orders" && req.method === "GET") {
        const token = url.searchParams.get("token")
        if (token !== env.ADMIN_TOKEN) {
          return json({ ok: false, error: "Unauthorized" }, { status: 401 })
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
        ).all()
  
        return json({ ok: true, orders: orders.results })
      }
  
      return json({ ok: false, error: "Not Found" }, { status: 404 })
    }
  }
  