"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import vibeProspectingLogo from "@/assets/images/vibe-prospecting-logo.png";
import MiniTerminal, { MiniTerminalLine } from "@/components/common/MiniTerminal";
import {
  streamVibeProspecting,
  VibeProspectingConnectionStatus,
  VibeProspectingStreamEvent,
} from "@/lib/api/vibeProspectingStream";
import { streamIntegrationsStatus } from "@/lib/api/integrationsStatusStream";
import { useAppDispatch } from "@/redux/hooks";
import { setProjectActivity } from "@/redux/services/auth/auth";
import { toast } from "@/components/snakbar";

// Maps a vibe-prospecting-oauth lambda step event onto the single-line shape
// both this sidebar's own MiniTerminal and the dashboard's shared Live
// Activity MiniTerminal expect — every step becomes a line, matching the
// eventToActivityLine convention already used in AppNavbar.
function eventToLine(event: VibeProspectingStreamEvent): MiniTerminalLine | null {
  if (event.type !== "step") return null;
  const status: MiniTerminalLine["status"] =
    event.status === "completed" ? "done" : event.status === "failed" ? "error" : "active";
  return { text: event.error ? `${event.label}: ${event.error}` : event.label, status };
}

interface McpConnectorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  accessToken: string | null;
}

// Right-side connector drawer, opened from AppNavbar's "Connectors" button.
// Portaled to document.body for the same reason AppNavbar's create/delete
// project modals are — framer-motion's `animate` prop leaves a transform on
// <motion.nav> even at rest, which turns a `fixed` descendant into
// effectively `absolute` relative to that ancestor instead of the real
// viewport. The panel's top offset reuses the project's own already-tuned
// navbar-clearance value (pt-20 md:pt-[88px] lg:pt-[104px]) so it can never
// visually cover the pill regardless of stacking order, and both the panel
// and its backdrop sit below the navbar's z-50 as a second line of defense.
export default function McpConnectorSidebar({ isOpen, onClose, projectId, accessToken }: McpConnectorSidebarProps) {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<VibeProspectingConnectionStatus>("disconnected");
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [line, setLine] = useState<MiniTerminalLine | null>(null);

  // Status is read from the shared xlya-dev-users-integrations-connection-
  // status-lambda rather than this connector's own "status" action — that
  // lambda checks every known integration's table for the current project in
  // one call, so a future second/third connector added to this sidebar only
  // needs its id looked up here, not a whole new status round trip.
  useEffect(() => {
    if (!isOpen || !accessToken || !projectId) return;
    let cancelled = false;
    (async () => {
      setIsLoadingStatus(true);
      try {
        await streamIntegrationsStatus(accessToken, projectId, (event) => {
          if (cancelled) return;
          if (event.type === "result" && event.statusCode === 200 && event.integrations) {
            const vibeProspecting = event.integrations.find((i) => i.id === "vibe_prospecting");
            if (vibeProspecting) setStatus(vibeProspecting.connection_status);
          }
        });
      } catch (err) {
        console.error("Failed to load integration status:", err);
      } finally {
        if (!cancelled) setIsLoadingStatus(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, accessToken, projectId]);

  const handleConnect = async () => {
    if (!accessToken || !projectId || isConnecting) return;
    setIsConnecting(true);
    let authorizeUrl = "";
    let errorMsg = "";
    try {
      await streamVibeProspecting(accessToken, { action: "connect", project_id: projectId }, (event) => {
        const nextLine = eventToLine(event);
        if (nextLine) {
          setLine(nextLine);
          dispatch(setProjectActivity(nextLine));
        }
        if (event.type !== "result") return;
        if (event.statusCode === 200 && event.authorize_url) authorizeUrl = event.authorize_url;
        else errorMsg = event.details?.join(" ") || event.error || "";
      });
    } catch (err) {
      console.error("Failed to start Vibe Prospecting connection:", err);
      errorMsg = err instanceof Error ? err.message : "";
    }

    if (authorizeUrl) {
      // Real top-level navigation — this leaves the SPA entirely for
      // Explorium's OAuth consent screen, so it can't be an XHR/fetch call.
      window.location.href = authorizeUrl;
      return;
    }
    setIsConnecting(false);
    toast.error(errorMsg || "Couldn't start the Vibe Prospecting connection.");
  };

  const handleDisconnect = async () => {
    if (!accessToken || !projectId || isDisconnecting) return;
    setIsDisconnecting(true);
    let ok = false;
    let errorMsg = "";
    try {
      await streamVibeProspecting(accessToken, { action: "disconnect", project_id: projectId }, (event) => {
        const nextLine = eventToLine(event);
        if (nextLine) {
          setLine(nextLine);
          dispatch(setProjectActivity(nextLine));
        }
        if (event.type !== "result") return;
        ok = event.statusCode === 200;
        errorMsg = event.details?.join(" ") || event.error || "";
      });
    } catch (err) {
      console.error("Failed to disconnect Vibe Prospecting:", err);
      errorMsg = err instanceof Error ? err.message : "";
    }
    setIsDisconnecting(false);
    if (ok) {
      setStatus("disconnected");
      toast.success("Vibe Prospecting disconnected.");
    } else {
      toast.error(errorMsg || "Couldn't disconnect Vibe Prospecting.");
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  const isConnected = status === "connected";

  return createPortal(
    <>
      <div
        className="fixed top-20 md:top-[88px] lg:top-[104px] inset-x-0 bottom-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="fixed top-20 md:top-[88px] lg:top-[104px] right-4 bottom-4 w-[calc(100%-2rem)] sm:w-[380px] lg:w-[420px] xl:w-1/3 bg-[#0f0f0f] border border-[#1c1c1c] rounded-3xl z-[45] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c1c1c] flex-none">
          <h2 className="text-sm font-semibold text-white">Integrations</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-md text-[#918C94] hover:text-[var(--gold-primary)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="border border-[#1c1c1c] bg-[#151515] rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-none overflow-hidden">
                <Image src={vibeProspectingLogo} alt="Vibe Prospecting" width={28} height={28} className="object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">Vibe Prospecting</p>
                  <span
                    className={`flex-none px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      isConnected
                        ? "text-[var(--gold-primary)]"
                        : "text-[#918C94]"
                    }`}
                    style={isConnected ? { background: "rgba(204,172,93,0.12)" } : { background: "rgba(145,140,148,0.12)" }}
                  >
                    {isLoadingStatus ? "Checking…" : isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  B2B company and contact data for prospecting, straight from your Vibe Prospecting account.
                </p>
              </div>
            </div>

            <div className="mt-3">
              <MiniTerminal line={line} idleLabel="No recent activity" />
            </div>

            <div className="mt-3 flex justify-end">
              {isConnected ? (
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting || isLoadingStatus}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-red-900/40 text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-50"
                >
                  {isDisconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || isLoadingStatus}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--gold-primary)] text-black hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {isConnecting ? "Connecting…" : "Connect"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
