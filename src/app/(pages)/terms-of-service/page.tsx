"use client";

import { useState, useEffect, useRef } from "react";
import AnimatedXBackground from "@/components/common/AnimatedXBackground";
import Navbar from "@/components/landingPage/Navbar";
import Footer from "@/components/landingPage/Footer";
import DescriptionIcon from '@mui/icons-material/Description';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PaymentIcon from '@mui/icons-material/Payment';
import CopyrightIcon from '@mui/icons-material/Copyright';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/Warning';
import GavelIcon from '@mui/icons-material/Gavel';
import ShieldIcon from '@mui/icons-material/Shield';
import PublicIcon from '@mui/icons-material/Public';
import EditNoteIcon from '@mui/icons-material/EditNote';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function TermsOfServicePage() {
    const [activeSection, setActiveSection] = useState("");
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    const sections = [
        { id: "acceptance", title: "Acceptance of Terms", Icon: DescriptionIcon },
        { id: "definitions", title: "Definitions", Icon: AccountCircleIcon },
        { id: "use-of-service", title: "Use of Service", Icon: VerifiedUserIcon },
        { id: "billing", title: "Subscription & Billing", Icon: PaymentIcon },
        { id: "content", title: "Content & IP", Icon: CopyrightIcon },
        { id: "prohibited", title: "Prohibited Conduct", Icon: BlockIcon },
        { id: "disclaimers", title: "Disclaimers", Icon: WarningIcon },
        { id: "liability", title: "Limitation of Liability", Icon: ShieldIcon },
        { id: "indemnification", title: "Indemnification", Icon: GavelIcon },
        { id: "governing-law", title: "Governing Law", Icon: PublicIcon },
        { id: "changes", title: "Changes to Terms", Icon: EditNoteIcon },
        { id: "contact", title: "Contact", Icon: EmailIcon },
    ];

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setActiveSection(id);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                root: null,
                rootMargin: "-120px 0px -60% 0px",
                threshold: 0,
            }
        );

        Object.values(sectionRefs.current).forEach((section) => {
            if (section) observer.observe(section);
        });

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div className="min-h-screen bg-black relative">
            <AnimatedXBackground />
            <Navbar showNavLinks={false} />

            <div className="relative z-10 pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <aside className="hidden lg:block lg:col-span-3">
                            <div className="sticky top-28">
                                <div className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-5 border border-white/5">
                                    <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-4 text-gray-400">
                                        Contents
                                    </h3>
                                    <nav className="space-y-1">
                                        {sections.map((section) => {
                                            const IconComponent = section.Icon;
                                            return (
                                                <button
                                                    key={section.id}
                                                    onClick={() => scrollToSection(section.id)}
                                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-3 group ${activeSection === section.id
                                                            ? "bg-[var(--gold-primary)]/10 text-[var(--gold-primary)]"
                                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                                        }`}
                                                >
                                                    <IconComponent
                                                        sx={{ fontSize: 16 }}
                                                        className={activeSection === section.id ? "text-[var(--gold-primary)]" : "text-gray-500 group-hover:text-gray-300"}
                                                    />
                                                    <span className="flex-1 font-medium">{section.title}</span>
                                                    {activeSection === section.id && (
                                                        <ChevronRightIcon sx={{ fontSize: 14 }} className="text-[var(--gold-primary)]" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </div>
                            </div>
                        </aside>

                        <main className="lg:col-span-9">
                            <div className="bg-gradient-to-br from-[var(--gold-primary)]/5 to-transparent backdrop-blur-xl rounded-xl p-10 border border-[var(--gold-primary)]/10 mb-8">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-xl bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 flex items-center justify-center flex-shrink-0">
                                        <DescriptionIcon sx={{ fontSize: 28 }} className="text-[var(--gold-primary)]" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Terms of Service</h1>
                                        <p className="text-gray-400 text-base">
                                            Please read these terms carefully before using our service
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-5 text-sm">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <CalendarTodayIcon sx={{ fontSize: 16 }} />
                                        <span>Last Updated: December 26, 2025</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <CheckCircleIcon sx={{ fontSize: 16 }} className="text-[var(--gold-primary)]" />
                                        <span>Effective Date: January 1, 2025</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <section id="acceptance"
                                    ref={(el) => {
                                        sectionRefs.current["acceptance"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <DescriptionIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">1. Acceptance of Terms</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed text-[15px]">
                                        By accessing or using the Xlya Service, you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you may not use the Service.
                                    </p>
                                </section>

                                <section id="definitions"
                                    ref={(el) => {
                                        sectionRefs.current["definitions"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <AccountCircleIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">2. Definitions</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex gap-3">
                                            <span className="text-[var(--gold-light)] font-semibold min-w-fit">"Service"</span>
                                            <span className="text-gray-300 text-[15px]">refers to all features, content, and applications offered by Xlya.</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <span className="text-[var(--gold-light)] font-semibold min-w-fit">"User"</span>
                                            <span className="text-gray-300 text-[15px]">refers to anyone accessing or using the Service.</span>
                                        </div>
                                    </div>
                                </section>

                                <section id="use-of-service"
                                    ref={(el) => {
                                        sectionRefs.current["use-of-service"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <VerifiedUserIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">3. Use of Service</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-md bg-[var(--gold-primary)]/10 flex items-center justify-center text-[var(--gold-primary)] text-xs font-bold">
                                                    3.1
                                                </span>
                                                Eligibility
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed text-[15px]">
                                                You must be at least 13 years old (or the minimum age in your jurisdiction) to use the Service.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-md bg-[var(--gold-primary)]/10 flex items-center justify-center text-[var(--gold-primary)] text-xs font-bold">
                                                    3.2
                                                </span>
                                                Account Registration
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed text-[15px]">
                                                To access certain features, you may be required to create an account. You are responsible for maintaining the confidentiality of your credentials.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-md bg-[var(--gold-primary)]/10 flex items-center justify-center text-[var(--gold-primary)] text-xs font-bold">
                                                    3.3
                                                </span>
                                                Permitted Use
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed text-[15px]">
                                                You may use the Service only in compliance with applicable laws and these Terms.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section id="billing"
                                    ref={(el) => {
                                        sectionRefs.current["billing"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <PaymentIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">4. Subscription, Billing & Payments</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed text-[15px]">
                                        Certain features may require payment of subscription fees. Payment terms are governed by the pricing and billing policies you agree to when purchasing a subscription.
                                    </p>
                                </section>

                                <section id="content"
                                    ref={(el) => {
                                        sectionRefs.current["content"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <CopyrightIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">5. Content and Intellectual Property</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-md bg-[var(--gold-primary)]/10 flex items-center justify-center text-[var(--gold-primary)] text-xs font-bold">
                                                    5.1
                                                </span>
                                                Ownership
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed text-[15px]">
                                                All content and technology underlying the Service, including AI models, are the exclusive property of Xlya or its licensors.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-md bg-[var(--gold-primary)]/10 flex items-center justify-center text-[var(--gold-primary)] text-xs font-bold">
                                                    5.2
                                                </span>
                                                User Content
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed text-[15px]">
                                                You retain ownership of content you upload or generate using the Service. By using the Service, you grant Xlya a limited, non-exclusive license to operate and improve the Service.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section id="prohibited"
                                    ref={(el) => {
                                        sectionRefs.current["prohibited"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <BlockIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">6. Prohibited Conduct</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed mb-4 text-[15px]">
                                        You agree not to:
                                    </p>
                                    <ul className="space-y-2.5">
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>Use the Service to violate any laws</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>Attempt to disrupt, reverse engineer, or compromise the Service</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>Infringe on others' intellectual property or privacy rights</span>
                                        </li>
                                    </ul>
                                </section>

                                <section id="disclaimers"
                                    ref={(el) => {
                                        sectionRefs.current["disclaimers"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <WarningIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">7. Disclaimers & Warranties</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed text-[15px]">
                                        The Service is provided "AS IS" and "AS AVAILABLE". Xlya disclaims all warranties, whether express or implied.
                                    </p>
                                </section>

                                <section id="liability"
                                    ref={(el) => {
                                        sectionRefs.current["liability"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <ShieldIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">8. Limitation of Liability</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed text-[15px]">
                                        To the maximum extent permitted by law, Xlya will not be liable for indirect, incidental, special, or consequential damages arising from your use of the Service.
                                    </p>
                                </section>

                                <section id="indemnification"
                                    ref={(el) => {
                                        sectionRefs.current["indemnification"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <GavelIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">9. Indemnification</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed text-[15px]">
                                        You agree to indemnify and hold Xlya harmless from any claims arising out of your use of the Service, violation of these Terms, or infringement of another's rights.
                                    </p>
                                </section>

                                <section id="governing-law"
                                    ref={(el) => {
                                        sectionRefs.current["governing-law"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <PublicIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">10. Governing Law</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed text-[15px]">
                                        These Terms are governed by the laws of the jurisdiction where Xlya is incorporated.
                                    </p>
                                </section>

                                <section id="changes"
                                    ref={(el) => {
                                        sectionRefs.current["changes"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <EditNoteIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">11. Changes to Terms</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed text-[15px]">
                                        We may revise these Terms at any time. Continued use of the Service constitutes acceptance of the updated Terms.
                                    </p>
                                </section>

                                <section id="contact"
                                    ref={(el) => {
                                        sectionRefs.current["contact"] = el;
                                    }}
                                    className="bg-gradient-to-br from-[var(--gold-primary)]/5 to-transparent backdrop-blur-xl rounded-xl p-8 border border-[var(--gold-primary)]/10">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <EmailIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">12. Contact</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed mb-6 text-[15px]">
                                        For questions regarding these Terms:
                                    </p>
                                    <a
                                        href="mailto:support@xlya.com"
                                        className="animate-button-gradient inline-flex items-center gap-3 bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-black font-semibold px-6 py-3 rounded-lg hover:shadow-xl hover:shadow-[var(--gold-primary)]/20 transition-all duration-300 hover:scale-105"
                                    >
                                        <EmailIcon sx={{ fontSize: 20 }} />
                                        support@xlya.com
                                    </a>
                                </section>

                                <div className="bg-[var(--gold-primary)]/5 border border-[var(--gold-primary)]/20 rounded-xl p-6 text-center">
                                    <p className="text-sm text-gray-400">
                                        By using Xlya, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                                    </p>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}