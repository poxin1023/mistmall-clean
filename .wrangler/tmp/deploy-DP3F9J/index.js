var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/index.ts
function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
      ...init.headers || {}
    }
  });
}
__name(json, "json");
function badRequest(message) {
  return json({ ok: false, error: message }, { status: 400 });
}
__name(badRequest, "badRequest");
function unauthorized() {
  return json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
__name(unauthorized, "unauthorized");
function getAuthToken(req) {
  const h = req.headers.get("authorization") || "";
  const v = h.trim();
  if (!v) return "";
  return v.toLowerCase().startsWith("bearer ") ? v.slice(7).trim() : v;
}
__name(getAuthToken, "getAuthToken");
function requireAdmin(req, env) {
  const token = getAuthToken(req);
  return token && env.ADMIN_TOKEN && token === env.ADMIN_TOKEN;
}
__name(requireAdmin, "requireAdmin");
function toInt(v, fallback = 0) {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}
__name(toInt, "toInt");
var index_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return json({ ok: true });
    if (url.pathname === "/api/health") {
      return json({ ok: true });
    }
    if (url.pathname === "/api/orders" && req.method === "POST") {
      let body;
      try {
        body = await req.json();
      } catch {
        return badRequest("Invalid JSON body");
      }
      const name = String(body?.name ?? "").trim();
      const phone = String(body?.phone ?? "").trim();
      const storeNo = String(body?.storeNo ?? "").trim();
      const storeName = String(body?.storeName ?? "").trim();
      const storeAddress = String(body?.storeAddress ?? "").trim();
      const amount = toInt(body?.amount, 0);
      const items = Array.isArray(body?.items) ? body.items : [];
      if (!name) return badRequest("Missing name");
      if (!/^09\d{8}$/.test(phone)) return badRequest("Invalid phone");
      if (!storeNo || !storeName) return badRequest("Missing store");
      if (!items.length) return badRequest("Cart is empty");
      if (amount <= 0) return badRequest("Invalid amount");
      const orderNo = `ORD${Date.now()}`;
      const createdAtISO = (/* @__PURE__ */ new Date()).toISOString();
      const statements = [];
      statements.push(
        env.DB.prepare(
          `INSERT INTO orders
             (order_no, created_at, status, name, phone, store_no, store_name, store_address, amount)
             VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`
        ).bind(orderNo, createdAtISO, name, phone, storeNo, storeName, storeAddress, amount)
      );
      for (const it of items) {
        const productName = String(it?.productName ?? "").trim();
        const qty = toInt(it?.qty, 0);
        const unitPrice = toInt(it?.unitPrice, 0);
        const lineTotal = toInt(it?.subtotal, qty * unitPrice);
        const specs = Array.isArray(it?.specs) ? it.specs.map((s) => String(s).trim()).filter(Boolean) : [];
        const variantText = specs.length ? specs.join(" / ") : "\uFF08\u7121\uFF09";
        if (!productName || qty <= 0 || unitPrice < 0) continue;
        statements.push(
          env.DB.prepare(
            `INSERT INTO order_items
               (order_no, product_name, variant_text, qty, unit_price, line_total)
               VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(orderNo, productName, variantText, qty, unitPrice, lineTotal)
        );
      }
      if (statements.length <= 1) return badRequest("No valid items");
      try {
        await env.DB.batch(statements);
      } catch (e) {
        return json(
          { ok: false, error: "DB insert failed", detail: String(e?.message ?? e) },
          { status: 500 }
        );
      }
      return json({ ok: true, orderNo, createdAt: createdAtISO });
    }
    if (url.pathname === "/api/admin/orders" && req.method === "GET") {
      if (!requireAdmin(req, env)) return unauthorized();
      const limit = Math.min(Math.max(toInt(url.searchParams.get("limit"), 50), 1), 200);
      const offset = Math.max(toInt(url.searchParams.get("offset"), 0), 0);
      const status = String(url.searchParams.get("status") ?? "").trim();
      const where = status ? "WHERE status = ?" : "";
      const stmt = env.DB.prepare(
        `SELECT order_no, created_at, status, name, phone, store_no, store_name, store_address, amount
           FROM orders
           ${where}
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`
      );
      const result = status ? await stmt.bind(status, limit, offset).all() : await stmt.bind(limit, offset).all();
      return json({ ok: true, items: result.results ?? [] });
    }
    if (url.pathname.startsWith("/api/admin/orders/") && req.method === "GET") {
      if (!requireAdmin(req, env)) return unauthorized();
      const orderNo = decodeURIComponent(url.pathname.replace("/api/admin/orders/", "")).trim();
      if (!orderNo) return badRequest("Missing orderNo");
      const orderRes = await env.DB.prepare(
        `SELECT order_no, created_at, status, name, phone, store_no, store_name, store_address, amount
           FROM orders
           WHERE order_no = ?
           LIMIT 1`
      ).bind(orderNo).all();
      const order = orderRes.results?.[0];
      if (!order) return json({ ok: false, error: "Order not found" }, { status: 404 });
      const itemsRes = await env.DB.prepare(
        `SELECT product_name, variant_text, qty, unit_price, line_total
           FROM order_items
           WHERE order_no = ?
           ORDER BY id ASC`
      ).bind(orderNo).all();
      return json({
        ok: true,
        order,
        items: itemsRes.results ?? []
      });
    }
    return json({ ok: false, error: "Not Found" }, { status: 404 });
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
