import { useRef } from "react";

export default function Intro({
  onSwipeRight,
  onSwipeLeft,
  // ⬇️ 추가된 프롭(기본값으로 안전하게 동작)
  showUserButton = true,
  isAuthed = false,
  onUserButtonClick,
}) {
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
    else if (dx < -threshold) onSwipeLeft?.();
    startX.current = null;
  };

  return (
    <div
      className="h-screen overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ✅ 우상단 사용자 버튼 */}
      {showUserButton && (
        <button
          onClick={onUserButtonClick}
          className="absolute top-4 right-4 h-10 px-3 rounded-xl border border-gray-200 bg-white/90 shadow text-sm font-medium hover:bg-white active:scale-95"
        >
          {isAuthed ? "마이페이지" : "로그인"}
        </button>
      )}

      {/* 오른쪽 스와이프 */}
      <p className="absolute top-[12vh] right-0 px-2">추천 데이트 코스는 여기!!</p>
      <div className="absolute flex flex-col items-end top-[15vh] right-0">
        <div className="flex items-center justify-center
        h-[5vh] w-[50vw] rounded-l-3xl bg-[#FABAE170] shadow-xl">
          <div className="flex items-center justify-center">
            <p className="mr-3 font-semibold text-gray-500">오른쪽으로 스와이프!</p>
            <img src="/RightArrow.png" alt="오른쪽스와이프" />
          </div>
        </div>
      </div>

      {/* 워터마크 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img src="/watermark.png" alt="워터마크"/>
      </div>

      {/* 왼쪽 스와이프 */}
      <div className="absolute flex flex-col items-start bottom-[15vh] left-0">
        <p className="px-2">간단한 정보 입력으로 맞춤 코스 추천!</p>
        <div className="flex items-center justify-center
        h-[5vh] w-[50vw] rounded-r-3xl bg-[#ADC3FF70] shadow-xl">
          <div className="flex items-center justify-center">
            <img src="/LeftArrow.png" alt="왼쪽스와이프" />
            <p className="ml-3 font-semibold text-gray-500">왼쪽으로 스와이프!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
