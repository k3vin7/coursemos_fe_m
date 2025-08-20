export default function Optional_Result({ onPrev, onDone }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Optional — Result</h1>
      <div className="flex gap-3">
        <button className="px-4 py-2 rounded bg-gray-200" onClick={onPrev}>
          ← Etc
        </button>
        <button className="px-4 py-2 rounded bg-green-600 text-white" onClick={onDone}>
          Done → Intro
        </button>
      </div>
    </div>
  );
}
