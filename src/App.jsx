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
import { isLoggedIn, clearAuth } from "./api/auth.js"; // ← 기존 auth 유틸 그대로 사용

export default function App() {
  // 페이지/슬라이드
  const [index, setIndex] = useState(1); // 1 = Intro
  const [dir, setDir] = useState("right");
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isMouseDownRef = useRef(false);

  // 로그인 상태 & 모달
  const [authed, setAuthed] = useState(isLoggedIn());
  const [authOpen, setAuthOpen] = useState(!isLoggedIn()); // 미로그인 시작 → 모달 자동 오픈
  const [myOpen, setMyOpen] = useState(false);

  // 튜토리얼
  const [showTutorial, setShowTutorial] = useState(true);
  const closeTutorial = () => setShowTutorial(false);

  // 추천 입력/응답
  const [date, setDate] = useState(null);
  const [time, setTime] = useState({ hour: null, minute: null });
  const [place, setPlace] = useState({ lat: null, lng: null, address: "" });
  const [etc, setEtc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // 다른 탭에서 토큰 바뀌면 반영 + 토큰 사라지면 로그인 모달 띄우기
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

  // 스와이프
  const onTouchStart = (e) => {
    const t = e.touches?.[0]; if (!t) return;
    startXRef.current = t.clientX; startYRef.current = t.clientY;
  };
  const onTouchEnd = (e) => {
    const t = e.changedTouches?.[0]; if (!t) return;
    const dx = t.clientX - startXRef.current;
    const dy = t.clientY - startYRef.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) go(index + 1); else go(index - 1);
    }
  };
  const onMouseDown = (e) => {
    isMouseDownRef.current = true;
    startXRef.current = e.clientX; startYRef.current = e.clientY;
  };
  const onMouseUp = (e) => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) go(index + 1); else go(index - 1);
    }
  };

  const go = (next) => {
    if (next === index || next < 0 || next > 6) return;
    if (index === 1 && next === 0) setDir("left");       // Intro → AI
    else if (index === 1 && next === 2) setDir("right"); // Intro → Date
    else if (next > index) setDir("right");
    else setDir("left");
    setIndex(next);
  };

  // 추천 실행
  async function requestRecommendAndShow() {
    requestAnimationFrame(() => setIndex(6));
    setLoading(true); setError(""); setResult(null);
    try {
      const now = new Date();
      const useDate = date ?? now;
      const useHour = time?.hour ?? now.getHours();
      const useMinute = time?.minute ?? 0;
      const payload = {
        date: useDate.toISOString().slice(0, 10),
        time: `${String(useHour).padStart(2, "0")}:${String(useMinute).padStart(2, "0")}`,
        lat: place?.lat ?? 37.5665,
        lng: place?.lng ?? 126.9780,
        address: place?.address || "서울특별시 중구 세종대로 110",
        etc: etc || "",
      };
      const data = await postRecommend(payload);
      setResult(data);
    } catch (e) {
      setError(e?.message || "추천 실패");
    } finally {
      setLoading(false);
    }
  }

  // 화면
  const renderScreen = () => {
    switch (index) {
      case 1:
        return (
          <PageSlide key="intro" dir={dir}>
            <Intro
              onStartLeft={() => go(0)}
              onStartRight={() => go(2)}
              showUserButton={!(authOpen || myOpen)}                       // 모달 열려있으면 버튼 숨김
              isAuthed={authed}                                             // 로그인/비로그인 라벨 토글
              onUserButtonClick={() => (authed ? setMyOpen(true) : setAuthOpen(true))}
            />
          </PageSlide>
        );
      case 0:
        return (
          <PageSlide key="ai" dir={dir}>
            <Recommendation_AI onNext={() => go(2)} onRequestRecommend={requestRecommendAndShow} />
          </PageSlide>
        );
      case 2:
        return (
          <PageSlide key="date" dir={dir}>
            <Optional_Date value={date} onChange={setDate} onNext={() => go(3)} onPrev={() => go(1)} />
          </PageSlide>
        );
      case 3:
        return (
          <PageSlide key="time" dir={dir}>
            <Optional_Time value={time} onChange={setTime} onNext={() => go(4)} onPrev={() => go(2)} />
          </PageSlide>
        );
      case 4:
        return (
          <PageSlide key="place" dir={dir}>
            <Optional_Place value={place} onChange={setPlace} onNext={() => go(5)} onPrev={() => go(3)} />
          </PageSlide>
        );
      case 5:
        return (
          <PageSlide key="etc" dir={dir}>
            <Optional_Etc value={etc} onChange={setEtc} onNext={() => go(6)} onPrev={() => go(4)} onSubmit={requestRecommendAndShow} />
          </PageSlide>
        );
      case 6:
        return (
          <PageSlide key="result" dir={dir}>
            <Optional_Result loading={loading} error={error} result={result} onPrev={() => go(5)} />
          </PageSlide>
        );
      default:
        return null;
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

      {/* 로그인 모달: 처음엔 미로그인이면 열려 있음 */}
      <AuthModal
        open={authOpen}
        onSkip={() => {          // 그냥 둘러보기 → 모달 닫고 버튼은 "로그인"
          setAuthOpen(false);
          setAuthed(false);
        }}
        onSuccess={() => {       // 로그인 성공 → 모달 닫고 버튼은 "마이페이지"
          setAuthOpen(false);
          setAuthed(true);
        }}
      />

      {/* 튜토리얼: 모달들 닫혀 있을 때만 1회 표시 */}
      {index === 1 && (
        <TutorialOverlay open={!authOpen && !myOpen && showTutorial} onClose={closeTutorial} />
      )}

      {/* 마이페이지 모달 */}
      <MyPageModal
        open={myOpen}
        onClose={() => setMyOpen(false)}
        onLogout={() => {        // 로그아웃 → 로그인 모달 즉시 재오픈
          clearAuth();
          setMyOpen(false);
          setAuthed(false);
          setAuthOpen(true);
        }}
      />
    </div>
  );
}