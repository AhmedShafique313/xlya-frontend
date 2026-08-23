"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "@/components/common/Logo";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { clearCredentials } from "@/redux/services/auth/auth";
import { streamLogout } from "@/lib/api/logoutStream";
import { toast } from "@/components/snakbar";

// Fixed top-center pill navbar for every screen inside the authenticated app
// (dashboard and anything added under the same layout going forward) — same
// visual "setting" as the public landingPage/Navbar (fixed position, gold
// palette, border-[#FEFEFE]/black-blur pill, rounded-xl, framer-motion
// entrance), but its own component/rule since the content is authenticated-
// only (app nav links + account/logout) instead of Login/Get Started.
const appLinks = [{ href: "/dashboard", label: "Dashboard" }];

const AppNavbar = () => {
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const accessToken = useAppSelector((state) => state.auth.tokens.accessToken);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    // Revokes the session server-side (GlobalSignOut via the logout lambda)
    // and clears local session state either way — a failed/expired-token
    // revoke call shouldn't leave the browser stuck "logged in" with a dead
    // token. clearCredentials() already wipes the "UserData" localStorage
    // entry and Redux auth state; this app sets no auth cookies to clear.
    const handleLogout = async () => {
        if (isSigningOut) return;
        setIsSigningOut(true);
        setIsProfileOpen(false);
        try {
            if (accessToken) {
                let apiSucceeded = false;
                await streamLogout(accessToken, (event) => {
                    if (event.type !== "result") return;
                    apiSucceeded = event.statusCode === 200;
                    if (!apiSucceeded) console.error("Logout API error:", event.error);
                });
                if (apiSucceeded) {
                    toast.success("Logged out successfully.");
                } else {
                    toast.error("Logout wasn't confirmed by the server, but you've been signed out on this device.");
                }
            } else {
                toast.success("Logged out successfully.");
            }
        } catch (error) {
            console.error("Logout request failed:", error);
            toast.error("Logout request failed, but you've been signed out on this device.");
        } finally {
            dispatch(clearCredentials());
            setIsSigningOut(false);
            // Full browser navigation, not router.push — ProtectedRoute (still
            // mounted here, inside the dashboard layout) reacts to
            // isAuthenticated flipping false with its own client-side redirect
            // to /auth/login, and that effect wins the race against a
            // same-tick router.push("/"). window.location bypasses React's
            // render/effect cycle entirely so the logout redirect always lands
            // on the actual landing page.
            window.location.href = "/";
        }
    };

    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Account";

    return (
        <motion.nav
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed top-[15px] left-1/2 -translate-x-1/2 w-fit max-w-[92%] z-50"
        >
            <div className="border border-[#FEFEFE] bg-black/60 backdrop-blur-sm rounded-xl">
                <div className="flex items-center gap-6 h-11 px-3">
                    <Link href="/dashboard" className="flex-shrink-0">
                        <Logo size="sm" className="!text-[18px]" />
                    </Link>

                    <div className="hidden md:flex items-center gap-1">
                        {appLinks.map((link) => {
                            const active = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                                        active
                                            ? "text-[var(--gold-primary)] bg-[rgba(204,172,93,0.12)]"
                                            : "text-[#918C94] hover:text-[var(--gold-primary)]"
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div ref={profileRef} className="relative flex items-center ml-auto pl-2">
                        <button
                            onClick={() => setIsProfileOpen((prev) => !prev)}
                            aria-label="Profile"
                            aria-expanded={isProfileOpen}
                            className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-md text-[#918C94] hover:text-[var(--gold-primary)] transition-colors duration-200 text-xs font-medium"
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
                            </svg>
                            Profile
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    className="absolute top-[calc(100%+10px)] right-0 w-[190px] border border-[#FEFEFE] bg-black/90 backdrop-blur-sm rounded-xl overflow-hidden"
                                >
                                    <div className="px-3.5 py-3 border-b border-[#FEFEFE]/20">
                                        <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                                    </div>
                                    <div className="py-1.5">
                                        <Link
                                            href="/dashboard/settings"
                                            onClick={() => setIsProfileOpen(false)}
                                            className="block w-full text-left px-3.5 py-2 text-xs font-medium text-[#918C94] hover:text-[var(--gold-primary)] transition-colors duration-200"
                                        >
                                            Settings
                                        </Link>
                                        <button
                                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-[var(--gold-primary)] hover:text-[var(--gold-light)] transition-colors duration-200"
                                        >
                                            Upgrade Plan
                                        </button>
                                    </div>
                                    <div className="border-t border-[#FEFEFE]/20 py-1.5">
                                        <button
                                            onClick={handleLogout}
                                            disabled={isSigningOut}
                                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#918C94] hover:text-[var(--gold-primary)] transition-colors duration-200 disabled:opacity-50"
                                        >
                                            {isSigningOut ? "Logging out…" : "Logout"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

export default AppNavbar;
