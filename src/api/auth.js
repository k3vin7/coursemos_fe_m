// src/api/auth.js
const AUTH_BASE = (import.meta.env.VITE_AUTH_BASE_URL || "/api").replace(/\/+$/, "");

const TOKEN_KEY  = "AUTH_TOKEN";
const USER_KEY   = "AUTH_USER";
const RTOKEN_KEY = "AUTH_REFRESH_TOKEN";
const EXP_KEY    = "AUTH_TOKEN_EXPIRES_AT";
const PROFILE_EP_KEY = "AUTH_PROFILE_ENDPOINT"; // ← 찾은 엔드포인트 캐시

// '/api' 이중중복 제거 및 안전 조립
function join(base, path) {
  const b = (base || "").replace(/\/+$/, "");
  let p = String(path || "");
  p = p.replace(/^\/+/, "/");
  p = p.replace(/^\/api(\/|$)/, "/");
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
  localStorage.removeItem(PROFILE_EP_KEY);
}

async function postJSONRaw(path, body, headers = {}) {
  const url = join(AUTH_BASE, path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body || {}),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  return { ok: res.ok, status: res.status, data, text, url };
}
async function postJSON(path, body, headers = {}) {
  const r = await postJSONRaw(path, body, headers);
  if (!r.ok) throw new Error(r.data?.message || `HTTP ${r.status}`);
  return r.data;
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

// ===== 로그인/회원가입 =====
export async function login({ email, password }) {
  return postJSON("/user/login", { email, password });
}
export async function signup({ email, password, name, birthday, partnerBirthday, startDate, profilePhoto }) {
  const base = { email, password, ...(birthday && { birthday }), ...(partnerBirthday && { partnerBirthday }), ...(startDate && { startDate }), ...(profilePhoto && { profilePhoto }) };
  const variants = [
    { key: "name", value: name },
    { key: "nickname", value: name },
    { key: "username", value: name },
  ].filter(v => v.value) || [{ key: null, value: null }];

  let lastErr;
  for (const v of variants) {
    const payload = v.key ? { ...base, [v.key]: v.value } : base;
    const r = await postJSONRaw("/user/signIn", payload);
    if (r.ok) return r.data;
    lastErr = new Error(r.data?.message || `HTTP ${r.status}`);
    if (r.status >= 500) break;
  }
  throw lastErr || new Error("회원가입 실패");
}

// ===== 프로필 엔드포인트 자동 탐색 & 캐시 =====
const PROFILE_ENDPOINT_CANDIDATES = [
  "/home/home",
  "/home",
  "/user/me",
  "/user/profile",
  "/user/info",
  "/user",
  "/auth/me",
  "/users/me",
];

async function detectProfileEndpoint() {
  // 캐시가 있으면 우선 사용
  const cached = localStorage.getItem(PROFILE_EP_KEY);
  if (cached) return cached;

  for (const ep of PROFILE_ENDPOINT_CANDIDATES) {
    try {
      const r = await getJSONRaw(ep, getAuthHeaders());
      if (r.ok && r.status === 200 && r.data && typeof r.data === "object") {
        localStorage.setItem(PROFILE_EP_KEY, ep);
        console.info("[auth] profile endpoint detected:", ep);
        return ep;
      }
    } catch {
      // 401/403/404 등 → 다음 후보 시도
    }
  }
  // 못 찾으면 null
  return null;
}

export async function getHomeInfo() {
  // 1) 감지된 엔드포인트 사용
  const ep = await detectProfileEndpoint();
  if (ep) return getJSON(ep, getAuthHeaders());

  // 2) 실패할 경우: 토큰만 저장된 상태에서 최소 표시용으로 로컬 유저 반환(없으면 null)
  const u = getUser();
  if (u) return u;

  // 3) 그래도 없으면 에러
  throw new Error("프로필 엔드포인트를 찾을 수 없습니다.");
}

// ===== (선택) 프로필 사진 업로드 =====
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
  return data; // { photoURL }
}
