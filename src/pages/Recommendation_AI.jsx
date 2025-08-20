import { useRef } from "react";
import PageSlide from "../components/PageSlide";

export default function Recommendation_AI({ __slideDir = "right", onBack }) {
  const startX = useRef(null);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const threshold = 50;

    // 왼쪽으로 스와이프 → Intro로 복귀
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
