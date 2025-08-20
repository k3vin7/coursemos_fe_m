import React, { useEffect, useRef, useState } from "react";
import { ensureLeafletLoaded } from "./leafletLoader";

export default function MapPickerModal({
  open,
  initialPos,           // { lat, lng }
  onClose,
  onConfirm,            // ({lat, lng}) => void
}) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [selPos, setSelPos] = useState(initialPos);

  useEffect(() => {
    if (open) setSelPos(initialPos);
  }, [open, initialPos]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    (async () => {
      await ensureLeafletLoaded();
      if (cancelled) return;
      const L = window.L;

      const center = selPos || initialPos || { lat: 37.5665, lng: 126.9780 };
      if (!mapRef.current) {
        const map = L.map(mapEl.current, { zoomControl: true }).setView([center.lat, center.lng], 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        }).addTo(map);

        markerRef.current = L.marker([center.lat, center.lng]).addTo(map);

        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          markerRef.current.setLatLng([lat, lng]);
          setSelPos({ lat, lng });
        });

        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 0);
      } else {
        setTimeout(() => mapRef.current.invalidateSize(), 0);
        if (selPos) {
          mapRef.current.setView([selPos.lat, selPos.lng], mapRef.current.getZoom());
          markerRef.current.setLatLng([selPos.lat, selPos.lng]);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [open, selPos, initialPos]);

  if (!open) return null;

  return (
    // ★ 여기서 이벤트 버블링을 막아서 부모(페이지)로 스와이프가 전달되지 않도록
    <div
      className="fixed inset-0 z-50"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[92vw] max-w-[880px] mx-auto mt-[8vh] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-base font-semibold">지도를 클릭해 위치를 선택하세요</h3>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200"
            >
              닫기
            </button>
            <button
              onClick={() => selPos && onConfirm?.(selPos)}
              disabled={!selPos}
              className="px-4 h-9 rounded-lg bg-[#FF6C43] text-white hover:brightness-95 disabled:opacity-50"
            >
              선택 확정
            </button>
          </div>
        </div>
        <div
          ref={mapEl}
          className="w-full h-[60vh]"
          // 모바일 제스처를 지도에 온전히 넘기기
          style={{ touchAction: "none" }}
        />
      </div>
    </div>
  );
}
