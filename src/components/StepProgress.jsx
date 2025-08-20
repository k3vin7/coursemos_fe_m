export default function StepProgress({
  current = 1,
  total = 4,
}) {
  const clamped = Math.min(Math.max(current, 1), total);

  return (
    <div className="w-full">
      <div className="mt-2 h-2 w-full rounded-full bg-white/60 overflow-hidden">
        <div
          className="h-full bg-[#FABAE180] transition-[width] duration-300 ease-out"
          style={{ width: `${(clamped) / (total || 1) * 100}%` }}
        />
      </div>
    </div>
  );
}
