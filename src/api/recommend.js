// src/api/recommend.js
const AI_BASE = (import.meta.env.VITE_API_BASE_URL || "/ai").replace(/\/+$/, "");
function join(base, path) {
  const b = (base || "").replace(/\/+$/, "");
  let p = String(path || "");
  p = p.replace(/^\/+/, "/");
  p = p.replace(/^\/ai(\/|$)/, "/");   // '/ai' 이중 제거
  return b + (p.startsWith("/") ? p : `/${p}`);
}

export async function postRecommend(body) {
  const url = join(AI_BASE, "/recommend");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}
