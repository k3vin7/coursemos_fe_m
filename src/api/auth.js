// src/api/auth.js
const AUTH_BASE = (import.meta.env.VITE_AUTH_BASE_URL || "/api").replace(/\/+$/, "");

// ===== 공통 =====
const TOKEN_KEY  = "AUTH_TOKEN";
const USER_KEY   = "AUTH_USER";
const RTOKEN_KEY = "AUTH_REFRESH_TOKEN";
const EXP_KEY    = "AUTH_TOKEN_EXPIRES_AT";

function join(base, path) {
  const b = (base || "").replace(/\/+$/, "");
  let p = String(path || "");
  p = p.replace(/^\/+/, "/");
  p = p.replace(/^\/api(\/|$)/, "/");     // '/api' 이중 제거
  return b + (p.startsWith("/") ? p : `/${p}`);
}

export function saveUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() { return localStorage.getItem(TOKEN_KEY) || ""; }
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

// ---- fetch helpers (에러 내용 그대로 노출) ----
async function postJSONRaw(path, body, headers = {}) {
  const url = join(AUTH_BASE, path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body || {}),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text };}
  return { ok: res.ok, status: res.status, data, text, url, body };
}
async function getJSON(path, headers = {}) {
  const url = join(AUTH_BASE, path);
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json", ...headers } });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text };}
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}
async function postJSON(path, body, headers = {}) {
  const r = await postJSONRaw(path, body, headers);
  if (!r.ok) {
    console.warn("[auth] POST error", { url: r.url, status: r.status, response: r.text, body: r.body });
    throw new Error(r.data?.message || `HTTP ${r.status}`);
  }
  return r.data;
}

// ====== 로그인 ======
export async function login({ email, password }) {
  return postJSON("/user/login", { email, password });
}

// ====== 회원가입 (호환 모드) ======
// 백엔드가 'name' 대신 'nickname'이나 'username'을 요구하는 경우 자동 재시도
export async function signup({ email, password, name, birthday, partnerBirthday, startDate, profilePhoto }) {
  const basePayload = {
    email, password,
    ...(birthday ? { birthday } : {}),
    ...(partnerBirthday ? { partnerBirthday } : {}),
    ...(startDate ? { startDate } : {}),
    ...(profilePhoto ? { profilePhoto } : {}),
  };

  const variants = [
    { key: "name", value: name },          // { name }
    { key: "nickname", value: name },      // { nickname }
    { key: "username", value: name },      // { username }
  ].filter(v => v.value); // 이름이 있을 때만

  // 최소 1회는 시도 (이름 없이 받는 서버일 수도 있으니)
  if (variants.length === 0) variants.push({ key: null, value: null });

  let lastErr;
  for (const v of variants) {
    const payload = v.key ? { ...basePayload, [v.key]: v.value } : { ...basePayload };
    const r = await postJSONRaw("/user/signIn", payload);
    if (r.ok) return r.data;
    // 404면 경로 문제, 400이면 필드 검증 실패 가능성 → 다음 변형 시도
    lastErr = new Error(r.data?.message || `HTTP ${r.status}`);
    console.warn("[auth] signup variant failed", { triedKey: v.key, status: r.status, response: r.text });
    if (r.status >= 500) break; // 서버 에러면 더 시도하지 않음
  }
  throw lastErr || new Error("회원가입 실패");
}

// ====== 홈 정보 ======
export async function getHomeInfo() {
  return getJSON("/home/home", { ...getAuthHeaders() });
}

// ====== (선택) 프로필 사진 업로드 ======
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
