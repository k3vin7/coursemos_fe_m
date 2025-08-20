// reverseGeocode.js
export function reverseGeocode(latlng) {
  return new Promise((resolve) => {
    const nv = window.naver?.maps;
    if (!nv?.Service?.reverseGeocode) return resolve("");

    nv.Service.reverseGeocode(
      { coords: latlng, orders: "roadaddr,addr" },
      (status, res) => {
        if (status !== nv.Service.Status.OK) return resolve("");
        const r = res?.v2?.results?.[0];
        if (!r) return resolve("");

        const text =
          r.roadAddress?.formatted ||
          r.jibunAddress?.formatted ||
          [
            r.region?.area1?.name,
            r.region?.area2?.name,
            r.region?.area3?.name,
            r.region?.area4?.name,
            r.land?.name,
            r.land?.number1,
            r.land?.number2 ? `-${r.land.number2}` : "",
          ].filter(Boolean).join(" ");

        resolve(text || "");
      }
    );
  });
}
