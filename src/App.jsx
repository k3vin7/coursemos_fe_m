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
  // 0=AI, 1=Intro(시작), 2=Date, 3=Time, 4=Place, 5=Etc, 6=Result
  const [index, setIndex] = useState(1);
  const [dir, setDir] = useState("right");
  const startPos = useRef(null);
  const isDragging = useRef(false);

  // ⛔ 페이지 스와이프 무시 여부(모달 열리면 true/닫히면 false)
  const [swipeLocked, setSwipeLocked] = useState(false);
  const swipeDisabled = () => swipeLocked;

  const go = (next) => {
    if (next === index || next < 0 || next > 6) return;
    if (index === 1 && next === 0) setDir("left");       // Intro -> AI
    else if (index === 1 && next >= 2) setDir("right");  // Intro -> Optional_*
    else setDir(next < index ? "left" : "right");
    requestAnimationFrame(() => setIndex(next));
  };

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

  const renderScreen = () => {
    switch (index) {
      case 0:
        return <PageSlide key="ai" dir={dir}>
          <Recommendation_AI onBack={() => go(1)} />
        </PageSlide>;
      case 1:
        return <PageSlide key="intro" dir={dir}>
          <Intro onSwipeRight={() => go(0)} onSwipeLeft={() => go(2)} />
        </PageSlide>;
      case 2:
        return <PageSlide key="opt-date" dir={dir}>
          <Optional_Date onPrev={() => go(1)} onNext={() => go(3)} />
        </PageSlide>;
      case 3:
        return <PageSlide key="opt-time" dir={dir}>
          <Optional_Time onPrev={() => go(2)} onNext={() => go(4)} />
        </PageSlide>;
      case 4:
        return <PageSlide key="opt-place" dir={dir}>
          {/* 👇 Optional_Place가 모달 open/close 시 여기로 락 상태만 알려줌 */}
          <Optional_Place onPrev={() => go(3)} onNext={() => go(5)}
                          onSwipeLockChange={(v) => setSwipeLocked(!!v)} />
        </PageSlide>;
      case 5:
        return <PageSlide key="opt-etc" dir={dir}>
          <Optional_Etc onPrev={() => go(4)} onNext={() => go(6)} />
        </PageSlide>;
      default:
        return <PageSlide key="opt-result" dir={dir}>
          <Optional_Result onPrev={() => go(5)} onDone={() => go(1)} />
        </PageSlide>;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white"
         onTouchStart={onTouchStart}
         onTouchEnd={onTouchEnd}
         onMouseDown={onMouseDown}
         onMouseUp={onMouseUp}>
      <AnimatePresence mode="wait" initial={false}>
        {renderScreen()}
      </AnimatePresence>
    </div>
  );
}
