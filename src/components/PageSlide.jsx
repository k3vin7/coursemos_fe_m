import { motion } from "framer-motion";

// 콘텐츠만 좌우 슬라이드. 스크롤처럼 '흘러가는' 느낌 유지.
export default function PageSlide({
  children,
  dir = "right",   // "right": 오른쪽에서 들어옴, "left": 왼쪽에서 들어옴
  duration = 0.20, // 스크롤 느낌
}) {
  const xFrom = dir === "right" ? "100%" : "-100%";
  const xExit = dir === "right" ? "-100%" : "100%";

  return (
    <motion.div
      initial={{ x: xFrom }}
      animate={{ x: 0 }}
      exit={{ x: xExit }}
      transition={{
        type: "tween",
        ease: "linear",
        duration,
      }}
      className="w-full h-full will-change-transform transform-gpu overflow-hidden"
    >
      {children}
    </motion.div>
  );
}
