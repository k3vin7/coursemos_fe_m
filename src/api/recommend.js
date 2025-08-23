export async function postRecommend(body) {
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const url = `${base}/recommend`;

  console.log("[POST /recommend] payload →", body);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("[POST /recommend] HTTP", res.status, text);
    throw new Error(`POST /recommend 실패 (HTTP ${res.status})`);
  }

  try {
    const json = JSON.parse(text);
    console.log("[POST /recommend] json ←", json);
    return json;
  } catch {
    console.log("[POST /recommend] text ←", text);
    return { message: text };
  }
}
