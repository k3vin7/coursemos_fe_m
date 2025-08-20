import ProgressDock from "../components/ProgressDock.jsx";

export default function Optional_Place({
  onPrev,
  onNext,
  currentStep = 3,
  totalSteps = 4,
}) {
  return (
    <div className="h-screen relative flex items-center justify-center">
      <ProgressDock current={currentStep} total={totalSteps} labels={["date","time","place","etc"]} />
      <div className="w-[86vw] max-w-[720px] bg-white/85 backdrop-blur rounded-3xl shadow-lg border border-white/40 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">장소 선택</h2>
        {/* 장소 UI */}
        <div className="flex items-center justify-between mt-4">
          <button onClick={onPrev} className="px-4 h-10 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 active:scale-95 transition">이전</button>
          <button onClick={onNext} className="px-4 h-10 rounded-xl bg-[#FF6C43] text-white hover:brightness-95 active:scale-95 transition">다음</button>
        </div>
      </div>
    </div>
  );
}
