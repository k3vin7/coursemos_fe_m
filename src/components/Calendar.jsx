import { useMemo, useEffect, useState } from "react";

export default function Calendar({ value, onChange }) {
  const [viewDate, setViewDate] = useState(value ?? new Date());

  useEffect(() => {
    if (value) setViewDate(value);
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const cells = useMemo(() => {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    const arr = [];
    for (let i = 0; i < 42; i++) {
      const dayNum = i - startDay + 1;
      if (dayNum < 1 || dayNum > daysInMonth) arr.push(null);
      else arr.push(new Date(year, month, dayNum));
    }
    return arr;
  }, [year, month]);

  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const today = new Date();
  const weekLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-5 sm:p-6 border border-slate-100">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          className="p-2 rounded-xl hover:bg-slate-100 active:scale-95"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
        >
          ‹
        </button>
        <div className="text-lg sm:text-xl font-semibold">
          {year}년 {month + 1}월
        </div>
        <button
          className="p-2 rounded-xl hover:bg-slate-100 active:scale-95"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
        >
          ›
        </button>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 text-center text-xs sm:text-sm font-medium mb-2">
        {weekLabels.map((d, i) => (
          <div
            key={d}
            className={`py-2 ${
              i === 0 ? "text-rose-500" : i === 6 ? "text-blue-600" : "text-slate-500"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((date, idx) => {
            const isToday = date && isSameDay(date, today);
            const isSelected = date && value && isSameDay(date, value);

            return (
                <button
                  key={idx}
                  className={[
                    "aspect-square rounded-xl flex items-center justify-center text-sm sm:text-base",
                    "transition select-none",
                    date ? (isSelected
                            ? "active:scale-95"                    // 선택된 날: hover 회색 넣지 않음
                            : "hover:bg-slate-100 active:scale-95" // 선택 안 된 날: hover 회색 허용
                          )
                        : "opacity-0 pointer-events-none",
                    isSelected ? "bg-indigo-500 text-white hover:bg-indigo-500" : "",
                    !isSelected && isToday && !value ? "ring-2 ring-indigo-500" : "",
                  ].join(" ")}
                  disabled={!date}
                  onClick={() => date && onChange?.(date)}
                >
                {date ? date.getDate() : ""}
                </button>
            );
        })}

            </div>
            </div>
        );
}
