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
import { postRecommend } from "./api/recommend.js";

export default function App() {
  // 0=AI, 1=Intro(시작), 2=Date, 3=Time, 4=Place, 5=Etc, 6=Result
  const [index, setIndex] = useState(1);
  const [dir, setDir] = useState("right");

  // 스와이프 제스처
  const startPos = useRef(null);
  const isDragging = useRef(false);

  // 스와이프 잠금(지도 모달/튜토리얼 오버레이 등)
  const [swipeLocked, setSwipeLocked] = useState(false);
  const swipeDisabled = () => swipeLocked || Boolean(window.__SWIPE_DISABLED);

  // 튜토리얼(인트로에서 첫 1회)
  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem("TUTORIAL_SEEN_V2")
  );
  const closeTutorial = () => {
    localStorage.setItem("TUTORIAL_SEEN_V2", "1");
    setShowTutorial(false);
  };

  // 입력값(App이 보관)
  const [date, setDate]   = useState(null);                      // Date 객체
  const [time, setTime]   = useState({ hour: null, minute: 0 }); // {hour, minute}
  const [place, setPlace] = useState({ lat: null, lng: null, address: "" });
  const [etc, setEtc]     = useState("");

  // 결과 상태
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState("");

  // 페이지 이동
  const go = (next) => {
    if (next === index || next < 0 || next > 6) return;

    // 방향(원래 규칙 유지)
    if (index === 1 && next === 0) setDir("left");       // Intro -> AI
    else if (index === 1 && next >= 2) setDir("right");  // Intro -> Optional_*
    else setDir(next < index ? "left" : "right");

    // Etc(5) → Result(6)에서만 추천 호출
    if (index === 5 && next === 6) {
      requestRecommendAndShow();
      return; // 여기서 setIndex/로딩 처리
    }

    requestAnimationFrame(() => setIndex(next));
  };

  // 스와이프 핸들러
  const threshold = 150;
  const resetDrag = () => { isDragging.current = false; startPos.current = null; };

  const onTouchStart = (e) => {
    if (swipeDisabled()) return resetDrag();
    isDragging.current = true;
    startPos.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (swipeDisabled()) return resetDrag();
    if (!isDragging.current || startPos.current == null) return;
    const dx = e.changedTouches[0].clientX - startPos.current;
    if (dx > threshold) go(index - 1);
    else if (dx < -threshold) go(index + 1);
    resetDrag();
  };

  const onMouseDown = (e) => {
    if (swipeDisabled()) return resetDrag();
    isDragging.current = true;
    startPos.current = e.clientX;
  };
  const onMouseUp = (e) => {
    if (swipeDisabled()) return resetDrag();
    if (!isDragging.current || startPos.current == null) return;
    const dx = e.clientX - startPos.current;
    if (dx > threshold) go(index - 1);
    else if (dx < -threshold) go(index + 1);
    resetDrag();
  };

  useEffect(() => {
    const preventSelect = (e) => { if (isDragging.current) e.preventDefault(); };
    window.addEventListener("selectstart", preventSelect);
    return () => window.removeEventListener("selectstart", preventSelect);
  }, []);

  // ====== 추천 요청 (비어있을 때 기본값 보정 포함) ======
  async function requestRecommendAndShow() {
    // 결과 화면 먼저 전환 + 로딩
    requestAnimationFrame(() => setIndex(6));
    setLoading(true);
    setError("");
    setResult(null);

    // 기본값 보정 (오늘/현재시간 반올림/서울 시청 좌표)
    const now = new Date();
    const useDate = date ?? now;
    const useHour = time?.hour ?? now.getHours();
    const useMinute = time?.minute ?? (now.getMinutes() < 30 ? 0 : 30);

    let loc =
      (place?.address && place.address.trim()) ||
      (place?.lat != null && place?.lng != null ? `${place.lat},${place.lng}` : "");
    if (!loc) loc = "37.5665,126.9780"; // 서울 시청

    const payload = {
      date: useDate.toISOString().slice(0, 10), // YYYY-MM-DD
      time: `${String(useHour).padStart(2, "0")}:${String(useMinute).padStart(2, "0")}`, // HH:MM
      location: loc,
      // etc도 필요하면 백엔드 스키마에 맞춰 추가
      // etc,
    };

    try {
      const data = await postRecommend(payload);
      setResult({ ...data }); // Optional_Result는 원본보기/복사 제거됨
    } catch (e) {
      setError(e.message || "추천 요청 실패");
    } finally {
      setLoading(false);
    }
  }
  // ===============================================

  const renderScreen = () => {
    switch (index) {
      case 0:
        return (
          <PageSlide key="ai" dir={dir}>
            <Recommendation_AI onBack={() => go(1)} />
          </PageSlide>
        );
      case 1:
        return (
          <PageSlide key="intro" dir={dir}>
            <Intro onSwipeRight={() => go(0)} onSwipeLeft={() => go(2)} />
          </PageSlide>
        );
      case 2:
        return (
          <PageSlide key="opt-date" dir={dir}>
            <Optional_Date
              value={date}
              onChange={setDate}
              onPrev={() => go(1)}
              onNext={() => go(3)}
            />
          </PageSlide>
        );
      case 3:
        return (
          <PageSlide key="opt-time" dir={dir}>
            <Optional_Time
              value={time}
              onChange={setTime}
              onPrev={() => go(2)}
              onNext={() => go(4)}
            />
          </PageSlide>
        );
      case 4:
        return (
          <PageSlide key="opt-place" dir={dir}>
            <Optional_Place
              value={place}
              onChange={setPlace}
              onPrev={() => go(3)}
              onNext={() => go(5)}
              onSwipeLockChange={(v) => setSwipeLocked(!!v)}
            />
          </PageSlide>
        );
      case 5:
        return (
          <PageSlide key="opt-etc" dir={dir}>
            <Optional_Etc
              value={etc}
              onChange={setEtc}
              onPrev={() => go(4)}
              onNext={() => go(6)}
            />
          </PageSlide>
        );
      default:
        return (
          <PageSlide key="opt-result" dir={dir}>
            <Optional_Result
              loading={loading}
              error={error}
              result={result}
              onPrev={() => go(5)}
              onDone={() => go(1)}
            />
          </PageSlide>
        );
    }
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-white"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      <AnimatePresence mode="wait" initial={false}>
        {renderScreen()}
      </AnimatePresence>

      {/* 인트로에서만 튜토리얼 1회 표시 */}
      {index === 1 && (
        <TutorialOverlay open={showTutorial} onClose={closeTutorial} />
      )}
    </div>
  );
}
