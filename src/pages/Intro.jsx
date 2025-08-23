// src/pages/Intro.jsx
import { useRef } from "react";

export default function Intro({ onSwipeRight, onSwipeLeft, onMyPage }) {
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
    if (dx > threshold) onSwipeRight?.();
    if (dx < -threshold) onSwipeLeft?.();
    startX.current = null;
  };

  return (
    <div
      className="h-screen overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 오른쪽 스와이프 힌트 (장식 요소는 클릭 막지 않도록) */}
      <p className="absolute top-[12vh] right-0 px-2 pointer-events-none">추천 데이트 코스는 여기!!</p>
      <div className="absolute flex flex-col items-end top-[15vh] right-0 pointer-events-none">
        <div className="flex items-center justify-center h-[5vh] w-[50vw] rounded-l-3xl bg-[#FABAE170] shadow-xl">
          <div className="flex items-center justify-center">
            <p className="mr-3 font-semibold text-gray-500">오른쪽으로 스와이프!</p>
            <img src="/RightArrow.png" alt="" className="pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 워터마크(전체를 덮지만 클릭은 통과) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img src="/watermark.png" alt="워터마크" className="max-w-[80vw] max-h-[60vh]" />
      </div>

      {/* 왼쪽 스와이프 힌트 */}
      <div className="absolute flex flex-col items-start bottom-[15vh] left-0 pointer-events-none">
        <p className="px-2">간단한 정보 입력으로 맞춤 코스 추천!</p>
        <div className="flex items-center justify-center h-[5vh] w-[50vw] rounded-r-3xl bg-[#ADC3FF70] shadow-xl">
          <div className="flex items-center justify-center">
            <img src="/LeftArrow.png" alt="" className="pointer-events-none" />
            <p className="ml-3 font-semibold text-gray-500">왼쪽으로 스와이프!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
