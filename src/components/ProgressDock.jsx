import { createPortal } from "react-dom";

export default function ProgressDock({
  current = 1,
  className = "",
  stroke = "#FF8DB5",
  strokeWidth = 10,
  topOffset = "10vh",    // 필요시 "6vh" 등으로 올리기
  heartScaleY = 4,
  dockHeight = 200,
  gapRadius = 8,         // 하트 바닥 갭 크기
  gapColor = "#fff",     // (mask 방식이라 실제로는 쓰이지 않지만 남겨둠)
}) {
  const VB_W = 300;
  const VB_H_BASE = 400;
  const B = 110; // 베이스라인(y)

  // 원본 하트 기준점
  const heartTopOriginal = 38;
  const heartBottomOriginal = 112;
  const dy = B - heartBottomOriginal; // -2

  // 세로 스케일 시 위쪽이 잘리지 않도록 viewBox 보정
  const scaledTop = B + ((heartTopOriginal + dy) - B) * heartScaleY;
  const minY = Math.min(0, Math.floor(scaledTop) - 8);
  const VB_H = VB_H_BASE - minY;

  // 갭 접점과 라인 조인트 정렬
  const jointOffset = gapRadius + strokeWidth * 0.5;
  const leftLine  = { x1: 20, x2: 150 - jointOffset, y: B };
  const rightLine = { x1: 150 + jointOffset, x2: 280, y: B };

  // 스텝 표시
  const showLeftLine  = current >= 1;
  const showHeartL    = current >= 2;
  const showHeartR    = current >= 3;
  const showRightLine = current >= 4;

  // 하트 곡선 (베이스라인에서 시작)
  const yStart = B;
  const heartLeftPathD = `
    M150,${yStart}
    C114,${94+dy} 92,${82+dy} 92,${63+dy}
    C92,${50+dy} 101,${38+dy} 119,${38+dy}
    C136,${38+dy} 150,${52+dy} 150,${76+dy}
  `;
  const heartRightPathD = `
    M150,${yStart}
    C186,${94+dy} 208,${82+dy} 208,${63+dy}
    C208,${50+dy} 199,${38+dy} 181,${38+dy}
    C164,${38+dy} 150,${52+dy} 150,${76+dy}
  `;

  return createPortal(
    <div
      className={`pointer-events-none fixed left-0 right-0 z-[50] ${className}`}
      style={{ top: topOffset, padding: "0 16px" }}
      aria-hidden
    >
      <style>{`
        .smooth-stroke {
          vector-effect: non-scaling-stroke;
          stroke-linecap: round;
          stroke-linejoin: round;
          shape-rendering: geometricPrecision;
        }
      `}</style>

      <div className="mx-auto max-w-[720px]">
        <svg
          viewBox={`0 ${minY} ${VB_W} ${VB_H}`}
          width="100%"
          height={dockHeight}
          preserveAspectRatio="none"
        >
          <defs>
            {/* 하트에만 구멍을 내는 마스크 */}
            <mask id="heartGapMask" maskUnits="userSpaceOnUse">
              {/* 전체는 보이게(흰색) */}
              <rect x="-1000" y={minY - 1000} width="3000" height="3000" fill="white" />
              {/* 하단 갭은 가리게(검정) */}
              <circle cx="150" cy={B} r={gapRadius + 0.5} fill="black" />
            </mask>
          </defs>

          {/* 1: 왼쪽 선분 */}
          {showLeftLine && (
            <line
              x1={leftLine.x1} y1={leftLine.y}
              x2={leftLine.x2} y2={leftLine.y}
              stroke={stroke}
              strokeWidth={strokeWidth}
              className="smooth-stroke"
            />
          )}

          {/* 2~3: 하트(세로 스케일: pivot=B) — 마스크로 바닥 갭 */}
          <g
            transform={`translate(0 ${B}) scale(1 ${heartScaleY}) translate(0 ${-B})`}
            mask="url(#heartGapMask)"
          >
            {showHeartL && (
              <path
                d={heartLeftPathD}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                className="smooth-stroke"
              />
            )}
            {showHeartR && (
              <path
                d={heartRightPathD}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                className="smooth-stroke"
              />
            )}
          </g>

          {/* 4: 오른쪽 선분 */}
          {showRightLine && (
            <line
              x1={rightLine.x1} y1={rightLine.y}
              x2={rightLine.x2} y2={rightLine.y}
              stroke={stroke}
              strokeWidth={strokeWidth}
              className="smooth-stroke"
            />
          )}
        </svg>
      </div>
    </div>,
    document.body
  );
}
