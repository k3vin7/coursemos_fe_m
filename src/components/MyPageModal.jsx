// src/components/MyPageModal.jsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getUser, getHomeInfo } from "../api/auth";

export default function MyPageModal({ open, onClose, onLogout }) {
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const user = useMemo(() => getUser() || {}, []);

  useEffect(() => {
    if (!open) return;
    // 스와이프 잠금
    const prev = window.__SWIPE_DISABLED;
    window.__SWIPE_DISABLED = true;

    // 프로필 사진 조회(GET /api/home/home) — 토큰 필요
    setLoading(true);
    setErr("");
    getHomeInfo()
      .then((d) => setPhotoURL(d?.photoURL || ""))
      .catch(() => {}) // 사진 없으면 무시
      .finally(() => setLoading(false));

    return () => { window.__SWIPE_DISABLED = prev; };
  }, [open]);

  if (!open) return null;

  const avatar = photoURL
    ? <img src={photoURL} alt="프로필" className="w-20 h-20 rounded-full object-cover border" />
    : (
      <div className="w-20 h-20 rounded-full bg-gray-200 grid place-items-center text-xl font-semibold text-gray-600 border">
        {(user?.name?.[0] || user?.email?.[0] || "🙂")}
      </div>
    );

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/40 grid place-items-center">
      <div className="w-[92vw] max-w-[560px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">마이페이지</h3>
          <button
            onClick={onClose}
            className="px-3 h-9 rounded-lg border text-gray-600 hover:bg-gray-50"
          >
            닫기
          </button>
        </div>

        <div className="flex items-center gap-4 mb-5">
          {avatar}
          <div>
            <p className="text-base font-semibold">{user?.name || "이름 미지정"}</p>
            <p className="text-sm text-gray-500">{user?.email || "이메일 미지정"}</p>
            {loading && <p className="text-xs text-gray-400 mt-1">프로필 불러오는 중…</p>}
            {err && <p className="text-xs text-rose-600 mt-1">{err}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoCard label="내 생일" value={user?.birthday} />
          <InfoCard label="파트너 생일" value={user?.partnerBirthday} />
          <InfoCard label="기념일(시작일)" value={user?.startDate} />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">로그인 후 토큰으로 보호됨</span>
          <button
            onClick={onLogout}
            className="px-4 h-10 rounded-xl bg-black text-white hover:opacity-90 active:scale-95"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-medium">{value || "—"}</p>
    </div>
  );
}
