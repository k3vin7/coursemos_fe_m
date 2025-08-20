// Optional_Place: 처음엔 지역명만 보여주고, "지도에서 선택" 누르면 모달 지도 오픈
// 선택 완료 후엔 선택된 주소/좌표 표시, onSelect로 부모 전달
import { useEffect, useState } from "react";
import ProgressDock from "../components/ProgressDock.jsx";
import { useNaverLoader } from "../components/naverLoader.jsx";
import NaverMapPickerModal from "../components/NaverMapPickerModal.jsx";

export default function Optional_Place({
  onPrev,
  onNext,
  onSelect, // { lat, lng, address } 전달
  currentStep = 3,
  totalSteps = 4,
}) {
  const ready = useNaverLoader();

  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [regionText, setRegionText] = useState(""); // 예: 성남시 분당구
  const [selected, setSelected] = useState(null);   // { lat, lng, address }
  const [openPicker, setOpenPicker] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // 2) 현재 center 기준으로 "지역명"만 역지오코딩 (area2 + area3)
  useEffect(() => {
    if (!ready) return;
    fetchRegionName(center).then((name) => setRegionText(name));
  }, [ready, center.lat, center.lng]);

  // 3) 모달 동작
  const open = () => setOpenPicker(true);
  const close = () => setOpenPicker(false);
  const handlePickSelect = (loc) => {
    // loc = { lat, lng, address }
    setSelected(loc);
    onSelect?.(loc);
    setCenter({ lat: loc.lat, lng: loc.lng });
    setOpenPicker(false);
  };

  return (
    <div className="h-screen relative flex items-center justify-center">
      <ProgressDock
        current={currentStep}
        total={totalSteps}
        labels={["date", "time", "place", "etc"]}
      />

      <div className="w-[92vw] max-w-[820px] bg-white/85 backdrop-blur rounded-3xl shadow-lg border border-white/40 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">위치 선택</h2>
          <button
            onClick={open}
            className="px-3 h-9 rounded-lg border border-gray-300 hover:bg-gray-50 active:scale-95 transition text-sm"
          >
            지도에서 선택
          </button>
        </div>

        {/* 현재 지역(간단 표시) */}
        <div className="px-1">
          <p className="text-sm text-gray-500">현재 지역</p>
          <p className="text-xl font-semibold text-gray-900">
            {regionText || "지역 정보를 불러오는 중..."}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            * 버튼을 눌러 지도로 정확한 위치를 선택할 수 있어.
          </p>
        </div>

        {/* 선택 결과 요약 */}
        {selected && (
          <div className="mt-4 px-1 text-sm text-gray-700">
            <span className="font-semibold">선택됨: </span>
            {selected.address}{" "}
            <span className="text-gray-500">
              ({selected.lat.toFixed(6)}, {selected.lng.toFixed(6)})
            </span>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={onPrev}
            className="px-4 h-10 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 active:scale-95 transition"
          >
            이전
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={open}
              className="px-4 h-10 rounded-xl border border-gray-300 hover:bg-gray-50 active:scale-95 transition"
            >
              지도에서 다시 선택
            </button>
            <button
              onClick={onNext}
              className="px-4 h-10 rounded-xl bg-[#FF6C43] text-white hover:brightness-95 active:scale-95 transition"
            >
              다음
            </button>
          </div>
        </div>
      </div>

      {/* 전체 화면 지도 모달 */}
      <NaverMapPickerModal
        open={openPicker}
        onClose={close}
        onSelect={handlePickSelect}
        initialCenter={center}
      />
    </div>
  );
}

/** center(lat,lng)로부터 "성남시 분당구" 같은 지역 문자열 얻기 */
async function fetchRegionName({ lat, lng }) {
  const nv = window.naver?.maps;
  if (!nv?.Service?.reverseGeocode) return "";
  return new Promise((resolve) => {
    nv.Service.reverseGeocode(
      { coords: new nv.LatLng(lat, lng), orders: "addr" }, // 지번 기반으로 region 파트가 잘 옴
      (status, response) => {
        if (status !== nv.Service.Status.OK) return resolve("");
        const r = response?.v2?.results?.[0];
        if (!r) return resolve("");

        const a2 = r.region?.area2?.name || ""; // 시/군/구
        const a3 = r.region?.area3?.name || ""; // 읍/면/동
        const a1 = r.region?.area1?.name || ""; // 시/도 (필요시 포함)

        // 보통 원하는 형태: "성남시 분당구" (또는 "서울특별시 강남구")
        // area2가 비어있고 area1이 필요한 지역(광역시 등) 대비
        const main = [a2 || a1, a3].filter(Boolean).join(" ");
        resolve(main || a1 || "");
      }
    );
  });
}
