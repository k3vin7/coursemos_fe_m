import { useEffect, useRef, useState } from "react";
import { useNaverLoader } from "../components/naverLoader";
import { reverseGeocode } from "../components/reverseGeocode";

export default function NaverMapPickerModal({
  open,
  onClose,
  onSelect,
  initialCenter, // {lat, lng}
  title = "지도에서 위치 선택",
}) {
  const [ready, setReady] = useState(false);
  const [addr, setAddr] = useState("");
  const [busy, setBusy] = useState(false);

  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // SDK 로드
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        await useNaverLoader();
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // 지도 초기화
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
      scaleControl: false,
      logoControl: false,
      mapDataControl: false,
    });
    mapRef.current = map;

    const marker = new nv.Marker({ position: center, map });
    markerRef.current = marker;

    // 모달 표시 후 리사이즈 트리거
    requestAnimationFrame(() => nv.Event.trigger(map, "resize"));

    const onIdle = async () => {
      const c = map.getCenter();
      marker.setPosition(c);
      setBusy(true);
      const name = await reverseGeocode(c);
      setAddr(name || "");
      setBusy(false);
    };

    nv.Event.addListener(map, "idle", onIdle);
    onIdle();

    return () => {
      nv.Event.clearInstanceListeners(map);
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [open, ready, initialCenter?.lat, initialCenter?.lng]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-[92vw] max-w-[540px] bg-white rounded-3xl shadow-xl p-4">
        <div className="relative">
          <div className="absolute top-2 left-0 w-32 h-1 bg-pink-200 rounded-full" />
          <h3 className="font-semibold text-lg pl-1">{title}</h3>
        </div>

        <div className="mt-4">
          {!ready ? (
            <div className="w-full h-[52vh] rounded-xl border grid place-items-center text-sm text-gray-500">
              네이버 지도 SDK 로딩 중…
            </div>
          ) : (
            <div
              ref={mapDivRef}
              className="w-full h-[52vh] rounded-xl border border-gray-200"
            />
          )}
        </div>

        <div className="mt-3 text-xs text-gray-500">
          <div className="font-medium text-gray-600">현재 중심 주소</div>
          <div className="truncate">
            {busy ? "주소를 불러오는 중…" : addr || "주소 없음"}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 h-10 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 active:scale-95 transition"
          >
            취소
          </button>
          <button
            onClick={() => {
              const map = mapRef.current;
              if (!map) return;
              const c = map.getCenter();
              onSelect?.({
                lat: c.lat(),
                lng: c.lng(),
                address: addr,
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
  );
}
