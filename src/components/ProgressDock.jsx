import StepProgress from "./StepProgress.jsx";

export default function ProgressDock({
  current,
  total = 4,
  className = "",
  top = "15vh",
}) {
  return (
    <div
      className={`fixed inset-x-0 z-40 ${className}`}
      style={{ top }}
    >
      {/* 화면에 보이는 뷰포트 */}
      <div className="relative h-[6vh] min-h-[50px] w-screen overflow-hidden">
        {/* 핑크 배경 바: 한 장 */}
        <div className="absolute inset-y-0 left-0 w-full bg-white" />
        {/* 내용 */}
        <div className="relative h-full flex items-center px-4">
          <StepProgress current={current} total={total} />
        </div>
      </div>
    </div>
  );
}
