"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import GetStartedButton from "@/components/common/GetStartedButton";

interface NavbarProps {
    showNavLinks?: boolean;
}

const menuLinks = [
    { href: "#pricing", label: "Pricing" },
    { href: "#contact", label: "Contact" },
];

const legalLinks = [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-of-service", label: "Terms & Conditions" },
];

const socialLinks = [
    {
        href: "https://www.instagram.com/xlya.saas/",
        label: "Instagram",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
        ),
    },
    {
        href: "https://web.facebook.com/profile.php?id=61587186425598",
        label: "Facebook",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
    },
];

const Navbar = ({ showNavLinks = true }: NavbarProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen((prev) => !prev);
    };

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <motion.nav
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed top-[15px] left-1/2 -translate-x-1/2 w-fit max-w-[92%] z-50"
        >
            <motion.div
                layout
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="border border-[#FEFEFE] bg-black/60 backdrop-blur-sm rounded-xl overflow-hidden"
            >
                <div className="w-full px-1">
                    <div className="flex items-center gap-6 h-11">
                        {showNavLinks && (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleMenu}
                                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                                aria-expanded={isMenuOpen}
                                className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-md text-[#918C94] hover:text-[var(--gold-primary)] transition-colors duration-200 text-xs font-medium"
                            >
                                <motion.svg
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    animate={{ rotate: isMenuOpen ? 90 : 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    {!isMenuOpen ? (
                                        <path d="M4 6h16M4 12h16M4 18h16" />
                                    ) : (
                                        <path d="M6 18L18 6M6 6l12 12" />
                                    )}
                                </motion.svg>
                                {isMenuOpen ? "Close" : "Menu"}
                            </motion.button>
                        )}

                        <motion.div
                            className="hidden md:block flex-shrink-0"
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                        >
                            <Link href="/auth/signup">
                                <GetStartedButton />
                            </Link>
                        </motion.div>
                    </div>
                </div>

                <AnimatePresence>
                    {isMenuOpen && showNavLinks && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                            className="border-t border-[#FEFEFE] overflow-hidden"
                        >
                            <div className="px-3 py-3 space-y-3">
                                <div>
                                    <p className="text-[9px] uppercase tracking-wide text-[var(--gold-primary)] mb-1.5">
                                        Menu
                                    </p>
                                    <div className="space-y-1">
                                        {menuLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={closeMenu}
                                                className="block text-xs font-semibold text-white hover:text-[var(--gold-primary)] transition-colors duration-200"
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-[#FEFEFE]/30" />

                                <div>
                                    <p className="text-[9px] uppercase tracking-wide text-[var(--gold-primary)] mb-1.5">
                                        Legal
                                    </p>
                                    <div className="space-y-1">
                                        {legalLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={closeMenu}
                                                className="block text-xs font-semibold text-white hover:text-[var(--gold-primary)] transition-colors duration-200"
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[9px] uppercase tracking-wide text-[var(--gold-primary)] mb-1.5">
                                        Social media
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        {socialLinks.map((social) => (
                                            <a
                                                key={social.label}
                                                href={social.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={social.label}
                                                className="w-6 h-6 rounded-full border border-[#FEFEFE]/30 flex items-center justify-center text-[#918C94] hover:text-[var(--gold-primary)] hover:border-[var(--gold-primary)] transition-colors duration-200"
                                            >
                                                <span className="w-3 h-3 [&>svg]:w-full [&>svg]:h-full">{social.icon}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                <Link href="/auth/signup" onClick={closeMenu} className="block md:hidden">
                                    <GetStartedButton fullWidth />
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.nav>
    );
};

export default Navbar;
