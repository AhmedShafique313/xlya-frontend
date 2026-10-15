"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { streamVibeProspecting } from "@/lib/api/vibeProspectingStream";
import { finishActivity, showActivityStep } from "@/lib/ui/activityToast";
import { toast } from "@/components/snakbar";
import { useLandingTheme } from "@/components/landingPage/landingTheme";

// Vibe Prospecting's OAuth authorize screen redirects the browser back here
// (a real top-level navigation, not an XHR) with ?code=...&state=.... The
// Cognito access token and current project_id are already rehydrated from
// localStorage by the time this mounts (see redux/store.ts's loadFromStorage),
// so no extra client-side state needs to survive the round trip to Explorium
// and back — the lambda itself matches `state` against what it stored
// server-side when the connect action ran.
function McpCallbackInner() {
  const { t } = useLandingTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = useAppSelector((state) => state.auth.tokens.accessToken);
  const projectId = useAppSelector((state) => state.auth.project?.project_id ?? null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      finishActivity("integration-callback", false, "Vibe Prospecting connection was not approved.");
      router.push("/dashboard");
      return;
    }

    if (!accessToken || !projectId || !code || !state) return;

    ranRef.current = true;
    toast.loading("Finishing Vibe Prospecting connection...", { id: "integration-callback" });

    (async () => {
      let ok = false;
      let errorMsg = "";
      try {
        await streamVibeProspecting(accessToken, { action: "callback", project_id: projectId, code, state }, (event) => {
          showActivityStep(event, "integration-callback");
          if (event.type !== "result") return;
          ok = event.statusCode === 200;
          errorMsg = event.details?.join(" ") || event.error || "";
        });
      } catch (err) {
        console.error("Failed to complete Vibe Prospecting connection:", err);
        errorMsg = err instanceof Error ? err.message : "";
      }

      finishActivity("integration-callback", ok, ok ? "Vibe Prospecting connected." : errorMsg || "Couldn't complete the Vibe Prospecting connection.");
      router.push("/dashboard");
    })();
  }, [accessToken, projectId, searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 pt-20 md:pt-[88px] lg:pt-[104px]" style={{ color: t.fg }}>
      <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ border: `1px solid ${t.border}`, background: t.card }}>
        <div className="w-6 h-6 mx-auto mb-4 rounded-full animate-spin" style={{ border: `2px solid ${t.border}`, borderTopColor: t.gold }} />
        <p className="text-sm font-medium mb-3" style={{ color: t.fg }}>Finishing your Vibe Prospecting connection…</p>
      </div>
    </div>
  );
}

export default function McpCallbackPage() {
  return (
    <Suspense fallback={null}>
      <McpCallbackInner />
    </Suspense>
  );
}
