// src/utils/naverLoader.jsx (혹은 네가 둔 위치)
let loadPromise = null;

function injectScript({ keyId, clientId }) {
  if (!keyId && !clientId) {
    throw new Error("NAVER 지도 키가 없습니다. VITE_NAVER_MAP_KEY_ID 또는 VITE_NAVER_MAPS_CLIENT_ID를 설정하세요.");
  }

  const exist = document.querySelector('script[data-naver-maps="v3"]');
  if (exist) return Promise.resolve();

  const qs = keyId
    ? `ncpKeyId=${encodeURIComponent(keyId)}`
    : `ncpClientId=${encodeURIComponent(clientId)}`;

  const s = document.createElement("script");
  s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${qs}&submodules=geocoder`;
  s.async = true;
  s.defer = true;
  s.setAttribute("data-naver-maps", "v3");

  return new Promise((resolve, reject) => {
    s.onload = resolve;
    s.onerror = () => reject(new Error("Naver Maps SDK 로드 실패"));
    document.head.appendChild(s);
  });
}

export function useNaverLoader() {
  const keyId = import.meta.env.VITE_NAVER_MAP_KEY_ID;
  const clientId = import.meta.env.VITE_NAVER_MAPS_CLIENT_ID;

  if (!loadPromise) {
    loadPromise = injectScript({ keyId, clientId }).then(
      () =>
        new Promise((r) => {
          const check = () =>
            (window.naver?.maps?.Service?.reverseGeocode ? r(true) : requestAnimationFrame(check));
          check();
        })
    );
  }
  return loadPromise;
}
