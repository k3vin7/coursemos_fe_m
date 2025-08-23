// src/pages/Optional_Result.jsx
import { useMemo } from "react";

/* ---------- 유틸 ---------- */
const tryParseJSON = (v) => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s.startsWith("{") && !s.startsWith("[")) return null;
  try { return JSON.parse(s); } catch { return null; }
};

const splitBullets = (v) => {
  if (typeof v !== "string") return [];
  const lines = v
    .split(/\r?\n+/)
    .map((x) => x.replace(/^\s*[-•*\d.)]+\s*/, "").trim())
    .filter((x) => x.length > 0);
  return lines.length >= 2 ? lines : [];
};

const truncate = (s, n = 160) =>
  !s ? "" : s.length > n ? s.slice(0, n - 1) + "…" : s;

const toCardFromString = (s, i, tag) => ({
  id: `${tag || "item"}-${i}`,
  title: `추천 항목 ${i + 1}`,
  subtitle: tag || "",
  description: String(s),
  image: "",
  link: "",
  tags: tag ? [tag] : [],
  raw: s,
});

const toCardFromObj = (o, i, tag) => ({
  id: o.id ?? o._id ?? i,
  title:
    o.title ??
    o.name ??
    o.place ??
    o.course ??
    o.heading ??
    o.label ??
    `추천 항목 ${i + 1}`,
  subtitle:
    o.subtitle ??
    o.address ??
    o.location ??
    o.zone ??
    o.area ??
    o.category ??
    "",
  description:
    o.description ??
    o.desc ??
    o.summary ??
    o.details ??
    o.explain ??
    o.text ??
    "",
  image: o.image || o.image_url || o.img || o.thumbnail || "",
  link: o.url || o.link || o.href || "",
  tags: tag ? [tag] : o.tags || o.keywords || o.hashtags || [],
  raw: o,
});

const deepCollectArrays = (obj) => {
  const arrays = [];
  const seen = new Set();
  const queue = [obj];
  while (queue.length) {
    const cur = queue.shift();
    if (cur && typeof cur === "object" && !seen.has(cur)) {
      seen.add(cur);
      for (const [k, v] of Object.entries(cur)) {
        if (k.startsWith("_")) continue; // 메타키(_sent 등) 무시
        if (Array.isArray(v) && v.length > 0) arrays.push([k, v]);
        else if (v && typeof v === "object") queue.push(v);
      }
    }
  }
  return arrays;
};

/* ---------- 정규화 ---------- */
function normalizeResults(input) {
  let result = input;

  const parsed = tryParseJSON(result);
  if (parsed) result = parsed;

  if (Array.isArray(result)) {
    if (result.every((x) => typeof x === "string"))
      return result.map((s, i) => toCardFromString(s, i));
    return result.map((x, i) =>
      typeof x === "string" ? toCardFromString(x, i) : toCardFromObj(x, i)
    );
  }

  if (result && typeof result === "object") {
    const common = ["places", "results", "items", "data", "courses", "list", "entries", "suggestions", "options"];
    for (const key of common) {
      const v = result[key];
      if (Array.isArray(v) && v.length > 0) {
        if (v.every((x) => typeof x === "string"))
          return v.map((s, i) => toCardFromString(s, i, key));
        return v.map((o, i) => toCardFromObj(o, i, key));
      }
    }
    const found = deepCollectArrays(result);
    if (found.length) {
      const [tag, arr] = found[0];
      if (arr.every((x) => typeof x === "string"))
        return arr.map((s, i) => toCardFromString(s, i, tag));
      return arr.map((o, i) => toCardFromObj(o, i, tag));
    }

    if ("name" in result || "title" in result) return [toCardFromObj(result, 0)];

    const stringPairs = Object.entries(result).filter(
      ([, v]) => typeof v === "string" && v.trim().length > 0
    );
    if (stringPairs.length)
      return stringPairs.map(([k, v], i) =>
        toCardFromObj({ title: k, description: v }, i, "fields")
      );
  }

  if (typeof result === "string") {
    const bullets = splitBullets(result);
    if (bullets.length) return bullets.map((s, i) => toCardFromString(s, i));
    return [toCardFromString(result, 0)];
  }

  return [];
}

/* ---------- 컴포넌트 ---------- */
export default function Optional_Result({
  onPrev,
  onDone,
  loading,
  error,
  result,
}) {
  const cards = useMemo(() => normalizeResults(result), [result]);

  return (
    <div className="h-screen w-screen overflow-y-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">추천 결과</h1>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 active:scale-95"
              onClick={onPrev}
            >
              ← 수정하기
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:brightness-95 active:scale-95"
              onClick={onDone}
            >
              완료
            </button>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-pulse"
              >
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4">
            오류: {error}
          </div>
        )}

        {!loading && !error && cards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map((c, i) => (
              <article
                key={c.id ?? i}
                className="group rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white hover:shadow-lg transition"
              >
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.title}
                    className="w-full h-44 object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
                    <span className="text-4xl">🧭</span>
                  </div>
                )}

                <div className="p-4">
                  <h3 className="text-lg font-semibold line-clamp-1">{c.title}</h3>
                  {c.subtitle && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                      {c.subtitle}
                    </p>
                  )}
                  {c.description && (
                    <p className="text-sm text-gray-700 mt-2">
                      {truncate(c.description, 160)}
                    </p>
                  )}
                  {Array.isArray(c.tags) && c.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {c.tags.slice(0, 5).map((t, j) => (
                        <span
                          key={j}
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200"
                        >
                          {String(t)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    {c.link ? (
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 h-9 rounded-lg bg-indigo-600 text-white text-sm flex items-center hover:brightness-95 active:scale-95"
                      >
                        자세히 보기
                      </a>
                    ) : null}
                    <button
                      onClick={() =>
                        navigator.clipboard
                          .writeText(
                            typeof c.raw === "string"
                              ? c.raw
                              : JSON.stringify(c.raw, null, 2)
                          )
                          .catch(() => {})
                      }
                      className="px-3 h-9 rounded-lg bg-gray-100 border border-gray-200 text-sm hover:bg-gray-200 active:scale-95"
                    >
                      내용 복사
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && cards.length === 0 && (
          <div className="text-gray-500">표시할 결과가 없어요.</div>
        )}
      </div>
    </div>
  );
}
