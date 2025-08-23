// src/components/AuthModal.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { login, signup, saveAuth } from "../api/auth";

export default function AuthModal({ open, onSuccess, onSkip }) {
  useEffect(() => {
    if (!open) return;
    const prev = window.__SWIPE_DISABLED;
    window.__SWIPE_DISABLED = true;
    return () => { window.__SWIPE_DISABLED = prev; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/40">
      <div className="w-[92vw] max-w-[520px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-5">
        <Header />
        <Body onSuccess={onSuccess} />
        <Footer onSkip={onSkip} />
      </div>
    </div>,
    document.body
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xl font-bold">로그인</h3>
      <span className="text-xs text-gray-400">튜토리얼은 로그인 후 1회 표시</span>
    </div>
  );
}

function Body({ onSuccess }) {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'

  // 공통 필드
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  // 회원가입 전용 필드
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");           // YYYY-MM-DD (optional)
  const [partnerBirthday, setPartnerBirthday] = useState(""); // YYYY-MM-DD (optional)
  const [startDate, setStartDate] = useState("");         // YYYY-MM-DD (optional)

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const canSubmit =
    mode === "login" ? email && pw : name && email && pw;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setErr("");

    try {
      if (mode === "login") {
        const data = await login({ email, password: pw });
        saveAuth({
          token: data?.token,
          refreshToken: data?.refreshToken,
          expiresIn: Number(data?.expiresIn),
          user: null,
        });
        onSuccess?.({ token: data?.token });
      } else {
        const payload = {
          email,
          password: pw,
          name,
          ...(birthday ? { birthday } : {}),
          ...(partnerBirthday ? { partnerBirthday } : {}),
          ...(startDate ? { startDate } : {}),
          // profilePhoto는 UI에서 받지 않음
        };
        const data = await signup(payload);
        saveAuth({ token: data?.token, user: data?.user });
        onSuccess?.({ token: data?.token, user: data?.user });
      }
    } catch (e) {
      setErr(e.message || "요청 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Tabs value={mode} onChange={setMode} />

      {/* 입력 순서: 이름 → 이메일 → 비밀번호 */}
      {mode === "signup" && (
        <input
          type="text"
          placeholder="이름(또는 닉네임)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          required
        />
      )}

      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        autoComplete="email"
        required
      />

      <input
        type="password"
        placeholder="비밀번호"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        required
      />

      {/* 회원가입 모드에서 추가정보 3개: 처음부터 노출(선택 입력) */}
      {mode === "signup" && (
        <div className="grid gap-2 md:grid-cols-3">
          <label className="text-xs text-gray-500">
            본인 생일
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="block w-full h-10 px-2 mt-1 rounded-lg border border-gray-200"
            />
          </label>
          <label className="text-xs text-gray-500">
            파트너 생일
            <input
              type="date"
              value={partnerBirthday}
              onChange={(e) => setPartnerBirthday(e.target.value)}
              className="block w-full h-10 px-2 mt-1 rounded-lg border border-gray-200"
            />
          </label>
          <label className="text-xs text-gray-500">
            기념일(시작일)
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full h-10 px-2 mt-1 rounded-lg border border-gray-200"
            />
          </label>
        </div>
      )}

      {err && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2">
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || busy}
        className="w-full h-11 rounded-xl bg-black text-white hover:opacity-90 active:scale-95 disabled:opacity-60 transition"
      >
        {busy ? "처리 중…" : mode === "login" ? "로그인" : "회원가입"}
      </button>

      <p className="text-center text-sm text-gray-500">
        {mode === "login" ? "아직 계정이 없나요? " : "이미 계정이 있나요? "}
        <button
          type="button"
          onClick={() => { setErr(""); setMode(mode === "login" ? "signup" : "login"); }}
          className="underline underline-offset-2 text-indigo-600"
        >
          {mode === "login" ? "회원가입" : "로그인"}
        </button>
      </p>
    </form>
  );
}

function Tabs({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl mb-2">
      <button
        type="button"
        onClick={() => onChange("login")}
        className={`h-9 rounded-lg text-sm font-medium transition ${
          value === "login" ? "bg-white shadow border" : "text-gray-600"
        }`}
      >
        로그인
      </button>
      <button
        type="button"
        onClick={() => onChange("signup")}
        className={`h-9 rounded-lg text-sm font-medium transition ${
          value === "signup" ? "bg-white shadow border" : "text-gray-600"
        }`}
      >
        회원가입
      </button>
    </div>
  );
}

function Footer({ onSkip }) {
  return (
    <div className="mt-3 text-center">
      <button
        type="button"
        onClick={onSkip}
        className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
      >
        그냥 둘러볼게요
      </button>
    </div>
  );
}
