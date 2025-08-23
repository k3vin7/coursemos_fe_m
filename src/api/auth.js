// src/api/auth.js
const AUTH_BASE = (import.meta.env.VITE_AUTH_BASE_URL || "").replace(/\/$/, "");

const TOKEN_KEY  = "AUTH_TOKEN";
const USER_KEY   = "AUTH_USER";
const RTOKEN_KEY = "AUTH_REFRESH_TOKEN";
const EXP_KEY    = "AUTH_TOKEN_EXPIRES_AT";

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
  const res = await fetch(`${AUTH_BASE}${path}`, {
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
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method: "GET",
    headers: { Accept: "application/json", ...headers },
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

// === 명세 반영 ===
// 회원가입: POST /api/user/signIn
export async function signup({
  email,
  password,
  name,
  birthday,          // "YYYY-MM-DD"
  partnerBirthday,    // "YYYY-MM-DD"
  startDate,          // "YYYY-MM-DD"
  profilePhoto,       // URL (UI에서는 안 받지만, 필요 시 전달 가능)
}) {
  return postJSON("/api/user/signIn", {
    email, password, name, birthday, partnerBirthday, startDate, profilePhoto,
  });
}

// 로그인: POST /api/user/login
export async function login({ email, password }) {
  return postJSON("/api/user/login", { email, password });
}

// 프로필 사진 업로드: POST /api/user/upload/user/uploadPhoto (multipart, field: file)
export async function uploadProfilePhoto(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${AUTH_BASE}/api/user/upload/user/uploadPhoto`, {
    method: "POST",
    headers: { ...getAuthHeaders() }, // Content-Type 자동
    body: fd,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data; // { photoURL }
}

// 홈 정보 조회: GET /api/home/home
export async function getHomeInfo() {
  return getJSON("/api/home/home", { ...getAuthHeaders() });
}
