// src/api/auth.js
// 베이스: Vercel 리라이트용. '/api'는 백엔드로 프록시됨.
const AUTH_BASE = (import.meta.env.VITE_AUTH_BASE_URL || "/api").replace(/\/+$/, "");

// localStorage keys
const TOKEN_KEY  = "AUTH_TOKEN";
const USER_KEY   = "AUTH_USER";
const RTOKEN_KEY = "AUTH_REFRESH_TOKEN";
const EXP_KEY    = "AUTH_TOKEN_EXPIRES_AT";

// ------------------------------------------------------------------
// utils
function join(base, path) {
  const b = (base || "").replace(/\/+$/, "");
  let p = String(path || "");
  p = p.replace(/^\/+/, "/").replace(/^\/api(\/|$)/, "/"); // '/api' 중복 제거
  return b + (p.startsWith("/") ? p : `/${p}`);
}

// exported helpers
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

// HTTP helpers
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

// ------------------------------------------------------------------
// API: 회원가입/로그인
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

// ------------------------------------------------------------------
// API: 프로필 조회 (DB에서 그대로) — 항상 /api/mypage만 호출
export async function getHomeInfo() {
  const headers = getAuthHeaders();
  return getJSON("/mypage", headers); // 최종 요청: GET /api/mypage
}

// (선택) 프로필 사진 업로드 — 문서 경로 그대로 사용
export async function uploadProfilePhoto(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(join(AUTH_BASE, "/user/upload/user/uploadPhoto"), {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: fd,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data; // { photoURL: "https://..." }
}
