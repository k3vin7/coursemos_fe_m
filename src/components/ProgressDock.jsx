import { createPortal } from "react-dom";

export default function ProgressDock({
  current = 1,           // 1: 왼선, 2: 하트L, 3: 하트R(←역방향), 4: 오른선
  className = "",
  stroke = "#FF8DB5",
  strokeWidth = 10,
  topOffset = "10vh",
  heartScaleY = 4,
  dockHeight = 200,
  gapRadius = 8,
  animMs = 500,
}) {
  const VB_W = 300;
  const VB_H_BASE = 400;
  const B = 110;

  const heartTopOriginal = 38;
  const heartBottomOriginal = 112;
  const dy = B - heartBottomOriginal;

  const scaledTop = B + ((heartTopOriginal + dy) - B) * heartScaleY;
  const topPad = Math.max(16, Math.ceil(strokeWidth * (heartScaleY + 0.5)));
  const minY = Math.floor(Math.min(0, scaledTop - topPad));
  const VB_H = VB_H_BASE - minY;

  // ★ 하트 스케일에 맞춰 라인만 굵기 보정
  const heartStrokeFactor = (1 + heartScaleY) / 2 + 1;      // 대략치
  // const heartStrokeFactor = heartScaleY;              // 더 강하게 맞추고 싶으면 이걸로
  const lineStrokeWidth = strokeWidth * heartStrokeFactor;

  const jointOffset = gapRadius + lineStrokeWidth * 0.5; // 라인 굵기에 맞춰 접점 보정
  const leftLine  = { x1: 20, x2: 150 - jointOffset, y: B };
  const rightLine = { x1: 150 + jointOffset, x2: 280, y: B };

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

  const L = 1000;
  const drawnStyle = { strokeDasharray: L, strokeDashoffset: 0 };

  const showLeftLine  = current >= 1;
  const showHeartL    = current >= 2;
  const showHeartR    = current >= 3;
  const showRightLine = current >= 4;

  return createPortal(
    <div
      className={`pointer-events-none fixed left-0 right-0 z-[50] ${className}`}
      style={{ top: topOffset, padding: "0 16px" }}
      aria-hidden
    >
      <style>{`
        @keyframes progressDraw {
          from { stroke-dashoffset: ${L}; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes progressDrawRev {
          from { stroke-dashoffset: -${L}; }
          to   { stroke-dashoffset: 0; }
        }
        .progress-draw {
          stroke-dasharray: ${L};
          stroke-dashoffset: ${L};
          animation: progressDraw ${animMs}ms ease-out forwards;
        }
        .progress-draw-rev {
          stroke-dasharray: ${L};
          stroke-dashoffset: -${L};
          animation: progressDrawRev ${animMs}ms ease-out forwards;
        }
        .smooth-stroke {
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
            <mask id="heartGapMask" maskUnits="userSpaceOnUse">
              <rect x="-10000" y={minY - 10000} width="20000" height="20000" fill="white" />
              <circle cx="150" cy={B} r={gapRadius + 0.5} fill="black" />
            </mask>
          </defs>

          {/* 1: 왼쪽 선분 — 라인만 굵기 보정 적용 */}
          {showLeftLine && (
            <line
              x1={leftLine.x1} y1={leftLine.y}
              x2={leftLine.x2} y2={leftLine.y}
              stroke={stroke}
              strokeWidth={lineStrokeWidth}
              className={`smooth-stroke ${current === 1 ? "progress-draw" : ""}`}
              pathLength={L}
              style={current > 1 ? drawnStyle : undefined}
            />
          )}

          {/* 2~3: 하트 — 원래 strokeWidth, 그룹 scaleY로 굵어짐 */}
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
                className={`smooth-stroke ${current === 2 ? "progress-draw" : ""}`}
                pathLength={L}
                style={current > 2 ? drawnStyle : undefined}
              />
            )}
            {showHeartR && (
              <path
                d={heartRightPathD}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                className={`smooth-stroke ${current === 3 ? "progress-draw-rev" : ""}`}
                pathLength={L}
                style={current > 3 ? drawnStyle : undefined}
              />
            )}
          </g>

          {/* 4: 오른쪽 선분 — 라인만 굵기 보정 적용 */}
          {showRightLine && (
            <line
              x1={rightLine.x1} y1={rightLine.y}
              x2={rightLine.x2} y2={rightLine.y}
              stroke={stroke}
              strokeWidth={lineStrokeWidth}
              className={`smooth-stroke ${current === 4 ? "progress-draw" : ""}`}
              pathLength={L}
              style={current > 4 ? drawnStyle : undefined}
            />
          )}
        </svg>
      </div>
    </div>,
    document.body
  );
}
