// src/components/TutorialOverlay.jsx
import { useEffect, useState } from "react";

/** 수평 화살표 아이콘 (→ 또는 ←) */
function ArrowIcon({ dir = "right", className = "" }) {
  const isRight = dir === "right";
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-14 h-14 text-gray-400 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {isRight ? (
        <>
          <path d="M4 12h14" />
          <path d="M12 6l6 6-6 6" />
        </>
      ) : (
        <>
          <path d="M20 12H6" />
          <path d="M12 6l-6 6 6 6" />
        </>
      )}
    </svg>
  );
}

export default function TutorialOverlay({ open, onClose }) {
  const [dontShow, setDontShow] = useState(false);

  // 이미 "다시 보지 않기"가 설정되어 있으면 표시하지 않음
  const neverShow = (() => {
    try { return localStorage.getItem("TUTORIAL_NEVER_SHOW") === "1"; }
    catch { return false; }
  })();

  // 열려 있을 때 스와이프 잠깐 비활성화
  useEffect(() => {
    if (!open || neverShow) return;
    const prev = window.__SWIPE_DISABLED;
    window.__SWIPE_DISABLED = true;
    return () => { window.__SWIPE_DISABLED = prev; };
  }, [open, neverShow]);

  if (!open || neverShow) return null;

  const handleClose = () => {
    try {
      if (dontShow) localStorage.setItem("TUTORIAL_NEVER_SHOW", "1");
    } catch {}
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[999]">
      {/* 반투명 배경 */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px]" />

      {/* 닫기 버튼 (X) */}
      <button
        aria-label="튜토리얼 닫기"
        onClick={handleClose}
        className="absolute top-4 right-4 w-10 h-10 grid place-items-center
                   rounded-full bg-white/90 border border-gray-300 shadow text-gray-700
                   hover:bg-white active:scale-95 transition"
      >
        <span className="text-xl leading-none">×</span>
      </button>

      {/* 우상단 안내: 다음으로 이동 (→) */}
      <div className="absolute top-16 right-6 max-w-[260px] text-right">
        <p className="inline-block px-3 py-2 rounded-xl bg-white/90 border border-gray-200 shadow text-sm text-gray-700">
          스와이프로 <b>다음</b>으로 이동할 수 있어요!
        </p>
        <ArrowIcon dir="right" className="ml-auto mt-2" />
      </div>

      {/* 좌하단 안내: 이전으로 이동 (←) */}
      <div className="absolute bottom-28 left-6 max-w-[260px]">
        <ArrowIcon dir="left" className="mb-2" />
        <p className="inline-block px-3 py-2 rounded-xl bg-white/90 border border-gray-200 shadow text-sm text-gray-700">
          스와이프로 <b>이전</b>으로 이동할 수 있어요!
        </p>
      </div>

      {/* 다시 보지 않기 체크 */}
      <div className="absolute left-0 right-0 bottom-6 flex items-center justify-center">
        <label
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/95 border border-gray-200 shadow text-sm text-gray-700 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="w-4 h-4"
          />
          다시 보지 않기
        </label>
      </div>
    </div>
  );
}
