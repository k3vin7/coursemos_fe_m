import { useEffect, useMemo, useRef } from "react";

export default function TimePicker({
  hour,
  minute,
  onChange,             
  itemHeight = 36,
  wheelHeight = 160,
}) {
  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minuteOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []);

  return (
    <div className="relative grid grid-cols-[1fr_20px_1fr] gap-2 items-center">
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 mx-2">
        <div className="h-10 rounded-2xl border-2 border-indigo-300 bg-[indigo]/5" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white to-transparent rounded-t-2xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent rounded-b-2xl" />

      <Wheel
        options={hourOptions}
        value={hour ?? 0}
        onChange={(h) => onChange?.({ hour: h, minute })}
        renderItem={(v) => String(v).padStart(2, "0")}
        itemHeight={itemHeight}
        wheelHeight={wheelHeight}
      />

      <div className="text-center text-lg font-bold text-gray-500 select-none">:</div>

      <Wheel
        options={minuteOptions}
        value={minute ?? 0}
        onChange={(m) => onChange?.({ hour: hour ?? 0, minute: m })}
        renderItem={(v) => String(v).padStart(2, "0")}
        itemHeight={itemHeight}
        wheelHeight={wheelHeight}
      />
    </div>
  );
}

function Wheel({ options, value, onChange, renderItem, itemHeight, wheelHeight }) {
  const ref = useRef(null);
  const pad = 2;

  useEffect(() => {
    if (!ref.current) return;
    const idx = Math.max(0, options.indexOf(value));
    ref.current.scrollTop = idx * itemHeight;
  }, [options, value, itemHeight]);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    let t = null;

    const onScroll = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        const nearestIdx = Math.round(el.scrollTop / itemHeight);
        const clampedIdx = Math.min(Math.max(nearestIdx, 0), options.length - 1);
        el.scrollTo({ top: clampedIdx * itemHeight, behavior: "smooth" });
        const newVal = options[clampedIdx];
        if (newVal !== value) onChange?.(newVal);
      }, 80);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (t) clearTimeout(t);
    };
  }, [options, value, itemHeight, onChange]);

  return (
    <div
      ref={ref}
      className="overflow-y-auto no-scrollbar rounded-2xl bg-white/70 border border-gray-200 scroll-smooth touch-pan-y"
      style={{
        height: `${wheelHeight}px`,
        scrollSnapType: "y mandatory",
        paddingTop: `${pad * itemHeight}px`,
        paddingBottom: `${pad * itemHeight}px`,
      }}
    >
      <ul className="divide-y divide-gray-100">
        {options.map((opt, i) => {
          const selected = opt === value;
          return (
            <li
              key={`${i}-${opt}`}
              className={[
                "flex items-center justify-center select-none",
                selected ? "text-indigo-500 font-semibold" : "text-gray-700",
              ].join(" ")}
              style={{ height: `${itemHeight}px`, scrollSnapAlign: "center" }}
              onClick={() => onChange?.(opt)}
            >
              {renderItem(opt)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
