export interface Env {
  DB: D1Database
  ALLOWED_ORIGINS: string
  CF_ACCESS_AUD?: string
  CF_ACCESS_TEAM_DOMAIN?: string
  DEV_BYPASS_ACCESS?: string
  ENVIRONMENT?: string
}

const MAX_NAME = 100
const MAX_PHONE = 20
const MAX_STORE_NO = 20
const MAX_STORE_NAME = 200
const MAX_STORE_ADDRESS = 300
const MAX_ITEMS = 50
const MAX_ITEM_NAME = 200
const MAX_ITEM_SPECS = 500
const RATE_LIMIT_ORDERS = 10
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_ORDER_QUERY = 30
const RATE_LIMIT_ORDER_QUERY_WINDOW_MS = 60_000
const RATE_LIMIT_ADMIN = 100
const RATE_LIMIT_ADMIN_WINDOW_MS = 60_000

function corsHeaders(origin: string | null, allowed: string): Record<string, string> {
  const allowList = allowed.split(",").map((s) => s.trim()).filter(Boolean)
  const allowOrigin = origin && allowList.includes(origin) ? origin : (allowList.includes("*") ? "*" : "")
  const h: Record<string, string> = {
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,idempotency-key",
    "access-control-max-age": "86400",
    "vary": "origin",
  }
  if (allowOrigin) h["access-control-allow-origin"] = allowOrigin
  return h
}

function json(
  data: unknown,
  init: ResponseInit & { origin?: string | null; allowedOrigins?: string } = {}
) {
  const { origin, allowedOrigins, ...rest } = init as ResponseInit & { origin?: string | null; allowedOrigins?: string }
  const cors = allowedOrigins ? corsHeaders(origin ?? null, allowedOrigins) : {}
  return new Response(JSON.stringify(data, null, 2), {
    ...rest,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...cors,
      ...(rest.headers as Record<string, string>),
    },
  })
}

function html(
  body: string,
  init: ResponseInit & { origin?: string | null; allowedOrigins?: string } = {}
) {
  const { origin, allowedOrigins, ...rest } = init as ResponseInit & { origin?: string | null; allowedOrigins?: string }
  const cors = allowedOrigins ? corsHeaders(origin ?? null, allowedOrigins) : {}
  return new Response(body, {
    ...rest,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...cors,
      ...(rest.headers as Record<string, string>),
    },
  })
}

function safeError(msg: string) {
  return { error: msg }
}

function getClientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "0.0.0.0"
}

async function simpleHash(s: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(s)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32)
}

async function checkRateLimit(
  db: D1Database,
  category: string,
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean }> {
  const keyHash = await simpleHash(key)
  const now = new Date().toISOString()

  const existing = await db.prepare(
    `SELECT id, count, window_start FROM abuse_logs
     WHERE category = ? AND key_hash = ?
     ORDER BY id DESC LIMIT 1`
  )
    .bind(category, keyHash)
    .first<{ id: number; count: number; window_start: string }>()

  if (!existing) {
    await db.prepare(
      `INSERT INTO abuse_logs (category, key_hash, count, window_start) VALUES (?, ?, 1, ?)`
    )
      .bind(category, keyHash, now)
      .run()
    return { allowed: true }
  }

  const ws = new Date(existing.window_start).getTime()
  if (Date.now() - ws > windowMs) {
    await db.prepare(
      `INSERT INTO abuse_logs (category, key_hash, count, window_start) VALUES (?, ?, 1, ?)`
    )
      .bind(category, keyHash, now)
      .run()
    return { allowed: true }
  }

  if (existing.count >= limit) return { allowed: false }

  await db.prepare(`UPDATE abuse_logs SET count = count + 1 WHERE id = ?`).bind(existing.id).run()
  return { allowed: true }
}

type OrderBody = {
  name?: unknown
  phone?: unknown
  storeNo?: unknown
  storeName?: unknown
  storeAddress?: unknown
  amount?: unknown
  items?: unknown
  turnstileToken?: unknown
}

function validateOrderBody(
  body: unknown,
  skipTurnstile = false
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" }
  const b = body as Record<string, unknown>

  const allowed = new Set(["name", "phone", "storeNo", "storeName", "storeAddress", "amount", "items", "turnstileToken"])
  for (const k of Object.keys(b)) {
    if (!allowed.has(k)) return { ok: false, error: "Unknown field" }
  }

  const name = typeof b.name === "string" ? b.name.trim() : ""
  if (!name || name.length > MAX_NAME) return { ok: false, error: "Invalid name" }

  const phone = typeof b.phone === "string" ? b.phone.trim() : ""
  if (!/^09\d{8}$/.test(phone)) return { ok: false, error: "Invalid phone" }

  const storeNo = typeof b.storeNo === "string" ? b.storeNo.trim() : ""
  if (!storeNo || storeNo.length > MAX_STORE_NO) return { ok: false, error: "Invalid storeNo" }

  const storeName = typeof b.storeName === "string" ? b.storeName.trim() : ""
  if (!storeName || storeName.length > MAX_STORE_NAME) return { ok: false, error: "Invalid storeName" }

  const storeAddress = typeof b.storeAddress === "string" ? b.storeAddress.trim() : ""
  if (storeAddress.length > MAX_STORE_ADDRESS) return { ok: false, error: "Invalid storeAddress" }

  const amount =
    typeof b.amount === "number" && Number.isInteger(b.amount) && b.amount >= 0
      ? b.amount
      : typeof b.amount === "string"
        ? parseInt(b.amount, 10)
        : NaN
  if (isNaN(amount) || amount < 0 || amount > 99999999) return { ok: false, error: "Invalid amount" }

  const items = Array.isArray(b.items) ? b.items : []
  if (items.length === 0 || items.length > MAX_ITEMS) return { ok: false, error: "Invalid items" }

  const turnstileToken = typeof b.turnstileToken === "string" ? b.turnstileToken.trim() : ""
  if (!skipTurnstile && !turnstileToken) return { ok: false, error: "Turnstile required" }

  const validatedItems: { productName: string; variant_text: string; qty: number; unitPrice: number; subtotal: number }[] = []
  for (const it of items) {
    if (!it || typeof it !== "object") return { ok: false, error: "Invalid item" }
    const i = it as Record<string, unknown>
    const productName = typeof i.productName === "string" ? i.productName.trim().slice(0, MAX_ITEM_NAME) : ""
    const specs = Array.isArray(i.specs) ? i.specs.map(String).join(" / ").slice(0, MAX_ITEM_SPECS) : ""
    const qty = typeof i.qty === "number" ? Math.floor(i.qty) : parseInt(String(i.qty ?? 0), 10)
    const unitPrice = typeof i.unitPrice === "number" ? Math.floor(i.unitPrice) : parseInt(String(i.unitPrice ?? 0), 10)
    const subtotal = typeof i.subtotal === "number" ? Math.floor(i.subtotal) : parseInt(String(i.subtotal ?? 0), 10)
    if (!productName || qty < 1 || unitPrice < 0 || subtotal < 0) return { ok: false, error: "Invalid item" }
    validatedItems.push({ productName, variant_text: specs, qty, unitPrice, subtotal })
  }

  return {
    ok: true,
    data: {
      name,
      phone,
      storeNo,
      storeName,
      storeAddress,
      amount,
      items: validatedItems,
      turnstileToken,
    },
  }
}

function base64UrlToBuf(s: string): ArrayBuffer {
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/")
  const pad = base64.length % 4
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function verifyAccessJwt(jwt: string | null, teamDomain: string | undefined, aud: string | undefined): Promise<boolean> {
  if (!jwt || !teamDomain || !aud) return false
  try {
    const [headerB64, payloadB64] = jwt.split(".")
    if (!headerB64 || !payloadB64) return false

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))) as { aud?: string[]; exp?: number }
    if (!payload.aud?.includes(aud)) return false
    if (payload.exp && payload.exp * 1000 < Date.now()) return false

    const jwksRes = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`)
    const jwks = (await jwksRes.json()) as { keys?: { kid?: string; n?: string; e?: string }[] }

    const header = JSON.parse(atob(headerB64.replace(/-/g, "+").replace(/_/g, "/"))) as { kid?: string; alg?: string }
    const key = jwks.keys?.find((k) => k.kid === header.kid)
    if (!key?.n || !key?.e) return false

    const publicKey = await crypto.subtle.importKey(
      "jwk",
      { kty: "RSA", n: key.n, e: key.e, alg: "RS256" },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    )

    const sigPart = jwt.split(".").slice(0, 2).join(".")
    const sig = base64UrlToBuf(jwt.split(".")[2] ?? "")
    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      sig,
      new TextEncoder().encode(sigPart)
    )
  } catch {
    return false
  }
}

function isLocalHost(url: URL): boolean {
  const h = url.hostname.toLowerCase()
  return h === "localhost" || h === "127.0.0.1"
}

function canBypass(req: Request, env: Env): boolean {
  const envName = (env.ENVIRONMENT ?? "").toLowerCase()
  if (envName === "staging" || envName === "production") return false
  const url = new URL(req.url)
  if (!isLocalHost(url)) return false
  if (url.protocol !== "http:") return false
  const bypass = (env.DEV_BYPASS_ACCESS ?? "").trim().toLowerCase()
  return bypass === "true" || bypass === "1"
}

async function requireAccessAsync(req: Request, env: Env, allowedOrigins: string, origin: string | null): Promise<Response | null> {
  // local: skip Access
  if ((env.ENVIRONMENT ?? "").toLowerCase() === "local") return null
  // dev on localhost: allow bypass if configured
  if (canBypass(req, env)) return null

  const jwt = req.headers.get("cf-access-jwt-assertion")
  if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD) {
    return json(safeError("Access not configured"), { status: 503, allowedOrigins, origin })
  }
  if (!jwt) {
    return json(safeError("Cloudflare Access required"), { status: 401, allowedOrigins, origin })
  }
  const valid = await verifyAccessJwt(jwt, env.CF_ACCESS_TEAM_DOMAIN, env.CF_ACCESS_AUD)
  if (!valid) {
    return json(safeError("Invalid Access token"), { status: 401, allowedOrigins, origin })
  }
  return null
}

function parseOrderNoFromPath(pathname: string, prefix: string): string {
  const raw = pathname.slice(prefix.length)
  const cleaned = raw.replace(/^\/+/, "").trim()
  return cleaned ? decodeURIComponent(cleaned.split("/")[0]) : ""
}

async function safeJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    return null
  }
}

async function logAudit(db: D1Database, action: string, targetType?: string, targetId?: string, ip?: string) {
  await db.prepare(
    `INSERT INTO audit_logs (action, target_type, target_id, ip) VALUES (?, ?, ?, ?)`
  )
    .bind(action, targetType ?? null, targetId ?? null, ip ?? null)
    .run()
}

const ADMIN_HTML = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
  <title>MEME後台</title>
  <style>
    :root {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --bg-soft: #dfe7ef;
      --bg-card: rgba(255, 255, 255, 0.28);
      --border: rgba(255, 255, 255, 0.42);
      --border-focus: rgba(108, 168, 255, 0.62);
      --text: #25354a;
      --text-muted: #5d6f86;
      --radius: 18px;
      --radius-lg: 24px;
      --shadow-sm: 0 6px 18px rgba(28, 58, 91, 0.12);
      --shadow: 0 14px 32px rgba(25, 51, 82, 0.18);
      --shadow-lg: 0 20px 42px rgba(28, 61, 96, 0.22);
      --inner-glow: inset 0 1px 0 rgba(255, 255, 255, 0.78), inset 0 -1px 0 rgba(255, 255, 255, 0.32);
      --transition: 0.26s ease;
      --mobile-pad: 12px;
    }
    * { box-sizing: border-box; }
    html { overflow-x: hidden; width: 100%; }
    body {
      width: 100%;
      overflow-x: hidden;
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at 12% 15%, rgba(169, 205, 255, 0.58) 0%, rgba(169, 205, 255, 0.12) 26%, transparent 56%),
        radial-gradient(circle at 88% 18%, rgba(251, 209, 224, 0.48) 0%, rgba(251, 209, 224, 0.12) 29%, transparent 56%),
        radial-gradient(circle at 55% 85%, rgba(197, 233, 255, 0.35) 0%, rgba(197, 233, 255, 0.1) 38%, transparent 68%),
        linear-gradient(160deg, #d9e3ed 0%, #e7eef6 38%, #edf2f7 100%);
      color: var(--text);
      padding-bottom: 40px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    header {
      position: sticky; top: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.24);
      border-bottom: 1px solid rgba(255, 255, 255, 0.52);
      box-shadow: var(--shadow-sm);
      backdrop-filter: blur(30px) saturate(1.3);
      -webkit-backdrop-filter: blur(30px) saturate(1.3);
    }
    .wrap { width: 100%; max-width: 1100px; margin: 0 auto; padding: 20px; position: relative; z-index: 1; }
    .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .header-inner { padding-top: 12px; padding-bottom: 10px; transition: max-height .26s ease, opacity .22s ease, transform .22s ease, padding .22s ease; max-height: 110px; overflow: hidden; }
    .header-main { justify-content: space-between; flex-wrap: nowrap; }
    .header-left { display: flex; align-items: center; min-width: 0; }
    .header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; }
    .header-toggle-row { margin-top: 6px; justify-content: center; }
    .pull-toggle {
      min-height: 28px;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 12px;
      color: #304967;
      background: linear-gradient(165deg, rgba(255, 255, 255, 0.54) 0%, rgba(236, 246, 255, 0.30) 100%);
      border: 1px solid rgba(255,255,255,0.5);
    }
    body.header-collapsed .header-inner { max-height: 36px; padding-top: 4px; padding-bottom: 4px; }
    body.header-collapsed .header-main { opacity: 0; transform: translateY(-10px); pointer-events: none; height: 0; overflow: hidden; }
    .card {
      background: linear-gradient(170deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.22) 100%);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow), var(--inner-glow);
      transition: var(--transition);
      backdrop-filter: blur(30px) saturate(1.2);
      -webkit-backdrop-filter: blur(30px) saturate(1.2);
    }
    .card:hover { box-shadow: var(--shadow-lg); }
    .card-header { border-bottom: 1px solid var(--border); }
    .pad { padding: 18px; }

    input, button, select { font: inherit; transition: var(--transition); }

    /* ==== FIX: input 疊影（移除二次 blur） ==== */
    input {
      padding: 12px 16px;
      width: 320px;
      border: 1px solid rgba(255, 255, 255, 0.55);
      border-radius: var(--radius);
      background: rgba(255,255,255,0.72);
      color: var(--text);
      box-shadow: inset 0 2px 6px rgba(92, 116, 144, 0.12), 0 8px 20px rgba(44, 71, 105, 0.10);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      filter: none;
      text-shadow: none;
    }
    input::placeholder { color: rgba(93, 111, 134, 0.7); text-shadow: none; }
    input:focus {
      outline: none;
      border-color: var(--border-focus);
      background: rgba(255,255,255,0.86);
      box-shadow: 0 0 0 3px rgba(93, 163, 255, 0.18), 0 12px 26px rgba(72, 129, 196, 0.16);
    }

    button {
      position: relative;
      overflow: hidden;
      padding: 11px 16px;
      border: 1px solid rgba(255, 255, 255, 0.32);
      border-radius: var(--radius);
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.02em;
      background: linear-gradient(165deg, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.22) 100%);
      color: #2e3d54;
      transition: 0.24s ease;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.84),
        inset 0 -1px 0 rgba(255, 255, 255, 0.24),
        0 10px 20px rgba(52, 87, 129, 0.2),
        0 2px 6px rgba(52, 87, 129, 0.12);
      backdrop-filter: blur(26px) saturate(1.25);
      -webkit-backdrop-filter: blur(26px) saturate(1.25);
    }
    button::before {
      content: "";
      position: absolute;
      left: 8px;
      right: 8px;
      top: 3px;
      height: 36%;
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0));
      pointer-events: none;
    }
    button:hover { transform: translateY(-1px) scale(1.01); }
    button:active { transform: scale(0.96); }

    button.primary {
      background: linear-gradient(165deg, rgba(103, 178, 255, 0.7) 0%, rgba(99, 137, 255, 0.58) 50%, rgba(120, 109, 255, 0.52) 100%);
      color: #f7fbff;
      border-color: rgba(220, 237, 255, 0.5);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.66),
        inset 0 -1px 0 rgba(173, 211, 255, 0.34),
        0 12px 26px rgba(74, 138, 235, 0.34),
        0 4px 10px rgba(74, 138, 235, 0.22);
    }

    button.danger { background: linear-gradient(165deg, rgba(255, 182, 166, 0.66) 0%, rgba(255, 128, 114, 0.52) 100%); color: #912f28; }
    button.ok { background: linear-gradient(165deg, rgba(126, 226, 179, 0.72) 0%, rgba(62, 197, 150, 0.58) 100%); color: #fff; }
    button.soft {
      background: linear-gradient(165deg, rgba(188, 216, 255, 0.62) 0%, rgba(209, 191, 255, 0.48) 100%);
      color: #244667;
      border-color: rgba(228, 239, 255, 0.62);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.75),
        inset 0 -1px 0 rgba(180, 202, 234, 0.35),
        0 10px 20px rgba(93, 128, 189, 0.2),
        0 4px 10px rgba(93, 128, 189, 0.12);
    }

    .muted { color: var(--text-muted); font-size: 13px; text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35); }
    .grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 16px; margin-top: 16px; width: 100%; position: relative; z-index: 1; }
    .card { width: 100%; min-width: 0; }
    @media (max-width: 980px){ .grid { grid-template-columns: 1fr; } input { width: 100%; } }

    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
    th {
      font-size: 12px;
      color: #5f748f;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.48), rgba(255, 255, 255, 0.22));
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    tbody tr { transition: var(--transition); cursor: pointer; }
    tbody tr:hover td { background: rgba(255, 255, 255, 0.3); }
    #list td { padding-top: 8px; padding-bottom: 8px; }
    .order-no-cell { width: 126px; max-width: 126px; }
    .order-no-text {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      line-height: 1.22;
      font-size: 13px;
      word-break: break-all;
    }
    .status-cell .pill {
      padding: 3px 8px;
      font-size: 12px;
      line-height: 1.15;
      border-radius: 7px;
      white-space: nowrap;
    }
    .recipient-cell { min-width: 0; }
    .recipient-main,
    .recipient-store {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.2;
      word-break: break-word;
    }
    .recipient-main {
      -webkit-line-clamp: 1;
      font-size: 13px;
      color: #2b3f57;
    }
    .recipient-store {
      -webkit-line-clamp: 1;
      margin-top: 2px;
      font-size: 12px;
    }
    .item-metrics {
      margin-top: 4px;
      line-height: 1.32;
      font-size: 13px;
    }
    .item-metric-value {
      color: #c5352d;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.01em;
    }

    .pill { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; border: 1px solid transparent; transition: var(--transition); }
    .pill.pending { background: rgba(255, 225, 122, 0.36); color: #8a6901; border-color: rgba(255, 235, 166, 0.62); }
    .pill.shipped { background: rgba(117, 234, 183, 0.32); color: #0f7e4f; border-color: rgba(173, 248, 218, 0.58); }
    .pill.cancelled { background: rgba(255, 161, 154, 0.34); color: #9c2c24; border-color: rgba(255, 207, 201, 0.62); }
    .pill.deleted { background: rgba(205, 218, 235, 0.42); color: #55697f; border-color: rgba(235, 242, 251, 0.58); }

    .k { font-size: 12px; color: var(--text-muted); }
    .v { font-weight: 500; }
    .mono { font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace; }

    .toast {
      position: fixed; right: 20px; bottom: 24px;
      background: linear-gradient(170deg, rgba(42, 60, 84, 0.88), rgba(34, 48, 68, 0.78));
      color: #eef6ff;
      padding: 14px 20px;
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      opacity: 0;
      transform: translateY(12px);
      transition: var(--transition);
      font-size: 14px;
    }
    .toast.show { opacity: 1; transform: translateY(0); }

    .btnbar { display: grid; gap: 10px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 12px; width: 100%; align-items: stretch; }
    .btnbar button { width: 100%; min-width: 0; min-height: 46px; white-space: nowrap; padding: 10px 12px; font-size: 14px; }
    .btnbar-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

    .box {
      background: linear-gradient(170deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.22) 100%);
      border: 1px solid rgba(255, 255, 255, 0.42);
      border-radius: var(--radius);
      padding: 14px 16px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55), 0 8px 20px rgba(48, 76, 110, 0.1);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
    }
    .hr { height: 1px; background: var(--border); margin: 14px 0; }

    .row2 { display:flex; gap:12px; flex-wrap:nowrap; align-items:center; justify-content:space-between; position: relative; z-index: 120; }
    .row2-filters { display:flex; gap:12px; flex-wrap:nowrap; align-items:center; overflow-x:auto; }
    .quick-status { display:inline-flex; align-items:center; gap:6px; margin-left: 2px; }
    .quick-status .muted.small { white-space: nowrap; }
    .quick-status .custom-select.compact { min-width: 98px; width: 98px; flex: 0 0 auto; }
    .quick-status .custom-select-trigger.compact {
      min-height: 34px;
      padding: 6px 26px 6px 8px;
      font-size: 12px;
      border-radius: 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      background-position: right 10px center;
    }

    .custom-select { position: relative; min-width: 140px; z-index: 180; }
    .custom-select.open { z-index: 260; }
    .custom-select-trigger {
      width: 100%;
      padding: 12px 36px 12px 16px;
      border: 1px solid rgba(255, 255, 255, 0.38);
      border-radius: var(--radius);
      background: linear-gradient(165deg, rgba(255, 255, 255, 0.48), rgba(255, 255, 255, 0.24));
      color: var(--text);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      text-align: left;
      transition: 0.24s ease;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.85), 0 10px 20px rgba(53, 82, 120, 0.14), 0 3px 8px rgba(53, 82, 120, 0.1);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7c93' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
    }
    .custom-select-dropdown {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      min-width: 100%;
      white-space: nowrap;
      background: linear-gradient(170deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.48));
      border: 1px solid rgba(255,255,255,0.62);
      border-top: none;
      border-radius: 0 0 var(--radius) var(--radius);
      box-shadow: 0 18px 30px rgba(39, 71, 108, 0.18), 0 3px 10px rgba(39, 71, 108, 0.1);
      z-index: 420;
      overflow: hidden;
      backdrop-filter: blur(28px) saturate(1.2);
      -webkit-backdrop-filter: blur(28px) saturate(1.2);
      color: var(--text);
    }
    .custom-select.open .custom-select-dropdown { display: block; animation: fadeInUp .22s ease; }
    .custom-select-option { padding: 12px 16px; cursor: pointer; font-size: 14px; transition: 0.15s ease; color: var(--text); }
    .custom-select-option:hover, .custom-select-option.selected { background: linear-gradient(170deg, rgba(123, 172, 255, 0.26), rgba(147, 191, 255, 0.18)); color: #1f2f45; }

    #filterCard { position: relative; z-index: 160; }
    #adminContent { display: none; }
    #adminContent.visible { display: block; }

    @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    /* ===== Modal / Overlay ===== */
    body.modal-open { overflow: hidden; touch-action: manipulation; }
    #adminContent.locked { filter: blur(10px) saturate(1.05); transform: translateZ(0); pointer-events: none; user-select: none; }
    #adminContent.locked * { pointer-events: none !important; }

    #loginOverlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: max(16px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom));
      background:
        radial-gradient(circle at 20% 10%, rgba(160,210,255,0.30), transparent 55%),
        radial-gradient(circle at 90% 20%, rgba(255,190,220,0.22), transparent 60%),
        rgba(10, 16, 24, 0.28);
      backdrop-filter: blur(18px) saturate(1.2);
      -webkit-backdrop-filter: blur(18px) saturate(1.2);
    }
    #loginOverlay.show { display: flex; animation: overlayIn .22s ease both; }
    #gameOverlay {
      position: fixed;
      inset: 0;
      z-index: 9900;
      display: none;
      align-items: center;
      justify-content: center;
      padding: max(16px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom));
      background:
        radial-gradient(circle at 25% 10%, rgba(161,216,255,0.28), transparent 56%),
        radial-gradient(circle at 86% 22%, rgba(254,196,220,0.24), transparent 58%),
        rgba(10, 16, 24, 0.30);
      backdrop-filter: blur(16px) saturate(1.15);
      -webkit-backdrop-filter: blur(16px) saturate(1.15);
    }
    #gameOverlay.show { display: flex; animation: overlayIn .22s ease both; }
    .game-modal {
      width: 100%;
      max-width: 440px;
      border-radius: 24px;
      padding: 16px;
      background: linear-gradient(165deg, rgba(255,255,255,0.38), rgba(255,255,255,0.18));
      border: 1px solid rgba(255,255,255,0.42);
      box-shadow: 0 20px 48px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.72);
      backdrop-filter: blur(24px) saturate(1.2);
      -webkit-backdrop-filter: blur(24px) saturate(1.2);
    }
    .game-top { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .game-title { font-weight: 800; font-size: 18px; letter-spacing: -0.02em; }
    .game-sub { margin-top: 4px; color: var(--text-muted); font-size: 13px; }
    .game-actions { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
    .game-actions button { min-height: 42px; }
    #gameResult {
      margin-top: 12px;
      min-height: 50px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.46);
      background: linear-gradient(165deg, rgba(255,255,255,0.38), rgba(255,255,255,0.2));
      color: var(--text);
      font-size: 13px;
      display: flex;
      align-items: center;
      line-height: 1.4;
    }
    @keyframes overlayIn { from{ opacity:0 } to{ opacity:1 } }

    .login-shell { width: 100%; max-width: 420px; position: relative; }
    .login-stack { position: absolute; inset: 0; border-radius: 28px; transform: translateY(10px) scale(0.98); filter: blur(0.2px); opacity: 0.95; pointer-events: none; }
    .login-stack.stack-1 { background: linear-gradient(165deg, rgba(255,255,255,0.18), rgba(255,255,255,0.10)); border: 1px solid rgba(255,255,255,0.24); transform: translateY(14px) rotate(-1.2deg) scale(0.985); }
    .login-stack.stack-2 { background: linear-gradient(165deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08)); border: 1px solid rgba(255,255,255,0.18); transform: translateY(22px) rotate(1.4deg) scale(0.975); }

    .login-modal {
      position: relative;
      border-radius: 28px;
      padding: 18px;
      background: linear-gradient(165deg, rgba(255,255,255,0.38), rgba(255,255,255,0.18));
      border: 1px solid rgba(255,255,255,0.42);
      box-shadow: 0 22px 60px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.72);
      backdrop-filter: blur(26px) saturate(1.2);
      -webkit-backdrop-filter: blur(26px) saturate(1.2);
      transform: translateY(6px);
      animation: modalIn .22s ease both;
    }
    @keyframes modalIn { from{ opacity:0; transform: translateY(14px) scale(0.98) } to{ opacity:1; transform: translateY(0) scale(1) } }

    .login-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .login-title { font-weight: 800; font-size: 18px; letter-spacing: -0.02em; }
    .login-sub { margin-top: 6px; color: var(--text-muted); font-size: 13px; }
    .login-form { margin-top: 14px; display: grid; gap: 10px; }
    .login-form input { width: 100%; min-height: 46px; }
    .login-actions { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 4px; }
    .login-x { width: 38px; height: 38px; display: inline-flex; align-items:center; justify-content:center; border-radius: 999px; border: 1px solid rgba(255,255,255,0.30); background: rgba(255,255,255,0.18); cursor: pointer; }
    .login-x:hover { background: rgba(255,255,255,0.28); }
    #loginErr { color: #b3261e; font-size: 13px; min-height: 18px; }
    html, body { overscroll-behavior: none; }

    /* ===== FIX: 登入視窗重影（iOS/Safari blur 疊加）===== */
    @media (max-width: 640px) {
      /* 1) overlay 不要 blur，不要透明疊加 */
      #loginOverlay {
        -webkit-backdrop-filter: none !important;
        backdrop-filter: none !important;
        background: rgba(10, 16, 24, 0.55) !important;
      }

      /* 2) 取消 login stack 兩層玻璃（它們是重影主因） */
      .login-stack { display: none !important; }

      /* 3) modal 改成實心卡片（不透明） */
      .login-modal {
        -webkit-backdrop-filter: none !important;
        backdrop-filter: none !important;
        filter: none !important;
        background: #f7f9fc !important;
        border: 1px solid rgba(15, 23, 42, 0.12) !important;
        box-shadow: 0 18px 40px rgba(0,0,0,0.28) !important;
      }

      /* 4) 所有文字/按鈕禁用 text-shadow（避免字變雙層） */
      .login-modal, .login-modal * {
        text-shadow: none !important;
        filter: none !important;
      }

      /* 5) input 也要實心（不要 blur/漸層透明） */
      .login-form input {
        -webkit-backdrop-filter: none !important;
        backdrop-filter: none !important;
        background: #ffffff !important;
        border: 1px solid rgba(15, 23, 42, 0.14) !important;
        box-shadow: 0 6px 14px rgba(15, 23, 42, 0.10) !important;
        color: #0f172a !important;
      }
      .login-form input::placeholder { color: rgba(15, 23, 42, 0.45) !important; }

      /* 6) 按鈕也改清楚、可點（人體工學） */
      .login-actions button.primary {
        min-height: 48px !important;
        border-radius: 14px !important;
        -webkit-backdrop-filter: none !important;
        backdrop-filter: none !important;
        box-shadow: 0 10px 18px rgba(37, 99, 235, 0.22) !important;
      }

      /* 7) 關閉鈕更明顯 */
      .login-x {
        background: #ffffff !important;
        border: 1px solid rgba(15, 23, 42, 0.14) !important;
      }
    }

    /* ===== Mobile scroll fix: page scroll + list/detail independent ===== */
    @media (max-width: 640px) {
      /* 1) 允許整頁垂直滾動 */
      html, body {
        height: auto !important;
        overflow-y: auto !important;
        overscroll-behavior-y: auto !important;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
      }

      /* 2) 登入遮罩關閉後，確保 body 不再被鎖 */
      body.modal-open { overflow: hidden !important; } /* 只在登入遮罩開啟時鎖 */
      #loginOverlay:not(.show) { pointer-events: none; } /* 避免透明層吃滑動 */

      /* 3) 讓訂單列表卡 / 詳情卡各自可滑（不影響其他區） */
      section.card, aside.card { min-height: 0; } /* 讓內部 overflow 生效 */

      /* 列表區：固定高度可滑 */
      section.card .pad[style*="padding-top:0"] {
        max-height: 44vh;
        overflow: auto;
        -webkit-overflow-scrolling: touch;
      }

      /* 詳情區：固定高度可滑 */
      #detail {
        max-height: 42vh;
        overflow: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 12px;
      }
    }

    /* ===== Overflow fix: order_no / long text ===== */
    @media (max-width: 640px) {
      .mono, td, .v {
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
      }

      /* 表格改成可橫向滑，避免欄位擠爆 */
      section.card table {
        min-width: 520px;
      }
      section.card .pad[style*="padding-top:0"] {
        overflow-x: auto;
      }
    }

    /* ===== Button ergonomics ===== */
    @media (max-width: 640px) {
      .btnbar { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
      .btnbar button {
        min-height: 48px !important;
        font-size: 14px !important;
        padding: 12px 12px !important;
        border-radius: 14px !important;
      }
      /* 刪除按鈕一欄獨占，避免誤觸 */
      #delOrder { grid-column: 1 / -1; }
    }

    @media (max-width: 640px) {
      #quickDates .qd {
        min-height: 40px;
        padding: 10px 12px;
        border-radius: 12px;
        background: #ffffff;
        border: 1px solid rgba(15,23,42,0.12);
        box-shadow: 0 4px 10px rgba(15,23,42,0.06);
        color: #0f172a;
        font-weight: 700;
      }
      #quickDates .qd.active {
        background: rgba(37,99,235,0.12);
        border-color: rgba(37,99,235,0.35);
      }
    }

    /* ===== URGENT MOBILE UI FIX: 表格直排/擠壓 ===== */
    @media (max-width: 640px) {
      /* 1) 列表容器：可橫向滑動（避免欄位被硬擠成直排） */
      section.card .pad[style*="padding-top:0"]{
        overflow-x: auto !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch;
        max-height: 44vh;                 /* 列表區可滑 */
        padding-bottom: 8px;
      }

      /* 2) table 至少要有寬度，才會啟用橫滑 */
      section.card table{
        min-width: 560px !important;      /* 4 欄版面 */
        table-layout: auto !important;
      }

      /* 3) 表格內容：不要把數字/字拆成一個一行 */
      section.card th,
      section.card td{
        white-space: nowrap !important;   /* 關掉自動換行 */
        word-break: normal !important;
        overflow-wrap: normal !important;
        vertical-align: top;
      }

      /* 4) 只有訂單號允許換行（太長時），但不拆單字元 */
      section.card td.mono{
        white-space: normal !important;
        word-break: break-word !important;
        overflow-wrap: anywhere !important;
      }

      /* 5) 收件人欄：保持一行或兩行，不要直排 */
      section.card td:nth-child(3){
        white-space: normal !important;
        line-height: 1.22;
      }
      section.card td:nth-child(3) .muted.small{
        display: block;
        margin-top: 1px;
        white-space: normal !important;
      }

      /* 7) 上方篩選區：一律兩行排版，避免右側被擠出去 */
      .row2{ flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
      .row2 .row{ width: 100% !important; }
      .row2-filters{ width: 100% !important; flex-wrap: wrap !important; gap: 8px !important; justify-content: flex-start !important; }
      .custom-select{ flex: 1 1 160px !important; min-width: 160px !important; }
      .custom-select-trigger{ width: 100% !important; }

      /* 8) 卡片內留白縮小，讓可視區更多 */
      .pad{ padding: 10px !important; }
      section.card th, section.card td { padding: 7px 8px !important; }
      #list td { padding-top: 6px !important; padding-bottom: 6px !important; }
      .order-no-cell { width: 112px !important; max-width: 112px !important; }
      .order-no-text { font-size: 12px !important; line-height: 1.2 !important; }
      .status-cell .pill { font-size: 11px !important; padding: 2px 6px !important; }
      .recipient-main { font-size: 12px !important; }
      .recipient-store { font-size: 11px !important; margin-top: 1px !important; }
      .item-metrics { font-size: 12px !important; }
      .item-metric-value { font-size: 14px !important; }
    }

    /* ===== Compact filter bar (mobile-first) ===== */
    @media (max-width: 640px) {
      /* 整個 filter 卡縮小 */
      #filterCard .pad { padding: 12px !important; }

      /* 搜尋列保留一行 */
      #q { min-height: 40px !important; padding: 10px 12px !important; border-radius: 12px !important; }

      /* 下面的控制項：自動換行排整、但維持小尺寸 */
      .row2-filters {
        width: 100% !important;
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
        align-items: center !important;
      }

      /* 日期輸入（小小的） */
      .date-inline { display: inline-flex; align-items: center; gap: 6px; flex: 1 1 220px; }
      .date-input {
        min-height: 36px !important;
        padding: 8px 10px !important;
        border-radius: 12px !important;
        border: 1px solid rgba(15,23,42,0.14) !important;
        background: #fff !important;
        font-size: 13px !important;
        width: 100% !important;
        min-width: 0 !important;
      }
      .date-tilde { font-size: 12px; color: rgba(15,23,42,0.55); }

      /* 狀態下拉縮窄 */
      .custom-select.compact { min-width: 120px !important; flex: 0 0 auto !important; }
      .custom-select-trigger.compact {
        min-height: 36px !important;
        padding: 8px 32px 8px 10px !important;
        border-radius: 12px !important;
        font-size: 13px !important;
        background: #fff !important;
        border: 1px solid rgba(15,23,42,0.14) !important;
        box-shadow: 0 4px 10px rgba(15,23,42,0.06) !important;
      }

      /* Quick buttons 全部小尺寸 */
      #quickDates .qd {
        min-height: 34px !important;
        padding: 8px 10px !important;
        border-radius: 12px !important;
        font-size: 13px !important;
      }
      .header-actions button { min-height: 36px !important; padding: 8px 10px !important; }
      .quick-status { gap: 4px !important; margin-left: 0 !important; }
      .quick-status .custom-select.compact { min-width: 88px !important; width: 88px !important; }
      .quick-status .custom-select-trigger.compact {
        min-height: 34px !important;
        padding: 6px 24px 6px 8px !important;
        font-size: 12px !important;
      }
      .game-actions { grid-template-columns: 1fr !important; }
    }

    /* ===== Compact filter bar override ===== */
    #filterCard.pad {
      padding: 12px !important;
      border-radius: 20px;
    }
    #filterCard .row2 {
      gap: 8px !important;
      align-items: flex-start !important;
    }
    #filterCard .row {
      gap: 8px !important;
    }
    #filterCard #q {
      min-height: 36px;
      padding: 8px 12px;
      border-radius: 12px;
    }
    #filterCard #stat {
      font-size: 12px;
      line-height: 1.2;
    }
    #filterCard .row2-filters {
      gap: 6px !important;
      align-items: center !important;
      margin-top: 0 !important;
      flex-wrap: nowrap !important;
      overflow-x: auto;
      padding-bottom: 1px;
    }
    #filterCard .date-inline {
      gap: 4px;
      flex: 0 0 auto;
    }
    #filterCard .date-input {
      min-height: 34px !important;
      height: 34px;
      padding: 6px 8px !important;
      width: 112px !important;
      min-width: 112px !important;
      border-radius: 10px !important;
      font-size: 12px !important;
    }
    #filterCard .custom-select.compact {
      min-width: 96px !important;
      width: 96px;
    }
    #filterCard .custom-select-trigger.compact {
      min-height: 34px !important;
      padding: 6px 24px 6px 8px !important;
      border-radius: 10px !important;
      font-size: 12px !important;
      background-position: right 9px center;
    }
    #filterCard #quickDates {
      margin-top: 6px !important;
      gap: 6px !important;
    }
    #filterCard #quickDates .qd {
      min-height: 32px !important;
      padding: 6px 10px !important;
      border-radius: 10px !important;
      font-size: 12px !important;
      font-weight: 700;
    }
    #filterCard .muted.small {
      font-size: 12px;
      line-height: 1.2;
    }
    @media (max-width: 640px) {
      #filterCard.pad { padding: 10px !important; }
      #filterCard .row2 { gap: 6px !important; }
      #filterCard #q {
        min-height: 34px !important;
        padding: 7px 10px !important;
      }
      #filterCard .row2-filters {
        gap: 5px !important;
      }
      #filterCard .date-input {
        min-height: 32px !important;
        height: 32px;
        width: 106px !important;
        min-width: 106px !important;
      }
      #filterCard .custom-select.compact {
        min-width: 90px !important;
        width: 90px;
      }
      #filterCard .custom-select-trigger.compact {
        min-height: 32px !important;
        font-size: 12px !important;
      }
      #filterCard #quickDates {
        margin-top: 4px !important;
        gap: 5px !important;
      }
      #filterCard #quickDates .qd {
        min-height: 30px !important;
        padding: 5px 9px !important;
      }
    }

    /* ===== Final sync patch: desktop + mobile-first ===== */
    .grid {
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
      align-items: start;
    }
    section.card,
    aside.card {
      min-width: 0;
    }
    #filterCard .row,
    #filterCard .row2,
    #filterCard .row2-filters {
      min-width: 0;
    }
    #filterCard #q {
      flex: 1 1 280px;
      min-width: 200px;
      width: auto;
    }
    #filterCard #stat {
      white-space: nowrap;
    }

    @media (max-width: 960px) {
      .wrap { padding: 14px; }
      .grid { grid-template-columns: 1fr; }
      section.card .pad[style*="padding-top:0"],
      #detail {
        max-height: none;
      }
    }

    @media (max-width: 640px) {
      .wrap { padding: 10px !important; }
      .grid { gap: 10px !important; }
      .card { border-radius: 16px !important; }
      .pad { padding: 10px !important; }

      #filterCard #q {
        width: 100% !important;
        min-width: 0 !important;
        min-height: 40px !important;
        font-size: 14px !important;
      }
      #filterCard #stat {
        width: 100%;
        white-space: normal;
      }
      #filterCard .row2-filters {
        flex-wrap: wrap !important;
        overflow-x: visible !important;
      }
      #filterCard .date-inline {
        width: 100%;
      }
      #filterCard .date-input {
        flex: 1 1 0;
        width: auto !important;
        min-width: 0 !important;
      }
      #filterCard #quickDates {
        width: 100%;
      }
      #filterCard #quickDates .qd {
        min-height: 38px !important;
        font-size: 13px !important;
      }
      .header-actions button,
      .btnbar button,
      .login-actions button.primary,
      #filterCard .custom-select-trigger,
      #filterCard .custom-select-trigger.compact {
        min-height: 42px !important;
      }

      section.card table {
        min-width: 600px !important;
      }
      .order-no-cell { width: 120px !important; max-width: 120px !important; }
      .status-cell { width: 84px; }
      .time-cell { min-width: 118px; }
    }
  </style>
</head>
<body>
<header id="header">
  <div class="wrap header-inner" id="headerInner">
    <div class="row header-main">
      <div class="header-left">
        <div class="header-title" style="font-weight:600; font-size:17px; letter-spacing:-0.02em; color: var(--text);">MEME後台</div>
      </div>
      <div class="header-actions">
        <button id="refresh" class="primary">重新載入</button>
        <button id="playBtn" class="soft">按鈕</button>
      </div>
    </div>
    <div class="row header-toggle-row">
      <button id="pullToggle" class="pull-toggle" type="button" aria-expanded="true">上拉收合</button>
    </div>
  </div>
</header>

<main id="adminContent" class="wrap" style="width:100%;">
  <div class="card pad" id="filterCard">
    <div class="row2">
      <div class="row">
        <input id="q" placeholder="搜尋：訂單號 / 姓名 / 電話" />
        <span id="stat" class="muted"></span>
      </div>
      <div class="row row2-filters">
        <span class="muted small">日期：</span>
        <div class="date-inline">
          <input type="date" id="dateFrom" class="date-input" />
          <span class="date-tilde">～</span>
          <input type="date" id="dateTo" class="date-input" />
        </div>
      </div>
      <div class="row" id="quickDates" style="margin-top:10px; gap:8px; flex-wrap:wrap;">
        <button type="button" class="qd" data-days="0">今天</button>
        <button type="button" class="qd" data-days="1">昨天</button>
        <button type="button" class="qd" data-days="7">本週</button>
        <button type="button" class="qd" data-days="9999">全部</button>
        <div class="quick-status">
          <span class="muted small">狀態：</span>
          <div class="custom-select compact" id="viewModeWrap">
            <input type="hidden" id="viewMode" value="pending">
            <button type="button" class="custom-select-trigger compact" id="viewModeTrigger">待處理</button>
            <div class="custom-select-dropdown" id="viewModeDropdown">
              <div class="custom-select-option selected" data-value="pending">待處理</div>
              <div class="custom-select-option" data-value="shipped">已寄件</div>
              <div class="custom-select-option" data-value="deleted">已刪除</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="grid">
    <section class="card">
      <div class="pad card-header">
        <div style="font-weight:700; font-size:15px;">訂單列表</div>
        <div class="muted small">待確認會優先排序</div>
      </div>
      <div class="pad" style="padding-top:0;">
        <table>
          <thead>
            <tr>
              <th style="width:140px;">訂單號</th>
              <th style="width:90px;">狀態</th>
              <th>收件人</th>
              <th style="width:140px;">建立時間</th>
            </tr>
          </thead>
          <tbody id="list"></tbody>
        </table>
      </div>
    </section>

    <aside class="card">
      <div class="pad card-header">
        <div style="font-weight:700; font-size:15px;">訂單詳情</div>
        <div id="detailHint" class="muted small">點左邊一筆訂單查看</div>
      </div>
      <div class="pad" id="detail"></div>
    </aside>
  </div>
</main>

<div id="loginOverlay" aria-hidden="true">
  <div class="login-shell" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
    <div class="login-stack stack-2"></div>
    <div class="login-stack stack-1"></div>
    <div class="login-modal">
      <div class="login-top">
        <div>
          <div id="loginTitle" class="login-title">MEME 後台</div>
          <div class="login-sub">請輸入密碼以進入後台</div>
        </div>
        <button class="login-x" id="loginClose" type="button" aria-label="Close">✕</button>
      </div>

      <form id="loginForm" class="login-form">
        <input type="password" id="adminPw" placeholder="密碼" autocomplete="current-password" required />
        <div id="loginErr"></div>
        <div class="login-actions">
          <button type="submit" class="primary" style="width:100%; min-height:46px;">登入</button>
        </div>
      </form>

      <div class="muted small" style="margin-top:10px;">
        提示：若你已登入 Cloudflare Access，仍需輸入後台密碼才能讀取訂單。
      </div>
    </div>
  </div>
</div>

<div id="gameOverlay" aria-hidden="true">
  <div class="game-modal" role="dialog" aria-modal="true" aria-labelledby="gameTitle">
    <div class="game-top">
      <div>
        <div id="gameTitle" class="game-title">按鈕小遊戲</div>
        <div class="game-sub">剪刀石頭布，來一局。</div>
      </div>
      <button class="login-x" id="gameClose" type="button" aria-label="Close">✕</button>
    </div>
    <div class="game-actions">
      <button type="button" class="soft game-pick" data-pick="石頭">石頭</button>
      <button type="button" class="soft game-pick" data-pick="剪刀">剪刀</button>
      <button type="button" class="soft game-pick" data-pick="布">布</button>
    </div>
    <div id="gameResult">按下任一按鈕開始，看看今天手氣。</div>
  </div>
</div>

<div id="toast" class="toast"></div>

<script>
  const $ = (id) => document.getElementById(id);
  let currentOrderNo = '';
  function toast(msg){ const t = $('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1200); }
  const STATUS_ZH = { pending: '待確認', shipped: '已寄件', cancelled: '已取消', deleted: '已刪除' };
  function statusRank(s){ const x = (s || '').toLowerCase(); if (x === 'pending') return 0; if (x === 'shipped') return 1; if (x === 'cancelled') return 2; if (x === 'deleted') return 9; return 5; }
  function statusLabel(status){ return STATUS_ZH[(status || '').toLowerCase()] || (status || '-'); }
  function pill(status){ return '<span class="pill ' + (status || '').toLowerCase() + '">' + statusLabel(status) + '</span>'; }
  function fmtTime(v){ if (!v) return '-'; const d = new Date(v); return !isNaN(d.getTime()) ? d.toLocaleString() : String(v); }

  async function copyTextWithFallback(text){
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch {}
    try { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.focus(); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return !!ok; } catch { return false; }
  }

  async function api(path, opt = {}){
    const res = await fetch(path, {
      method: opt.method || 'GET',
      headers: opt.json ? { 'Content-Type': 'application/json' } : {},
      body: opt.json ? JSON.stringify(opt.json) : undefined,
      credentials: 'same-origin'
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!res.ok){ const err = new Error('HTTP ' + res.status); err.status = res.status; err.body = data; throw err; }
    return data;
  }

  function openLogin(){
    $('loginOverlay').classList.add('show');
    $('loginOverlay').setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    $('adminContent').classList.add('visible');
    $('adminContent').classList.add('locked');
    setTimeout(() => { try { $('adminPw').focus(); } catch {} }, 50);
  }
  function closeLogin(){
    $('loginOverlay').classList.remove('show');
    $('loginOverlay').setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    $('adminContent').classList.remove('locked');
  }
  function openGame(){
    $('gameOverlay').classList.add('show');
    $('gameOverlay').setAttribute('aria-hidden', 'false');
  }
  function closeGame(){
    $('gameOverlay').classList.remove('show');
    $('gameOverlay').setAttribute('aria-hidden', 'true');
  }
  const GAME_LINES = {
    win: [
      '漂亮！這拳有在讀心。',
      '你這不是猜，是預言。',
      'CPU：我剛剛是不是被教育了？',
      '贏得很乾淨，像剛洗完的鍵盤（騙人）。',
      '這一局我宣布你是手指界的 MVP。'
    ],
    lose: [
      '嗯…你剛剛那拳，連你自己都不信。',
      '別怕，輸給電腦不丟臉，丟臉的是我還在笑。',
      '你出那個，我都替你緊張。',
      'CPU：謝謝你送分。',
      '沒事，下一局我們假裝這局沒發生。'
    ],
    draw: [
      '同一個想法，同一個痛苦。',
      '你我都很穩，穩到不動。',
      '這局是「默契」，不是「技術」。',
      '平手：兩邊都不想先承認自己亂猜。'
    ]
  };
  function pickRandomLine(kind){
    const pool = GAME_LINES[kind] || [];
    if (!pool.length) return '';
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
  function isoDateStart(dStr){
    if (!dStr) return null;
    const d = new Date(dStr + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  function isoDateEnd(dStr){
    if (!dStr) return null;
    // end = 當天 23:59:59.999
    const d = new Date(dStr + 'T23:59:59.999');
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  function renderList(rows){
    const q = ($('q').value || '').trim().toLowerCase();
    const mode = $('viewMode').value || 'pending';
    const fromIso = isoDateStart($('dateFrom')?.value || '');
    const toIso = isoDateEnd($('dateTo')?.value || '');
    let filtered = rows || [];
    if (fromIso) filtered = filtered.filter(o => (o.created_at || '') >= fromIso);
    if (toIso) filtered = filtered.filter(o => (o.created_at || '') <= toIso);
    filtered = filtered.filter(o => String(o.status || '').toLowerCase() === mode);
    if (q) filtered = filtered.filter(o => String(o.order_no || '').toLowerCase().includes(q) || String(o.name || '').toLowerCase().includes(q) || String(o.phone || '').toLowerCase().includes(q));

    filtered.sort((a,b) => { const ra = statusRank(a.status), rb = statusRank(b.status); return ra !== rb ? ra - rb : String(b.created_at||'').localeCompare(String(a.created_at||'')); });

    const tbody = $('list');
    tbody.innerHTML = filtered.map(o => {
      const who = [o.name, o.phone].filter(Boolean).join(' / ') || '-';
      return '<tr data-order="' + escapeHtml(o.order_no) + '" style="cursor:pointer;"><td class="mono order-no-cell"><div class="order-no-text">' + escapeHtml(o.order_no) + '</div></td><td class="status-cell">' + pill(o.status) + '</td><td class="recipient-cell"><div class="recipient-main">' + escapeHtml(who) + '</div><div class="muted small recipient-store">' + escapeHtml(o.store_name || '') + '</div></td><td class="time-cell">' + escapeHtml(fmtTime(o.created_at)) + '</td></tr>';
    }).join('');

    $('stat').textContent = '顯示 ' + filtered.length + ' / ' + (rows||[]).length;

    Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
      tr.addEventListener('click', () => loadDetail(tr.getAttribute('data-order')));
    });
  }

  async function updateStatus(orderNo, nextStatus){
    if (!orderNo) return;
    await api('/api/admin/orders/' + encodeURIComponent(orderNo) + '/status', { method: 'PATCH', json: { status: nextStatus } });
  }
  async function deleteOrder(orderNo){
    if (!orderNo) return;
    await api('/api/admin/orders/' + encodeURIComponent(orderNo), { method: 'DELETE' });
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
    const itemsHtml = items.length
      ? items.map(it => '<div class="box item-box" style="margin-top:8px;"><div class="v">' + escapeHtml(it.product_name || '-') + '</div><div class="muted small">' + escapeHtml(it.variant_text || '') + '</div><div class="item-metrics">數量：<span class="item-metric-value">' + escapeHtml(it.qty) + '</span> / 單價：<span class="item-metric-value">' + escapeHtml(it.unit_price) + '</span> / 小計：<span class="item-metric-value">' + escapeHtml(it.line_total) + '</span></div></div>').join('')
      : '<div class="muted small">（無商品明細）</div>';

    const shipText =
      '訂單號：' + info.orderNo + '\\n狀態：' + statusLabel(info.status) + '\\n建立：' + fmtTime(info.createdAt) +
      '\\n收件人：' + info.name + '\\n電話：' + info.phone +
      '\\n7-11門市：' + info.storeName + '（' + info.storeNo + '）' +
      '\\n門市地址：' + info.storeAddress + '\\n金額：' + info.amount;

    const orderDate = info.createdAt
      ? (new Date(info.createdAt)).toLocaleDateString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit'})
      : '-';

    d.innerHTML =
      '<div class="box">' +
        '<div class="k">訂單號</div><div class="v mono">' + escapeHtml(info.orderNo) + '</div>' +
        '<div class="k" style="margin-top:6px;">狀態</div><div class="v">' + pill(info.status) + '</div>' +
        '<div class="k" style="margin-top:6px;">訂單日期</div><div class="v">' + escapeHtml(orderDate) + '</div>' +
        '<div class="k" style="margin-top:6px;">建立時間</div><div class="v">' + escapeHtml(fmtTime(info.createdAt)) + '</div>' +
        '<div class="hr"></div>' +
        '<div class="row op-row" style="justify-content: space-between;">' +
          '<div class="muted small">出貨操作</div>' +
          '<div class="row btnbar">' +
            '<button id="markShipped" class="ok">標記已寄件</button>' +
            '<button id="markPending">改回待確認</button>' +
            '<button id="delOrder" class="danger">刪除此訂單</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="box" style="margin-top:10px;">' +
        '<div class="k">收件人</div><div class="v">' + escapeHtml(info.name) + '</div>' +
        '<div class="k" style="margin-top:6px;">電話</div><div class="v mono">' + escapeHtml(info.phone) + '</div>' +
        '<div class="k" style="margin-top:6px;">門市</div><div class="v">' + escapeHtml(info.storeName) + ' <span class="muted small">(' + escapeHtml(info.storeNo) + ')</span></div>' +
        '<div class="k" style="margin-top:6px;">門市地址</div><div class="v">' + escapeHtml(info.storeAddress) + '</div>' +
        '<div class="k" style="margin-top:6px;">金額</div><div class="v">' + escapeHtml(info.amount) + '</div>' +
        '<div class="btnbar btnbar-2">' +
          '<button id="copyShip" class="primary">一鍵複製寄件資訊</button>' +
          '<button id="copyOrderNo">複製訂單號</button>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:10px;"><div style="font-weight:800; margin-bottom:6px;">商品明細</div>' + itemsHtml + '</div>';

    $('copyShip').addEventListener('click', async () => { const ok = await copyTextWithFallback(shipText); toast(ok ? '已複製寄件資訊' : '複製失敗'); });
    $('copyOrderNo').addEventListener('click', async () => { const ok = await copyTextWithFallback(info.orderNo); toast(ok ? '已複製訂單號' : '複製失敗'); });

    $('markShipped').addEventListener('click', async () => {
      try { await updateStatus(info.orderNo, 'shipped'); toast('已標記：已寄件'); await loadList(); await loadDetail(info.orderNo); }
      catch(e) { toast('操作失敗'); }
    });
    $('markPending').addEventListener('click', async () => {
      try { await updateStatus(info.orderNo, 'pending'); toast('已改回：待確認'); await loadList(); await loadDetail(info.orderNo); }
      catch(e) { toast('操作失敗'); }
    });
    $('delOrder').addEventListener('click', async () => {
      if (!confirm('確定要刪除此訂單嗎？')) return;
      try { await deleteOrder(info.orderNo); toast('已刪除'); currentOrderNo = ''; $('detail').innerHTML = '<div class="muted small">已刪除。</div>'; await loadList(); }
      catch(e) { toast('刪除失敗'); }
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
      $('detail').innerHTML = '<div class="muted small">無法載入（請先登入）</div>';
      if (e && e.status) toast('錯誤：HTTP ' + e.status); else toast('載入失敗');
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
    }
  }

  function initCustomSelect(wrapId, inputId, triggerId, dropdownId) {
    const wrap = $(wrapId);
    if (!wrap) return;
    const input = $(inputId);
    const trigger = $(triggerId);
    const dropdown = $(dropdownId);
    const options = dropdown?.querySelectorAll('.custom-select-option') || [];
    function close() { wrap.classList.remove('open'); }
    function select(val, label) {
      input.value = val;
      trigger.textContent = label;
      options.forEach(o => { o.classList.toggle('selected', o.dataset.value === val); });
      close();
      toast('已選取：' + label);
      loadList();
    }
    trigger.addEventListener('click', (e) => { e.stopPropagation(); wrap.classList.toggle('open'); });
    options.forEach(o => o.addEventListener('click', () => select(o.dataset.value, o.textContent)));
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(); });
  }

  function fmtDateInput(d){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + day;
  }

  function setDateRangePreset(preset){
    const today = new Date();
    today.setHours(0,0,0,0);

    let from = null, to = null;

    if (preset === 'today'){
      from = new Date(today);
      to = new Date(today);
    } else if (preset === 'yesterday'){
      from = new Date(today); from.setDate(from.getDate()-1);
      to = new Date(from);
    } else if (preset === 'week'){
      to = new Date(today);
      from = new Date(today); from.setDate(from.getDate()-6);
    } else if (preset === 'all'){
      from = null; to = null;
    }

    $('dateFrom').value = from ? fmtDateInput(from) : '';
    $('dateTo').value = to ? fmtDateInput(to) : '';

    loadList();
  }

  $('refresh').addEventListener('click', () => {
    toast('重新整理頁面中...');
    setTimeout(() => window.location.reload(), 120);
  });
  $('playBtn')?.addEventListener('click', () => {
    $('gameResult').textContent = '按下任一按鈕開始，看看今天手氣。';
    openGame();
  });
  $('pullToggle')?.addEventListener('click', () => {
    const collapsed = document.body.classList.toggle('header-collapsed');
    const txt = collapsed ? '下拉展開' : '上拉收合';
    $('pullToggle').textContent = txt;
    $('pullToggle').setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    toast(collapsed ? '已收合上方橫條' : '已展開上方橫條');
  });
  $('gameClose')?.addEventListener('click', () => closeGame());
  $('gameOverlay')?.addEventListener('click', (e) => { if (e.target === $('gameOverlay')) closeGame(); });
  document.querySelectorAll('.game-pick').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mine = btn.getAttribute('data-pick') || '';
      const options = ['石頭', '剪刀', '布'];
      const cpu = options[Math.floor(Math.random() * options.length)];
      let kind = 'draw';
      if (mine !== cpu) {
        const win =
          (mine === '石頭' && cpu === '剪刀') ||
          (mine === '剪刀' && cpu === '布') ||
          (mine === '布' && cpu === '石頭');
        kind = win ? 'win' : 'lose';
      }
      const line = pickRandomLine(kind);
      const title = kind === 'win' ? '你贏了' : kind === 'lose' ? '你輸了' : '平手';
      $('gameResult').textContent = '你出：' + mine + '｜CPU 出：' + cpu + '｜' + title + '。' + line;
    });
  });
  $('q').addEventListener('input', () => loadList());
  initCustomSelect('viewModeWrap', 'viewMode', 'viewModeTrigger', 'viewModeDropdown');
  document.querySelectorAll('#quickDates .qd').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#quickDates .qd').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const v = (btn.textContent || '').trim();
      if (v === '今天') setDateRangePreset('today');
      else if (v === '昨天') setDateRangePreset('yesterday');
      else if (v === '本週') setDateRangePreset('week');
      else setDateRangePreset('all');
    });
  });
  $('dateFrom')?.addEventListener('change', () => loadList());
  $('dateTo')?.addEventListener('change', () => loadList());

  // 預設：今天
  $('dateFrom').value = (new Date()).toISOString().slice(0,10);
  $('dateTo').value = (new Date()).toISOString().slice(0,10);
  document.querySelectorAll('#quickDates .qd').forEach((b) => b.classList.remove('active'));
  document.querySelector('#quickDates .qd[data-days="0"]')?.classList.add('active');

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = $('adminPw').value.trim();
    $('loginErr').textContent = '';
    try {
      const res = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
        credentials: 'same-origin'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { $('loginErr').textContent = data.error || '密碼錯誤'; return; }
      closeLogin();
      loadList();
    } catch { $('loginErr').textContent = '連線失敗'; }
  });

  $('loginClose')?.addEventListener('click', () => { toast('請先登入'); try { $('adminPw').focus(); } catch {} });
  $('loginOverlay')?.addEventListener('click', (e) => { if (e.target === $('loginOverlay')) { toast('請先登入'); try { $('adminPw').focus(); } catch {} } });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('gameOverlay')?.classList.contains('show')) { e.preventDefault(); closeGame(); return; }
    if (e.key === 'Escape' && $('loginOverlay')?.classList.contains('show')) { e.preventDefault(); toast('請先登入'); try { $('adminPw').focus(); } catch {} }
  });

  // 進頁面：固定先開登入遮罩（你要求的行為）
  $('adminContent').classList.add('visible');
  openLogin();
</script>
</body>
</html>`

export default {
  async fetch(req: Request, env: Env, ctx: unknown): Promise<Response> {
    void ctx
    const url = new URL(req.url)
    const origin = req.headers.get("origin")
    const allowedOrigins = env.ALLOWED_ORIGINS || "https://www.oito.uk"
    const preflightHeaders = corsHeaders(origin, allowedOrigins)

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: preflightHeaders })
    }

    // Cancel password layer: always succeed (UI still requires non-empty due to required)
    if (url.pathname === "/api/admin/verify-password" && req.method === "POST") {
      return json({ ok: true }, { status: 200, allowedOrigins, origin })
    }

    // Admin page (behind Access unless local/bypass)
    if (url.pathname === "/admin" || url.pathname === "/admin/") {
      const deny = await requireAccessAsync(req, env, allowedOrigins, origin)
      if (deny) return deny
      return html(ADMIN_HTML, { allowedOrigins, origin })
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true }, { allowedOrigins, origin })
    }

    // Orders create
    if (url.pathname === "/api/orders" && req.method === "POST") {
      try {
        const ip = getClientIp(req)
        const rl = await checkRateLimit(env.DB, "order_create", ip, RATE_LIMIT_ORDERS, RATE_LIMIT_WINDOW_MS)
        if (!rl.allowed) return json(safeError("Too many requests"), { status: 429, allowedOrigins, origin })

        const idempotencyKey = req.headers.get("idempotency-key")?.trim()
        if (idempotencyKey) {
          const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
          if (!uuidRe.test(idempotencyKey)) {
            return json(safeError("Invalid Idempotency-Key format"), { status: 400, allowedOrigins, origin })
          }
          const existing = await env.DB.prepare(`SELECT key FROM idempotency_keys WHERE key = ? LIMIT 1`)
            .bind(idempotencyKey)
            .first()
          if (existing) return json(safeError("Duplicate request"), { status: 409, allowedOrigins, origin })
        }

        const body = await safeJson(req)
        const validated = validateOrderBody(body, true) // skip turnstile
        if (!validated.ok) return json(safeError(validated.error), { status: 400, allowedOrigins, origin })

        const { data } = validated
        const items = data.items as { productName: string; variant_text: string; qty: number; unitPrice: number; subtotal: number }[]
        const serverAmount = items.reduce((sum, it) => sum + (it.subtotal ?? 0), 0)

        if (idempotencyKey) {
          const now = new Date().toISOString()
          try {
            await env.DB.prepare(`INSERT INTO idempotency_keys (key, created_at) VALUES (?, ?)`)
              .bind(idempotencyKey, now)
              .run()
          } catch {
            return json(safeError("Duplicate request"), { status: 409, allowedOrigins, origin })
          }
        }

        const orderNo = "ORD" + Date.now()
        const createdAt = new Date().toISOString()

        await env.DB.prepare(
          `INSERT INTO orders (order_no, created_at, status, name, phone, store_no, store_name, store_address, amount)
           VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`
        )
          .bind(orderNo, createdAt, data.name, data.phone, data.storeNo, data.storeName, data.storeAddress, serverAmount)
          .run()

        for (const it of items) {
          await env.DB.prepare(
            `INSERT INTO order_items (order_no, product_name, variant_text, qty, unit_price, line_total)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
            .bind(orderNo, it.productName, it.variant_text, it.qty, it.unitPrice, it.subtotal)
            .run()
        }

        return json({ ok: true, orderNo }, { allowedOrigins, origin })
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e)
        return json({ ok: false, error: message }, { status: 500, allowedOrigins, origin })
      }
    }

    // Orders query (customer)
    if (url.pathname === "/api/orders" && req.method === "GET") {
      const ip = getClientIp(req)
      const rl = await checkRateLimit(env.DB, "order_query", ip, RATE_LIMIT_ORDER_QUERY, RATE_LIMIT_ORDER_QUERY_WINDOW_MS)
      if (!rl.allowed) return json(safeError("Too many requests"), { status: 429, allowedOrigins, origin })

      const phone = String(url.searchParams.get("phone") ?? "").trim()
      if (!/^09\d{8}$/.test(phone)) {
        return json(safeError("Invalid phone"), { status: 400, allowedOrigins, origin })
      }

      const rows = await env.DB.prepare(
        `SELECT order_no, created_at, status, amount, phone, store_no, store_name, store_address
         FROM orders
         WHERE phone = ? AND status != 'deleted'
         ORDER BY created_at DESC
         LIMIT 3`
      )
        .bind(phone)
        .all()

      return json({ ok: true, orders: rows.results ?? [] }, { allowedOrigins, origin })
    }

    // Admin APIs: require Access (unless local/bypass), and rate-limit
    if (url.pathname.startsWith("/api/admin/")) {
      const deny = await requireAccessAsync(req, env, allowedOrigins, origin)
      if (deny) return deny

      const ip = getClientIp(req)
      const rl = await checkRateLimit(env.DB, "admin", ip, RATE_LIMIT_ADMIN, RATE_LIMIT_ADMIN_WINDOW_MS)
      if (!rl.allowed) return json(safeError("Too many requests"), { status: 429, allowedOrigins, origin })
    }

    if (url.pathname === "/api/admin/check" && req.method === "GET") {
      return json({ ok: true }, { allowedOrigins, origin })
    }

    if (url.pathname === "/api/admin/orders" && req.method === "GET") {
      const orders = await env.DB.prepare(
        `SELECT order_no, created_at, status, name, phone, store_no, store_name, store_address, amount
         FROM orders ORDER BY created_at DESC`
      ).all()
      return json({ ok: true, orders: orders.results }, { allowedOrigins, origin })
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/admin/orders/") && !url.pathname.endsWith("/status")) {
      const orderNo = parseOrderNoFromPath(url.pathname, "/api/admin/orders/")
      if (!orderNo) return json(safeError("Bad Request"), { status: 400, allowedOrigins, origin })

      const order = await env.DB.prepare(
        `SELECT order_no, created_at, status, name, phone, store_no, store_name, store_address, amount
         FROM orders WHERE order_no = ? LIMIT 1`
      )
        .bind(orderNo)
        .first()
      if (!order) return json(safeError("Not Found"), { status: 404, allowedOrigins, origin })

      const items = await env.DB.prepare(
        `SELECT order_no, product_name, variant_text, qty, unit_price, line_total
         FROM order_items WHERE order_no = ? ORDER BY rowid ASC`
      )
        .bind(orderNo)
        .all()
      return json({ ok: true, order, items: items.results }, { allowedOrigins, origin })
    }

    if (req.method === "PATCH" && url.pathname.startsWith("/api/admin/orders/") && url.pathname.endsWith("/status")) {
      const orderNo = parseOrderNoFromPath(url.pathname, "/api/admin/orders/")
      if (!orderNo) return json(safeError("Bad Request"), { status: 400, allowedOrigins, origin })

      const body = (await safeJson(req)) as { status?: string } | null
      const next = String(body?.status ?? "").toLowerCase().trim()
      const allow = new Set(["pending", "shipped", "cancelled", "deleted"])
      if (!allow.has(next)) return json(safeError("Invalid status"), { status: 400, allowedOrigins, origin })

      const r = await env.DB.prepare(`UPDATE orders SET status = ? WHERE order_no = ?`).bind(next, orderNo).run()
      await logAudit(env.DB, "order_status_update", "order", orderNo, getClientIp(req))
      return json({ ok: true, updated: r.meta?.changes ?? 0, status: next }, { allowedOrigins, origin })
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/admin/orders/")) {
      const orderNo = parseOrderNoFromPath(url.pathname, "/api/admin/orders/")
      if (!orderNo) return json(safeError("Bad Request"), { status: 400, allowedOrigins, origin })

      const r = await env.DB.prepare(`UPDATE orders SET status = 'deleted' WHERE order_no = ?`).bind(orderNo).run()
      await logAudit(env.DB, "order_delete", "order", orderNo, getClientIp(req))
      return json({ ok: true, deleted: r.meta?.changes ?? 0 }, { allowedOrigins, origin })
    }

    return json(safeError("Not Found"), { status: 404, allowedOrigins, origin })
  },
}