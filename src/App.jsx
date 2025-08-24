import { useRef, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

import Intro from "./pages/Intro.jsx";
import Recommendation_AI from "./pages/Recommendation_AI.jsx";
import Optional_Date from "./pages/Optional_Date.jsx";
import Optional_Time from "./pages/Optional_Time.jsx";
import Optional_Place from "./pages/Optional_Place.jsx";
import Optional_Etc from "./pages/Optional_Etc.jsx";
import Optional_Result from "./pages/Optional_Result.jsx";

import PageSlide from "./components/PageSlide.jsx";
import TutorialOverlay from "./components/TutorialOverlay.jsx";
import AuthModal from "./components/AuthModal.jsx";
import MyPageModal from "./components/MyPageModal.jsx";
import LoadingOverlay from "./components/LoadingOverlay.jsx";

import { postRecommend } from "./api/recommend.js";
import { isLoggedIn, clearAuth } from "./api/auth.js";

function weatherToPhrase(text) {
  const t = String(text || "").toLowerCase();
  if (/비|rain|shower|drizzle/.test(t)) return "오늘은 비가 오네요 ☔ 실내 데이트 위주로 찾아볼게요!";
  if (/눈|snow/.test(t)) return "오늘은 눈이 와요 ❄️ 따뜻한 실내 위주로 추천할게요!";
  if (/맑|clear|sun/.test(t)) return "오늘은 날씨가 맑네요! ☀️";
  if (/흐|구름|cloud/.test(t)) return "오늘은 구름이 많아요 ☁️ 산책하기 좋은 코스를 골라볼게요.";
  if (/폭염|더|hot|heat/.test(t)) return "오늘은 많이 덥네요 🥵 실내/그늘 위주로 골라볼게요.";
  if (/추|cold|freez|한파/.test(t)) return "오늘은 많이 춥네요 🥶 실내 위주로 추천해볼게요.";
  if (/바람|강풍|wind/.test(t)) return "오늘은 바람이 강해요 🌬️ 바람 덜 부는 동선으로 찾아볼게요.";
  return "오늘의 날씨를 반영해서 코스를 고르는 중…";
}

// 로딩 힌트 배열 생성
function composeLoadingHints({ weatherText, date, place }) {
  const first = weatherToPhrase(weatherText);
  const addrHint = place?.address
    ? `${place.address} 근처를 탐색하는 중…`
    : "주변 스팟을 분석하는 중…";
  const dateHint = date
    ? `${new Date(date).toLocaleDateString("ko-KR")} 일정에 맞춰 조정 중…`
    : "시간대에 맞춰 코스를 조정하는 중…";
  return [
    first,
    addrHint,
    dateHint,
    "이동 시간을 줄이는 동선을 계산하는 중…",
    "사진 맛집 우선순위를 정렬하는 중…",
  ];
}

export default function App() {
  // ===== 페이지/슬라이드 =====
  const [index, setIndex] = useState(1); // 1 = Intro
  const [dir, setDir] = useState("left"); // ← '스와이프 방향' 저장
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isMouseDownRef = useRef(false);

  // 전환 락
  const SLIDE_MS = 200;
  const animatingRef = useRef(false);

  // ===== 로그인 상태 & 모달 =====
  const [authed, setAuthed] = useState(isLoggedIn());
  const [authOpen, setAuthOpen] = useState(!isLoggedIn());
  const [myOpen, setMyOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false); 

  const [weatherText, setWeatherText] = useState(
    () => localStorage.getItem("LAST_WEATHER_TEXT") || ""
  );

  useEffect(() => {
    const ok = isLoggedIn();
    setAuthed(ok);
    setAuthOpen(!ok);
  }, []);

  // ===== 튜토리얼 =====
  const [showTutorial, setShowTutorial] = useState(true);
  const closeTutorial = () => setShowTutorial(false);

  // ===== 추천 입력/응답 =====
  const [date, setDate] = useState(null);
  const [time, setTime] = useState({ hour: null, minute: null });
  const [place, setPlace] = useState({ lat: null, lng: null, address: "" });
  const [etc, setEtc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // 다른 탭에서 토큰 변경 반영
  useEffect(() => {
    const onStorage = (e) => {
      if (!e?.key) return;
      if (e.key === "AUTH_TOKEN" || e.key === "AUTH_TOKEN_EXPIRES_AT") {
        const ok = isLoggedIn();
        setAuthed(ok);
        if (!ok) setAuthOpen(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ===== 제스처(모달 열려있으면 무시) =====
  const onTouchStart = (e) => {
    if (authOpen || myOpen || mapOpen) return;
    const t = e.touches?.[0];
    if (!t) return;
    startXRef.current = t.clientX;
    startYRef.current = t.clientY;
  };

  const onTouchEnd = (e) => {
    if (authOpen || myOpen || mapOpen) return;
    if (animatingRef.current) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - startXRef.current;
    const dy = t.clientY - startYRef.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 80) {
      if (dx < 0) go(index + 1, "left");   // ← 왼쪽 스와이프
      else        go(index - 1, "right");  // ← 오른쪽 스와이프
    }
  };

  const onMouseDown = (e) => {
    if (authOpen || myOpen || mapOpen) return;
    isMouseDownRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
  };

  const onMouseUp = (e) => {
    if (authOpen || myOpen || mapOpen) return;
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    if (animatingRef.current) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 80) {
      if (dx < 0) go(index + 1, "left");
      else        go(index - 1, "right");
    }
  };

  // ===== 페이지 이동 (스와이프 방향을 명시적으로 받음) =====
  const go = (next, swipe) => {
    if (animatingRef.current) return;

    setIndex((prev) => {
      if (next === prev || next < 0 || next > 6) return prev;

      // swipe가 명시되지 않으면: forward=left, backward=right로 기본값
      const fallback = next > prev ? "left" : "right";
      const useSwipe = swipe || fallback;

      setDir(useSwipe);
      animatingRef.current = true;
      setTimeout(() => (animatingRef.current = false), SLIDE_MS + 60);

      if (next === 6 && prev !== 6) requestRecommendAndShow();

      return next;
    });
  };

  // ===== 추천 실행 =====
  async function requestRecommendAndShow() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const now = new Date();
      const useDate = date ?? now;
      const useHour = time?.hour ?? now.getHours();
      const useMinute = time?.minute ?? 0;

      const lat = place?.lat ?? 37.5665;
      const lng = place?.lng ?? 126.9780;
      const addr = (place?.address || "").trim();
      const location = addr ? addr : `${lng},${lat}`;

      const payload = {
        date: useDate.toISOString().slice(0, 10),
        time: `${String(useHour).padStart(2, "0")}:${String(useMinute).padStart(2, "0")}`,
        location,
        lat,
        lng,
        etc: (etc || "").trim(),
      };

      const data = await postRecommend(payload);
      setResult(data);
      if (data?.weather_text) {
        setWeatherText(data.weather_text);
        try { localStorage.setItem("LAST_WEATHER_TEXT", data.weather_text); } catch {}
      }
    } catch (e) {
      setError(e?.message || "추천 실패");
    } finally {
      setLoading(false);
    }
  }

  // ===== 화면 =====
  const renderScreen = () => {
    switch (index) {
      case 1:
        return (
          <PageSlide key="intro" dir={dir} duration={SLIDE_MS / 1000}>
            <Intro
              onSwipeLeft={() => go(2, "left")}   // ← 다음: date
              onSwipeRight={() => go(0, "right")} // ← 이전: recom ai
              showUserButton={!(authOpen || myOpen)}
              isAuthed={authed}
              onUserButtonClick={() =>
                authed ? setMyOpen(true) : setAuthOpen(true)
              }
            />
          </PageSlide>
        );
      case 0:
        return (
          <PageSlide key="ai" dir={dir} duration={SLIDE_MS / 1000}>
            <Recommendation_AI
              onNext={() => go(1, "left")}            // ← 다음: intro
              onRequestRecommend={requestRecommendAndShow}
            />
          </PageSlide>
        );
      case 2:
        return (
          <PageSlide key="date" dir={dir} duration={SLIDE_MS / 1000}>
            <Optional_Date
              value={date}
              onChange={setDate}
              onNext={() => go(3, "left")}
              onPrev={() => go(1, "right")}
            />
          </PageSlide>
        );
      case 3:
        return (
          <PageSlide key="time" dir={dir} duration={SLIDE_MS / 1000}>
          <Optional_Time
              value={time}
              onChange={setTime}
              onNext={() => go(4, "left")}
              onPrev={() => go(2, "right")}
            />
          </PageSlide>
        );
      case 4:
        return (
          <PageSlide key="place" dir={dir} duration={SLIDE_MS / 1000}>
            <Optional_Place
              value={place}
              onChange={setPlace}
              onNext={() => go(5, "left")}
              onPrev={() => go(3, "right")}
              mapOpen={mapOpen} 
              setMapOpen={setMapOpen}
            />
          </PageSlide>
        );
      case 5:
        return (
          <PageSlide key="etc" dir={dir} duration={SLIDE_MS / 1000}>
            <Optional_Etc
              value={etc}
              onChange={setEtc}
              onNext={() => go(6, "left")}
              onPrev={() => go(4, "right")}
              onSubmit={requestRecommendAndShow}
            />
          </PageSlide>
        );
      case 6:
        return (
          <PageSlide key="result" dir={dir} duration={SLIDE_MS / 1000}>
            <Optional_Result
              loading={loading}
              error={error}
              result={result}
              onPrev={() => go(5, "right")}
            />
          </PageSlide>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-white"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {/* custom에 현재 '스와이프 방향'을 전달 */}
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        {renderScreen()}
      </AnimatePresence>

      <LoadingOverlay
        open={index === 6 && loading}
        hints={composeLoadingHints({ weatherText, date, place })}
      />

      {/* 로그인 모달 */}
      <AuthModal
        open={authOpen}
        onSkip={() => {
          setAuthOpen(false);
          setAuthed(false);
        }}
        onSuccess={() => {
          setAuthOpen(false);
          setAuthed(true);
        }}
      />

      {/* 인트로에서만, 모달 닫혀 있을 때만 튜토리얼 */}
      {index === 1 && (
        <TutorialOverlay
          open={!authOpen && !myOpen && showTutorial}
          onClose={closeTutorial}
        />
      )}

      {/* 마이페이지 모달 */}
      <MyPageModal
        open={myOpen}
        onClose={() => setMyOpen(false)}
        onLogout={() => {
          clearAuth();
          setMyOpen(false);
          setAuthed(false);
          setAuthOpen(true);
        }}
      />
    </div>
  );
}
