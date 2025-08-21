import { useEffect, useRef, useState, useCallback } from "react";
import { loadNaverMaps } from "./naverLoader.jsx";
import { reverseGeocode } from "./reverseGeocode.js";

export default function NaverMapPickerModal({
  open,
  onClose,
  onSelect,
  initialCenter,
  title = "지도에서 위치 선택",
}) {
  const [busy, setBusy] = useState(false);
  const [addr, setAddr] = useState({ display: "", road: "", jibun: "" });

  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // 모달 열릴 때만 페이지 스와이프 잠금(지도 안 제스처는 통과)
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.dataset.swipeLock = "1";
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      delete document.documentElement.dataset.swipeLock;
    };
  }, [open]);

  // 지도 밖에서만 이벤트 차단, 지도 영역은 그대로 통과
  const blockOutside = useCallback((e) => {
    const mapEl = mapDivRef.current;
    if (!mapEl) return;
    if (!mapEl.contains(e.target)) {
      e.stopPropagation();
      if (typeof e.preventDefault === "function") e.preventDefault();
    }
  }, []);

  const updateAddress = async (latlng) => {
    setBusy(true);
    const r = await reverseGeocode(latlng);
    setAddr({ display: r.jibun || "", road: "", jibun: r.jibun || "" }); // 지번만
    setBusy(false);
  };

  useEffect(() => {
    if (!open) return;
    let alive = true;
    let dispose = () => {};
    loadNaverMaps().then(() => {
      if (!alive) return;
      const nv = window.naver.maps;
      const center =
        initialCenter?.lat && initialCenter?.lng
          ? new nv.LatLng(initialCenter.lat, initialCenter.lng)
          : new nv.LatLng(37.5665, 126.9780);

      const map = new nv.Map(mapDivRef.current, { center, zoom: 16, minZoom: 7 });
      mapRef.current = map;

      const marker = new nv.Marker({ position: center, map });
      markerRef.current = marker;

      updateAddress(center);

      const idle = nv.Event.addListener(map, "idle", () => {
        const c = map.getCenter();
        marker.setPosition(c);
        updateAddress(c);
      });

      // 모달 초기 1프레임 후 사이즈 보정(흰 화면 방지)
      requestAnimationFrame(() => {
        const el = mapDivRef.current;
        if (el) map.setSize(new nv.Size(el.clientWidth || 360, el.clientHeight || 420));
      });

      dispose = () => {
        nv.Event.removeListener(idle);
        map.destroy();
      };
    });
    return () => { alive = false; dispose(); };
  }, [open, initialCenter]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onTouchStart={blockOutside}
      onTouchMove={blockOutside}
      onPointerDown={blockOutside}
      onPointerMove={blockOutside}
      onWheel={blockOutside}
      onMouseDown={blockOutside}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[92vw] max-w-[720px] h-[70vh] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="px-3 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 transition"
          >
            닫기
          </button>
        </div>

        <div className="flex-1 relative">
          <div ref={mapDivRef} className="absolute inset-0 touch-pan-x touch-pan-y" />
          {/* 중앙 원 오버레이 제거됨 */}
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="mb-3">
            <div className="text-sm text-gray-500 mb-1">
              {busy ? "주소 가져오는 중…" : "현재 중심 지번"}
            </div>
            <div className="text-base font-medium">
              {addr.jibun || (busy ? "" : "")}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 h-10 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 active:scale-95 transition"
            >
              취소
            </button>
            <button
              onClick={() => {
                const c = mapRef.current.getCenter();
                onSelect?.({
                  lat: c.lat(),
                  lng: c.lng(),
                  addressRoad: "",          // 도로명 제거
                  addressJibun: addr.jibun, // 지번만 전달
                });
                onClose?.();
              }}
              className="px-4 h-10 rounded-xl bg-black text-white hover:opacity-90 active:scale-95 transition"
            >
              이 위치 선택
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
