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
  onSwipeLockChange,           // ⬅ App에 락 상태 알려줄 콜백
}) {
  const [center, setCenter] = useState({ lat: 37.385, lng: 127.121 });
  const [addr, setAddr] = useState({ display: "", road: "", jibun: "" });
  const [busy, setBusy] = useState(true);
  const [open, setOpen] = useState(false);

  // 진입 시 현위치(가능하면)로 기본 주소 채우기
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
      setAddr({ display: r.jibun || "", road: "", jibun: r.jibun || "" });
      setBusy(false);
    });

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 모달 열고 닫을 때 App에 "스와이프 잠금"만 알림 (모달 내부는 아무것도 안 함)
  const openModal = () => { setOpen(true); onSwipeLockChange?.(true); };
  const closeModal = () => { setOpen(false); onSwipeLockChange?.(false); };

  return (
    <div className="h-screen relative flex items-center justify-center px-4">
      <ProgressDock current={currentStep} total={totalSteps} />
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-5 sm:p-6 border border-slate-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">만남의 장소는...</h2>

        <div className="mb-4">
          <div className="text-sm text-gray-500">{busy ? "주소 가져오는 중…" : ""}</div>
          <div className="text-base font-medium">{addr.jibun || (busy ? "" : "")}</div>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={openModal}
            className="px-4 h-10 rounded-xl bg-indigo-500 text-white hover:opacity-90 active:scale-95 transition"
          >
            지도에서 선택
          </button>
        </div>
      </div>

      <NaverMapPickerModal
        open={open}
        onClose={closeModal}
        initialCenter={center}
        onSelect={(v) => {
          setCenter({ lat: v.lat, lng: v.lng });
          setAddr({ display: v.address || "", road: "", jibun: v.address || "" });
        }}
      />
    </div>
  );
}
