"use client";

import { useState, useEffect, useRef } from "react";
import AnimatedXBackground from "@/components/common/AnimatedXBackground";
import Navbar from "@/components/landingPage/Navbar";
import Footer from "@/components/landingPage/Footer";
import DescriptionIcon from '@mui/icons-material/Description';
import StorageIcon from '@mui/icons-material/Storage';
import BuildIcon from '@mui/icons-material/Build';
import SyncIcon from '@mui/icons-material/Sync';
import LockIcon from '@mui/icons-material/Lock';
import ScheduleIcon from '@mui/icons-material/Schedule';
import GavelIcon from '@mui/icons-material/Gavel';
import EditNoteIcon from '@mui/icons-material/EditNote';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function PrivacyPolicyPage() {
    const [activeSection, setActiveSection] = useState("");
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    const sections = [
        { id: "introduction", title: "Introduction", Icon: DescriptionIcon },
        { id: "information-collect", title: "Information We Collect", Icon: StorageIcon },
        { id: "how-we-use", title: "How We Use Your Information", Icon: BuildIcon },
        { id: "sharing", title: "Sharing and Disclosure", Icon: SyncIcon },
        { id: "security", title: "Data Security", Icon: LockIcon },
        { id: "retention", title: "Data Retention", Icon: ScheduleIcon },
        { id: "your-rights", title: "Your Rights", Icon: GavelIcon },
        { id: "changes", title: "Changes to this Policy", Icon: EditNoteIcon },
        { id: "contact", title: "Contact Us", Icon: EmailIcon },
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
                rootMargin: "-120px 0px -60% 0px", // accounts for navbar height
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
                                        <LockIcon sx={{ fontSize: 28 }} className="text-[var(--gold-primary)]" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Privacy Policy</h1>
                                        <p className="text-gray-400 text-base">
                                            Learn how we collect, use, and protect your personal information
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
                                        <span>Effective Date: December 26, 2025</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <section id="introduction"
                                    ref={(el) => {
                                        sectionRefs.current["introduction"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <DescriptionIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">1. Introduction</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed text-[15px]">
                                        Welcome to <span className="text-[var(--gold-primary)] font-semibold">Xalya</span> ("we", "our", "us"). We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Xalya platform, including our website, applications, and related services (collectively, the "Service").
                                    </p>
                                    <p className="text-gray-300 leading-relaxed mt-4 text-[15px]">
                                        By using our Service, you agree to the collection and use of information in accordance with this policy.
                                    </p>
                                </section>

                                <section id="information-collect"
                                    ref={(el) => {
                                        sectionRefs.current["information-collect"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <StorageIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">2. Information We Collect</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-md bg-[var(--gold-primary)]/10 flex items-center justify-center text-[var(--gold-primary)] text-xs font-bold">
                                                    2.1
                                                </span>
                                                Personal Information
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed mb-3 text-[15px]">
                                                We may collect information that identifies you individually ("Personal Information"), such as:
                                            </p>
                                            <ul className="space-y-2.5">
                                                <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                                    <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                                    <span>Name, email address, phone number</span>
                                                </li>
                                                <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                                    <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                                    <span>Account credentials and profile data</span>
                                                </li>
                                                <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                                    <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                                    <span>Billing and payment information</span>
                                                </li>
                                                <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                                    <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                                    <span>Customer support communications</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-md bg-[var(--gold-primary)]/10 flex items-center justify-center text-[var(--gold-primary)] text-xs font-bold">
                                                    2.2
                                                </span>
                                                Usage & Technical Information
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed mb-3 text-[15px]">
                                                We automatically collect data about how you interact with our Service, such as:
                                            </p>
                                            <ul className="space-y-2.5">
                                                <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                                    <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                                    <span>IP address and device identifiers</span>
                                                </li>
                                                <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                                    <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                                    <span>Browser type and settings</span>
                                                </li>
                                                <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                                    <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                                    <span>Pages visited, actions taken, timestamps</span>
                                                </li>
                                                <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                                    <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                                    <span>Cookies and similar tracking technologies</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </section>

                                <section id="how-we-use"
                                    ref={(el) => {
                                        sectionRefs.current["how-we-use"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <BuildIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">3. How We Use Your Information</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed mb-4 text-[15px]">
                                        We use information for purposes including:
                                    </p>
                                    <ul className="space-y-2.5">
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>Providing, maintaining, and improving the Service</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>Personalizing your experience</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>Billing, account administration, and customer support</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>Security, fraud prevention, and legal compliance</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>Analytics and usage optimization</span>
                                        </li>
                                    </ul>
                                </section>

                                <section id="sharing"
                                    ref={(el) => {
                                        sectionRefs.current["sharing"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <SyncIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">4. Sharing and Disclosure</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed mb-4 text-[15px]">
                                        We may share information:
                                    </p>
                                    <ul className="space-y-2.5">
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>With service providers who help operate the Service</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>To comply with legal obligations or enforce terms</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>With your consent or at your direction</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>In connection with business transfers (e.g., merger or acquisition)</span>
                                        </li>
                                    </ul>
                                </section>

                                <section id="security"
                                    ref={(el) => {
                                        sectionRefs.current["security"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <LockIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">5. Data Security</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed text-[15px]">
                                        We implement reasonable administrative, technical, and physical safeguards to help protect your information from unauthorized access or disclosure.
                                    </p>
                                </section>

                                <section id="retention"
                                    ref={(el) => {
                                        sectionRefs.current["retention"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <ScheduleIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">6. Data Retention</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed text-[15px]">
                                        We retain your information only as long as necessary to provide the Service and fulfill legal obligations.
                                    </p>
                                </section>

                                <section id="your-rights"
                                    ref={(el) => {
                                        sectionRefs.current["your-rights"] = el;
                                    }}
                                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-xl p-8 border border-white/5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--gold-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <GavelIcon sx={{ fontSize: 20 }} className="text-[var(--gold-primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">7. Your Rights</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed mb-4 text-[15px]">
                                        Depending on your jurisdiction, you may have rights including:
                                    </p>
                                    <ul className="space-y-2.5">
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>Access to your data</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>Correction of inaccurate data</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>Deletion of personal information</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300 text-[15px]">
                                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[var(--gold-primary)] mt-0.5 flex-shrink-0" />
                                            <span>Opt-out of marketing communications</span>
                                        </li>
                                    </ul>
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
                                            <h2 className="text-2xl font-bold text-white mb-1">8. Changes to this Policy</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed text-[15px]">
                                        We may update this Privacy Policy as needed. We will notify you of significant changes via email or through the Service.
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
                                            <h2 className="text-2xl font-bold text-white mb-1">9. Contact Us</h2>
                                            <div className="w-16 h-0.5 bg-[var(--gold-primary)]/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed mb-6 text-[15px]">
                                        If you have questions or requests about this policy, contact us at:
                                    </p>
                                    <a
                                        href="mailto:support@xalya.com"
                                        className="animate-button-gradient inline-flex items-center gap-3 bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-black font-semibold px-6 py-3 rounded-lg hover:shadow-xl hover:shadow-[var(--gold-primary)]/20 transition-all duration-300 hover:scale-105"
                                    >
                                        <EmailIcon sx={{ fontSize: 20 }} />
                                        support@xalya.com
                                    </a>
                                </section>
                            </div>
                        </main>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}