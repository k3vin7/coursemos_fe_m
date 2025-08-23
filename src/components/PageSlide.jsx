import { motion } from "framer-motion";
import { useRef } from "react";

export default function PageSlide({
  children,
  dir = "right",
  duration = 0.20,
  className = "",
}) {
  // 이 인스턴스가 "처음 마운트될 때"의 방향을 고정
  const stableDirRef = useRef();
  if (stableDirRef.current == null) stableDirRef.current = dir;
  const d = stableDirRef.current;

  const variants = {
    initial: (dd) => ({ x: dd === "right" ? "100%" : "-100%" }),
    animate: { x: 0 },
    exit:    (dd) => ({ x: dd === "right" ? "-100%" : "100%" }),
  };

  return (
    <motion.div
      custom={d}                       // 고정된 방향을 variants로 전달
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "tween", ease: "linear", duration }}
      // 전환 중 겹쳐서 미는 구조 (부모는 relative 여야 함)
      style={{ position: "absolute", inset: 0 }}
      className={`will-change-transform transform-gpu overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}
