import { useEffect, useState } from "react";
import NaverMapPickerModal from "../components/NaverMapPickerModal.jsx";
import { loadNaverMaps } from "../components/naverLoader.jsx";
import { reverseGeocode } from "../components/reverseGeocode.js";
import ProgressDock from "../components/ProgressDock.jsx";

export default function Optional_Place({
  onPrev,
  onNext,
  currentStep = 3,
  totalSteps = 4,
}) {
  // 기본 좌표(임시) — 현위치 성공 시 즉시 대체됨
  const [center, setCenter] = useState({ lat: 37.385, lng: 127.121 });
  const [addr, setAddr] = useState({ display: "", road: "", jibun: "" });
  const [busy, setBusy] = useState(true);
  const [open, setOpen] = useState(false);

  // ▶ 페이지 진입: (A) 현위치 시도하여 center 먼저 세팅 → (B) 지도 SDK 준비되면 해당 좌표로 지번 표시
  useEffect(() => {
    let alive = true;
    const secure = window.isSecureContext || location.hostname === "localhost";
    let candidate = { ...center }; // 기본값

    const getGeo = new Promise((resolve) => {
      if (secure && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (p) => {
            candidate = { lat: p.coords.latitude, lng: p.coords.longitude };
            if (alive) setCenter(candidate); // 현위치로 즉시 디폴트 교체
            resolve();
          },
          () => resolve(),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      } else {
        resolve();
      }
    });

    Promise.all([loadNaverMaps(), getGeo]).then(async () => {
      if (!alive) return;
      const r = await reverseGeocode(candidate); // 지번만
      if (!alive) return;
      setAddr({ display: r.jibun || "", road: "", jibun: r.jibun || "" });
      setBusy(false);
    });

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen relative flex items-center justify-center">
      {/* 프로그레스바 유지 */}
      <ProgressDock current={currentStep} total={totalSteps} />

      <div className="w-[86vw] max-w-[720px] bg-white/85 backdrop-blur rounded-3xl shadow-lg border border-white/40 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">위치 선택</h2>

        <div className="mb-4">
          <div className="text-sm text-gray-500">
            {busy ? "주소 가져오는 중…" : "현재 선택된 지번"}
          </div>
          <div className="text-base font-medium">
            {addr.jibun || (busy ? "" : "")}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setOpen(true)}
            className="px-4 h-10 rounded-xl bg-black text-white hover:opacity-90 active:scale-95 transition"
          >
            지도에서 선택
          </button>

          <div className="flex gap-2">
            <button
              onClick={onPrev}
              className="px-4 h-10 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 active:scale-95 transition"
            >
              이전
            </button>
            <button
              onClick={onNext}
              className="px-4 h-10 rounded-xl bg-[#FF6C43] text-white hover:brightness-110 active:scale-95 transition"
            >
              다음
            </button>
          </div>
        </div>
      </div>

      <NaverMapPickerModal
        open={open}
        onClose={() => setOpen(false)}
        initialCenter={center}
        onSelect={(v) => {
          setCenter({ lat: v.lat, lng: v.lng });
          setAddr({
            display: v.addressJibun || "",
            road: "",
            jibun: v.addressJibun || "",
          });
        }}
      />
    </div>
  );
}
