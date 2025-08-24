import { useRef, useState } from "react";

export default function Intro({
  onSwipeRight,
  onSwipeLeft,
  showUserButton = true,
  isAuthed = false,
  onUserButtonClick,
}) {
  const startX = useRef(null);
  const locked = () => Boolean(window.__SWIPE_DISABLED);

  const THRESHOLD = 80; // ← 이만큼 넘으면 색 진하게

  // 실시간 반지름(px)
  const [rRight, setRRight] = useState(0); // 오른쪽 스와이프(→) 하단 블루
  const [rLeft, setRLeft] = useState(0);   // 왼쪽 스와이프(←) 상단 핑크

  // 임계 초과 여부(색 전환용)
  const [hitRight, setHitRight] = useState(false); // → 방향 임계 통과
  const [hitLeft, setHitLeft] = useState(false);   // ← 방향 임계 통과

  const MAX_R = Math.min(window.innerWidth, window.innerHeight) * 0.8;
  const bandCenterVH = 17.5;
  const centerY = Math.round((bandCenterVH / 100) * window.innerHeight);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const reset = () => {
    setRRight(0);
    setRLeft(0);
    setHitRight(false);
    setHitLeft(false);
  };

  const handleTouchStart = (e) => {
    if (locked()) { startX.current = null; return; }
    startX.current = e.touches[0].clientX;
    reset();
  };

  const handleTouchMove = (e) => {
    if (locked()) return;
    if (startX.current == null) return;
    const curX = e.touches[0].clientX;
    const dx = curX - startX.current;

    if (dx > 0) {
      // 오른쪽 스와이프: 하단 블루(왼쪽 가장자리 중심) 확장
      setRRight(clamp(0 + dx, 0, MAX_R));
      setRLeft(0);
      setHitRight(dx >= THRESHOLD);
      setHitLeft(false);
    } else if (dx < 0) {
      // 왼쪽 스와이프: 상단 핑크(오른쪽 가장자리 중심) 확장
      const amt = -dx;
      setRLeft(clamp(0 + amt, 0, MAX_R));
      setRRight(0);
      setHitLeft(amt >= THRESHOLD);
      setHitRight(false);
    } else {
      reset();
    }
  };

  const handleTouchEnd = (e) => {
    if (locked()) { startX.current = null; reset(); return; }
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;

    if (dx > THRESHOLD) onSwipeRight?.();   // Intro → AI
    else if (dx < -THRESHOLD) onSwipeLeft?.(); // Intro → Date

    startX.current = null;
    reset();
  };

  // 색상: 기본은 반투명, 임계 통과(hit*) 시 진한색
  const blueBase = "rgba(173,195,255,0.44)"; // #ADC3FF70
  const blueSolid = "rgba(120,150,255,0.95)"; // 더 진한 블루
  const pinkBase = "rgba(250,186,225,0.44)"; // #FABAE170
  const pinkSolid = "rgba(250,140,205,0.95)"; // 더 진한 핑크

  return (
    <div
      className="h-screen overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 오른쪽 스와이프용: 하단 블루 (왼쪽 가장자리 중심 → 오른쪽 확장) */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-10"
        style={{
          width: `${2 * rRight}px`,
          height: `${2 * rRight}px`,
          left: `${-rRight}px`,
          bottom: `${centerY - rRight}px`,
          borderRadius: "9999px",
          backgroundColor: hitRight ? blueSolid : blueBase,
          transition:
            "width 70ms linear, height 70ms linear, left 70ms linear, bottom 70ms linear, background-color 70ms linear",
        }}
      />

      {/* 왼쪽 스와이프용: 상단 핑크 (오른쪽 가장자리 중심 → 왼쪽 확장) */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-10"
        style={{
          width: `${2 * rLeft}px`,
          height: `${2 * rLeft}px`,
          right: `${-rLeft}px`,
          top: `${centerY - rLeft}px`,
          borderRadius: "9999px",
          backgroundColor: hitLeft ? pinkSolid : pinkBase,
          transition:
            "width 70ms linear, height 70ms linear, right 70ms linear, top 70ms linear, background-color 70ms linear",
        }}
      />

      {/* 우상단 사용자 버튼 */}
      {showUserButton && (
        <button
          type="button"
          data-swipe-ignore
          onClick={onUserButtonClick}
          className="absolute top-4 right-4 z-[60] h-10 px-3 rounded-xl border bg-white/90 shadow text-lg font-medium hover:bg-white active:scale-95"
        >
          {isAuthed ? "☰" : "로그인"}
        </button>
      )}

      {/* 오른쪽 스와이프 안내 */}
      <div className="absolute flex flex-col items-end top-[15vh] right-0 z-20">
        <div className="flex items-center justify-center">
          <p className="mr-3 font-semibold text-gray-500">추천 데이트 코스는 여기!!</p>
          <img src="/RightArrow.png" alt="오른쪽스와이프"
          className="pr-4"/>
        </div>
      </div>

      {/* 중앙 워터마크 */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <img src="/watermark.png" alt="워터마크" />
      </div>

      {/* 왼쪽 스와이프 안내 */}
      <div className="absolute flex flex-col items-start bottom-[15vh] left-0 z-20">
        <div className="flex items-center justify-center">
           <img src="/LeftArrow.png" alt="왼쪽스와이프"
           className="pl-4"/>
           <p className="ml-3 font-semibold text-gray-500">간단한 정보 입력으로 맞춤 코스 추천!</p>
        </div>
      </div>
    </div>
  );
}
