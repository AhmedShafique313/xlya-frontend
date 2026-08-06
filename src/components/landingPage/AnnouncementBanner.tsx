const SEGMENT =
  "\u00a0\u00a0\u2736\u00a0\u00a0 Coming Soon — Stay Tuned \u00a0\u00a0\u2736\u00a0\u00a0 Something Big Is on the Way \u00a0\u00a0\u2736\u00a0\u00a0 Launching Soon \u00a0\u00a0\u2736\u00a0\u00a0 Get Ready \u00a0\u00a0\u2736\u00a0\u00a0 Exciting Things Ahead \u00a0\u00a0\u2736\u00a0\u00a0 We\u2019re Almost Here";

const AnnouncementBanner = () => {
  return (
    <>
      <style>{`
        @keyframes ticker-ltr {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .banner-track {
          display: inline-flex;
          white-space: nowrap;
          animation: ticker-ltr 40s linear infinite;
          will-change: transform;
        }
        .banner-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 60, height: "36px" }}
        className="flex items-center overflow-hidden bg-black border-b border-[var(--gold-primary)]/20"
      >
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        <div className="banner-track">
          <span className="text-[var(--gold-primary)] text-[0.68rem] font-medium tracking-[0.15em] uppercase">
            {SEGMENT}
          </span>
          <span className="text-[var(--gold-primary)] text-[0.68rem] font-medium tracking-[0.15em] uppercase">
            {SEGMENT}
          </span>
        </div>
      </div>
    </>
  );
};

export default AnnouncementBanner;
