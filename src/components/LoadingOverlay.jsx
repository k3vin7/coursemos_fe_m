import { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function LoadingOverlay({ open, hints = [] }) {
  const defaultHints = useMemo(
    () => [
      "오늘은 날씨가 좋네요! ☀️",
      "근처 분위기를 파악하는 중…",
      "사람 덜 붐비는 곳을 찾는 중…",
      "사진이 예쁜 스팟을 고르는 중…",
      "이동 동선을 최적화하는 중…",
    ],
    []
  );
  const pool = hints.length ? hints : defaultHints;

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!open) return;
    setIdx(0);
    const id = setInterval(() => setIdx((i) => (i + 1) % pool.length), 1800);
    return () => clearInterval(id);
  }, [open, pool.length]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10000] bg-white/90 backdrop-blur-sm grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex flex-col items-center gap-6">
            <SpinnerHeart />
            <div className="h-6 relative w-[80vw] max-w-md">
              <AnimatePresence mode="wait">
                <motion.p
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="text-center text-gray-700 text-base"
                >
                  {pool[idx]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SpinnerHeart() {
  return (
    <div className="relative">
      <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-2xl">💗</span>
      </div>
    </div>
  );
}
