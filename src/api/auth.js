// src/api/auth.js
const AUTH_BASE = (import.meta.env.VITE_AUTH_BASE_URL || "/api").replace(/\/+$/, "");

// ── localStorage keys
const TOKEN_KEY  = "AUTH_TOKEN";
const USER_KEY   = "AUTH_USER";
const RTOKEN_KEY = "AUTH_REFRESH_TOKEN";
const EXP_KEY    = "AUTH_TOKEN_EXPIRES_AT";

// ── utils
function join(base, path) {
  const b = (base || "").replace(/\/+$/, "");
  let p = String(path || "");
  p = p.replace(/^\/+/, "/").replace(/^\/api(\/|$)/, "/"); // '/api' 중복 제거
  return b + (p.startsWith("/") ? p : `/${p}`);
}

// ── auth state
export function getToken() { return localStorage.getItem(TOKEN_KEY) || ""; }
export function getUser()  { try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; } }
export function saveUser(user) { if (user) localStorage.setItem(USER_KEY, JSON.stringify(user)); }
export function clearAuth() {
  [TOKEN_KEY, USER_KEY, RTOKEN_KEY, EXP_KEY].forEach(k => localStorage.removeItem(k));
}
export function saveAuth({ token, refreshToken, expiresIn, user }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(RTOKEN_KEY, refreshToken);
  if (typeof expiresIn === "number") {
    localStorage.setItem(EXP_KEY, String(Date.now() + expiresIn * 1000));
  }
  if (user) saveUser(user);
}
export function getAuthHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ✅ 로그인 여부(만료 고려)
export function isLoggedIn() {
  const t = getToken();
  if (!t) return false;
  const exp = Number(localStorage.getItem(EXP_KEY) || 0);
  if (exp && Date.now() > exp) return false;
  return true;
}

// ── HTTP helpers
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
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json", ...headers } });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

// ── APIs
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

// DB 프로필 조회(항상 /api/mypage)
export async function getHomeInfo() {
  return getJSON("/mypage", getAuthHeaders());
}

// 홈(사진만)
export async function getHomePhoto() {
  return getJSON("/home", getAuthHeaders()); // { photoURL }
}

// 프로필 사진 업로드(multipart, field: file)
export async function uploadProfilePhoto(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(join(AUTH_BASE, "/user/uploadPhoto"), {
    method: "POST",
    headers: { ...getAuthHeaders() }, // boundary 자동 세팅
    body: fd,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data; // { photoURL }
}
