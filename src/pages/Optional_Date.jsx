import { useState } from "react";
import Calendar from "../components/Calendar";
import ProgressDock from "../components/ProgressDock";

export default function Optional_Date({
  onPrev,
  currentStep = 1,
  totalSteps = 4,
}) {
  const [selectedDate, setSelectedDate] = useState(null);

  return (
    <div className="h-screen overflow-hidden relative">
      {/* 상단 좌측 진행도 */}
      <div className="absolute top-0 left-0 p-3 z-10">
        <ProgressDock
          current={currentStep}
          total={totalSteps}
          labels={["date", "time", "place", "etc"]}
        />
      </div>

      {/* 가운데 달력 */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <Calendar value={selectedDate} onChange={setSelectedDate} />
      </div>
    </div>
  );
}
