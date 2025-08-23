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
import { isLoggedIn, clearAuth } from "./api/auth.js";

export default function App() {
  // ===== 페이지/슬라이드 =====
  const [index, setIndex] = useState(1); // 1 = Intro
  const [dir, setDir] = useState("right");
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isMouseDownRef = useRef(false);

  // ===== 로그인 상태 & 모달 =====
  const [authed, setAuthed] = useState(isLoggedIn());
  const [authOpen, setAuthOpen] = useState(!isLoggedIn()); // 미로그인이면 처음부터 로그인 모달
  const [myOpen, setMyOpen] = useState(false);

  // ★ 최소 수정 1: 마운트 직후 로그인 상태 재확인 → 모달 강제 오픈 보장
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

  // 다른 탭에서 토큰이 바뀌면 반영 + 사라지면 로그인 모달
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

  // ===== 스와이프 / 마우스 제스처 =====
  const onTouchStart = (e) => {
    // ★ 최소 수정 2: 모달이 열려 있으면 제스처 무시
    if (authOpen || myOpen) return;
    const t = e.touches?.[0];
    if (!t) return;
    startXRef.current = t.clientX;
    startYRef.current = t.clientY;
  };

  const onTouchEnd = (e) => {
    if (authOpen || myOpen) return; // ★
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - startXRef.current;
    const dy = t.clientY - startYRef.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) go(index + 1);
      else go(index - 1);
    }
  };

  const onMouseDown = (e) => {
    if (authOpen || myOpen) return; // ★
    isMouseDownRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
  };

  const onMouseUp = (e) => {
    if (authOpen || myOpen) return; // ★
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) go(index + 1);
      else go(index - 1);
    }
  };

  // ===== 페이지 이동 =====
  // ★ 최소 수정 3: prev 기준으로 dir 계산 + 결과(6) 진입 시 자동 호출
  const go = (next) => {
    setIndex((prev) => {
      if (next === prev || next < 0 || next > 6) return prev;
      setDir(next > prev ? "right" : "left");
      if (next === 6 && prev !== 6) {
        requestRecommendAndShow(); // 결과로 처음 진입할 때만 호출
      }
      return next;
    });
  };

  // ===== 추천 실행 =====
  async function requestRecommendAndShow() {
    // ★ 최소 수정 4: 이미 결과 화면이면 중복 setIndex(6) 방지
    if (index !== 6) {
      requestAnimationFrame(() => setIndex(6));
    }
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
      const locationStr = addr ? addr : `${lat},${lng}`;
      const payload = {
        date: useDate.toISOString().slice(0, 10),
        time: `${String(useHour).padStart(2, "0")}:${String(useMinute).padStart(2, "0")}`,
        location: locationStr,        // ★ 객체 → 문자열
        etc: (etc || "").trim(),      // 서버가 'note'를 요구한다면 등호 오른쪽 키만 note로 바꿔도 됨
      };
      const data = await postRecommend(payload);
      setResult(data);
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
          <PageSlide key="intro" dir={dir}>
            <Intro
              onStartLeft={() => go(0)}
              onStartRight={() => go(2)}
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
          <PageSlide key="ai" dir={dir}>
            <Recommendation_AI
              onNext={() => go(2)}
              onRequestRecommend={requestRecommendAndShow}
            />
          </PageSlide>
        );
      case 2:
        return (
          <PageSlide key="date" dir={dir}>
            <Optional_Date
              value={date}
              onChange={setDate}
              onNext={() => go(3)}
              onPrev={() => go(1)}
            />
          </PageSlide>
        );
      case 3:
        return (
          <PageSlide key="time" dir={dir}>
            <Optional_Time
              value={time}
              onChange={setTime}
              onNext={() => go(4)}
              onPrev={() => go(2)}
            />
          </PageSlide>
        );
      case 4:
        return (
          <PageSlide key="place" dir={dir}>
            <Optional_Place
              value={place}
              onChange={setPlace}
              onNext={() => go(5)}
              onPrev={() => go(3)}
            />
          </PageSlide>
        );
      case 5:
        return (
          <PageSlide key="etc" dir={dir}>
            <Optional_Etc
              value={etc}
              onChange={setEtc}
              onNext={() => go(6)}
              onPrev={() => go(4)}
              onSubmit={requestRecommendAndShow}
            />
          </PageSlide>
        );
      case 6:
        return (
          <PageSlide key="result" dir={dir}>
            <Optional_Result
              loading={loading}
              error={error}
              result={result}
              onPrev={() => go(5)}
            />
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
        onSkip={() => {
          // 그냥 둘러보기 → 버튼은 "로그인"
          setAuthOpen(false);
          setAuthed(false);
        }}
        onSuccess={() => {
          // 로그인 성공 → 버튼은 "마이페이지"
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
          // 로그아웃 → 로그인 모달 즉시 재오픈
          clearAuth();
          setMyOpen(false);
          setAuthed(false);
          setAuthOpen(true);
        }}
      />
    </div>
  );
}
