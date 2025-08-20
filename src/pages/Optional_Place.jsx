import { useState } from "react";
import NaverMapPickerModal from "../components/NaverMapPickerModal";

export default function Optional_Place({
  onPrev,
  onNext,
  currentStep = 3,
  totalSteps = 4,
}) {
  // 처음에는 행정구만 간단히
  const [summary, setSummary] = useState("성남시 분당구");
  const [open, setOpen] = useState(false);
  const [center, setCenter] = useState({ lat: 37.385, lng: 127.121 }); // 분당구 근처

  return (
    <div className="h-screen relative flex items-center justify-center">
      {/* 필요시 ProgressDock 유지 */}
      {/* <ProgressDock current={currentStep} total={totalSteps} labels={["date","time","place","etc"]} /> */}

      <div className="w-[86vw] max-w-[720px] bg-white/85 backdrop-blur rounded-3xl shadow-lg border border-white/40 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">장소 선택</h2>

        <div className="text-sm text-gray-700 mb-4">
          선택된 지역: <span className="font-medium">{summary}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="px-4 h-10 rounded-xl bg-gray-900 text-white hover:opacity-90 active:scale-95 transition"
          >
            지도에서 선택
          </button>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={onPrev}
            className="px-4 h-10 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 active:scale-95 transition"
          >
            이전
          </button>
          <button
            onClick={onNext}
            className="px-4 h-10 rounded-xl bg-[#FF6C43] text-white hover:brightness-95 active:scale-95 transition"
          >
            다음
          </button>
        </div>
      </div>

      <NaverMapPickerModal
        open={open}
        onClose={() => setOpen(false)}
        initialCenter={center}
        onSelect={(v) => {
          // 간단 요약: 시/구 정도만 추려 표시
          const pretty =
            (v.address?.split(" ").slice(0, 2).join(" ")) ||
            `${v.lat.toFixed(5)}, ${v.lng.toFixed(5)}`;
          setSummary(pretty);
          setCenter({ lat: v.lat, lng: v.lng });
        }}
      />
    </div>
  );
}
