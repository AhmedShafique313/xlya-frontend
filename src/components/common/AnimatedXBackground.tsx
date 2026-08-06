export default function AnimatedXBackground() {
  return (
    <div className="x-bg-container-fixed">
      {/* Zone 1 — Top (0–20%) */}
      <div className="absolute top-[3%] left-[5%] x-sm md:x-md x-gold-primary x-shape animate-float-slow"></div>
      <div className="absolute top-[8%] left-[40%] x-sm x-gold-light x-shape animate-pulse-slow"></div>
      <div className="absolute top-[5%] right-[6%] x-sm md:x-md-lg x-white-strong x-shape animate-float-fast"></div>
      <div className="absolute top-[12%] left-[22%] x-sm x-white-medium x-shape animate-bounce-slow"></div>
      <div className="absolute top-[15%] right-[28%] x-sm x-gold-accent x-shape animate-bounce-medium"></div>
      <div className="absolute top-[10%] left-[65%] x-sm-md x-gold-secondary x-shape animate-float-medium"></div>

      {/* Zone 2 — Upper-middle (20–40%) */}
      <div className="absolute top-[22%] left-[4%] x-sm-md md:x-lg x-gold-dark x-shape animate-pulse-slow"></div>
      <div className="absolute top-[28%] left-[35%] x-sm x-gold-light x-shape animate-float-medium"></div>
      <div className="absolute top-[25%] right-[5%] x-sm md:x-md x-gold-light x-shape animate-bounce-fast"></div>
      <div className="absolute top-[35%] left-[60%] x-sm x-gold-dark x-shape animate-pulse-slow"></div>
      <div className="absolute top-[32%] right-[35%] x-sm x-white-medium x-shape animate-float-medium"></div>

      {/* Zone 3 — Center (40–60%) */}
      <div className="absolute top-[42%] left-[5%] x-sm-md x-white-medium x-shape animate-float-medium"></div>
      <div className="absolute top-[48%] left-[28%] x-sm x-gold-accent x-shape animate-bounce-medium"></div>
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 x-sm-md md:x-lg-xl x-gold-primary x-shape animate-float-slow opacity-30"></div>
      <div className="absolute top-[45%] right-[6%] x-sm x-gold-secondary x-shape animate-bounce-medium"></div>
      <div className="absolute top-[55%] right-[25%] x-sm x-white-medium x-shape animate-float-slow"></div>
      <div className="absolute top-[52%] left-[70%] x-sm x-gold-light x-shape animate-pulse-slow"></div>

      {/* Zone 4 — Lower-middle (60–80%) */}
      <div className="absolute top-[62%] left-[8%] x-sm-md md:x-md-lg x-gold-secondary x-shape animate-float-fast"></div>
      <div className="absolute top-[68%] left-[45%] x-sm x-white-strong x-shape animate-pulse-slow"></div>
      <div className="absolute top-[65%] right-[8%] x-sm x-gold-primary x-shape animate-float-slow"></div>
      <div className="absolute top-[75%] left-[25%] x-sm-md x-white-strong x-shape animate-float-fast"></div>
      <div className="absolute top-[72%] right-[35%] x-sm x-gold-secondary x-shape animate-bounce-medium"></div>

      {/* Zone 5 — Bottom (80–100%) */}
      <div className="absolute top-[82%] left-[5%] x-sm md:x-md x-gold-light x-shape animate-float-medium"></div>
      <div className="absolute top-[88%] left-[42%] x-sm-md md:x-lg x-gold-accent x-shape animate-bounce-medium"></div>
      <div className="absolute top-[85%] right-[5%] x-sm md:x-md x-gold-light x-shape animate-float-medium"></div>
      <div className="absolute top-[92%] left-[65%] x-sm-md x-gold-primary x-shape animate-float-slow"></div>
      <div className="absolute top-[90%] right-[28%] x-sm md:x-lg x-white-medium x-shape animate-bounce-slow"></div>
    </div>
  );
}
