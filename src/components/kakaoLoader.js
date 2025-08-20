// 카카오 지도 SDK 로더 (services 라이브러리 포함, 실패 원인 로깅 강화)
let kakaoReadyPromise = null;

export function loadKakao(apiKey) {
    console.log("RAW ENV VALUE =", import.meta.env.VITE_KAKAO_JS_KEY);

  if (typeof window === "undefined") {
    return Promise.reject(new Error("[Kakao] window missing"));
  }

  const key = (apiKey ?? "").toString().trim();
  if (!key) {
    return Promise.reject(new Error("[Kakao] VITE_KAKAO_JS_KEY missing (JavaScript 키 필요)"));
  }

  // 이미 로드되어 있으면 즉시 성공
  if (window.kakao?.maps?.services) return Promise.resolve();
  if (kakaoReadyPromise) return kakaoReadyPromise;

  kakaoReadyPromise = new Promise((resolve, reject) => {
    // 과거 잔재 제거(중복 로드 방지)
    [...document.querySelectorAll('script[data-kakao-sdk="1"]')].forEach(s => s.remove());

    const src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;
    window.__lastKakaoSrc = src;
    console.debug("[Kakao] try load:", src);

    const s = document.createElement("script");
    s.setAttribute("data-kakao-sdk", "1");
    s.async = true;
    s.src = src;
    s.onerror = (e) => {
      console.debug("[Kakao] failed url:", src, e);
      reject(new Error("[Kakao] SDK network error"));
    };
    document.head.appendChild(s);

    s.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error("[Kakao] maps namespace missing"));
        return;
      }
      try {
        window.kakao.maps.load(() => {
          if (!window.kakao?.maps?.services) {
            reject(new Error("[Kakao] services lib missing"));
            return;
          }
          console.debug("[Kakao] SDK ready");
          resolve();
        });
      } catch {
        reject(new Error("[Kakao] maps.load failed"));
      }
    };
  });

  return kakaoReadyPromise;
}

// 과거 코드 호환용 별칭
export const ensureKakaoLoaded = loadKakao;
