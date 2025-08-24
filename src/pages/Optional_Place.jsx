// src/pages/Optional_Place.jsx
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
  value,
  onChange,
  mapOpen,            // ✅ 부모에서 내려옴
  setMapOpen,         // ✅ 부모에서 내려옴
}) {
  const [center, setCenter] = useState({
    lat: value?.lat ?? 37.385,
    lng: value?.lng ?? 127.121,
  });
  const [addr, setAddr] = useState(value?.address ?? "");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let alive = true;
    const secure = window.isSecureContext || location.hostname === "localhost";
    let candidate = { ...center };

    const getGeo = new Promise((resolve) => {
      if (secure && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (p) => {
            candidate = { lat: p.coords.latitude, lng: p.coords.longitude };
            if (alive) setCenter(candidate);
            resolve();
          },
          () => resolve(),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      } else resolve();
    });

    Promise.all([loadNaverMaps(), getGeo]).then(async () => {
      if (!alive) return;
      const r = await reverseGeocode(candidate);
      if (!alive) return;
      const jibun = r?.jibun || "";
      setAddr(jibun);
      onChange?.({ lat: candidate.lat, lng: candidate.lng, address: jibun });
      setBusy(false);
    });

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen relative flex items-center justify-center px-4">
      <ProgressDock current={currentStep} total={totalSteps} />
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-5 sm:p-6 border border-slate-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">만남의 장소는...</h2>

        <div className="mb-4">
          <div className="text-sm text-gray-500">
            {busy ? "주소 가져오는 중…" : "\u00A0"}
          </div>
          <div className="text-base font-medium truncate">
            {addr || (busy ? "" : "")}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={() => setMapOpen(true)}   // ✅ 부모 상태로 오픈
            className="px-4 h-10 rounded-xl bg-indigo-500 text-white hover:opacity-90 active:scale-95 transition"
          >
            지도에서 선택
          </button>
        </div>
      </div>

      <NaverMapPickerModal
        open={mapOpen}                         // ✅ 부모 상태 사용
        onClose={() => setMapOpen(false)}      // ✅ 부모 상태로 닫기
        initialCenter={center}
        onSelect={(v) => {
          setCenter({ lat: v.lat, lng: v.lng });
          setAddr(v.address || "");
          onChange?.({ lat: v.lat, lng: v.lng, address: v.address || "" });
          setMapOpen(false);                   // 선택 후 닫기(원하면 유지해도 됨)
        }}
      />
    </div>
  );
}
