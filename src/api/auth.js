// src/api/auth.js
const AUTH_BASE = (import.meta.env.VITE_AUTH_BASE_URL || "/api").replace(/\/+$/, "");

const TOKEN_KEY  = "AUTH_TOKEN";
const USER_KEY   = "AUTH_USER";
const RTOKEN_KEY = "AUTH_REFRESH_TOKEN";
const EXP_KEY    = "AUTH_TOKEN_EXPIRES_AT";

function join(base, path) {
  const b = (base || "").replace(/\/+$/, "");
  let p = String(path || "");
  p = p.replace(/^\/+/, "/").replace(/^\/api(\/|$)/, "/");
  return b + (p.startsWith("/") ? p : `/${p}`);
}

export function getToken() { return localStorage.getItem(TOKEN_KEY) || ""; }
export function getUser()  { try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; } }
export function saveUser(user) { if (user) localStorage.setItem(USER_KEY, JSON.stringify(user)); }
export function getAuthHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
export function saveAuth({ token, refreshToken, expiresIn, user }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(RTOKEN_KEY, refreshToken);
  if (typeof expiresIn === "number") {
    localStorage.setItem(EXP_KEY, String(Date.now() + expiresIn * 1000));
  }
  if (user) saveUser(user);
}
export function clearAuth() {
  [TOKEN_KEY, USER_KEY, RTOKEN_KEY, EXP_KEY].forEach(k => localStorage.removeItem(k));
}

// ---- helpers ----
async function postJSON(path, body, headers = {}) {
  const url = join(AUTH_BASE, path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body || {}),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}
async function getJSONRaw(path, headers = {}) {
  const url = join(AUTH_BASE, path);
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json", ...headers } });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  return { ok: res.ok, status: res.status, data, text, url };
}
async function getJSON(path, headers = {}) {
  const r = await getJSONRaw(path, headers);
  if (!r.ok) throw new Error(r.data?.message || `HTTP ${r.status}`);
  return r.data;
}

// ---- APIs ----
export async function signup({ email, password, name, birthday, partnerBirthday, startDate, profilePhoto }) {
  return postJSON("/user/signIn", {
    email, password, name,
    ...(birthday && { birthday }),
    ...(partnerBirthday && { partnerBirthday }),
    ...(startDate && { startDate }),
    ...(profilePhoto && { profilePhoto }),
  });
}
export async function login({ email, password }) {
  return postJSON("/user/login", { email, password });
}

/** DB 프로필 조회: 항상 /api/mypage만 호출. 실패 시 [status] 포함 메시지로 throw */
export async function getHomeInfo() {
  const headers = getAuthHeaders();
  const r = await getJSONRaw("/mypage", headers); // 최종 호출: GET /api/mypage
  if (r.ok) return r.data;
  // 상태/본문을 그대로 에러 메시지로
  const msg = r.data?.message || r.text || "프로필 조회 실패";
  throw new Error(`[${r.status}] ${msg}`);
}
