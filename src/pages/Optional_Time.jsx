// src/pages/Optional_Time.jsx
import { useEffect, useState } from "react";
import TimePicker from "../components/TimePicker.jsx";
import ProgressDock from "../components/ProgressDock.jsx";

export default function Optional_Time({
  onChange,
  currentStep = 2,
  totalSteps = 4,
  initialHour = null,
  initialMinute = 0,
}) {
  // ✅ 초기값: initialHour가 null이면 '현재 시각' 사용 (분은 5분단위 반올림)
  const [hour, setHour] = useState(() => {
    if (initialHour !== null) return initialHour;
    const now = new Date();
    const rawM = now.getMinutes();
    let m = Math.round(rawM / 5) * 5;
    let h = now.getHours();
    if (m === 60) { h = (h + 1) % 24; m = 0; }
    return h;
  });

  const [minute, setMinute] = useState(() => {
    if (initialHour !== null) return initialMinute;
    const now = new Date();
    let m = Math.round(now.getMinutes() / 5) * 5;
    if (m === 60) m = 0;
    return m;
  });

  useEffect(() => {
    if (hour !== null) onChange?.({ hour, minute, label: toTimeLabel(hour, minute) });
  }, [hour, minute, onChange]);

  return (
    <div className="h-screen relative flex flex-col items-center justify-center px-4">
      <ProgressDock current={currentStep} total={totalSteps} labels={["date","time","place","etc"]} />

      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-5 sm:p-6 border border-slate-100">
        <div className="grid grid-cols-3 items-center text-xs font-semibold text-gray-500 mb-2">
          <div className="col-span-1">시(Hour)</div>
          <div className="text-center"></div>
          <div className="col-span-1 text-right">분(Min)</div>
        </div>

        <TimePicker
          hour={hour ?? 0}
          minute={minute ?? 0}
          onChange={({ hour: h, minute: m }) => { setHour(h); setMinute(m); }}
          itemHeight={36}
          wheelHeight={160}
        />
      </div>
    </div>
  );
}

function toTimeLabel(h, m) {
  const hh = String(h ?? 0).padStart(2, "0");
  const mm = String(m ?? 0).padStart(2, "0");
  return `${hh}:${mm}`;
}
