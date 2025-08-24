import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

let __EVER_REVEALED__ = { left: false, heartL: false, heartR: false, right: false };

export default function ProgressDock({
  current = 1,
  className = "",
  stroke = "#FF8DB5",
  strokeWidth = 8,
  topOffset = "10vh",
  heartScaleY = 3,
  dockHeight = 300,
  animMs = 800,
  gapRadius = 0,
  gapColor = "#fff",
}) {
  const VB_W = 300;
  const VB_H_BASE = 400;
  const B = 110;

  const heartTopOriginal = 38;
  const heartBottomOriginal = 112;
  const dy = B - heartBottomOriginal; // -2

  const scaledTop = B + ((heartTopOriginal + dy) - B) * heartScaleY;
  const minY = Math.min(0, Math.floor(scaledTop) - 8);
  const VB_H = VB_H_BASE - minY;

  const leftLine  = { x1: 0,  x2: 130, y: B };
  const rightLine = { x1: 170, x2: 320, y: B };

  const showLeftLine  = current >= 1;
  const showHeartL    = current >= 2;
  const showHeartR    = current >= 3;
  const showRightLine = current >= 4;

  // 시작점을 살짝 올려서 갭 원에 가리지 않게
  const startLiftLocal = (gapRadius + strokeWidth * 0.6) / heartScaleY;
  const yStart = (112 + dy) - startLiftLocal;

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

  const [ever, setEver] = useState(() => ({ ...__EVER_REVEALED__ }));
  const animLeft  = showLeftLine  && !ever.left;
  const animHL    = showHeartL    && !ever.heartL;
  const animHR    = showHeartR    && !ever.heartR;
  const animRight = showRightLine && !ever.right;

  useEffect(() => {
    const next = { ...ever };
    if (showLeftLine)  next.left   = true;
    if (showHeartL)    next.heartL = true;
    if (showHeartR)    next.heartR = true;
    if (showRightLine) next.right  = true;
    if (
      next.left   !== ever.left   ||
      next.heartL !== ever.heartL ||
      next.heartR !== ever.heartR ||
      next.right  !== ever.right
    ) {
      setEver(next);
      __EVER_REVEALED__ = next;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, showLeftLine, showHeartL, showHeartR, showRightLine]);

  // "처음 렌더에서 숨김(prehide) → 길이 세팅 → 다음 프레임에 애니메이션 시작"
  function useDrawOnFirstReveal(ref, shouldAnimate, duration, pad = 0) {
    useEffect(() => {
      const el = ref.current;
      if (!el || !shouldAnimate) return;

      let len = 0;
      try {
        if (el.tagName === "LINE") {
          const x1 = Number(el.getAttribute("x1"));
          const y1 = Number(el.getAttribute("y1"));
          const x2 = Number(el.getAttribute("x2"));
          const y2 = Number(el.getAttribute("y2"));
          len = Math.hypot(x2 - x1, y2 - y1);
        } else if ("getTotalLength" in el) {
          len = el.getTotalLength();
        } else {
          len = 600;
        }
      } catch { len = 600; }

      const L = len + pad;

      // 첫 프레임: 길이/오프셋 세팅(숨김 상태 유지)
      el.style.transition = "none";
      el.style.strokeDasharray = String(L);
      el.style.strokeDashoffset = String(L);
      el.style.willChange = "stroke-dashoffset";
      // Safari 깜빡임 줄이기
      el.style.transform = "translateZ(0)";
      void el.getBoundingClientRect();

      // 두 번째 프레임: 애니메이션 시작(0으로)
      requestAnimationFrame(() => {
        el.style.transition = `stroke-dashoffset ${duration}ms ease-out`;
        el.style.strokeDashoffset = "0";
        const clear = () => {
          el.style.transition = "";
          el.style.willChange = "";
          el.style.transform = "";
        };
        el.addEventListener("transitionend", clear, { once: true });
      });
    }, [ref, shouldAnimate, duration, pad]);
  }

  const refLeft  = useRef(null);
  const refHL    = useRef(null);
  const refHR    = useRef(null);
  const refRight = useRef(null);

  const padLine  = Math.max(4, strokeWidth * 2);
  const padHeart = Math.max(6, strokeWidth * 3) * Math.max(1, heartScaleY * 0.9);

  useDrawOnFirstReveal(refLeft,  animLeft,  Math.max(200, animMs * 0.7), padLine);
  useDrawOnFirstReveal(refHL,    animHL,    animMs,                       padHeart);
  useDrawOnFirstReveal(refHR,    animHR,    animMs,                       padHeart);
  useDrawOnFirstReveal(refRight, animRight, Math.max(200, animMs * 0.7), padLine);

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
        /* 첫 페인트에서 보임/사라짐 플래시 방지 */
        .prehide {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
        }
      `}</style>

      <div className="mx-auto max-w-[720px]">
        <svg
          viewBox={`0 ${minY} ${VB_W} ${VB_H}`}
          width="100%"
          height={dockHeight}
          preserveAspectRatio="none"
        >
          {/* 1: 왼쪽 선분 */}
          {showLeftLine && (
            <line
              ref={refLeft}
              x1={leftLine.x1} y1={leftLine.y}
              x2={leftLine.x2} y2={leftLine.y}
              stroke={stroke}
              strokeWidth={strokeWidth}
              className={`smooth-stroke ${animLeft ? "prehide" : ""}`}
            />
          )}

          {/* 하트(세로 스케일: pivot=B) */}
          <g transform={`translate(0 ${B}) scale(1 ${heartScaleY}) translate(0 ${-B})`}>
            {/* 2: 하트 왼쪽 */}
            {showHeartL && (
              <path
                ref={refHL}
                d={heartLeftPathD}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                className={`smooth-stroke ${animHL ? "prehide" : ""}`}
              />
            )}
            {/* 3: 하트 오른쪽 */}
            {showHeartR && (
              <path
                ref={refHR}
                d={heartRightPathD}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                className={`smooth-stroke ${animHR ? "prehide" : ""}`}
              />
            )}
          </g>

          {/* 하트 최하단 갭 */}
          {(showHeartL || showHeartR) && (
            <circle cx="150" cy={B} r={gapRadius} fill={gapColor} />
          )}

          {/* 4: 오른쪽 선분 */}
          {showRightLine && (
            <line
              ref={refRight}
              x1={rightLine.x1} y1={rightLine.y}
              x2={rightLine.x2} y2={rightLine.y}
              stroke={stroke}
              strokeWidth={strokeWidth}
              className={`smooth-stroke ${animRight ? "prehide" : ""}`}
            />
          )}
        </svg>
      </div>
    </div>,
    document.body
  );
}
