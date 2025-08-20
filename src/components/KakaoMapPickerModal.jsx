import { useEffect, useRef, useState } from "react";
import { ensureKakaoLoaded } from "./kakaoLoader";
import reverseGeocode, { regionName } from "./reverseGeocode";

export default function KakaoMapPickerModal({
  initialCenter = { lat: 37.5665, lng: 126.9780 },
  onPick,
  onClose,
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markerRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [center, setCenter] = useState(initialCenter);
  const [label, setLabel] = useState("지도를 준비하는 중…");

  const safeRelayout = () => {
    const { kakao } = window;
    const map = mapRef.current;
    if (!map || !kakao) return;
    try {
      map.relayout();
      map.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
    } catch {}
  };

  useEffect(() => {
    let mounted = true;
    let resizeObs;

    async function boot() {
      await ensureKakaoLoaded(import.meta.env.VITE_KAKAO_JS_KEY);
      if (!mounted) return;

      const { kakao } = window;

      const el = containerRef.current;
      if (el) {
        el.style.width = "100%";
        el.style.height = "60vh";
      }

      const map = new kakao.maps.Map(el, {
        center: new kakao.maps.LatLng(initialCenter.lat, initialCenter.lng),
        level: 3,
      });
      mapRef.current = map;

      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(initialCenter.lat, initialCenter.lng),
        draggable: true,
      });
      marker.setMap(map);
      markerRef.current = marker;

      updateLabel(initialCenter.lat, initialCenter.lng);

      kakao.maps.event.addListener(map, "click", function (mouseEvent) {
        const latlng = mouseEvent.latLng;
        const next = { lat: latlng.getLat(), lng: latlng.getLng() };
        marker.setPosition(latlng);
        setCenter(next);
        updateLabel(next.lat, next.lng);
      });

      kakao.maps.event.addListener(marker, "dragend", function () {
        const pos = marker.getPosition();
        const next = { lat: pos.getLat(), lng: pos.getLng() };
        setCenter(next);
        updateLabel(next.lat, next.lng);
      });

      requestAnimationFrame(safeRelayout);
      setTimeout(safeRelayout, 0);
      setTimeout(safeRelayout, 200);

      if ("ResizeObserver" in window && el) {
        resizeObs = new ResizeObserver(() => safeRelayout());
        resizeObs.observe(el);
      } else {
        window.addEventListener("resize", safeRelayout);
      }

      setReady(true);
    }

    boot();

    return () => {
      mounted = false;
      if (resizeObs) resizeObs.disconnect();
      else window.removeEventListener("resize", safeRelayout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCenter.lat, initialCenter.lng]);

  async function updateLabel(lat, lng) {
    const admin = await regionName(lat, lng);
    if (admin) setLabel(admin);
    else {
      const addr = await reverseGeocode(lat, lng);
      setLabel(addr || "");
    }
  }

  const submit = () => {
    onPick?.({
      lat: center.lat,
      lng: center.lng,
      address: label,
      name: label,
    });
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[900px] bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">지도에서 장소 선택</h3>
          <button
            onClick={onClose}
            className="px-3 h-9 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            닫기
          </button>
        </div>

        <div ref={containerRef} className="w-full h-[60vh]" />

        <div className="px-4 py-3 border-t flex items-center justify-between gap-3">
          <div className="min-w-0 text-sm text-gray-700 truncate">
            {label ? label : "위치를 선택하세요"}
            <span className="ml-2 text-gray-400">
              ({center.lat.toFixed(5)}, {center.lng.toFixed(5)})
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 h-10 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 active:scale-95 transition"
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={!ready}
              className="px-4 h-10 rounded-xl bg-[#FF6C43] text-white hover:brightness-110 active:scale-95 transition disabled:opacity-50"
            >
              선택
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
