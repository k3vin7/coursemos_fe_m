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

import { postRecommend } from "./api/recommend.js";
import { getToken, clearAuth } from "./api/auth";

export default function App() {
  // 0=AI, 1=Intro, 2=Date, 3=Time, 4=Place, 5=Etc, 6=Result
  const [index, setIndex] = useState(1);
  const [dir, setDir] = useState("right");

  // 로그인 모달
  const [authOpen, setAuthOpen] = useState(() => !getToken());
  // 마이페이지 모달
  const [myOpen, setMyOpen] = useState(false);

  // 스와이프
  const startPos = useRef(null);
  const isDragging = useRef(false);
  const [swipeLocked, setSwipeLocked] = useState(false);
  const swipeDisabled = () =>
    authOpen || myOpen || swipeLocked || Boolean(window.__SWIPE_DISABLED);

  // 튜토리얼은 로그인 이후 1회
  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem("TUTORIAL_SEEN_V2")
  );
  const closeTutorial = () => {
    localStorage.setItem("TUTORIAL_SEEN_V2", "1");
    setShowTutorial(false);
  };

  // 입력
  const [date, setDate]   = useState(null);
  const [time, setTime]   = useState({ hour: null, minute: 0 });
  const [place, setPlace] = useState({ lat: null, lng: null, address: "" });
  const [etc, setEtc]     = useState("");

  // 결과
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState("");

  // 페이지 이동
  const go = (next) => {
    if (next === index || next < 0 || next > 6) return;
    if (index === 1 && next === 0) setDir("left");
    else if (index === 1 && next >= 2) setDir("right");
    else setDir(next < index ? "left" : "right");

    if (index === 5 && next === 6) { requestRecommendAndShow(); return; }
    requestAnimationFrame(() => setIndex(next));
  };

  // 스와이프 핸들러
  const threshold = 150;
  const resetDrag = () => { isDragging.current = false; startPos.current = null; };

  const onTouchStart = (e) => { if (swipeDisabled()) return resetDrag(); isDragging.current = true; startPos.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => { if (swipeDisabled()) return resetDrag();
    if (!isDragging.current || startPos.current == null) return;
    const dx = e.changedTouches[0].clientX - startPos.current;
    if (dx > threshold) go(index - 1);
    else if (dx < -threshold) go(index + 1);
    resetDrag();
  };

  const onMouseDown = (e) => { if (swipeDisabled()) return resetDrag(); isDragging.current = true; startPos.current = e.clientX; };
  const onMouseUp   = (e) => { if (swipeDisabled()) return resetDrag();
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

  // 추천 요청
  async function requestRecommendAndShow() {
    requestAnimationFrame(() => setIndex(6));
    setLoading(true);
    setError("");
    setResult(null);

    const now = new Date();
    const useDate = date ?? now;
    const useHour = time?.hour ?? now.getHours();
    const useMinute = time?.minute ?? (now.getMinutes() < 30 ? 0 : 30);

    let loc =
      (place?.address && place.address.trim()) ||
      (place?.lat != null && place?.lng != null ? `${place.lat},${place.lng}` : "");
    if (!loc) loc = "37.5665,126.9780";

    const payload = {
      date: useDate.toISOString().slice(0, 10),
      time: `${String(useHour).padStart(2, "0")}:${String(useMinute).padStart(2, "0")}`,
      location: loc,
    };

    try {
      const data = await postRecommend(payload);
      setResult({ ...data });
    } catch (e) {
      setError(e.message || "추천 요청 실패");
    } finally {
      setLoading(false);
    }
  }

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
            <Intro
              onSwipeRight={() => go(0)}
              onSwipeLeft={() => go(2)}
              onMyPage={() => setMyOpen(true)}
            />
          </PageSlide>
        );
      case 2:
        return (
          <PageSlide key="opt-date" dir={dir}>
            <Optional_Date value={date} onChange={setDate} onPrev={() => go(1)} onNext={() => go(3)} />
          </PageSlide>
        );
      case 3:
        return (
          <PageSlide key="opt-time" dir={dir}>
            <Optional_Time value={time} onChange={setTime} onPrev={() => go(2)} onNext={() => go(4)} />
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
            <Optional_Etc value={etc} onChange={setEtc} onPrev={() => go(4)} onNext={() => go(6)} />
          </PageSlide>
        );
      default:
        return (
          <PageSlide key="opt-result" dir={dir}>
            <Optional_Result loading={loading} error={error} result={result} onPrev={() => go(5)} onDone={() => go(1)} />
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

      {/* 로그인 모달: 열려 있으면 튜토리얼 숨김 */}
      <AuthModal
        open={authOpen}
        onSkip={() => setAuthOpen(false)}
        onSuccess={() => setAuthOpen(false)}
      />

      {/* 인트로에서만, 로그인 모달이 닫힌 상태일 때만 1회 표시 */}
      {index === 1 && (
        <TutorialOverlay open={!authOpen && !myOpen && showTutorial} onClose={closeTutorial} />
      )}

      {/* 마이페이지 모달 */}
      <MyPageModal
        open={myOpen}
        onClose={() => setMyOpen(false)}
        onLogout={() => {
          clearAuth();
          setMyOpen(false);
          setAuthOpen(true);   // → 로그아웃 즉시 로그인 모달 재오픈
        }}
      />
    </div>
  );
}
