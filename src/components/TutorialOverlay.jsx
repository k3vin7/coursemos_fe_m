// src/components/TutorialOverlay.jsx
import { useEffect } from "react";

/** 회색 화살표 아이콘 (기본: ↗) */
function ArrowIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-14 h-14 text-gray-400 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* ↗ 형태: 대각선 + 꺾인 머리 */}
      <path d="M5 19L19 5" />
      <path d="M9 5h10v10" />
    </svg>
  );
}

export default function TutorialOverlay({ open, onClose }) {
  // 열려 있을 때 스와이프 잠깐 비활성화
  useEffect(() => {
    if (!open) return;
    const prev = window.__SWIPE_DISABLED;
    window.__SWIPE_DISABLED = true;
    return () => { window.__SWIPE_DISABLED = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      {/* 반투명 배경 */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px]" />

      {/* 닫기 버튼 (X) */}
      <button
        aria-label="튜토리얼 닫기"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 grid place-items-center
                   rounded-full bg-white/90 border border-gray-300 shadow text-gray-700
                   hover:bg-white active:scale-95 transition"
      >
        <span className="text-xl leading-none">×</span>
      </button>

      {/* 우상단 안내: 다음으로 이동 */}
      <div className="absolute top-16 right-6 max-w-[260px] text-right">
        <p className="inline-block px-3 py-2 rounded-xl bg-white/90 border border-gray-200 shadow text-sm text-gray-700">
          스와이프로 <b>다음</b>으로 이동할 수 있어요!
        </p>
        {/* ↗ (기본) 화살표를 살짝 기울여 배치 */}
        <ArrowIcon className="ml-auto mt-2 rotate-[-10deg]" />
      </div>

      {/* 좌하단 안내: 이전으로 이동 */}
      <div className="absolute bottom-24 left-6 max-w-[260px]">
        {/* ↗ 아이콘을 225도 회전 = ↙ */}
        <ArrowIcon className="mb-2 rotate-[135deg]" />
        <p className="inline-block px-3 py-2 rounded-xl bg-white/90 border border-gray-200 shadow text-sm text-gray-700">
          스와이프로 <b>이전</b>으로 이동할 수 있어요!
        </p>
      </div>
    </div>
  );
}
