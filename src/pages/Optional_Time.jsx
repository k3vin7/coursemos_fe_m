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
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);

  useEffect(() => {
    if (hour !== null) onChange?.({ hour, minute, label: toTimeLabel(hour, minute) });
  }, [hour, minute, onChange]);

  return (
    <div className="h-screen relative flex flex-col items-center justify-center px-4">
      <ProgressDock current={currentStep} total={totalSteps} labels={["date","time","place","etc"]} />

      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-5 sm:p-6 border border-slate-100">
        <div className="grid grid-cols-3 items-center text-xs font-semibold text-gray-500 mb-2">
          <div className="col-span-1">시(Hour)</div>
          <div className="text-center">:</div>
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
