export default function Intro({
  onStartLeft,
  onStartRight,
  showUserButton = false,
  isAuthed = false,
  onUserButtonClick,
}) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
      {/* 사용자 버튼 (조건부 렌더) */}
      {showUserButton && (
        <button
          type="button"
          onClick={onUserButtonClick}
          className="absolute top-4 right-4 rounded-full border px-4 h-9 bg-white shadow-sm hover:bg-gray-50"
        >
          {isAuthed ? "마이페이지" : "로그인"}
        </button>
      )}

      {/* 기존 인트로 콘텐츠 (필요시 네 문구/버튼 그대로 유지) */}
      <h2 className="text-center text-lg font-semibold mb-6">
        추천 데이트 코스는 여기!!
      </h2>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={onStartRight}
          className="mx-auto rounded-full bg-pink-100 px-5 py-2 text-sm shadow"
        >
          오른쪽으로 스와이프! →
        </button>
        <button
          type="button"
          onClick={onStartLeft}
          className="mx-auto rounded-full bg-gray-100 px-5 py-2 text-sm shadow"
        >
          ← 왼쪽으로 스와이프!
        </button>
      </div>
    </div>
  );
}
