import { createPortal } from "react-dom";

export default function ProgressDock({
  current = 1,               // 1=date, 2=time, 3=place, 4=etc
  total = 4,
  labels = ["date", "time", "place", "etc"],
  className = "",
}) {
  // 색
  const ACTIVE = "#FF6C43";                 // 진한 액센트
  const INACTIVE = "rgba(255,108,67,0.18)"; // 연한 배경
  const STROKE = "rgba(0,0,0,0.06)";

  // 활성 세그먼트 판정
  const isActive = (seg) => current === seg;

  // SVG 레이아웃 (가로 300, 세로 120 기준으로 그린 다음, width:100%로 스케일)
  // [0..90]  왼쪽 1/3 선분
  // [90..210] 하트 (왼쪽/오른쪽 반쪽)
  // [210..300] 오른쪽 1/3 선분
  return createPortal(
    <div
      className={`pointer-events-none fixed top-0 left-0 right-0 z-[50] ${className}`}
      style={{ padding: "10px 16px" }}
      aria-hidden
    >
      <div className="mx-auto max-w-[720px]">
        <svg
          viewBox="0 0 300 120"
          width="100%"
          height="64"
          preserveAspectRatio="none"
        >
          {/* 배경 선분 (연하게) */}
          <rect x="0"   y="55" width="90"  height="10" rx="5" fill={INACTIVE} />
          <rect x="210" y="55" width="90"  height="10" rx="5" fill={INACTIVE} />

          {/* 하트 배경 (연하게) */}
          <defs>
            {/* 전체 하트 패스 하나 정의 */}
            <path id="heartPath"
              d="
                M150,70
                C150,50 135,35 118,35
                C100,35 90,47 90,60
                C90,78 112,90 150,108
                C188,90 210,78 210,60
                C210,47 200,35 182,35
                C165,35 150,50 150,70 Z
              " />
            {/* 좌/우 반쪽 클립 */}
            <clipPath id="clipLeftHalf">
              <rect x="90" y="0" width="60" height="120" />
            </clipPath>
            <clipPath id="clipRightHalf">
              <rect x="150" y="0" width="60" height="120" />
            </clipPath>
          </defs>

          {/* 하트(연한 배경) */}
          <use href="#heartPath" fill={INACTIVE} />

          {/* 활성 영역들 */}
          {/* 1단계: 왼쪽 1/3 선분 활성 */}
          <rect
            x="0" y="55" width="90" height="10" rx="5"
            fill={isActive(1) ? ACTIVE : "transparent"}
          />

          {/* 2단계: 하트 왼쪽 반쪽 활성 */}
          <use
            href="#heartPath"
            clipPath="url(#clipLeftHalf)"
            fill={isActive(2) ? ACTIVE : "transparent"}
          />

          {/* 3단계: 하트 오른쪽 반쪽 활성 */}
          <use
            href="#heartPath"
            clipPath="url(#clipRightHalf)"
            fill={isActive(3) ? ACTIVE : "transparent"}
          />

          {/* 4단계: 오른쪽 1/3 선분 활성 */}
          <rect
            x="210" y="55" width="90" height="10" rx="5"
            fill={isActive(4) ? ACTIVE : "transparent"}
          />

          {/* 외곽선(아주 옅게) */}
          <rect x="0"   y="55" width="90"  height="10" rx="5" fill="none" stroke={STROKE} />
          <use  href="#heartPath" fill="none" stroke={STROKE} />
          <rect x="210" y="55" width="90"  height="10" rx="5" fill="none" stroke={STROKE} />

          {/* 라벨(선택) */}
          <g fontSize="10" fill="#666" textAnchor="middle">
            <text x="45"  y="48">{labels[0] ?? "date"}</text>
            <text x="120" y="28">{labels[1] ?? "time"}</text>
            <text x="180" y="28">{labels[2] ?? "place"}</text>
            <text x="255" y="48">{labels[3] ?? "etc"}</text>
          </g>
        </svg>
      </div>
    </div>,
    document.body
  );
}
