// 네이버 지도 SDK 로더 (싱글톤)
let loadPromise = null;

function injectScript(clientId) {
  const exist = document.querySelector('script[data-naver-maps="v3"]');
  if (exist) return Promise.resolve();

  const s = document.createElement('script');
  s.src =
    `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
  s.async = true;
  s.defer = true;
  s.setAttribute('data-naver-maps', 'v3');

  return new Promise((resolve, reject) => {
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Naver Maps SDK'));
    document.head.appendChild(s);
  });
}

export function useNaverLoader() {
  const clientId = import.meta.env.VITE_NAVER_MAPS_CLIENT_ID;
  if (!loadPromise) {
    loadPromise = injectScript(clientId).then(
      () =>
        new Promise((r) => {
          const check = () => {
            if (window.naver?.maps?.Service?.reverseGeocode) r(true);
            else requestAnimationFrame(check);
          };
          check();
        })
    );
  }
  return loadPromise;
}
