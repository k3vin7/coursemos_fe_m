// v3: Service 인스턴스 생성 없이 정적 메서드를 직접 호출
export function reverseGeocode(latlng) {
  return new Promise((resolve) => {
    const nv = window.naver?.maps;
    if (!nv?.Service?.reverseGeocode) return resolve("");

    nv.Service.reverseGeocode(
      { coords: latlng, orders: "roadaddr,addr" },
      (status, response) => {
        if (status !== nv.Service.Status.OK) return resolve("");
        const r = response?.v2?.results?.[0];
        if (!r) return resolve("");

        const name =
          r.roadAddress?.formatted ||
          r.jibunAddress?.formatted ||
          buildFromParts(r);
        resolve(name || "");
      }
    );
  });
}

function buildFromParts(r) {
  const parts = [
    r.region?.area1?.name,
    r.region?.area2?.name,
    r.region?.area3?.name,
    r.region?.area4?.name,
    r.land?.name,
    r.land?.number1,
    r.land?.number2 ? `-${r.land.number2}` : "",
  ].filter(Boolean);
  return parts.join(" ");
}
