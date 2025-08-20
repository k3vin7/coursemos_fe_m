// 지도를 띄워 중심을 이동해 위치 선택하는 모달
// props:
//  - open: boolean
//  - onClose(): void
//  - onSelect({lat, lng, address}): void
//  - initialCenter={{lat, lng}} (선택)
import { useEffect, useRef, useState } from "react";
import { useNaverLoader } from "./naverLoader.jsx";
import { reverseGeocode } from "./reverseGeocode.js";

export default function NaverMapPickerModal({
  open,
  onClose,
  onSelect,
  initialCenter,
}) {
  const ready = useNaverLoader();
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [address, setAddress] = useState("");

  // 스와이프 차단: 모달 내부 인터랙션 시 상위 제스처 방지
  useEffect(() => {
    if (!open) return;
    const el = mapDivRef.current;
    if (!el) return;
    const stop = (e) => e.stopPropagation();
    el.addEventListener("touchstart", stop, { passive: true });
    el.addEventListener("touchmove", stop, { passive: true });
    el.addEventListener("touchend", stop, { passive: true });
    el.addEventListener("mousedown", stop);
    el.addEventListener("mousemove", stop);
    el.addEventListener("mouseup", stop);
    return () => {
      el.removeEventListener("touchstart", stop);
      el.removeEventListener("touchmove", stop);
      el.removeEventListener("touchend", stop);
      el.removeEventListener("mousedown", stop);
      el.removeEventListener("mousemove", stop);
      el.removeEventListener("mouseup", stop);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !ready || !mapDivRef.current) return;

    const nv = window.naver.maps;
    const center = new nv.LatLng(
      initialCenter?.lat ?? 37.5665,
      initialCenter?.lng ?? 126.9780
    );
    const map = new nv.Map(mapDivRef.current, {
      center,
      zoom: 14,
      logoControl: false,
      mapDataControl: false,
      scaleControl: false,
      zoomControl: true,
      zoomControlOptions: { position: nv.Position.RIGHT_CENTER },
    });
    mapRef.current = map;

    const marker = new nv.Marker({
      position: map.getCenter(),
      map,
      clickable: false,
      icon: {
        content:
          '<div style="transform: translate(-50%,-100%); padding-bottom:4px;"><div style="width:14px;height:14px;border-radius:50%;background:#111;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25)"></div></div>',
      },
    });
    markerRef.current = marker;

    const onIdle = () => {
      const c = map.getCenter();
      marker.setPosition(c);
      reverseGeocode(c).then(setAddress);
    };
    nv.Event.addListener(map, "idle", onIdle);

    // 첫 주소
    reverseGeocode(map.getCenter()).then(setAddress);

    return () => {
      nv.Event.clearListeners(map, "idle");
      marker.setMap(null);
      map.destroy();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [open, ready, initialCenter?.lat, initialCenter?.lng]);

  if (!open) return null;

  const handleSelect = () => {
    const nv = window.naver.maps;
    const c = mapRef.current.getCenter();
    onSelect?.({ lat: c.y, lng: c.x, address });
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-[92vw] max-w-[860px] bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
        <div className="text-lg font-semibold mb-2">지도에서 위치 선택</div>
        <div
          ref={mapDivRef}
          className="w-full h-[52vh] rounded-xl border border-gray-200 overflow-hidden"
        />
        <div className="mt-3">
          <p className="text-sm text-gray-500">현재 중심 주소</p>
          <p className="text-base font-medium text-gray-800 break-words">
            {address || "주소를 불러오는 중..."}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 h-10 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 active:scale-95 transition"
          >
            취소
          </button>
          <button
            onClick={handleSelect}
            className="px-4 h-10 rounded-xl bg-[#111] text-white hover:brightness-110 active:scale-95 transition"
          >
            이 위치 선택
          </button>
        </div>
      </div>
    </div>
  );
}
