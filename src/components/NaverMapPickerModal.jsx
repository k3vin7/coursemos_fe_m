import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { loadNaverMaps } from "./naverLoader.jsx";
import { reverseGeocode } from "./reverseGeocode.js";

export default function NaverMapPickerModal({
  open,
  onClose,
  onSelect,
  initialCenter,            // {lat, lng}
  title = "지도에서 위치 선택",
}) {
  const [ready, setReady] = useState(false);
  const [addr, setAddr] = useState({ display: "", road: "", jibun: "" });
  const [busy, setBusy] = useState(false);

  // 🔎 검색 상태
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");

  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // SDK 로드
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        await loadNaverMaps();
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setReady(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  // 지도 초기화 + 중심 이동 시 역지오코드
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

    requestAnimationFrame(() => nv.Event.trigger(map, "resize"));

    const onIdle = async () => {
      const c = map.getCenter();
      marker.setPosition(c);
      setBusy(true);
      const name = await reverseGeocode(c);   // {display, road, jibun}
      setAddr(name);
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

  // 🔎 주소/키워드 검색 → 지도 이동
  const doSearch = () => {
    const q = query.trim();
    const map = mapRef.current;
    const nv = window.naver?.maps;
    if (!q || !map || !nv?.Service?.geocode) return;

    setSearching(true);
    setSearchErr("");
    nv.Service.geocode({ query: q }, async (status, res) => {
      setSearching(false);
      if (status !== nv.Service.Status.OK) {
        setSearchErr("검색에 실패했어요. 다른 키워드로 시도해보세요.");
        return;
      }
      const item = res?.v2?.addresses?.[0];
      if (!item) {
        setSearchErr("검색 결과가 없어요.");
        return;
      }
      // v2: x=lng, y=lat (문자열)
      const lat = parseFloat(item.y);
      const lng = parseFloat(item.x);
      const coord = new nv.LatLng(lat, lng);

      map.setCenter(coord);
      markerRef.current?.setPosition(coord);

      // 바로 주소 라벨도 갱신
      setBusy(true);
      const name = await reverseGeocode(coord);
      setAddr(name);
      setBusy(false);
    });
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/50">
      <div className="w-[92vw] max-w-[540px] bg-white rounded-3xl shadow-xl p-4">
        <h3 className="font-semibold text-lg pl-1">{title}</h3>

        {/* 🔎 검색 바 */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
            placeholder="주소·지번·도로명으로 검색 (예: 서울특별시청)"
            className="flex-1 h-10 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={doSearch}
            disabled={searching || !query.trim()}
            className="px-4 h-10 rounded-xl bg-indigo-600 text-white disabled:opacity-50 active:scale-95 transition"
          >
            {searching ? "검색중…" : "검색"}
          </button>
        </div>
        {searchErr && <div className="mt-1 text-xs text-rose-500">{searchErr}</div>}

        {/* 지도 */}
        <div className="mt-3">
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

        {/* 주소 라벨 */}
        <div className="mt-3 text-xs text-gray-500">
          <div className="font-medium text-gray-600">현재 중심 주소</div>
          <div className="truncate">
            {busy ? "주소를 불러오는 중…" : (addr.display || "주소 없음")}
          </div>
        </div>

        {/* 액션 버튼 */}
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
              onSelect?.({ lat: c.lat(), lng: c.lng(), address: addr.display });
              onClose?.();
            }}
            className="px-4 h-10 rounded-xl bg-black text-white hover:opacity-90 active:scale-95 transition"
          >
            이 위치 선택
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
