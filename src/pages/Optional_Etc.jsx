import ProgressDock from "../components/ProgressDock.jsx";
import { useEffect, useState } from "react";

export default function Optional_Etc({
  onPrev,
  onNext,
  currentStep = 4,
  totalSteps = 4,
  value,
  onChange,
}) {
  const [text, setText] = useState(value || "");
  useEffect(() => { onChange?.(text); }, [text, onChange]);

  return (
    <div className="h-screen relative flex items-center justify-center">
      <ProgressDock current={currentStep} total={totalSteps} labels={["date","time","place","etc"]} />
      <div className="w-[86vw] max-w-[720px] bg-white/85 backdrop-blur rounded-3xl shadow-lg border border-white/40 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">추천에 반영하길 원하시는 내용이 있나요?</h2>

        <textarea
          className="w-full h-[8vh] p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="알레르기, 예산, 분위기, 이동수단 등 자유롭게 적어주세요!"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={onPrev}
            className="px-4 h-10 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 active:scale-95 transition"
          >
            이전
          </button>
          <button
            onClick={onNext}
            className="px-4 h-10 rounded-xl bg-indigo-600 text-white border border-[#FF6C43] hover:brightness-95 active:scale-95 transition"
          >
            결과 보기
          </button>
        </div>
      </div>
    </div>
  );
}
