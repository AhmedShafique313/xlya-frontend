"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "@/components/common/Logo";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { clearCredentials, setProject, setProjects, setProjectActivity, ProjectSummary, ProjectRecord } from "@/redux/services/auth/auth";
import { streamLogout } from "@/lib/api/logoutStream";
import { streamSettings, SettingsUser } from "@/lib/api/settingsStream";
import { streamProjectList, ProjectListStreamEvent } from "@/lib/api/projectListStream";
import { streamCreateProject, CreateProjectStreamEvent } from "@/lib/api/createProjectStream";
import McpConnectorSidebar from "@/components/common/McpConnectorSidebar";
import { toast } from "@/components/snakbar";

// Maps a project-list-detail or create-project lambda step event to the
// single line the dashboard's live-activity MiniTerminal should show — every
// step, parent or nested sub-step alike, becomes a line (nothing filtered
// out), same convention as project/page.tsx's eventToLine.
function eventToActivityLine(event: ProjectListStreamEvent | CreateProjectStreamEvent) {
  if (event.type !== "step") return null;
  const status: "active" | "done" | "error" =
    event.status === "completed" ? "done" : event.status === "failed" ? "error" : "active";
  return { text: event.error ? `${event.label}: ${event.error}` : event.label, status };
}

function isValidWebsiteUrl(value: string) {
  try {
    const u = new URL(value);
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".") && u.hostname.length >= 4;
  } catch {
    return false;
  }
}

// Fixed top-center pill navbar for every screen inside the authenticated app
// (dashboard and anything added under the same layout going forward) — same
// visual "setting" as the public landingPage/Navbar (fixed position, gold
// palette, border-[#FEFEFE]/black-blur pill, rounded-xl, framer-motion
// entrance), but its own component/rule since the content is authenticated-
// only (app nav links + account/logout) instead of Login/Get Started.
const DashboardIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
);

const ProjectIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
);

const PlusIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const ConnectorIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 3v4M15 3v4M9 21v-4M15 21v-4" />
        <path d="M6 7h12a1 1 0 011 1v3a5 5 0 01-5 5h-4a5 5 0 01-5-5V8a1 1 0 011-1z" />
    </svg>
);

const appLinks = [{ href: "/dashboard", label: "Dashboard", icon: DashboardIcon }];

const AppNavbar = () => {
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const accessToken = useAppSelector((state) => state.auth.tokens.accessToken);
    const project = useAppSelector((state) => state.auth.project);
    const projects = useAppSelector((state) => state.auth.projects);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isProjectOpen, setIsProjectOpen] = useState(false);
    // Real custom dropdown (trigger button + option panel) — native <select>
    // can't be themed on this dark UI. Options come from `projects`
    // (Redux), populated below by the project-list-detail lambda's "list"
    // action.
    const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [switchingProjectId, setSwitchingProjectId] = useState<string | null>(null);
    const [profile, setProfile] = useState<SettingsUser | null>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const projectRef = useRef<HTMLDivElement>(null);

    // Delete-current-project modal — see handleDeleteProject below for why
    // this currently maps onto the same delete_account lambda call the
    // Settings page already uses (frontend-only wiring, no new backend work).
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
    const [isDeletingProject, setIsDeletingProject] = useState(false);

    // Create-new-project modal — only asks for a website URL; the
    // create-project lambda derives the project name from the domain itself
    // (e.g. https://www.notion.com -> "notion"), so there's no separate name
    // field to fill in.
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectWebsite, setNewProjectWebsite] = useState("");
    const [createUrlError, setCreateUrlError] = useState("");

    // MCP connectors drawer (Vibe Prospecting) — see McpConnectorSidebar.
    const [isMcpSidebarOpen, setIsMcpSidebarOpen] = useState(false);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setIsProfileOpen(false);
            }
            if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
                setIsProjectOpen(false);
                setIsProjectSelectOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    // Redux's auth.user only gets firstName/lastName/profileImage populated
    // for sessions that started via signup (the login lambda's result event
    // doesn't return them) — see feedback_dont_trust_redux_user_for_identity_fields.
    // The settings lambda's "get" action always fetches given_name/family_name
    // /profileImage fresh from Cognito+DynamoDB, so reuse that same call here
    // instead of trusting the Redux snapshot for the navbar's identity display.
    useEffect(() => {
        if (!accessToken) return;
        let cancelled = false;
        streamSettings(accessToken, { action: "get" }, (event) => {
            if (cancelled) return;
            if (event.type === "result" && event.statusCode === 200 && event.user) {
                setProfile(event.user);
            }
        }).catch((err) => {
            console.error("Failed to load profile for navbar:", err);
        });
        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    // Fetches the full record for one project_id via the project-list-detail
    // lambda's "get" action, streaming its steps into the dashboard's shared
    // live-activity terminal (state.auth.projectActivity) as they arrive, and
    // dispatching the fresh ProjectRecord into state.auth.project on success
    // — every other lambda call in the app (project content, market
    // analysis) reads project_id from that same Redux field, so this is the
    // one place a project switch needs to update. `silent` suppresses the
    // success toast for the automatic mount-time load (only an explicit
    // click through the dropdown should announce itself).
    const switchToProject = async (projectId: string, options?: { silent?: boolean }) => {
        if (!accessToken) return false;
        setSwitchingProjectId(projectId);
        const outcome: { ok: boolean; project: ProjectRecord | null; errorMsg: string } = {
            ok: false,
            project: null,
            errorMsg: "",
        };
        try {
            await streamProjectList(accessToken, { action: "get", project_id: projectId }, (event) => {
                const line = eventToActivityLine(event);
                if (line) dispatch(setProjectActivity(line));
                if (event.type !== "result") return;
                outcome.ok = event.statusCode === 200;
                outcome.project = event.project || null;
                outcome.errorMsg = event.details?.join(" ") || event.error || "";
            });
        } catch (err) {
            console.error("Failed to load project details:", err);
            outcome.errorMsg = err instanceof Error ? err.message : "";
        }
        setSwitchingProjectId(null);
        if (outcome.ok && outcome.project) {
            dispatch(setProject(outcome.project));
            if (!options?.silent) toast.success(`Switched to "${outcome.project.project_name}".`);
            return true;
        }
        toast.error(outcome.errorMsg || "Couldn't load that project.");
        return false;
    };

    // Runs once per authenticated navbar mount: loads every project the
    // account owns (for the Select Project dropdown), then makes sure
    // state.auth.project reflects the real current row from
    // xlya-dev-projects-table — not just whatever the signup/login lambda
    // happened to return, which can go stale over a long session.
    useEffect(() => {
        if (!accessToken) return;
        let cancelled = false;
        (async () => {
            setIsLoadingProjects(true);
            let list: ProjectSummary[] = [];
            try {
                await streamProjectList(accessToken, { action: "list" }, (event) => {
                    if (cancelled) return;
                    if (event.type === "result" && event.statusCode === 200 && event.projects) {
                        list = event.projects;
                    }
                });
            } catch (err) {
                console.error("Failed to load projects:", err);
            }
            if (cancelled) return;
            dispatch(setProjects(list));
            setIsLoadingProjects(false);

            if (list.length === 0) return;
            const currentId = project?.project_id;
            const activeId = (currentId && list.some((p) => p.project_id === currentId))
                ? currentId
                : (list.find((p) => p.isDefault) || list[0]).project_id;
            await switchToProject(activeId, { silent: true });
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken]);

    const handleSelectProject = (p: ProjectSummary) => {
        setIsProjectSelectOpen(false);
        if (p.project_id === project?.project_id || switchingProjectId) return;
        switchToProject(p.project_id);
    };

    // Fires the create-project lambda (website crawl + NVIDIA ICP/competitors
    // + lighthouse scoring + knowledge-base sync, commonly 60-150s+) in the
    // background. The modal is already closed by the time this runs — every
    // streamed step (parent or nested sub-step) feeds the same
    // state.auth.projectActivity the dashboard's Live Activity terminal
    // reads, and a single toast fires only once the whole thing resolves.
    const handleCreateProject = async (websiteUrl: string) => {
        if (!accessToken) return;
        let ok = false;
        let newProject: ProjectRecord | null = null;
        let errorMsg = "";
        try {
            await streamCreateProject(accessToken, websiteUrl, (event) => {
                const line = eventToActivityLine(event);
                if (line) dispatch(setProjectActivity(line));
                if (event.type !== "result") return;
                ok = event.statusCode === 200;
                newProject = event.project || null;
                errorMsg = event.details?.join(" ") || event.error || "";
            });
        } catch (err) {
            console.error("Failed to create project:", err);
            errorMsg = err instanceof Error ? err.message : "";
        }

        if (ok && newProject) {
            dispatch(setProject(newProject));
            toast.success(`"${(newProject as ProjectRecord).project_name}" created and set as your active project.`);
            // Refresh the full project list so the switcher reflects the new
            // project and the old default's isDefault:false flip.
            try {
                let list: ProjectSummary[] = [];
                await streamProjectList(accessToken, { action: "list" }, (event) => {
                    if (event.type === "result" && event.statusCode === 200 && event.projects) list = event.projects;
                });
                dispatch(setProjects(list));
            } catch (err) {
                console.error("Failed to refresh project list after create:", err);
            }
        } else {
            toast.error(errorMsg || "Couldn't create that project.");
        }
    };

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

    // Every account currently has exactly one project (created at signup,
    // no multi-project support yet), so "delete this project" and "delete
    // this account" are the same real-world action today — this reuses the
    // settings lambda's existing delete_account call rather than inventing
    // a project-only deletion the backend has no concept of. The modal copy
    // says plainly that the whole account goes with it, so this isn't
    // presented as something narrower than it actually is.
    const handleDeleteProject = async () => {
        if (!accessToken || isDeletingProject) return;
        setIsDeletingProject(true);
        try {
            let ok = false;
            let errorMsg = "";
            await streamSettings(accessToken, { action: "delete_account" }, (event) => {
                if (event.type !== "result") return;
                ok = event.statusCode === 200;
                errorMsg = event.error || "";
            });
            if (ok) {
                toast.success("Project and account deleted.");
            } else {
                toast.error(errorMsg || "Couldn't delete your project.");
                setIsDeletingProject(false);
                return;
            }
        } catch (err) {
            console.error("Failed to delete project:", err);
            toast.error("Couldn't delete your project.");
            setIsDeletingProject(false);
            return;
        }
        dispatch(clearCredentials());
        // Full browser navigation, not router.push — same ProtectedRoute
        // race-avoidance reasoning as handleLogout above.
        window.location.href = "/";
    };

    const firstName = profile?.firstName || user?.firstName;
    const lastName = profile?.lastName || user?.lastName;
    const email = profile?.email || user?.email;
    const displayName = [firstName, lastName].filter(Boolean).join(" ") || email || "Account";
    const profileImage = profile?.profileImage || null;
    const initials = (firstName?.[0] || email?.[0] || "?").toUpperCase();

    return (
        <motion.nav
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed top-[15px] left-1/2 -translate-x-1/2 w-fit max-w-[92%] z-50"
        >
            <div className="border border-[#FEFEFE] bg-black/60 backdrop-blur-sm rounded-xl">
                <div className="flex items-center gap-6 h-11 px-3">
                    {/* Not a link on purpose — this is the authenticated app's
                        navbar, and clicking the logo must never be a way to
                        leave the app for the public landing page without
                        going through logout. */}
                    <div className="flex-shrink-0">
                        <Logo size="sm" className="!text-[18px]" />
                    </div>

                    <div className="hidden md:flex items-center gap-1">
                        {appLinks.map((link) => {
                            const active = pathname === link.href;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                                        active
                                            ? "text-[var(--gold-primary)] bg-[rgba(204,172,93,0.12)]"
                                            : "text-[#918C94] hover:text-[var(--gold-primary)]"
                                    }`}
                                >
                                    <Icon />
                                    {link.label}
                                </Link>
                            );
                        })}

                        {project && (
                            <div ref={projectRef} className="relative flex items-center">
                                <button
                                    onClick={() => {
                                        setIsProjectOpen((prev) => !prev);
                                        setIsProjectSelectOpen(false);
                                    }}
                                    aria-label="Project"
                                    aria-expanded={isProjectOpen}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                                        isProjectOpen
                                            ? "text-[var(--gold-primary)] bg-[rgba(204,172,93,0.12)]"
                                            : "text-[#918C94] hover:text-[var(--gold-primary)]"
                                    }`}
                                >
                                    <ProjectIcon />
                                    Project
                                </button>

                                <AnimatePresence>
                                    {isProjectOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="absolute top-[calc(100%+10px)] left-0 w-[240px] border border-[#FEFEFE] bg-black/90 backdrop-blur-sm rounded-xl overflow-hidden"
                                        >
                                            <div className="px-3.5 pt-3 pb-1.5 text-[10px] font-semibold tracking-[0.06em] text-[#6b6b6b]">
                                                SELECT PROJECT
                                            </div>
                                            <div className="px-3.5 pb-3">
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsProjectSelectOpen((o) => !o)}
                                                        disabled={isLoadingProjects && projects.length === 0}
                                                        className={`w-full flex items-center justify-between gap-2 pl-3 pr-2.5 py-2 text-xs font-medium bg-[#2a2a2a]/50 backdrop-blur-sm border rounded-lg text-left transition-all disabled:opacity-50 ${
                                                            isProjectSelectOpen
                                                                ? "border-[var(--gold-primary)] ring-1 ring-[var(--gold-primary)]"
                                                                : "border-gray-700/50"
                                                        }`}
                                                    >
                                                        <span className="text-white truncate">
                                                            {isLoadingProjects && projects.length === 0
                                                                ? "Loading projects…"
                                                                : switchingProjectId
                                                                ? "Switching…"
                                                                : project.project_name}
                                                        </span>
                                                        <svg
                                                            className={`w-3.5 h-3.5 text-gray-500 flex-none transition-transform duration-200 ${
                                                                isProjectSelectOpen ? "rotate-180" : ""
                                                            }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>

                                                    {isProjectSelectOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setIsProjectSelectOpen(false)} />
                                                            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1e1e1e] border border-gray-700/50 rounded-lg shadow-xl shadow-black/40 overflow-hidden max-h-[220px] overflow-y-auto">
                                                                {projects.length === 0 ? (
                                                                    <div className="px-3.5 py-2.5 text-xs text-gray-500">No projects yet.</div>
                                                                ) : (
                                                                    projects.map((p) => {
                                                                        const isActive = p.project_id === project.project_id;
                                                                        const isSwitching = switchingProjectId === p.project_id;
                                                                        return (
                                                                            <button
                                                                                key={p.project_id}
                                                                                type="button"
                                                                                onClick={() => handleSelectProject(p)}
                                                                                disabled={!!switchingProjectId}
                                                                                className={`w-full flex items-center justify-between gap-2 text-left px-3.5 py-2.5 text-xs transition-colors disabled:cursor-not-allowed ${
                                                                                    isActive
                                                                                        ? "bg-[var(--gold-primary)]/10 text-[var(--gold-primary)]"
                                                                                        : "text-[#c9c2ae] hover:bg-white/5"
                                                                                }`}
                                                                            >
                                                                                <span className="truncate">
                                                                                    {p.project_name}
                                                                                    {p.isDefault && <span className="text-gray-600"> · Default</span>}
                                                                                </span>
                                                                                {isSwitching ? (
                                                                                    <span className="w-3 h-3 flex-none rounded-full border-2 border-gray-600 border-t-transparent animate-spin" />
                                                                                ) : isActive ? (
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-none">
                                                                                        <polyline points="20 6 9 17 4 12" />
                                                                                    </svg>
                                                                                ) : null}
                                                                            </button>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="border-t border-[#FEFEFE]/20 py-1.5">
                                                <Link
                                                    href="/dashboard/project"
                                                    onClick={() => setIsProjectOpen(false)}
                                                    className="block w-full text-left px-3.5 py-2 text-xs font-medium text-[#918C94] hover:text-[var(--gold-primary)] transition-colors duration-200"
                                                >
                                                    View Project Details
                                                </Link>
                                            </div>
                                            <div className="border-t border-[#FEFEFE]/20 py-1.5">
                                                <button
                                                    onClick={() => {
                                                        setIsProjectOpen(false);
                                                        setIsCreateModalOpen(true);
                                                    }}
                                                    className="w-full flex items-center gap-1.5 text-left px-3.5 py-2 text-xs font-medium text-[#918C94] hover:text-[var(--gold-primary)] transition-colors duration-200"
                                                >
                                                    <PlusIcon />
                                                    Create New Project
                                                </button>
                                            </div>
                                            <div className="border-t border-[#FEFEFE]/20 py-1.5">
                                                <button
                                                    onClick={() => {
                                                        setIsProjectOpen(false);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-400 hover:text-red-300 transition-colors duration-200"
                                                >
                                                    Delete Current Project
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        <button
                            onClick={() => setIsMcpSidebarOpen(true)}
                            aria-label="Integrations"
                            aria-expanded={isMcpSidebarOpen}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                                isMcpSidebarOpen
                                    ? "text-[var(--gold-primary)] bg-[rgba(204,172,93,0.12)]"
                                    : "text-[#918C94] hover:text-[var(--gold-primary)]"
                            }`}
                        >
                            <ConnectorIcon />
                            Integrations
                        </button>

                        <button
                            aria-label="Notifications"
                            className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-md text-[#918C94] hover:text-[var(--gold-primary)] transition-colors duration-200 text-xs font-medium"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 01-3.46 0" />
                            </svg>
                            Notifications
                        </button>

                        <div ref={profileRef} className="relative flex items-center">
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
                                    <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[#FEFEFE]/20">
                                        <div className="relative w-7 h-7 rounded-full overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                                            {profileImage ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={profileImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-semibold text-[var(--gold-primary)]">{initials}</span>
                                            )}
                                        </div>
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

                    <div className="hidden sm:flex items-center gap-2 border border-[#2a2a2a] rounded-lg px-3.5 py-1.5 w-[220px] lg:w-[300px] text-[#6b6b6b] ml-auto">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-none">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <span className="text-[11px] text-[#5c5c5c]">Search</span>
                    </div>
                </div>
            </div>

            {isCreateModalOpen &&
                typeof document !== "undefined" &&
                createPortal(
                    // Rendered via a portal straight into <body> — this modal was
                    // getting trapped inside <motion.nav>'s own transformed
                    // bounding box (framer-motion's animate prop leaves a
                    // transform on the nav even at rest), which turns `fixed`
                    // into effectively `absolute` relative to that ancestor
                    // instead of the viewport, so the popup rendered off-center
                    // with no real full-screen blur. A portal escapes that
                    // stacking/containing-block context entirely.
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => {
                                setIsCreateModalOpen(false);
                                setNewProjectWebsite("");
                                setCreateUrlError("");
                            }}
                        />
                        <div className="relative w-full max-w-sm bg-[#0f0f0f] border border-[#FEFEFE]/20 rounded-2xl p-6">
                            <h3 className="text-base font-semibold text-white mb-2">Create new project</h3>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                Paste your website URL — Xlya names the project from your domain and
                                automatically generates its ICP, competitors, and performance insights.
                            </p>
                            <div>
                                <label className="block text-[10.5px] font-semibold tracking-[0.06em] uppercase text-gray-600 mb-1.5">
                                    Website URL
                                </label>
                                <input
                                    autoFocus
                                    value={newProjectWebsite}
                                    onChange={(e) => {
                                        setNewProjectWebsite(e.target.value);
                                        if (createUrlError) setCreateUrlError("");
                                    }}
                                    placeholder="https://www.notion.com"
                                    className={`w-full px-3.5 py-2.5 text-[0.8rem] bg-[#161616] border rounded-lg text-white placeholder:text-gray-600 focus:outline-none transition-colors ${
                                        createUrlError ? "border-red-500" : "border-[#2a2a2a] focus:border-[var(--gold-primary)]"
                                    }`}
                                />
                                {createUrlError && <p className="text-[11px] text-red-400 mt-1.5">{createUrlError}</p>}
                            </div>
                            <div className="flex items-center justify-end gap-3 mt-5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setNewProjectWebsite("");
                                        setCreateUrlError("");
                                    }}
                                    className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const trimmed = newProjectWebsite.trim();
                                        if (!isValidWebsiteUrl(trimmed)) {
                                            setCreateUrlError("Enter a valid website URL, e.g. https://www.notion.com");
                                            return;
                                        }
                                        // Closes immediately — progress streams into the
                                        // dashboard's Live Activity terminal instead, and a
                                        // single toast fires once the whole thing resolves.
                                        setIsCreateModalOpen(false);
                                        setNewProjectWebsite("");
                                        setCreateUrlError("");
                                        handleCreateProject(trimmed);
                                    }}
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--gold-primary)] text-black hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Create project
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {isDeleteModalOpen &&
                project &&
                typeof document !== "undefined" &&
                createPortal(
                    // Same portal fix as the create-project modal above — escapes
                    // <motion.nav>'s transformed bounding box so `fixed` centers
                    // on the real viewport and the backdrop blur covers the
                    // whole screen.
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => !isDeletingProject && setIsDeleteModalOpen(false)}
                        />
                        <div className="relative w-full max-w-sm bg-[#0f0f0f] border border-red-900/40 rounded-2xl p-6">
                            <h3 className="text-base font-semibold text-white mb-2">
                                Delete {project.project_name}?
                            </h3>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                Xlya doesn&apos;t support multiple projects yet, so deleting your only project
                                permanently deletes your entire account and all its data. This cannot be undone.
                                Type your email ({email && <span className="text-gray-400">{email}</span>}) to
                                confirm.
                            </p>
                            <input
                                type="email"
                                value={deleteConfirmEmail}
                                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                                placeholder={email || "your@email.com"}
                                className="w-full px-3.5 py-2.5 text-[0.8rem] bg-[#161616] border border-[#2a2a2a] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 transition-colors"
                            />
                            <div className="flex items-center justify-end gap-3 mt-5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setDeleteConfirmEmail("");
                                    }}
                                    disabled={isDeletingProject}
                                    className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteProject}
                                    disabled={
                                        isDeletingProject ||
                                        deleteConfirmEmail.trim().toLowerCase() !== (email || "").toLowerCase()
                                    }
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-40 disabled:hover:bg-red-600"
                                >
                                    {isDeletingProject ? "Deleting…" : "Delete permanently"}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            <McpConnectorSidebar
                isOpen={isMcpSidebarOpen}
                onClose={() => setIsMcpSidebarOpen(false)}
                projectId={project?.project_id ?? null}
                accessToken={accessToken}
            />
        </motion.nav>
    );
};

export default AppNavbar;
