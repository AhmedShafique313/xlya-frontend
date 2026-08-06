"use client";

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 sm:px-10 lg:px-16 py-7 sm:py-9 animate-fadeIn">
      {/* Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-2 text-[var(--gold-primary)] text-xs font-semibold tracking-widest uppercase border border-[var(--gold-primary)]/30 bg-[var(--gold-primary)]/10 px-4 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)] animate-pulse" />
          Quick Setup
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
        Help Xlya personalize
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-light)]">
          your experience
        </span>
      </h1>

      <p className="text-gray-400 text-base sm:text-lg mb-2 font-medium">
        in under 60 seconds.
      </p>
      <p className="text-gray-500 text-sm max-w-sm mb-7 leading-relaxed">
        Answer a few quick questions so we can build the perfect workspace
        tailored just for you.
      </p>

      {/* CTA Button */}
      <button
        onClick={onStart}
        className="animate-button-gradient w-full max-w-xs text-black font-semibold py-3.5 px-8 rounded-xl hover:shadow-xl hover:shadow-[var(--gold-primary)]/25 transition-all duration-300 hover:scale-[1.02] text-sm sm:text-base"
      >
        Get Started
      </button>

      <p className="text-gray-600 text-xs mt-3">
        You can always update these preferences later in settings
      </p>
    </div>
  );
}
