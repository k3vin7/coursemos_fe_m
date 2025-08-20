// 네이버 스크립트 로더 (중복 로드 방지)
// 환경변수: VITE_NAVER_MAPS_CLIENT_ID
import { useEffect, useState } from "react";

let loadPromise = null;

function injectScript(clientId) {
  const existing = document.querySelector('script[data-naver-maps="v3"]');
  if (existing) return Promise.resolve();

  const src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.dataset.naverMaps = "v3";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Naver Maps script load failed"));
    document.head.appendChild(s);
  });
}

export function loadNaverMaps() {
  const clientId = import.meta.env.VITE_NAVER_MAPS_CLIENT_ID;
  if (!clientId) return Promise.reject(new Error("VITE_NAVER_MAPS_CLIENT_ID 누락"));
  if (!loadPromise) {
    loadPromise = injectScript(clientId).then(() => {
      // 스크립트 onload 직후 window.naver 초기화까지 한 프레임 여유
      return new Promise((r) => {
        if (window.naver?.maps) r();
        else requestAnimationFrame(r);
      });
    });
  }
  return loadPromise;
}

// 컴포넌트/훅: 준비 여부를 React 상태로 받기
export function useNaverLoader() {
  const [ready, setReady] = useState(!!window.naver?.maps);
  useEffect(() => {
    if (ready) return;
    loadNaverMaps().then(() => setReady(true)).catch(() => setReady(false));
  }, [ready]);
  return ready;
}
