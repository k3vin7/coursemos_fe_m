export default function Intro({
  // 기존에 사용하던 props는 그대로 받도록 열어둠
  onStartLeft,
  onStartRight,

  // ✅ 추가된 3개
  showUserButton = false,        // 모달 열려있으면 false로 내려옴 → 버튼 렌더 안 함
  isAuthed = false,              // true면 '마이페이지', false면 '로그인'
  onUserButtonClick = () => {},  // 클릭 시 동작(로그인 모달 / 마이페이지 모달)
}) {
  return (
    <div className="relative w-full h-full">
      {/* ✅ 우상단 사용자 버튼(조건부 렌더). className은 필요하면 네 기존 값으로 바꿔도 됨 */}
      {showUserButton && (
        <button
          type="button"
          onClick={onUserButtonClick}
          className="absolute top-4 right-4 rounded-full border px-4 h-9 bg-white shadow-sm hover:bg-gray-50"
        >
          {isAuthed ? "마이페이지" : "로그인"}
        </button>
      )}

      {/*
        ▼▼▼ 여기 아래부터는 너의 기존 Intro 콘텐츠를 그대로 둬.
        (텍스트/가이드/버튼/일러스트 등 기존 마크업 전부 유지)
      */}

      {/* 예시: 기존에 있던 시작 버튼(그대로 유지) */}
      <div className="pointer-events-auto">
        {/* 오른쪽/왼쪽 이동용 기존 트리거가 있다면 그대로 */}
        {/* 필요 없으면 이 블록은 삭제해도 됨 */}
        <div className="sr-only">{/* 접근성용 자리표시자 */}</div>
      </div>
    </div>
  );
}
