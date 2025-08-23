// src/components/ProgressDock.jsx
import { createPortal } from "react-dom";

export default function ProgressDock({
  current = 1,               // 1=date, 2=time, 3=place, 4=etc
  className = "",
  stroke = "#FF8DB5",        // 외곽선 색
  strokeWidth = 5,
}) {
  // 레이아웃 (반응형 스케일: viewBox 기준으로 그리고 width:100%)
  // [왼쪽 선분] 20~100  | [하트] 90~210 | [오른쪽 선분] 210~280
  const y = 64;
  const left = { x1: 20, x2: 100, y };
  const right = { x1: 210, x2: 280, y };

  // 현재 단계까지 누적 표시
  const showLeftLine  = current >= 1;
  const showHeartL    = current >= 2;
  const showHeartR    = current >= 3;
  const showRightLine = current >= 4;

  return createPortal(
    <div
      className={`pointer-events-none fixed top-0 left-0 right-0 z-[50] ${className}`}
      style={{ padding: "12px 16px" }}
      aria-hidden
    >
      <div className="mx-auto max-w-[720px]">
        <svg
          viewBox="0 0 300 128"
          width="100%"
          height="72"
          preserveAspectRatio="none"
        >
          <defs>
            {/* 부드러운 하트 패스 (센터 x=150) */}
            <path id="heartPath"
              d="
                M150,76
                C150,52 136,38 119,38
                C101,38 92,50 92,63
                C92,82 114,94 150,112
                C186,94 208,82 208,63
                C208,50 199,38 181,38
                C164,38 150,52 150,76 Z
              " />
            {/* 하트 반쪽 클립 */}
            <clipPath id="clipLeft"><rect x="90"  y="0" width="60" height="128"/></clipPath>
            <clipPath id="clipRight"><rect x="150" y="0" width="60" height="128"/></clipPath>
          </defs>

          {/* 1단계: 왼쪽 선분 */}
          {showLeftLine && (
            <line
              x1={left.x1} y1={left.y}
              x2={left.x2} y2={left.y}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}

          {/* 2단계: 하트 왼쪽 반쪽 */}
          {showHeartL && (
            <use
              href="#heartPath"
              clipPath="url(#clipLeft)"
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          )}

          {/* 3단계: 하트 오른쪽 반쪽 */}
          {showHeartR && (
            <use
              href="#heartPath"
              clipPath="url(#clipRight)"
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          )}

          {/* 4단계: 오른쪽 선분 */}
          {showRightLine && (
            <line
              x1={right.x1} y1={right.y}
              x2={right.x2} y2={right.y}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>
    </div>,
    document.body
  );
}
