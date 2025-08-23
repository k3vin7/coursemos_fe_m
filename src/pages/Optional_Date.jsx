import { useEffect, useState } from "react";
import Calendar from "../components/Calendar";
import ProgressDock from "../components/ProgressDock";

export default function Optional_Date({
  onPrev,
  onNext,
  currentStep = 1,
  totalSteps = 4,
  value,
  onChange,
}) {
  const [selectedDate, setSelectedDate] = useState(value ?? null);
  useEffect(() => { setSelectedDate(value ?? null); }, [value]);
  useEffect(() => { onChange?.(selectedDate); }, [selectedDate, onChange]);

  return (
    <div className="h-screen overflow-hidden relative">
      <div className="absolute top-0 left-0 p-3 z-10">
        <ProgressDock current={currentStep} total={totalSteps} labels={["date","time","place","etc"]}/>
      </div>
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <Calendar value={selectedDate} onChange={setSelectedDate} />
      </div>
    </div>
  );
}
