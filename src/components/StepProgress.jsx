export default function StepProgress({
  current = 1,
  total = 4,
}) {
  const clamped = Math.min(Math.max(current, 1), total);

  return (
    <div className="w-full">
      <div className="">
        <div
          className="top-[15vh] w-full h-[5vh] rounded-r-2xl
          bg-[#FABAE180] transition-[width] duration-300 ease-out overflow-hidden shadow-xl"
          style={{ width: `${(clamped) / (total || 1) * 100}%` }}
        />
      </div>
    </div>
  );
}
