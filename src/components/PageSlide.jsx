import { motion } from "framer-motion";

export default function PageSlide({
  children,
  dir = "left",      // ← '사용자 스와이프 방향': "left" or "right"
  duration = 0.20,
  className = "",
}) {
  // 스와이프 방향 기준으로: left 스와이프면
  // - 나가는 화면: 왼쪽(-100%)으로 퇴장
  // - 들어오는 화면: 오른쪽(100%)에서 입장
  const variants = {
    initial: (swipe) => ({ x: swipe === "left" ? "100%" : "-100%" }),
    animate: { x: 0 },
    exit:    (swipe) => ({ x: swipe === "left" ? "-100%" : "100%" }),
  };

  return (
    <motion.div
      custom={dir}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "tween", ease: "linear", duration }}
      style={{ position: "absolute", inset: 0 }}   // 겹쳐서 미는 레이아웃
      className={`will-change-transform transform-gpu overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}
