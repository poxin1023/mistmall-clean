export interface Env {
  DB: D1Database
  ALLOWED_ORIGINS: string
  TURNSTILE_SECRET_KEY?: string
  CF_ACCESS_AUD?: string
  CF_ACCESS_TEAM_DOMAIN?: string
  DEV_BYPASS_ACCESS?: string
  DEV_BYPASS_TURNSTILE?: string
  ENVIRONMENT?: string
  ADMIN_PASSWORD_HASH?: string
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
const RATE_LIMIT_ADMIN = 100
const RATE_LIMIT_ADMIN_WINDOW_MS = 60_000

function getCorsHeaders(origin: string | null, allowed: string): Record<string, string> {
  const list = allowed.split(",").map((o) => o.trim()).filter(Boolean)
  const allowOrigin = origin && list.includes(origin) ? origin : list[0] ?? ""
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,cf-access-jwt-assertion,idempotency-key,cookie",
    "access-control-max-age": "86400",
  }
}

function json(data: unknown, init: ResponseInit & { origin?: string | null; allowedOrigins?: string } = {}) {
  const { origin, allowedOrigins, ...rest } = init as ResponseInit & { origin?: string | null; allowedOrigins?: string }
  const cors = allowedOrigins ? getCorsHeaders(origin ?? null, allowedOrigins) : {}
  return new Response(JSON.stringify(data, null, 2), {
    ...rest,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...cors,
      ...(rest.headers as Record<string, string>),
    },
  })
}

function html(body: string, init: ResponseInit & { origin?: string | null; allowedOrigins?: string } = {}) {
  const { origin, allowedOrigins, ...rest } = init as ResponseInit & { origin?: string | null; allowedOrigins?: string }
  const cors = allowedOrigins ? getCorsHeaders(origin ?? null, allowedOrigins) : {}
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
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0"
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

  const existing = await db
    .prepare(
      `SELECT id, count, window_start FROM abuse_logs 
       WHERE category = ? AND key_hash = ? 
       ORDER BY id DESC LIMIT 1`
    )
    .bind(category, keyHash)
    .first<{ id: number; count: number; window_start: string }>()

  if (!existing) {
    await db
      .prepare(`INSERT INTO abuse_logs (category, key_hash, count, window_start) VALUES (?, ?, 1, ?)`)
      .bind(category, keyHash, now)
      .run()
    return { allowed: true }
  }

  const ws = new Date(existing.window_start).getTime()
  if (Date.now() - ws > windowMs) {
    await db
      .prepare(`INSERT INTO abuse_logs (category, key_hash, count, window_start) VALUES (?, ?, 1, ?)`)
      .bind(category, keyHash, now)
      .run()
    return { allowed: true }
  }

  if (existing.count >= limit) {
    return { allowed: false }
  }

  await db.prepare(`UPDATE abuse_logs SET count = count + 1 WHERE id = ?`).bind(existing.id).run()
  return { allowed: true }
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

const ADMIN_SESSION_COOKIE = "admin_session"

type AdminPasswordHashConfig = {
  algorithm: "PBKDF2-SHA256"
  iterations: number
  salt: Uint8Array
  hash: Uint8Array
}

function decodeBase64ToBytes(s: string): Uint8Array | null {
  try {
    const bin = atob(s)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  } catch {
    return null
  }
}

function parseAdminPasswordHash(encoded: string | undefined): AdminPasswordHashConfig | null {
  const raw = (encoded ?? "").trim()
  if (!raw) return null
  const parts = raw.split("$")
  if (parts.length !== 5) return null
  const [scheme, digest, iterRaw, saltB64, hashB64] = parts
  if (scheme !== "pbkdf2" || digest !== "sha256") return null
  const iterations = Number.parseInt(iterRaw, 10)
  if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 2_000_000) return null
  const salt = decodeBase64ToBytes(saltB64)
  const hash = decodeBase64ToBytes(hashB64)
  if (!salt || !hash || salt.length < 16 || hash.length < 32) return null
  return { algorithm: "PBKDF2-SHA256", iterations, salt, hash }
}

async function deriveAdminPasswordHash(password: string, cfg: AdminPasswordHashConfig): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: cfg.salt,
      iterations: cfg.iterations,
    },
    keyMaterial,
    cfg.hash.length * 8
  )
  return new Uint8Array(bits)
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!
  return diff === 0
}

async function verifyAdminPasswordInput(password: string, env: Env): Promise<boolean> {
  const cfg = parseAdminPasswordHash(env.ADMIN_PASSWORD_HASH)
  if (!cfg) return false
  const derived = await deriveAdminPasswordHash(password, cfg)
  return timingSafeEqual(derived, cfg.hash)
}

async function getAdminSessionToken(env: Env): Promise<string> {
  const hash = (env.ADMIN_PASSWORD_HASH ?? "").trim()
  return simpleHash(hash + "admin_session_salt")
}

function getAdminCookie(req: Request): string | null {
  const cookie = req.headers.get("Cookie") ?? ""
  const match = cookie.match(new RegExp(`${ADMIN_SESSION_COOKIE}=([^;]+)`))
  return match ? match[1].trim() : null
}

async function verifyAdminSession(req: Request, env: Env): Promise<boolean> {
  const hash = (env.ADMIN_PASSWORD_HASH ?? "").trim()
  if (!hash) return false
  const expected = await getAdminSessionToken(env)
  const got = getAdminCookie(req)
  return !!got && got === expected
}

async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
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

function validateOrderBody(body: unknown, skipTurnstile = false): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
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

  const amount = typeof b.amount === "number" && Number.isInteger(b.amount) && b.amount >= 0
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

async function verifyAccessJwt(
  jwt: string | null,
  teamDomain: string | undefined,
  aud: string | undefined
): Promise<boolean> {
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

    const n = base64UrlToBuf(key.n)
    const e = base64UrlToBuf(key.e)
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

function base64UrlToBuf(s: string): ArrayBuffer {
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/")
  const pad = base64.length % 4
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function isLocalHost(url: URL): boolean {
  const h = url.hostname.toLowerCase()
  return h === "localhost" || h === "127.0.0.1"
}

function canBypass(req: Request, env: Env, type: "access" | "turnstile"): boolean {
  const envName = (env.ENVIRONMENT ?? "").toLowerCase()
  if (envName === "staging" || envName === "production") return false
  const url = new URL(req.url)
  if (!isLocalHost(url)) return false
  if (url.protocol !== "http:") return false
  if (type === "access") return env.DEV_BYPASS_ACCESS === "true"
  if (type === "turnstile") return env.DEV_BYPASS_TURNSTILE === "true"
  return false
}

async function requireAccessAsync(req: Request, env: Env, allowedOrigins: string, origin: string | null): Promise<Response | null> {
  if (canBypass(req, env, "access")) return null
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
  await db
    .prepare(
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
    input {
      padding: 12px 16px;
      width: 320px;
      border: 1px solid rgba(255, 255, 255, 0.55);
      border-radius: var(--radius);
      background: linear-gradient(165deg, rgba(255, 255, 255, 0.52) 0%, rgba(255, 255, 255, 0.26) 100%);
      color: var(--text);
      box-shadow: inset 0 2px 6px rgba(92, 116, 144, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.26), 0 8px 20px rgba(44, 71, 105, 0.1);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
    }
    input::placeholder { color: var(--text-muted); }
    input:focus {
      outline: none;
      border-color: var(--border-focus);
      background: linear-gradient(165deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.36) 100%);
      box-shadow: 0 0 0 3px rgba(93, 163, 255, 0.2), 0 12px 26px rgba(72, 129, 196, 0.18), inset 0 0 0 1px rgba(255, 255, 255, 0.45);
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
    button:hover {
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.9),
        inset 0 -1px 0 rgba(255, 255, 255, 0.34),
        0 13px 25px rgba(60, 100, 150, 0.25),
        0 4px 10px rgba(60, 100, 150, 0.18);
      transform: translateY(-1px) scale(1.01);
    }
    button:active {
      box-shadow:
        inset 0 5px 10px rgba(42, 70, 100, 0.25),
        inset 0 -2px 2px rgba(255, 255, 255, 0.2),
        0 3px 8px rgba(42, 70, 100, 0.15);
      transform: scale(0.96);
    }
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
    button.primary:hover {
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.72),
        0 16px 28px rgba(74, 138, 235, 0.42),
        0 6px 12px rgba(74, 138, 235, 0.24);
    }
    button.primary:active {
      box-shadow:
        inset 0 7px 12px rgba(56, 110, 189, 0.35),
        0 3px 8px rgba(56, 110, 189, 0.2);
    }
    button.danger {
      background: linear-gradient(165deg, rgba(255, 182, 166, 0.66) 0%, rgba(255, 128, 114, 0.52) 100%);
      color: #912f28;
      border-color: rgba(255, 203, 193, 0.58);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.8),
        0 10px 20px rgba(218, 113, 96, 0.28),
        0 3px 10px rgba(218, 113, 96, 0.18);
    }
    button.danger:hover {
      box-shadow:
        inset 0px 1px 0px rgba(255,255,255,0.95),
        0px 5px 2px rgba(0,0,0,0.06),
        2px 6px 3px rgba(255,255,255,0.8),
        0px 12px 18px rgba(192,57,43,0.15);
      transform: translateY(-1px);
    }
    button.danger:active {
      box-shadow:
        inset 0px 4px 8px rgba(192,57,43,0.15),
        0px 2px 4px rgba(0,0,0,0.05);
      transform: translateY(3px);
    }
    button.ok {
      background: linear-gradient(165deg, rgba(126, 226, 179, 0.72) 0%, rgba(62, 197, 150, 0.58) 100%);
      color: #fff;
      border-color: rgba(206, 251, 229, 0.55);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.65),
        inset 0 -1px 0 rgba(192, 246, 224, 0.36),
        0 12px 24px rgba(61, 179, 127, 0.34),
        0 3px 10px rgba(61, 179, 127, 0.22);
    }
    button.ok:hover {
      box-shadow:
        inset 0px 1px 0px rgba(255,255,255,0.45),
        0px 6px 3px rgba(39,174,96,0.45),
        2px 7px 4px rgba(255,255,255,0.55),
        0px 14px 24px rgba(39,174,96,0.3);
      transform: translateY(-1px);
    }
    button.ok:active {
      box-shadow:
        inset 0px 4px 10px rgba(0,0,0,0.25),
        0px 2px 6px rgba(39,174,96,0.2);
      transform: translateY(3px);
    }
    button:not(.primary):not(.danger):not(.ok):hover {
      background: #f5f6f8;
    }
    .muted { color: var(--text-muted); font-size: 13px; text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35); }
    .grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 16px; margin-top: 16px; width: 100%; position: relative; z-index: 1; }
    .card { width: 100%; min-width: 0; }
    @media (max-width: 980px){ .grid { grid-template-columns: 1fr; } input { width: 100%; } }
    @media (max-width: 640px) {
      #detail .v, #detail .mono, #detail .box { overflow-wrap: break-word; word-break: break-word; }
      body { padding: 0 0 24px; padding-bottom: max(24px, env(safe-area-inset-bottom)); }
      .wrap { padding: var(--mobile-pad); width: 100%; max-width: 100%; }
      header .wrap { padding: var(--mobile-pad); }
      .grid { width: 100%; gap: 12px; margin-top: 12px; }
      .card { width: 100%; border-radius: var(--radius-lg); }
      .card .pad { padding: var(--mobile-pad); }
      header .row { flex-direction: column; align-items: stretch; gap: 10px; }
      header .row > div:last-child { width: 100%; }
      header button { width: 100%; min-height: 44px; }
      .row2 { flex-wrap: wrap; }
      .row2-filters { flex-wrap: wrap; }
      .row2 .row { flex-direction: column; align-items: stretch; width: 100%; }
      input { width: 100% !important; min-width: 0; min-height: 44px; padding: 12px 14px; }
      .select { width: 100%; min-width: 0; min-height: 44px; }
      .custom-select { width: 100%; min-width: 0; }
      .custom-select-trigger { min-height: 44px; }
      section.card:first-of-type .pad:last-of-type { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }
      table { display: table; width: 100%; min-width: 320px; }
      th, td { padding: 10px 8px; font-size: 13px; white-space: nowrap; }
      th:first-child, td:first-child { min-width: 85px; }
      th:nth-child(2), td:nth-child(2) { min-width: 68px; }
      th:nth-child(3), td:nth-child(3) { min-width: 75px; }
      th:nth-child(4), td:nth-child(4) { min-width: 82px; }
      th:nth-child(5), td:nth-child(5) { min-width: 100px; }
      .btnbar { grid-template-columns: 1fr; gap: 8px; }
      .btnbar-2 { grid-template-columns: 1fr; }
      .btnbar button { width: 100%; min-height: 44px; }
      .box { padding: 10px 12px; width: 100%; min-width: 0; }
      #detail { width: 100%; min-width: 0; }
      .row .row { width: 100%; }
      .row[style*="justify-content: space-between"] { flex-direction: column; align-items: stretch; gap: 8px; }
      .toast { left: var(--mobile-pad); right: var(--mobile-pad); width: auto; bottom: max(16px, env(safe-area-inset-bottom)); margin: 0; }
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--border); vertical-align: top; }
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
    .pill {
      display: inline-flex; align-items: center;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid transparent;
      transition: var(--transition);
    }
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
    .small { font-size: 12px; }
    .btnbar {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-top: 12px;
      width: 100%;
      align-items: stretch;
    }
    .btnbar button {
      width: 100%;
      min-width: 0;
      min-height: 46px;
      white-space: nowrap;
      padding: 10px 12px;
      font-size: 14px;
    }
    .btnbar-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .op-row .btnbar { margin-top: 0; }
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
    .row2-filters { display:flex; gap:12px; flex-wrap:nowrap; align-items:center; }
    .select {
      padding: 12px 36px 12px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: #fafbfc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7c93' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 14px center;
      color: var(--text);
      cursor: pointer;
      font-size: 14px;
      min-width: 100px;
      appearance: none;
      -webkit-appearance: none;
    }
    .select:hover { background: #f5f7fa; }
    .select:focus {
      outline: none;
      border-color: var(--border-focus);
      background: #fff;
      box-shadow: 0 0 0 3px rgba(100,150,255,0.12);
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
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.85),
        0 10px 20px rgba(53, 82, 120, 0.14),
        0 3px 8px rgba(53, 82, 120, 0.1);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7c93' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
    }
    .custom-select-trigger:hover {
      box-shadow:
        inset 0px 1px 0px rgba(255,255,255,0.95),
        0px 5px 2px rgba(0,0,0,0.07),
        2px 6px 3px rgba(255,255,255,0.85),
        0px 12px 18px rgba(0,0,0,0.08);
      transform: translateY(-1px);
    }
    .custom-select.open .custom-select-trigger {
      box-shadow:
        inset 0px 4px 8px rgba(0,0,0,0.12),
        0px 2px 4px rgba(0,0,0,0.06);
      transform: translateY(2px);
      border-radius: var(--radius) var(--radius) 0 0;
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
      box-shadow:
        0 18px 30px rgba(39, 71, 108, 0.18),
        0 3px 10px rgba(39, 71, 108, 0.1);
      z-index: 420;
      overflow: hidden;
      backdrop-filter: blur(28px) saturate(1.2);
      -webkit-backdrop-filter: blur(28px) saturate(1.2);
    }
    .custom-select.open .custom-select-dropdown { display: block; animation: fadeInUp .22s ease; }
    .custom-select-option {
      padding: 12px 16px;
      cursor: pointer;
      font-size: 14px;
      transition: 0.15s ease;
    }
    .custom-select-option:hover,
    .custom-select-option.selected {
      background: linear-gradient(170deg, rgba(123, 172, 255, 0.26), rgba(147, 191, 255, 0.18));
    }
    #filterCard { position: relative; z-index: 160; }
    #adminContent { display: none; }
    #adminContent.visible { display: block; }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 480px) {
      :root { --radius: 10px; --radius-lg: 14px; }
      .wrap { padding: 10px; }
      .card .pad { padding: 10px; }
      .box { padding: 8px 10px; }
      th, td { padding: 8px 6px; font-size: 12px; }
      table { min-width: 280px; }
      th:first-child, td:first-child { min-width: 75px; }
      th:nth-child(2), td:nth-child(2) { min-width: 58px; }
      th:nth-child(3), td:nth-child(3) { min-width: 65px; }
      th:nth-child(4), td:nth-child(4) { min-width: 72px; }
      th:nth-child(5), td:nth-child(5) { min-width: 88px; }
    }
    /* ===== Modal / Overlay (Glass + stacked) ===== */
    body.modal-open { overflow: hidden; touch-action: manipulation; }
    #adminContent.locked {
      filter: blur(10px) saturate(1.05);
      transform: translateZ(0);
      pointer-events: none;
      user-select: none;
    }
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
    @keyframes overlayIn { from{ opacity:0 } to{ opacity:1 } }

    .login-shell {
      width: 100%;
      max-width: 420px;
      position: relative;
    }

    .login-stack {
      position: absolute;
      inset: 0;
      border-radius: 28px;
      transform: translateY(10px) scale(0.98);
      filter: blur(0.2px);
      opacity: 0.95;
      pointer-events: none;
    }
    .login-stack.stack-1 {
      background: linear-gradient(165deg, rgba(255,255,255,0.18), rgba(255,255,255,0.10));
      border: 1px solid rgba(255,255,255,0.24);
      transform: translateY(14px) rotate(-1.2deg) scale(0.985);
    }
    .login-stack.stack-2 {
      background: linear-gradient(165deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08));
      border: 1px solid rgba(255,255,255,0.18);
      transform: translateY(22px) rotate(1.4deg) scale(0.975);
    }

    .login-modal {
      position: relative;
      border-radius: 28px;
      padding: 18px;
      background: linear-gradient(165deg, rgba(255,255,255,0.38), rgba(255,255,255,0.18));
      border: 1px solid rgba(255,255,255,0.42);
      box-shadow:
        0 22px 60px rgba(0,0,0,0.25),
        inset 0 1px 0 rgba(255,255,255,0.72);
      backdrop-filter: blur(26px) saturate(1.2);
      -webkit-backdrop-filter: blur(26px) saturate(1.2);
      transform: translateY(6px);
      animation: modalIn .22s ease both;
    }
    @keyframes modalIn { from{ opacity:0; transform: translateY(14px) scale(0.98) } to{ opacity:1; transform: translateY(0) scale(1) } }

    .login-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .login-title {
      font-weight: 800;
      font-size: 18px;
      letter-spacing: -0.02em;
    }
    .login-sub { margin-top: 6px; color: var(--text-muted); font-size: 13px; }

    .login-form { margin-top: 14px; display: grid; gap: 10px; }
    .login-form input { width: 100%; min-height: 46px; }
    .login-actions { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 4px; }

    .login-x {
      width: 38px; height: 38px;
      display: inline-flex; align-items:center; justify-content:center;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.30);
      background: rgba(255,255,255,0.18);
      cursor: pointer;
    }
    .login-x:hover { background: rgba(255,255,255,0.28); }

    #loginErr { color: #b3261e; font-size: 13px; min-height: 18px; }

    /* 手機更穩：避免背景「橡皮筋」滑動 */
    html, body { overscroll-behavior: none; }

    /* ===== Dropdown readable contrast ===== */
    .custom-select-dropdown {
      color: var(--text);
    }
    .custom-select-option {
      color: var(--text);
    }
    .custom-select-option:hover,
    .custom-select-option.selected {
      color: #1f2f45;
    }
  </style>
</head>
<body>
<header id="header">
  <div class="wrap">
    <div class="row" style="justify-content: space-between;">
      <div>
        <div class="header-title" style="font-weight:600; font-size:17px; letter-spacing:-0.02em; color: var(--text);">MEME後台</div>
      </div>
      <div class="row">
        <button id="refresh" class="primary">重新載入</button>
      </div>
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
        <span class="muted small">日期範圍：</span>
        <div class="custom-select" id="dateRangeWrap">
          <input type="hidden" id="dateRange" value="3">
          <button type="button" class="custom-select-trigger" id="dateRangeTrigger">三天</button>
          <div class="custom-select-dropdown" id="dateRangeDropdown">
            <div class="custom-select-option" data-value="1">一天</div>
            <div class="custom-select-option selected" data-value="3">三天</div>
            <div class="custom-select-option" data-value="7">七天</div>
          </div>
        </div>
        <span class="muted small">顯示：</span>
        <div class="custom-select" id="viewModeWrap">
          <input type="hidden" id="viewMode" value="pending">
          <button type="button" class="custom-select-trigger" id="viewModeTrigger">待處理</button>
          <div class="custom-select-dropdown" id="viewModeDropdown">
            <div class="custom-select-option selected" data-value="pending">待處理</div>
            <div class="custom-select-option" data-value="shipped">已寄件</div>
            <div class="custom-select-option" data-value="deleted">已刪除</div>
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
              <th style="width:95px;">日期</th>
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
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return !!ok;
    } catch {
      return false;
    }
  }
  async function api(path, opt = {}){ const res = await fetch(path, { method: opt.method || 'GET', headers: opt.json ? { 'Content-Type': 'application/json' } : {}, body: opt.json ? JSON.stringify(opt.json) : undefined, credentials: 'same-origin' }); const text = await res.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; } if (!res.ok){ const err = new Error('HTTP ' + res.status); err.status = res.status; err.body = data; throw err; } return data; }
  async function checkAuth(){ try { const r = await fetch('/api/admin/check', { credentials: 'same-origin' }); return r.ok; } catch { return false; } }
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

  async function showLoginOrAdmin(){
    const ok = await checkAuth();
    $('adminContent').classList.add('visible');
    if (ok){
      closeLogin();
      loadList();
    } else {
      openLogin();
    }
  }
  function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
  function getDateRangeStart(days){ const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - parseInt(days,10)); return d.toISOString(); }
  function renderList(rows){ const q = ($('q').value || '').trim().toLowerCase(); const mode = $('viewMode').value || 'pending'; const days = ($('dateRange') && $('dateRange').value) || '3'; const rangeStart = getDateRangeStart(days); let filtered = rows || []; filtered = filtered.filter(o => (o.created_at || '') >= rangeStart); filtered = filtered.filter(o => String(o.status || '').toLowerCase() === mode); if (q) filtered = filtered.filter(o => String(o.order_no || '').toLowerCase().includes(q) || String(o.name || '').toLowerCase().includes(q) || String(o.phone || '').toLowerCase().includes(q)); filtered.sort((a,b) => { const ra = statusRank(a.status), rb = statusRank(b.status); return ra !== rb ? ra - rb : String(b.created_at||'').localeCompare(String(a.created_at||'')); }); const tbody = $('list'); tbody.innerHTML = filtered.map(o => { const who = [o.name, o.phone].filter(Boolean).join(' / ') || '-'; const dt = o.created_at ? (new Date(o.created_at)).toLocaleDateString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit'}) : '-'; return '<tr data-order="' + escapeHtml(o.order_no) + '" style="cursor:pointer;"><td class="mono">' + escapeHtml(o.order_no) + '</td><td>' + pill(o.status) + '</td><td>' + escapeHtml(who) + '<div class="muted small">' + escapeHtml(o.store_name || '') + '</div></td><td class="date-cell">' + escapeHtml(dt) + '</td><td class="time-cell">' + escapeHtml(fmtTime(o.created_at)) + '</td></tr>'; }).join(''); $('stat').textContent = '顯示 ' + filtered.length + ' / ' + (rows||[]).length; Array.from(tbody.querySelectorAll('tr')).forEach(tr => { tr.addEventListener('click', () => loadDetail(tr.getAttribute('data-order'))); }); }
  async function updateStatus(orderNo, nextStatus){ if (!orderNo) return; await api('/api/admin/orders/' + encodeURIComponent(orderNo) + '/status', { method: 'PATCH', json: { status: nextStatus } }); }
  async function deleteOrder(orderNo){ if (!orderNo) return; await api('/api/admin/orders/' + encodeURIComponent(orderNo), { method: 'DELETE' }); }
  function renderDetail(order){ const d = $('detail'); $('detailHint').textContent = ''; currentOrderNo = order.order?.order_no || ''; const info = { orderNo: order.order?.order_no || '', status: order.order?.status || '', createdAt: order.order?.created_at || '', name: order.order?.name || '', phone: order.order?.phone || '', storeNo: order.order?.store_no || '', storeName: order.order?.store_name || '', storeAddress: order.order?.store_address || '', amount: order.order?.amount ?? '' }; const items = order.items || []; const itemsHtml = items.length ? items.map(it => '<div class="box item-box" style="margin-top:8px;"><div class="v">' + escapeHtml(it.product_name || '-') + '</div><div class="muted small">' + escapeHtml(it.variant_text || '') + '</div><div class="muted small">數量：' + escapeHtml(it.qty) + ' / 單價：' + escapeHtml(it.unit_price) + ' / 小計：' + escapeHtml(it.line_total) + '</div></div>').join('') : '<div class="muted small">（無商品明細）</div>'; const shipText = '訂單號：' + info.orderNo + '\\n狀態：' + statusLabel(info.status) + '\\n建立：' + fmtTime(info.createdAt) + '\\n收件人：' + info.name + '\\n電話：' + info.phone + '\\n7-11門市：' + info.storeName + '（' + info.storeNo + '）\\n門市地址：' + info.storeAddress + '\\n金額：' + info.amount; const orderDate = info.createdAt ? (new Date(info.createdAt)).toLocaleDateString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit'}) : '-';
d.innerHTML = '<div class="box"><div class="k">訂單號</div><div class="v mono">' + escapeHtml(info.orderNo) + '</div><div class="k" style="margin-top:6px;">狀態</div><div class="v">' + pill(info.status) + '</div><div class="k" style="margin-top:6px;">訂單日期</div><div class="v">' + escapeHtml(orderDate) + '</div><div class="k" style="margin-top:6px;">建立時間</div><div class="v">' + escapeHtml(fmtTime(info.createdAt)) + '</div><div class="hr"></div><div class="row op-row" style="justify-content: space-between;"><div class="muted small">出貨操作</div><div class="row btnbar"><button id="markShipped" class="ok">標記已寄件</button><button id="markPending">改回待確認</button><button id="delOrder" class="danger">刪除此訂單</button></div></div></div><div class="box" style="margin-top:10px;"><div class="k">收件人</div><div class="v">' + escapeHtml(info.name) + '</div><div class="k" style="margin-top:6px;">電話</div><div class="v mono">' + escapeHtml(info.phone) + '</div><div class="k" style="margin-top:6px;">門市</div><div class="v">' + escapeHtml(info.storeName) + ' <span class="muted small">(' + escapeHtml(info.storeNo) + ')</span></div><div class="k" style="margin-top:6px;">門市地址</div><div class="v">' + escapeHtml(info.storeAddress) + '</div><div class="k" style="margin-top:6px;">金額</div><div class="v">' + escapeHtml(info.amount) + '</div><div class="btnbar btnbar-2"><button id="copyShip" class="primary">一鍵複製寄件資訊</button><button id="copyOrderNo">複製訂單號</button></div></div><div style="margin-top:10px;"><div style="font-weight:800; margin-bottom:6px;">商品明細</div>' + itemsHtml + '</div>'; $('copyShip').addEventListener('click', async () => { const ok = await copyTextWithFallback(shipText); toast(ok ? '已複製寄件資訊' : '複製失敗'); }); $('copyOrderNo').addEventListener('click', async () => { const ok = await copyTextWithFallback(info.orderNo); toast(ok ? '已複製訂單號' : '複製失敗'); }); $('markShipped').addEventListener('click', async () => { try { await updateStatus(info.orderNo, 'shipped'); toast('已標記：已寄件'); await loadList(); await loadDetail(info.orderNo); } catch(e) { toast('操作失敗'); } }); $('markPending').addEventListener('click', async () => { try { await updateStatus(info.orderNo, 'pending'); toast('已改回：待確認'); await loadList(); await loadDetail(info.orderNo); } catch(e) { toast('操作失敗'); } }); $('delOrder').addEventListener('click', async () => { if (!confirm('確定要刪除此訂單嗎？')) return; try { await deleteOrder(info.orderNo); toast('已刪除'); currentOrderNo = ''; $('detail').innerHTML = '<div class="muted small">已刪除。</div>'; await loadList(); } catch(e) { toast('刪除失敗'); } }); }
  async function loadList(){ $('stat').textContent = '載入中...'; try { const res = await api('/api/admin/orders'); renderList(res.orders || []); } catch (e){ $('list').innerHTML = ''; $('stat').textContent = ''; $('detail').innerHTML = '<div class="muted small">無法載入（請先登入）</div>'; if (e && e.status) toast('錯誤：HTTP ' + e.status); else toast('載入失敗'); } }
  async function loadDetail(orderNo){ if (!orderNo) return; try { const res = await api('/api/admin/orders/' + encodeURIComponent(orderNo)); renderDetail(res); } catch (e){ $('detail').innerHTML = '<div class="muted small">無法載入詳情</div>'; if (e && e.status) toast('錯誤：HTTP ' + e.status); } }
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
  $('refresh').addEventListener('click', async () => { await loadList(); toast('已重新載入'); }); $('q').addEventListener('input', () => loadList());
  initCustomSelect('dateRangeWrap', 'dateRange', 'dateRangeTrigger', 'dateRangeDropdown');
  initCustomSelect('viewModeWrap', 'viewMode', 'viewModeTrigger', 'viewModeDropdown');
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = $('adminPw').value.trim();
    $('loginErr').textContent = '';
    try {
      const res = await fetch('/api/admin/verify-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }), credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { $('loginErr').textContent = data.error || '密碼錯誤'; return; }
      await showLoginOrAdmin();
    } catch { $('loginErr').textContent = '連線失敗'; }
  });
  $('loginClose')?.addEventListener('click', () => {
    toast('請先登入');
    try { $('adminPw').focus(); } catch {}
  });

  $('loginOverlay')?.addEventListener('click', (e) => {
    if (e.target === $('loginOverlay')) {
      toast('請先登入');
      try { $('adminPw').focus(); } catch {}
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('loginOverlay')?.classList.contains('show')) {
      e.preventDefault();
      toast('請先登入');
      try { $('adminPw').focus(); } catch {}
    }
  });
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    const h = $('header');
    if (y > 60) h.classList.add('collapsed'); else h.classList.remove('collapsed');
    lastScroll = y;
  });
  showLoginOrAdmin();
</script>
</body>
</html>`

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const origin = req.headers.get("origin")
    const allowedOrigins = env.ALLOWED_ORIGINS ?? ""

    const corsHeaders = getCorsHeaders(origin, allowedOrigins)

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (url.pathname === "/admin" || url.pathname === "/admin/") {
      const deny = await requireAccessAsync(req, env, allowedOrigins, origin)
      if (deny) return deny
      return html(ADMIN_HTML, { allowedOrigins, origin })
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true }, { allowedOrigins, origin })
    }

    if (url.pathname === "/api/order" && req.method === "POST") {
      return json(safeError("Not Found"), { status: 404, allowedOrigins, origin })
    }

    if (url.pathname === "/api/orders" && req.method === "POST") {
      const bypassTurnstile = canBypass(req, env, "turnstile")

      const ip = getClientIp(req)
      const rl = await checkRateLimit(env.DB, "order_create", ip, RATE_LIMIT_ORDERS, RATE_LIMIT_WINDOW_MS)
      if (!rl.allowed) {
        return json(safeError("Too many requests"), { status: 429, allowedOrigins, origin })
      }

      const idempotencyKey = req.headers.get("idempotency-key")?.trim()
      if (idempotencyKey) {
        const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
        if (!uuidRe.test(idempotencyKey)) {
          return json(safeError("Invalid Idempotency-Key format"), { status: 400, allowedOrigins, origin })
        }
        const existing = await env.DB.prepare(
          `SELECT key FROM idempotency_keys WHERE key = ? LIMIT 1`
        )
          .bind(idempotencyKey)
          .first()
        if (existing) {
          return json(safeError("Duplicate request"), { status: 409, allowedOrigins, origin })
        }
      }

      const body = await safeJson(req)
      const validated = validateOrderBody(body, bypassTurnstile)
      if (!validated.ok) {
        return json(safeError(validated.error), { status: 400, allowedOrigins, origin })
      }
      const { data } = validated

      if (!bypassTurnstile) {
        const secret = env.TURNSTILE_SECRET_KEY
        if (!secret) {
          return json(safeError("Turnstile not configured"), { status: 503, allowedOrigins, origin })
        }
        const turnstileOk = await verifyTurnstile((data.turnstileToken as string), secret)
        if (!turnstileOk) {
          return json(safeError("Turnstile verification failed"), { status: 403, allowedOrigins, origin })
        }
      }

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
    }

    if (url.pathname.startsWith("/api/admin/")) {
      const deny = await requireAccessAsync(req, env, allowedOrigins, origin)
      if (deny) return deny

      const ip = getClientIp(req)
      const rl = await checkRateLimit(env.DB, "admin", ip, RATE_LIMIT_ADMIN, RATE_LIMIT_ADMIN_WINDOW_MS)
      if (!rl.allowed) {
        return json(safeError("Too many requests"), { status: 429, allowedOrigins, origin })
      }
    }

    if (url.pathname === "/api/admin/verify-password" && req.method === "POST") {
      const hash = (env.ADMIN_PASSWORD_HASH ?? "").trim()
      if (!parseAdminPasswordHash(hash)) {
        return json(safeError("Admin password hash not configured"), { status: 503, allowedOrigins, origin })
      }
      const body = (await safeJson(req)) as { password?: string } | null
      const input = String(body?.password ?? "").trim()
      const ok = await verifyAdminPasswordInput(input, env)
      if (!ok) return json(safeError("密碼錯誤"), { status: 401, allowedOrigins, origin })
      const token = await getAdminSessionToken(env)
      const headers: Record<string, string> = { ...getCorsHeaders(origin ?? null, allowedOrigins) }
      headers["Set-Cookie"] = `${ADMIN_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8", ...headers },
      })
    }

    if (url.pathname === "/api/admin/check" && req.method === "GET") {
      const ok = await verifyAdminSession(req, env)
      if (!ok) return json(safeError("Unauthorized"), { status: 401, allowedOrigins, origin })
      return json({ ok: true }, { allowedOrigins, origin })
    }

    if (url.pathname.startsWith("/api/admin/") && url.pathname !== "/api/admin/verify-password" && url.pathname !== "/api/admin/check") {
      const ok = await verifyAdminSession(req, env)
      if (!ok) return json(safeError("請先登入"), { status: 401, allowedOrigins, origin })
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
