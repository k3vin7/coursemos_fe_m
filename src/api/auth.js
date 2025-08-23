// src/api/auth.js
const AUTH_BASE = (import.meta.env.VITE_AUTH_BASE_URL || "/api").replace(/\/+$/, "");
const PROFILE_EP_ENV = (import.meta.env.VITE_PROFILE_ENDPOINT || "none").trim(); // ← 기본값 'none'으로 조용히

const TOKEN_KEY  = "AUTH_TOKEN";
const USER_KEY   = "AUTH_USER";
const RTOKEN_KEY = "AUTH_REFRESH_TOKEN";
const EXP_KEY    = "AUTH_TOKEN_EXPIRES_AT";

function join(base, path) {
  const b = (base || "").replace(/\/+$/, "");
  let p = String(path || "");
  p = p.replace(/^\/+/, "/");
  p = p.replace(/^\/api(\/|$)/, "/"); // '/api' 이중 제거
  return b + (p.startsWith("/") ? p : `/${p}`);
}

export function getToken() { return localStorage.getItem(TOKEN_KEY) || ""; }
export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
  catch { return null; }
}
export function saveUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}
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

// === Auth APIs ===
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

// === Profile ===
// 기본 동작: 네트워크 요청 "안 함"(none). 필요 시 환경변수로만 켭니다.
//   VITE_PROFILE_ENDPOINT=none        → 요청 안 보냄(로컬만 반환)
//   VITE_PROFILE_ENDPOINT=/home/home  → 해당 경로만 호출(탐색 X)
//   VITE_PROFILE_ENDPOINT=auto        → (/home/home, /home)만 짧게 탐색
export async function getHomeInfo() {
  const mode = PROFILE_EP_ENV.toLowerCase();

  if (mode === "none" || mode === "") {
    // 조용히 로컬만 반환
    return getUser() || {};
  }

  if (PROFILE_EP_ENV.startsWith("/")) {
    // 고정 경로만 호출
    return getJSON(PROFILE_EP_ENV, getAuthHeaders());
  }

  if (mode === "auto") {
    // 필요한 경우에만 짧게 탐색(404 로그 최소화)
    const candidates = ["/home/home", "/home"];
    for (const ep of candidates) {
      try { return await getJSON(ep, getAuthHeaders()); } catch { /* 다음 후보 */ }
    }
    // 실패 시에도 네트워크 재시도 없이 로컬만 반환
    return getUser() || {};
  }

  // 알 수 없는 값이면 안전하게 로컬만 반환
  return getUser() || {};
}

// (선택) 프로필 사진 업로드
export async function uploadProfilePhoto(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(join(AUTH_BASE, "/user/uploadPhoto"), {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: fd,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}
