import { motion } from "framer-motion";

// 콘텐츠만 좌우 슬라이드. opacity는 건드리지 않음.
export default function PageSlide({ children, dir = "right", duration = 0.28 }) {
  const xFrom = dir === "right" ? 80 : -80;
  const xExit = dir === "right" ? -80 : 80;

  return (
    <motion.div
      initial={{ x: xFrom }}
      animate={{ x: 0 }}
      exit={{ x: xExit }}
      transition={{ type: "tween", duration, ease: "easeOut" }}
      className="w-full h-full will-change-transform transform-gpu"
    >
      {children}
    </motion.div>
  );
}
