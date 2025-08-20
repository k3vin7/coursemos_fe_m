export default function PersistentBG({ children }) {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* 항상 유지되는 배경 */}
      <div className="fixed inset-0 -z-10">
        <img
          src="/background.jpg"
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* 필요 시 약한 오버레이
        <div className="absolute inset-0 bg-black/10" />
        */}
      </div>

      {/* 실제 콘텐츠 */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}
