let _promise;

export function loadNaverMaps() {
  if (window.naver?.maps?.Service) return Promise.resolve(window.naver.maps);

  if (!_promise) {
    _promise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-naver-maps="v3"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.naver.maps));
        existing.addEventListener('error', reject);
        return;
      }
      const s = document.createElement('script');
      s.dataset.naverMaps = 'v3';
      s.async = true;
      s.src =
        `https://oapi.map.naver.com/openapi/v3/maps.js` +
        `?ncpKeyId=${import.meta.env.VITE_NAVER_MAP_KEY_ID}` +
        `&submodules=geocoder`;
      s.onload = () => resolve(window.naver.maps);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return _promise;
}
