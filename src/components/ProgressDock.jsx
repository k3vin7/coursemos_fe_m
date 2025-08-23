import { createPortal } from "react-dom";

export default function ProgressDock({
  current = 1,                 // 1=date, 2=time, 3=place, 4=etc
  className = "",
  stroke = "#FFA3C4",
  strokeWidth = 8,
  topOffset = "15vh",          // 진행 바 세로 위치
  animMs = 500,                // 그려지는 시간(ms)
}) {
  // 좌표/형상 ------------------------------------------------------------
  const VB_W = 300, VB_H = 160;
  const BASE_Y = 110;          // 선분/하트 바닥 y(둘이 만나는 기준선)
  const PADDING_X = 20;

  // 하트 아랫부분이 "살짝 벌어진" 느낌을 위해 중앙에서 footGap만큼 좌우로 띄움
  const footGap = 28;          // ← 숫자 키우면 벌어짐 증가
  const footL = { x: 150 - footGap, y: BASE_Y };
  const footR = { x: 150 + footGap, y: BASE_Y };

  // 하트 상단 골 위치(위로 갈수록 값 감소). 더 위로 올리고 싶으면 줄이면 됨.
  const tipY = 44;

  // 부드러운 곡률용 컨트롤 포인트(좌우 대칭)
  // - 첫 곡선은 바닥에서 살짝 옆/위로 빠져나오고,
  // - 두 번째 곡선이 상단 골로 자연스럽게 연결되도록 잡음.
  const PATH_HEART_L = [
    `M ${footL.x},${footL.y}`,
    `C ${footL.x - 18},${BASE_Y - 10}  ${footL.x - 30},${BASE_Y - 44}  ${150 - 22},${(tipY + BASE_Y) / 2}`,
    `C ${150 - 14},${tipY + 8}  ${150 - 8},${tipY + 2}  150,${tipY}`,
  ].join(" ");

  const PATH_HEART_R = [
    `M ${footR.x},${footR.y}`,
    `C ${footR.x + 18},${BASE_Y - 10}  ${footR.x + 30},${BASE_Y - 44}  ${150 + 22},${(tipY + BASE_Y) / 2}`,
    `C ${150 + 14},${tipY + 8}  ${150 + 8},${tipY + 2}  150,${tipY}`,
  ].join(" ");

  const LEFT_LINE_D  = `M ${PADDING_X},${BASE_Y} L ${footL.x},${BASE_Y}`;
  const RIGHT_LINE_D = `M ${footR.x},${BASE_Y} L ${VB_W - PADDING_X},${BASE_Y}`;

  // 누적 노출 -----------------------------------------------------------
  const showLeftLine  = current >= 1;
  const showHeartL    = current >= 2;
  const showHeartR    = current >= 3;
  const showRightLine = current >= 4;

  // 이번에 "방금 켜진" 세그먼트만 그려지는 애니메이션 적용
  const animLeftLine  = current === 1;
  const animHeartL    = current === 2;
  const animHeartR    = current === 3;
  const animRightLine = current === 4;

  // 공통 스타일: pathLength=100 기준으로 dash 애니
  const segStyle = {
    vectorEffect: "non-scaling-stroke",
    stroke,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    fill: "none",
    pathLength: 100,
    strokeDasharray: 100,
  };
  const animClass = "animate-draw";

  return createPortal(
    <div
      className={`pointer-events-none fixed left-0 right-0 z-[50] ${className}`}
      style={{ top: topOffset, padding: "0 16px" }}
      aria-hidden
    >
      {/* 그려지는 애니메이션 키프레임 */}
      <style>{`
        @keyframes draw {
          from { stroke-dashoffset: 100; }
          to   { stroke-dashoffset: 0; }
        }
        .${animClass} { animation: draw ${animMs}ms ease-out forwards; }
      `}</style>

      <div className="mx-auto max-w-[720px]">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          width="100%"
          height="96"
          preserveAspectRatio="none"
        >
          {/* 1) 왼쪽 선분 */}
          {showLeftLine && (
            <path
              key={`L-${current}`}                 // 단계 바뀔 때 재마운트 → 애니 보장
              d={LEFT_LINE_D}
              style={{ ...segStyle, strokeDashoffset: animLeftLine ? 100 : 0 }}
              className={animLeftLine ? animClass : ""}
            />
          )}

          {/* 2) 왼쪽 하트 반쪽 */}
          {showHeartL && (
            <path
              key={`HL-${current}`}
              d={PATH_HEART_L}
              style={{ ...segStyle, strokeDashoffset: animHeartL ? 100 : 0 }}
              className={animHeartL ? animClass : ""}
            />
          )}

          {/* 3) 오른쪽 하트 반쪽 */}
          {showHeartR && (
            <path
              key={`HR-${current}`}
              d={PATH_HEART_R}
              style={{ ...segStyle, strokeDashoffset: animHeartR ? 100 : 0 }}
              className={animHeartR ? animClass : ""}
            />
          )}

          {/* 4) 오른쪽 선분 */}
          {showRightLine && (
            <path
              key={`R-${current}`}
              d={RIGHT_LINE_D}
              style={{ ...segStyle, strokeDashoffset: animRightLine ? 100 : 0 }}
              className={animRightLine ? animClass : ""}
            />
          )}
        </svg>
      </div>
    </div>,
    document.body
  );
}
