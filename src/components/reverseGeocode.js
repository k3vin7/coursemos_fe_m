// src/components/reverseGeocode.js
export function reverseGeocode(latlng) {
  return new Promise((resolve) => {
    const nv = window.naver?.maps;
    const EMPTY = { display: "", road: "", jibun: "" };
    if (!nv?.Service?.reverseGeocode) return resolve(EMPTY);

    const coords =
      latlng instanceof nv.LatLng
        ? latlng
        : new nv.LatLng(latlng?.lat, latlng?.lng);

    // 지번만 요청
    nv.Service.reverseGeocode(
      { coords, orders: nv.Service.OrderType.ADDR },
      (status, res) => {
        if (status !== nv.Service.Status.OK) return resolve(EMPTY);

        const r = res?.v2?.results?.[0];
        if (!r) return resolve(EMPTY);

        const formatted = r?.jibunAddress?.formatted;
        const parts = [
          r?.region?.area1?.name,
          r?.region?.area2?.name,
          r?.region?.area3?.name,
          r?.region?.area4?.name,
          r?.land?.name,
          [r?.land?.number1, r?.land?.number2].filter(Boolean).join("-") || undefined,
        ].filter(Boolean).join(" ");

        const jibun = formatted || parts || "";
        resolve({ display: jibun, road: "", jibun });
      }
    );
  });
}
