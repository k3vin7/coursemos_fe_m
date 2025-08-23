// src/components/HeaderAuthButton.jsx
import { useEffect, useState } from "react";
import { isLoggedIn, clearAuth } from "../api/auth";
import AuthModal from "./AuthModal";
import MyPageModal from "./MyPageModal";

export default function HeaderAuthButton() {
  const [authed, setAuthed] = useState(isLoggedIn());
  const [showAuth, setShowAuth] = useState(false);
  const [showMy, setShowMy] = useState(false);

  // 다른 탭/창에서 로그인 상태가 바뀌어도 반영
  useEffect(() => {
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (e.key === "AUTH_TOKEN" || e.key === "AUTH_TOKEN_EXPIRES_AT") {
        setAuthed(isLoggedIn());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => (authed ? setShowMy(true) : setShowAuth(true))}
        className="px-4 h-10 rounded-xl border bg-white hover:bg-gray-50 shadow-sm"
      >
        {authed ? "마이페이지" : "로그인"}
      </button>

      {/* 로그인 모달 */}
      <AuthModal
        open={showAuth}
        onSuccess={() => {
          setShowAuth(false);
          setAuthed(true);          // 로그인 성공 → 버튼: 마이페이지
        }}
        onSkip={() => {
          setShowAuth(false);
          setAuthed(false);         // 그냥 둘러보기 → 버튼: 로그인
        }}
      />

      {/* 마이페이지 모달 */}
      <MyPageModal
        open={showMy}
        onClose={() => setShowMy(false)}
        onLogout={() => {
          clearAuth();
          setShowMy(false);
          setAuthed(false);         // 로그아웃 → 버튼: 로그인
          setShowAuth(true);        // 옵션: 곧바로 로그인 모달 띄우기
        }}
      />
    </>
  );
}
