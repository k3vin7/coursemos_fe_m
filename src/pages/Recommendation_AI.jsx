import { useRef } from "react";

export default function Recommendation_AI({ onNext, onRequestRecommend }) {
  const startX = useRef(null);

  const handleTouchStart = (e) => {
    const t = e.touches?.[0];
    startX.current = t ? t.clientX : null;
  };

  const handleTouchEnd = (e) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    startX.current = null;
    const threshold = 80;
    if (dx < -threshold) onNext?.(); // 왼쪽 스와이프 → 다음 단계
  };

  return (
    <div
      className="h-screen w-screen flex items-center justify-center bg-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Recommendation AI</h1>
        <button
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white"
          onClick={onRequestRecommend}
        >
          추천 받기
        </button>
      </div>
    </div>
  );
}
