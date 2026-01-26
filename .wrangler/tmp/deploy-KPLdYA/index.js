var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/index.ts
function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
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
var index_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return json({ ok: true });
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
      for (const it of body.items) {
        await env.DB.prepare(
          `INSERT INTO order_items
            (order_no, product_name, variant_text, qty, unit_price, line_total)
            VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          orderNo,
          it.productName,
          it.specs.join(" / "),
          it.qty,
          it.unitPrice,
          it.subtotal
        ).run();
      }
      return json({ ok: true, orderNo });
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
