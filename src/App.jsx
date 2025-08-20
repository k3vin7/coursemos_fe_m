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

export default function App() {
  // 인덱스: 0=AI, 1=Intro(시작), 2=Date, 3=Time, 4=Place, 5=Etc, 6=Result
  const [index, setIndex] = useState(1);
  const [dir, setDir] = useState("right");
  const startPos = useRef(null);
  const isDragging = useRef(false);

  // 전환 규칙 고정: (dir 먼저 → 다음 프레임에 index 변경)
  const go = (next) => {
    if (next === index || next < 0 || next > 6) return;

    if (index === 1 && next === 0) {
      setDir("left");        // Intro -> AI: 인트로는 항상 오른쪽으로 사라짐
    } else if (index === 1 && next >= 2) {
      setDir("right");       // Intro -> Optional_*: 인트로는 항상 왼쪽으로 사라짐
    } else {
      setDir(next < index ? "left" : "right");
    }

    requestAnimationFrame(() => setIndex(next));
  };

  // 제스처(터치/마우스) 공통
  const threshold = 150;

  const onTouchStart = (e) => {
    isDragging.current = true;
    startPos.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (!isDragging.current || startPos.current == null) return;
    const dx = e.changedTouches[0].clientX - startPos.current;
    if (dx > threshold) go(index - 1);       // 오른쪽 스와이프 → 이전
    else if (dx < -threshold) go(index + 1); // 왼쪽 스와이프 → 다음
    isDragging.current = false;
    startPos.current = null;
  };

  const onMouseDown = (e) => {
    isDragging.current = true;
    startPos.current = e.clientX;
  };
  const onMouseUp = (e) => {
    if (!isDragging.current || startPos.current == null) return;
    const dx = e.clientX - startPos.current;
    if (dx > threshold) go(index - 1);
    else if (dx < -threshold) go(index + 1);
    isDragging.current = false;
    startPos.current = null;
  };

  useEffect(() => {
    const preventSelect = (e) => {
      if (isDragging.current) e.preventDefault();
    };
    window.addEventListener("selectstart", preventSelect);
    return () => window.removeEventListener("selectstart", preventSelect);
  }, []);

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
              onSwipeRight={() => go(0)} // Intro에서 오른쪽 스와이프 → AI
              onSwipeLeft={() => go(2)}  // Intro에서 왼쪽 스와이프 → Date
            />
          </PageSlide>
        );
      case 2:
        return (
          <PageSlide key="opt-date" dir={dir}>
            <Optional_Date
              onPrev={() => go(1)}  // Intro
              onNext={() => go(3)}  // Time
            />
          </PageSlide>
        );
      case 3:
        return (
          <PageSlide key="opt-time" dir={dir}>
            <Optional_Time
              onPrev={() => go(2)}  // Date
              onNext={() => go(4)}  // Place
            />
          </PageSlide>
        );
      case 4:
        return (
          <PageSlide key="opt-place" dir={dir}>
            <Optional_Place
              onPrev={() => go(3)}  // Time
              onNext={() => go(5)}  // Etc
            />
          </PageSlide>
        );
      case 5:
        return (
          <PageSlide key="opt-etc" dir={dir}>
            <Optional_Etc
              onPrev={() => go(4)}  // Place
              onNext={() => go(6)}  // Result
            />
          </PageSlide>
        );
      case 6:
      default:
        return (
          <PageSlide key="opt-result" dir={dir}>
            <Optional_Result
              onPrev={() => go(5)}  // Etc
              onDone={() => go(1)}  // 완료 후 Intro로
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
    </div>
  );
}
