// src/components/NaverMapPickerModal.jsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { loadNaverMaps } from "./naverLoader.jsx";
import { reverseGeocode } from "./reverseGeocode.js";

export default function NaverMapPickerModal({
  open,
  onClose,
  onSelect,
  initialCenter,            // { lat, lng }
  title = "지도에서 위치 선택",
}) {
  const [ready, setReady] = useState(false);

  // 주소 표시용
  const [addr, setAddr] = useState({ display: "", road: "", jibun: "" });
  const [busy, setBusy] = useState(false);

  // 지도/마커
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // 검색
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");

  // ===== 1) 모달 열릴 때 네이버맵 로드 & 지도 초기화 =====
  useEffect(() => {
    if (!open) return;
    let canceled = false;

    (async () => {
      await loadNaverMaps();
      if (canceled) return;

      const nv = window.naver?.maps;
      if (!nv || !mapDivRef.current) return;

      // 초기 중심
      const center = new nv.LatLng(
        initialCenter?.lat ?? 37.5665,
        initialCenter?.lng ?? 126.9780
      );

      // 지도 생성
      const map = new nv.Map(mapDivRef.current, {
        center,
        zoom: 15,
        minZoom: 6,
        maxZoom: 19,
      });
      mapRef.current = map;

      // 마커 생성(중심에 고정)
      markerRef.current = new nv.Marker({
        position: center,
        map,
      });

      // 중심 이동이 끝나면 주소 갱신
      const onDragEnd = async () => {
        const c = map.getCenter();
        markerRef.current?.setPosition(c);
        setBusy(true);
        try {
          const display = await reverseGeocode(c);
          setAddr({
            display,
            road: "",
            jibun: "",
          });
        } finally {
          setBusy(false);
        }
      };

      nv.Event.addListener(map, "dragend", onDragEnd);
      nv.Event.addListener(map, "zoom_changed", () => {
        // 확대/축소 후에도 마커는 항상 중심으로
        markerRef.current?.setPosition(map.getCenter());
      });

      // 최초 주소도 1회 역지오코딩
      setBusy(true);
      try {
        const display = await reverseGeocode(center);
        setAddr({ display, road: "", jibun: "" });
      } finally {
        setBusy(false);
      }

      setReady(true);
    })();

    return () => {
      canceled = true;
      setReady(false);
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [open, initialCenter?.lat, initialCenter?.lng]);

  // ===== 2) 검색(키워드 보정 포함) =====
  const doSearch = () => {
    const qRaw = query.trim();
    const map = mapRef.current;
    const nv = window.naver?.maps;
    if (!qRaw || !map || !nv?.Service?.geocode) return;

    const tryGeocode = (q) =>
      new Promise((resolve) => {
        nv.Service.geocode({ query: q }, (status, res) => {
          if (status !== nv.Service.Status.OK) return resolve(null);
          const item = res?.v2?.addresses?.[0] || null;
          if (!item) return resolve(null);
          const lat = parseFloat(item.y);
          const lng = parseFloat(item.x);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            resolve(new nv.LatLng(lat, lng));
          } else {
            resolve(null);
          }
        });
      });

    // 보정 후보: 그대로 → "역" → "구" → "동"
    const candidates = [qRaw];
    if (!/[구동역]$/.test(qRaw)) {
      candidates.push(`${qRaw}역`, `${qRaw}구`, `${qRaw}동`);
    }

    setSearching(true);
    setSearchErr("");

    (async () => {
      let coord = null;
      for (const c of candidates) {
        coord = await tryGeocode(c);
        if (coord) break;
      }
      setSearching(false);

      if (!coord) {
        setSearchErr("검색 결과가 없어요. 더 구체적으로 입력해 주세요. (예: 강남역, 교대, 서울시청)");
        return;
      }

      // 지도/마커 이동
      map.setCenter(coord);
      markerRef.current?.setPosition(coord);

      // 주소 갱신
      setBusy(true);
      try {
        const display = await reverseGeocode(coord);
        setAddr({ display, road: "", jibun: "" });
      } finally {
        setBusy(false);
      }
    })();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      data-swipe-ignore
      onClick={onClose}
    >
      <div
        className="w-[92vw] max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-4 py-3 border-b bg-white/95 backdrop-blur flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border grid place-items-center hover:bg-gray-50 active:scale-95"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 🔎 검색 바 */}
        <div className="mt-3 px-4 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
            placeholder="주소·장소·지번 검색 (예: 강남역, 교대, 서울시청)"
            className="flex-1 h-10 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={doSearch}
            disabled={searching || !query.trim()}
            className="px-3 h-10 rounded-xl bg-indigo-500 text-white hover:brightness-95 disabled:opacity-50 active:scale-95 transition"
          >
            검색
          </button>
        </div>

        {searchErr && (
          <div className="px-4 mt-2 text-sm text-red-600">{searchErr}</div>
        )}

        {/* 지도 영역 */}
        <div className="px-4 py-3">
          <div
            ref={mapDivRef}
            className="w-full h-[420px] rounded-xl overflow-hidden border border-gray-200"
          />
        </div>

        {/* 현재 주소 */}
        <div className="px-4 pb-3">
          <div className="text-xs text-gray-500">현재 중심 주소</div>
          <div className="text-sm text-gray-800 mt-1">
            {busy ? "주소 확인 중..." : (addr.display || "주소를 불러오는 중...")}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="px-4 pb-4 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 h-10 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:scale-95 transition"
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
                address: addr.display,
              });
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
