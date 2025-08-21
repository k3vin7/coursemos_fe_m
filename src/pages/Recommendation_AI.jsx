import { useRef } from "react";
import PageSlide from "../components/PageSlide";

export default function Recommendation_AI({ __slideDir = "right", onBack }) {
  const startX = useRef(null);
  const locked = () => Boolean(window.__SWIPE_DISABLED);

  const handleTouchStart = (e) => {
    if (locked()) { startX.current = null; return; }
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (locked()) { startX.current = null; return; }
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const threshold = 50;

    // 왼쪽으로 스와이프 → Intro 복귀
    if (dx < -threshold) onBack?.();
    startX.current = null;
  };

  return (
    <PageSlide dir={__slideDir}>
      <div
        className="h-screen flex items-center justify-center bg-white"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <h1 className="text-2xl font-bold">Recommendation AI</h1>
      </div>
    </PageSlide>
  );
}
