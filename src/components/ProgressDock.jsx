// ProgressDock.jsx
import { createPortal } from "react-dom";
import StepProgress from "./StepProgress.jsx";

export default function ProgressDock({
  current,
  total = 4,
  className = "",
  top = "15vh",
}) {
  const node = (
    <div
      className={`fixed inset-x-0 z-40 pointer-events-none ${className}`}
      style={{ top }}
    >
      {/* 화면에 보이는 뷰포트 */}
      <StepProgress current={current} total={total} />
    </div>
  );

  return createPortal(node, document.body);
}
