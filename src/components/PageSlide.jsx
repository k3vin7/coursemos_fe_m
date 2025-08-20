import { motion } from "framer-motion";

// 콘텐츠만 좌우 슬라이드. 스크롤처럼 '흘러가는' 느낌으로.
export default function PageSlide({
  children,
  dir = "right",     // "right": 오른쪽에서 들어와 왼쪽으로 밀림, "left"는 반대
  duration = 0.20,   // 스크롤 느낌: 0.32 ~ 0.45 권장
}) {
  // 퍼센트 단위로 화면 폭만큼 이동 → 스크롤처럼 보이게
  const xFrom = dir === "right" ? "100%" : "-100%";
  const xExit = dir === "right" ? "-100%" : "100%";

  return (
    <motion.div
      initial={{ x: xFrom }}
      animate={{ x: 0 }}
      exit={{ x: xExit }}
      transition={{
        type: "tween",
        ease: "linear",   // 관성 없음, 일정 속도 → 스크롤 같은 느낌
        duration,
      }}
      className="w-full h-full will-change-transform transform-gpu overflow-hidden"
    >
      {children}
    </motion.div>
  );
}
