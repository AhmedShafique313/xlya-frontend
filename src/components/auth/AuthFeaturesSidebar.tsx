import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/images/Logo4.png";

export default function AuthFeaturesSidebar() {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-14 relative z-10">
      <div className="mb-7">
        <Link href="/">
          <Image src={Logo} alt="Texalya Logo" width={110} height={38} className="h-auto w-auto" />
        </Link>
      </div>

      <h1 className="text-[2rem] font-bold text-white mb-2.5">
        Start your 30-day free trial
      </h1>
      <p className="text-gray-400 text-[0.9rem] mb-10 flex items-center gap-2">
        <svg className="w-[1.1rem] h-[1.1rem] text-[var(--gold-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        No credit card required
      </p>

      <div className="space-y-7">
        {/* Feature 1 */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-[1.4rem] h-[1.4rem] text-[var(--gold-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-[1.05rem] mb-1">
              Invite unlimited colleagues
            </h3>
            <p className="text-gray-400 text-[0.82rem] leading-relaxed">
              Invite as many teammates as you&apos;d like or need to spend to collaborate on different creative projects.
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-[1.4rem] h-[1.4rem] text-[var(--gold-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-[1.05rem] mb-1">
              Ensure compliance
            </h3>
            <p className="text-gray-400 text-[0.82rem] leading-relaxed">
              Provide detailed reports so all your numbers is in real time, see where users are dropping off.
            </p>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-[1.4rem] h-[1.4rem] text-[var(--gold-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-[1.05rem] mb-1">
              Built in security
            </h3>
            <p className="text-gray-400 text-[0.82rem] leading-relaxed">
              Keep your team members and stakeholders in the loop so that your operations is visible and transparent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}