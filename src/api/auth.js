// src/api/auth.js
const AUTH_BASE = (import.meta.env.VITE_AUTH_BASE_URL || "/api").replace(/\/+$/, "");

const TOKEN_KEY  = "AUTH_TOKEN";
const USER_KEY   = "AUTH_USER";
const RTOKEN_KEY = "AUTH_REFRESH_TOKEN";
const EXP_KEY    = "AUTH_TOKEN_EXPIRES_AT";

// ---- 공통: URL 조립 시 '/api' 이중중복 제거 ----
function join(base, path) {
  const b = (base || "").replace(/\/+$/, "");               // '/api'
  let p = String(path || "");                               // 입력 path
  p = p.replace(/^\/+/, "/");                               // 앞 슬래시 1개로
  p = p.replace(/^\/api(\/|$)/, "/");                       // ← 선두의 '/api' 제거
  return b + (p.startsWith("/") ? p : `/${p}`);             // '/api' + '/user/login'
}
// -----------------------------------------------

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
  catch { return null; }
}
export function getAuthHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
export function saveAuth({ token, refreshToken, expiresIn, user }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(RTOKEN_KEY, refreshToken);
  if (typeof expiresIn === "number") {
    const at = Date.now() + expiresIn * 1000;
    localStorage.setItem(EXP_KEY, String(at));
  }
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearAuth() {
  [TOKEN_KEY, USER_KEY, RTOKEN_KEY, EXP_KEY].forEach(k => localStorage.removeItem(k));
}

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
async function getJSON(path, headers = {}) {
  const url = join(AUTH_BASE, path);
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json", ...headers },
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

// --- 실제 API들: 경로는 '/user/…', '/home/…' 처럼만 쓰면 됨 ---
export async function signup({ email, password, name, birthday, partnerBirthday, startDate, profilePhoto }) {
  return postJSON("/user/signIn", { email, password, name, birthday, partnerBirthday, startDate, profilePhoto });
}
export async function login({ email, password }) {
  return postJSON("/user/login", { email, password });
}
export async function uploadProfilePhoto(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(join(AUTH_BASE, "/user/uploadPhoto"), {
    method: "POST",
    headers: { ...getAuthHeaders() }, // Content-Type 자동
    body: fd,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data; // { photoURL }
}
export async function getHomeInfo() {
  return getJSON("/home/home", { ...getAuthHeaders() });
}
