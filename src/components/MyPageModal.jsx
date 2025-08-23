// src/components/MyPageModal.jsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getUser as readLocalUser,
  getHomeInfo,
  getHomePhoto,
  uploadProfilePhoto,
  saveUser,
  clearAuth,
} from "../api/auth";

/* ---------- 날짜 포맷: "YYYY-MM-DD"만 표시 ---------- */
// "2002-07-26T00:00:00.000Z" → "2002-07-26"
const dateOnly = (v) => {
  if (!v) return "";
  if (typeof v === "string") {
    // 문자열이면 맨 앞의 YYYY-MM-DD만 취함
    const m = v.match(/^\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
    // 혹시 다른 문자열이면 T 기준으로 잘라보기
    const i = v.indexOf("T");
    return i > 0 ? v.slice(0, i) : v;
  }
  // Date 객체 등은 안전하게 ISO로 변환 후 앞 10자리
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return String(v);
};

export default function MyPageModal({ open, onClose, onLogout }) {
  const [user, setUser] = useState(() => readLocalUser() || {});
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = window.__SWIPE_DISABLED;
    window.__SWIPE_DISABLED = true;

    const local = readLocalUser() || {};
    setUser(local);
    setPhotoURL(local.photoURL || local.profilePhoto || "");
    setErr("");
    setLoading(true);

    // 1) /api/mypage 로 프로필(이름/생일/연애일수/사진 등) 가져오기
    getHomeInfo()
      .then((me) => {
        if (!me || typeof me !== "object") return;
        const merged = { ...local, ...me };
        setUser(merged);
        setPhotoURL(me.photoURL || merged.photoURL || "");
        saveUser(merged);
      })
      .catch((e) => setErr(e?.message || "프로필을 불러올 수 없습니다."))
      .finally(async () => {
        // 2) (보정) 사진이 없으면 /api/home에서 photoURL만 보충
        try {
          if (!photoURL) {
            const h = await getHomePhoto(); // { photoURL }
            if (h?.photoURL) {
              setPhotoURL(h.photoURL);
              setUser((prev) => {
                const merged = { ...prev, photoURL: h.photoURL };
                saveUser(merged);
                return merged;
              });
            }
          }
        } catch {
          /* ignore */
        }
        setLoading(false);
      });

    return () => {
      window.__SWIPE_DISABLED = prev;
    };
  }, [open]);

  if (!open) return null;

  const displayName =
    user?.name || user?.nickname || user?.username || "이름 미지정";
  const displayEmail = user?.email || "이메일 미지정";

  async function onUploadChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr("");
    try {
      const { photoURL: url } = await uploadProfilePhoto(file); // POST /api/user/uploadPhoto
      if (url) {
        setPhotoURL(url);
        const merged = { ...(readLocalUser() || {}), photoURL: url };
        setUser(merged);
        saveUser(merged);
      }
    } catch (e) {
      setErr(e?.message || "사진 업로드 실패");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleLogout() {
    clearAuth();
    onLogout?.();
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/40 grid place-items-center">
      <div className="w-[92vw] max-w-[560px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">마이페이지</h3>
          <button
            onClick={onClose}
            className="px-3 h-9 text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-4 mb-5">
          {photoURL ? (
            <img
              src={photoURL}
              alt="프로필"
              className="w-20 h-20 rounded-full object-cover border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 grid place-items-center text-xl font-semibold text-gray-600 border">
              {displayName?.[0] || displayEmail?.[0] || "🙂"}
            </div>
          )}
          <div className="flex-1">
            <p className="text-base font-semibold">{displayName}</p>
            <p className="text-sm text-gray-500">{displayEmail}</p>
            {loading && (
              <p className="text-xs text-gray-400 mt-1">프로필 불러오는 중…</p>
            )}
            {err && !loading && (
              <p className="text-xs text-rose-600 mt-1">{err}</p>
            )}
          </div>
          <div className="shrink-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onUploadChange}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-3 h-auto rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-60"
            >
              {uploading ? "업로드 중…" : <>사진<br />변경</>}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* ⬇️ 날짜 세 곳은 시간 제거해서 표시 */}
          <Info label="내 생일" value={dateOnly(user?.birthday)} />
          <Info label="애인 생일" value={dateOnly(user?.partnerBirthday)} />
          <Info label="1일" value={dateOnly(user?.startDate)} />
          <Info
            label="연애일수"
            value={
              user?.daysTogether != null ? String(user.daysTogether) : undefined
            }
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="px-3 w-full h-10 rounded-xl bg-red-600 text-white hover:opacity-90 active:scale-95"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-medium">{value || "—"}</p>
    </div>
  );
}
