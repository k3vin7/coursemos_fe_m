// src/pages/Optional_Result.jsx
import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";

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

const deepCollectArrays = (obj) => {
  const arrays = [];
  const seen = new Set();
  const queue = [obj];
  while (queue.length) {
    const cur = queue.shift();
    if (cur && typeof cur === "object" && !seen.has(cur)) {
      seen.add(cur);
      for (const [k, v] of Object.entries(cur)) {
        if (k.startsWith("_")) continue;
        if (Array.isArray(v) && v.length > 0) arrays.push([k, v]);
        else if (v && typeof v === "object") queue.push(v);
      }
    }
  }
  return arrays;
};

const minutesToLabel = (min) => {
  if (!min && min !== 0) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
};

/* ---------- 기존 카드 정규화(백업용) ---------- */
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
  tags: o.tags || o.keywords || o.hashtags || (tag ? [tag] : []),
  raw: o,
});

function normalizeGeneric(input) {
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

/* ---------- 코스 전용 파서 ---------- */
const toCourseCard = (course, i, groupTag = "courses") => {
  const stops = Array.isArray(course?.stops) ? course.stops : [];
  const firstImg = stops.find((s) => s?.photo_url)?.photo_url || "";
  const names = stops.map((s) => s?.name).filter(Boolean);
  const cats = Array.from(new Set(stops.map((s) => s?.category).filter(Boolean)));
  const tods = Array.from(new Set(stops.map((s) => s?.suggested_time_of_day).filter(Boolean)));

  return {
    id: course.id ?? course._id ?? `${groupTag}-${i}`,
    title: course.title ?? `코스 ${i + 1}`,
    subtitle: `${minutesToLabel(course.total_estimated_minutes ?? 0)} · ${stops.length}곳`,
    description: names.slice(0, 6).join(" → "), // 코스 흐름 요약
    image: firstImg,
    link: "", // 필요시 코스 공유 링크 등 매핑
    tags: [...cats.slice(0, 3), ...tods.slice(0, 2)],
    raw: course,
  };
};

function extractCourseGroups(input) {
  // 반환: [{ title: "courses", cards: [...] }, ...]
  let data = input;
  const parsed = tryParseJSON(data);
  if (parsed) data = parsed;

  const groups = [];

  if (Array.isArray(data)) {
    // 배열이 곧 코스 리스트인지 판단(요소에 stops 배열이 있으면 코스)
    if (data.every((c) => Array.isArray(c?.stops))) {
      groups.push({
        title: "코스",
        cards: data.map((c, i) => toCourseCard(c, i, "courses")),
      });
      return groups;
    }
    return groups;
  }

  if (data && typeof data === "object") {
    // 1) 우선순위: top-level "courses"
    if (Array.isArray(data.courses) && data.courses.length > 0) {
      const arr = data.courses.filter((c) => Array.isArray(c?.stops));
      if (arr.length) {
        groups.push({
          title: "코스",
          cards: arr.map((c, i) => toCourseCard(c, i, "courses")),
        });
      }
    }
    // 2) 그 외 키들 중 'stops'를 가진 코스 배열을 추가 섹션으로
    for (const [key, arr] of Object.entries(data)) {
      if (key === "courses") continue;
      if (Array.isArray(arr) && arr.length > 0 && arr.every((c) => Array.isArray(c?.stops))) {
        groups.push({
          title: key,
          cards: arr.map((c, i) => toCourseCard(c, i, key)),
        });
      }
    }
    // 3) 중첩 객체 안에 있는 코스 배열도 찾아서 하나만 더(필요시 확장)
    if (groups.length === 0) {
      const arrays = deepCollectArrays(data);
      for (const [tag, arr] of arrays) {
        if (arr.every((c) => Array.isArray(c?.stops))) {
          groups.push({
            title: tag,
            cards: arr.map((c, i) => toCourseCard(c, i, tag)),
          });
          break;
        }
      }
    }
  }

  return groups;
}

/* ---------- 상세 모달 ---------- */
function CourseDetailModal({ open, course, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !course) return null;

  const stops = Array.isArray(course.raw?.stops) ? course.raw.stops : [];

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute inset-0 grid place-items-center p-4" onClick={(e) => e.stopPropagation()}>
        <article className="w-[96vw] max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-200">
          {/* 헤더 */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-5 py-3 border-b">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold truncate">{course.title}</h2>
              <button
                aria-label="닫기"
                onClick={onClose}
                className="w-9 h-9 rounded-full border grid place-items-center hover:bg-gray-50 active:scale-95"
              >
                ×
              </button>
            </div>
            {course.subtitle ? (
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{course.subtitle}</p>
            ) : null}
          </div>

          {/* 대표 이미지 */}
          {course.image ? (
            <img
              src={course.image}
              alt={course.title}
              className="w-full h-56 object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}

          {/* 본문: 코스 구성 */}
          <div className="p-5 space-y-6">
            {stops.length > 0 && (
              <section>
                <h3 className="text-base font-semibold mb-3">코스 구성</h3>
                <ol className="space-y-3">
                  {stops.map((s, i) => (
                    <li key={i} className="p-3 rounded-2xl border bg-white">
                      <div className="flex gap-3">
                        {s.photo_url ? (
                          <img
                            src={s.photo_url}
                            alt={s.name || `스탑 ${i + 1}`}
                            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gray-100 grid place-items-center flex-shrink-0">
                            <span className="text-xl">📍</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{i + 1}</span>
                            <h4 className="font-medium text-gray-800 truncate">
                              {s.name || `스탑 ${i + 1}`}
                            </h4>
                            {s.typical_duration_min ? (
                              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                {minutesToLabel(s.typical_duration_min)}
                              </span>
                            ) : null}
                          </div>
                          {s.category || s.suggested_time_of_day ? (
                            <div className="flex gap-1.5 mt-1">
                              {s.category && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-gray-100 border">
                                  {s.category}
                                </span>
                              )}
                              {s.suggested_time_of_day && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-gray-100 border">
                                  {s.suggested_time_of_day}
                                </span>
                              )}
                            </div>
                          ) : null}
                          {s.desc ? (
                            <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                              {s.desc}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </article>
      </div>
    </div>,
    document.body
  );
}

/* ---------- 컴포넌트 ---------- */
export default function Optional_Result({
  onPrev,
  onDone,
  loading,
  error,
  result,
}) {
  const [selected, setSelected] = useState(null);

  const { courseGroups, fallbackCards } = useMemo(() => {
    const groups = extractCourseGroups(result);
    if (groups.length > 0) return { courseGroups: groups, fallbackCards: [] };
    // 코스가 하나도 없다면 기존 방식으로라도 보여주기
    return { courseGroups: [], fallbackCards: normalizeGeneric(result) };
  }, [result]);

  return (
    <div className="h-screen w-screen overflow-y-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">추천 결과</h1>
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

        {/* 코스가 있을 때: 섹션별 렌더 */}
        {!loading && !error && courseGroups.length > 0 && (
          <div className="space-y-8">
            {courseGroups.map((g, gi) => (
              <section key={gi}>
                {courseGroups.length > 1 && (
                  <h2 className="text-lg font-semibold mb-3">{g.title}</h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {g.cards.map((c, i) => (
                    <article
                      key={c.id ?? i}
                      role="button"
                      onClick={() => setSelected(c)}
                      className="group cursor-pointer rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white hover:shadow-lg transition"
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
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{c.subtitle}</p>
                        )}
                        {c.description && (
                          <p className="text-sm text-gray-700 mt-2">{truncate(c.description, 160)}</p>
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
                          <button
                            className="ml-auto px-3 h-9 rounded-lg border text-sm hover:bg-gray-50 active:scale-95"
                            onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                          >
                            상세 보기
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* 코스가 없을 때: 기존 카드 렌더 */}
        {!loading && !error && courseGroups.length === 0 && fallbackCards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {fallbackCards.map((c, i) => (
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
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{c.subtitle}</p>
                  )}
                  {c.description && (
                    <p className="text-sm text-gray-700 mt-2">{truncate(c.description, 160)}</p>
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
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && courseGroups.length === 0 && (!fallbackCards || fallbackCards.length === 0) && (
          <div className="text-gray-500">표시할 결과가 없어요.</div>
        )}
      </div>

      {/* 상세 모달 */}
      <CourseDetailModal open={!!selected} course={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
