"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/images/Logo4.png"

interface NavbarProps {
    showNavLinks?: boolean;
}

const Navbar = ({ showNavLinks = true }: NavbarProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="fixed top-9 left-1/2 -translate-x-1/2 w-[95%] border border-[#FEFEFE] bg-transparent mt-4 rounded-full overflow-hidden z-50 backdrop-blur-sm">
            <div className="w-full pl-4 pr-3 lg:pl-6 lg:pr-4">
                <div className="flex items-center justify-between h-14">
                    <div className="flex-shrink-0 -ml-14 lg:-ml-14">
                        <Link href="/">
                            <Image 
                                src={Logo}
                                alt="Texalya Logo"
                                width={150}
                                height={100}
                                className="h-auto w-auto"
                                priority
                            />
                        </Link>
                    </div>

                    {showNavLinks && (
                        <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
                            <Link
                                href="#pricing"
                                className="relative text-[#918C94] hover:text-[var(--gold-primary)] transition-colors duration-200 text-sm font-medium group"
                            >
                                Pricing
                                <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[var(--gold-primary)] transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                            <Link
                                href="#contact"
                                className="relative text-[#918C94] hover:text-[var(--gold-primary)] transition-colors duration-200 text-sm font-medium group"
                            >
                                Contact
                                <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[var(--gold-primary)] transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                        </div>
                    )}

                    <div className="hidden md:block flex-shrink-0">
                        <Link href="/auth/signup">
                            <button className="animate-button-gradient px-6 py-2.5 rounded-full hover:scale-105 hover:shadow-lg text-sm font-medium text-white transition-all duration-500">
                                Get Started
                            </button>
                        </Link>
                    </div>

                    <div className="md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="text-[#918C94] hover:text-[var(--gold-primary)] focus:outline-none focus:text-[var(--gold-primary)]"
                            aria-label="Toggle menu"
                        >
                            {!isMenuOpen ? (
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden border-t border-[#FEFEFE]">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {showNavLinks && (
                            <>
                                <Link
                                    href="#pricing"
                                    className="text-[#918C94] hover:text-[var(--gold-primary)] block px-3 py-2 text-base font-medium transition-colors duration-200"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Pricing
                                </Link>
                                <Link
                                    href="#contact"
                                    className="text-[#918C94] hover:text-[var(--gold-primary)] block px-3 py-2 text-base font-medium transition-colors duration-200"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Contact
                                </Link>
                            </>
                        )}
                        <Link
                            href="/auth/signup"
                            className="block px-3 py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <button className="animate-button-gradient w-full px-6 py-2 rounded-full hover:scale-105 text-sm font-medium text-white transition-all duration-500">
                                Get Started
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;