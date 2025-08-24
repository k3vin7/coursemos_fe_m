// src/pages/Recommendation_AI.jsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { postRecommend } from "../api/recommend.js";

/* ---------- 유틸 ---------- */
const isNonEmpty = (v) => v !== undefined && v !== null && `${v}`.trim() !== "";
const tryParseJSON = (v) => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s.startsWith("{") && !s.startsWith("[")) return null;
  try { return JSON.parse(s); } catch { return null; }
};
const truncate = (s, n = 160) => (!s ? "" : s.length > n ? s.slice(0, n - 1) + "…" : s);
const minutesToLabel = (min) => {
  if (!isNonEmpty(min)) return "";
  const num = Number(min);
  if (Number.isNaN(num)) return "";
  const h = Math.floor(num / 60);
  const m = num % 60;
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
};

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

/* ---------- 키 매핑 & 정규화 (Optional_Result와 동일한 로직) ---------- */
const getAny = (o, keys = []) => {
  for (const k of keys) {
    if (o && k in o && isNonEmpty(o[k])) return o[k];
  }
  return undefined;
};

function normalizeStop(stopRaw = {}) {
  const name = getAny(stopRaw, ["name", "장소명", "place", "title", "label"]);
  const desc = getAny(stopRaw, ["desc", "description", "설명", "summary", "explain", "text"]);
  const category = getAny(stopRaw, ["category", "카테고리", "type"]);
  const suggested_time_of_day = getAny(stopRaw, ["suggested_time_of_day", "권장시간대", "time_of_day"]);
  const photo_url = getAny(stopRaw, ["photo_url", "image_url", "image", "img", "thumbnail"]);
  const durationLike = getAny(stopRaw, [
    "typical_duration_min",
    "duration_min",
    "권장체류시간",
    "stay_minutes",
    "duration",
  ]);
  const typical_duration_min = isNonEmpty(durationLike) ? Number(durationLike) : undefined;

  return {
    name: isNonEmpty(name) ? String(name) : "",
    desc: isNonEmpty(desc) ? String(desc) : "",
    category: isNonEmpty(category) ? String(category) : "",
    suggested_time_of_day: isNonEmpty(suggested_time_of_day) ? String(suggested_time_of_day) : "",
    photo_url: isNonEmpty(photo_url) ? String(photo_url) : "",
    typical_duration_min: Number.isFinite(typical_duration_min) ? typical_duration_min : undefined,
    _original: stopRaw,
  };
}

function normalizeCourse(courseRaw = {}, idx = 0) {
  const stopsArr =
    getAny(courseRaw, ["stops", "스톱", "Stops"]) ||
    getAny(courseRaw, ["스탑"]) || [];
  const stops = Array.isArray(stopsArr) ? stopsArr.map((s) => normalizeStop(s)) : [];

  const minutesLike =
    getAny(courseRaw, ["total_estimated_minutes", "총예상소요시간", "duration_min"]) ??
    (stops.some((s) => isNonEmpty(s.typical_duration_min))
      ? stops.reduce((acc, s) => acc + (s.typical_duration_min || 0), 0)
      : undefined);

  const title = getAny(courseRaw, ["title", "name", "코스명", "course", "label"]) || `코스 ${idx + 1}`;

  return {
    id: getAny(courseRaw, ["id", "_id"]) ?? `course-${idx}`,
    title: String(title),
    total_estimated_minutes: Number.isFinite(Number(minutesLike)) ? Number(minutesLike) : undefined,
    stops,
    _original: courseRaw,
  };
}

const toCourseCard = (normCourse, i, groupTag = "courses") => {
  const firstImg = normCourse.stops.find((s) => s.photo_url)?.photo_url || "";
  const names = normCourse.stops.map((s) => s.name).filter(Boolean);
  const cats = Array.from(new Set(normCourse.stops.map((s) => s.category).filter(Boolean)));
  const tods = Array.from(
    new Set(normCourse.stops.map((s) => s.suggested_time_of_day).filter(Boolean))
  );

  return {
    id: normCourse.id ?? `${groupTag}-${i}`,
    title: normCourse.title ?? `코스 ${i + 1}`,
    subtitle: [
      normCourse.total_estimated_minutes ? minutesToLabel(normCourse.total_estimated_minutes) : "",
      `${normCourse.stops.length}곳`,
    ].filter(Boolean).join(" · "),
    description: names.slice(0, 6).join(" → "),
    image: firstImg,
    link: "",
    tags: [...cats.slice(0, 3), ...tods.slice(0, 2)],
    raw: normCourse,
  };
};

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
  title: o.title ?? o.name ?? o.place ?? o.course ?? o.heading ?? o.label ?? `추천 항목 ${i + 1}`,
  subtitle: o.subtitle ?? o.address ?? o.location ?? o.zone ?? o.area ?? o.category ?? "",
  description: o.description ?? o.desc ?? o.summary ?? o.details ?? o.explain ?? o.text ?? "",
  image: o.image || o.image_url || o.img || o.thumbnail || "",
  link: o.url || o.link || o.href || "",
  tags: o.tags || o.keywords || o.hashtags || (tag ? [tag] : []),
  raw: o,
});

function extractCourseGroups(input) {
  let data = input;
  const parsed = tryParseJSON(data);
  if (parsed) data = parsed;

  const groups = [];
  const isCourseArray = (arr) =>
    Array.isArray(arr) && arr.length > 0 && arr.every((c) => {
      const s = getAny(c || {}, ["stops", "스톱", "Stops", "스탑"]);
      return Array.isArray(s);
    });

  if (Array.isArray(data) && isCourseArray(data)) {
    const cards = data.map((c, i) => toCourseCard(normalizeCourse(c, i), i, "courses"));
    groups.push({ title: "코스", cards });
    return groups;
  }

  if (data && typeof data === "object") {
    if (isCourseArray(data.courses)) {
      const cards = data.courses.map((c, i) => toCourseCard(normalizeCourse(c, i), i, "courses"));
      groups.push({ title: "코스", cards });
    }
    for (const [key, arr] of Object.entries(data)) {
      if (key === "courses") continue;
      if (isCourseArray(arr)) {
        const cards = arr.map((c, i) => toCourseCard(normalizeCourse(c, i), i, key));
        groups.push({ title: key, cards });
      }
    }
    if (groups.length === 0) {
      const arrays = deepCollectArrays(data);
      for (const [tag, arr] of arrays) {
        if (isCourseArray(arr)) {
          const cards = arr.map((c, i) => toCourseCard(normalizeCourse(c, i), i, tag));
          groups.push({ title: tag, cards });
          break;
        }
      }
    }
  }
  return groups;
}

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
      return stringPairs.map(([k, v], i) => toCardFromObj({ title: k, description: v }, i, "fields"));
  }

  if (typeof result === "string") return [toCardFromString(result, 0)];
  return [];
}

/* ---------- 상세 모달 (Optional_Result와 동일) ---------- */
function KeyValueList({ obj, omit = [] }) {
  if (!obj || typeof obj !== "object") return null;
  const entries = Object.entries(obj).filter(([k, v]) => !omit.includes(k) && isNonEmpty(v));
  if (!entries.length) return null;
  return (
    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      {entries.map(([k, v]) => (
        <FragmentKV key={k} k={k} v={v} />
      ))}
    </dl>
  );
}
function FragmentKV({ k, v }) {
  return (
    <>
      <dt className="text-gray-500">{k}</dt>
      <dd className="text-gray-800 break-words whitespace-pre-wrap">{String(v)}</dd>
    </>
  );
}

function CourseDetailModal({ open, course, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !course) return null;

  const norm = course.raw;
  const stops = Array.isArray(norm?.stops) ? norm.stops : [];
  const courseExtra = norm?._original || {};

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute inset-0 grid place-items-center p-4" onClick={(e) => e.stopPropagation()}>
        <article className="w-[96vw] max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-200">
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

          <div className="p-5 space-y-8">
            <section>
              <h3 className="text-base font-semibold mb-2">코스 정보</h3>
              <div className="text-sm text-gray-700">
                {isNonEmpty(norm?.total_estimated_minutes) && (
                  <div className="mb-1">
                    총 예상 소요: <b>{minutesToLabel(norm.total_estimated_minutes)}</b>
                  </div>
                )}
                <KeyValueList obj={courseExtra} omit={["스톱", "stops", "Stops"]} />
              </div>
            </section>

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
                            {isNonEmpty(s.typical_duration_min) && (
                              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                {minutesToLabel(s.typical_duration_min)}
                              </span>
                            )}
                          </div>

                          {(s.category || s.suggested_time_of_day) && (
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
                          )}

                          {s.desc && (
                            <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                              {s.desc}
                            </p>
                          )}

                          <KeyValueList
                            obj={s._original}
                            omit={[
                              "photo_url", "image_url", "image", "img", "thumbnail",
                              "장소명", "name", "place", "title", "label",
                              "설명", "desc", "description", "summary", "explain", "text",
                              "권장체류시간", "typical_duration_min", "duration_min", "stay_minutes", "duration",
                              "카테고리", "category", "type",
                              "권장시간대", "suggested_time_of_day", "time_of_day",
                            ]}
                          />
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

/* ---------- 페이지 컴포넌트 ---------- */
export default function Recommendation_AI({ onPrev, onNext }) {
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);

  // 오늘/현재시각 라벨
  const now = new Date();
  const dateISO = now.toISOString().slice(0, 10);
  const timeLabel = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setResult(null);

    // 현위치 가져오기
    const getGeo = () =>
      new Promise((resolve) => {
        if (!("geolocation" in navigator)) {
          resolve({ lat: 37.5665, lng: 126.9780 }); // 서울 시청 좌표 fallback
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve({ lat: 37.5665, lng: 126.9780 }),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      });

    (async () => {
      const { lat, lng } = await getGeo();

      const payload = {
        date: dateISO,
        time: timeLabel,
        location: `${lng},${lat}`, // 주소가 없으면 "lng,lat"로
        lat,
        lng,
        etc: "",
      };

      try {
        const data = await postRecommend(payload);
        if (!alive) return;
        setResult(data);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "추천 요청 실패");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시 1회 자동 추천

  const { courseGroups, fallbackCards } = useMemo(() => {
    const groups = extractCourseGroups(result);
    if (groups.length > 0) return { courseGroups: groups, fallbackCards: [] };
    return { courseGroups: [], fallbackCards: normalizeGeneric(result) };
  }, [result]);

  return (
    <div className="h-screen w-screen overflow-y-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">AI 추천</h1>
            <p className="text-sm text-gray-500 mt-1">
              기준: <b>{dateISO}</b> {timeLabel} · 장소: <b>현위치</b> · 추가정보: 없음
            </p>
          </div>
          <div className="flex gap-2">
            {onPrev && (
              <button
                className="px-3 h-9 rounded-lg border text-sm hover:bg-gray-50 active:scale-95"
                onClick={onPrev}
              >
                이전
              </button>
            )}
            {onNext && (
              <button
                className="px-3 h-9 rounded-lg border text-sm hover:bg-gray-50 active:scale-95"
                onClick={onNext}
              >
                다음
              </button>
            )}
          </div>
        </div>

        {/* 로딩 스켈레톤 */}
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

        {/* 에러 */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4">
            오류: {error}
          </div>
        )}

        {/* 코스 결과 */}
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

        {/* 범용 카드 */}
        {!loading && !error && courseGroups.length === 0 && result && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {normalizeGeneric(result).map((c, i) => (
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

        {/* 결과 없음 */}
        {!loading && !error && !result && (
          <div className="text-gray-500">표시할 결과가 없어요.</div>
        )}
      </div>

      {/* 상세 모달 */}
      <CourseDetailModal open={!!selected} course={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
