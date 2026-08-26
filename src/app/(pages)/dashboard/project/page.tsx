"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archivo } from "next/font/google";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { streamSettings, SettingsUser } from "@/lib/api/settingsStream";
import {
  streamProjectContent,
  streamAddFile,
  ProjectDocument,
  ProjectContentStreamEvent,
} from "@/lib/api/projectContentStream";
import { setProject } from "@/redux/services/auth/auth";
import MarketAnalysis from "@/components/dashboard/MarketAnalysis";
import MiniTerminal, { MiniTerminalLine } from "@/components/common/MiniTerminal";
import { BUSINESS_TYPE_OPTIONS, CHALLENGE_OPTIONS, TEAM_SIZE_OPTIONS } from "@/constants/onboarding";
import { toast } from "@/components/snakbar";

// Matches the font used on the main dashboard (src/app/(pages)/dashboard/page.tsx)
// so this page reads as the same product, not a bolted-on settings screen.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
});

// Shared keyboard-focus ring — every icon-only / low-contrast control below
// uses this instead of relying on the browser default outline, which reads
// poorly against this page's near-black surfaces.
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

const MAX_FILES = 5;
// Matches the Lambda's ALLOWED_EXTENSIONS exactly — client-side rejection
// here is just a fast first pass, the server re-validates regardless.
const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".docx", ".ppt", ".pptx"];
// Lambda Function URLs base64-encode binary bodies before the handler ever
// sees them, so the real ceiling under the 6MB synchronous payload cap is
// ~4MB regardless of transport — see MAX_FILE_BYTES in the Lambda itself.
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_DESCRIPTION_CHARS = 500;

const FILE_ICON_STYLE: Record<string, { bg: string; label: string }> = {
  pdf: { bg: "#e0806b", label: "PDF" },
  txt: { bg: "#9a9a9a", label: "TXT" },
  docx: { bg: "#6b9ae0", label: "DOC" },
  ppt: { bg: "var(--gold-primary)", label: "PPT" },
  pptx: { bg: "var(--gold-primary)", label: "PPT" },
};
const FALLBACK_FILE_ICON = { bg: "#6b6b6b", label: "FILE" };

// Maps an NDJSON step event to the single line its card's MiniTerminal
// should show — non-step events (the terminal "result") don't get a line of
// their own, the step stream already tells the visual story.
function eventToLine(event: ProjectContentStreamEvent): MiniTerminalLine | null {
  if (event.type !== "step") return null;
  const status: MiniTerminalLine["status"] =
    event.status === "completed" ? "done" : event.status === "failed" ? "error" : "active";
  return { text: event.error ? `${event.label}: ${event.error}` : event.label, status };
}

export default function ProjectDetailsPage() {
  const project = useAppSelector((state) => state.auth.project);
  const accessToken = useAppSelector((state) => state.auth.tokens.accessToken);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const projectId = project?.project_id;
  const [settings, setSettings] = useState<SettingsUser | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    streamSettings(accessToken, { action: "get" }, (event) => {
      if (cancelled) return;
      if (event.type === "result" && event.statusCode === 200 && event.user) {
        setSettings(event.user);
      }
    }).catch((err) => {
      console.error("Failed to load business profile for project details:", err);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // Design-only fallback so this page is reviewable without a live project
  // in Redux (e.g. logged out / no signup flow run yet in this session).
  const displayProject = project || {
    project_name: "Acme Marketing Co.",
    website_url: "https://acmemarketing.io",
    created_at: new Date().toISOString(),
    isDefault: true,
  };

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayProject.project_name);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real project content — empty until loaded (or forever, if there's no
  // real project, e.g. the design-only preview fallback above).
  const [description, setDescription] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [files, setFiles] = useState<ProjectDocument[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const isDescriptionDirty = descriptionDraft.trim() !== description.trim();

  // Each card owns its own single-line terminal, fed only by the actions
  // that card triggers — not a shared cross-card history.
  const [descriptionLine, setDescriptionLine] = useState<MiniTerminalLine | null>(null);
  const [filesLine, setFilesLine] = useState<MiniTerminalLine | null>(null);
  const [deleteLine, setDeleteLine] = useState<MiniTerminalLine | null>(null);

  useEffect(() => {
    if (!accessToken || !projectId) return;
    let cancelled = false;
    setIsLoadingProject(true);
    streamProjectContent(accessToken, { action: "get", project_id: projectId }, (event) => {
      if (cancelled || event.type !== "result") return;
      if (event.statusCode === 200) {
        setDescription(event.description || "");
        setDescriptionDraft(event.description || "");
        setFiles(event.documents || []);
      }
    })
      .catch((err) => {
        console.error("Failed to load project content:", err);
        if (!cancelled) toast.error("Could not load this project's description and files.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProject(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, projectId]);

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDraft(displayProject.project_name);
      setIsEditingName(false);
      return;
    }
    setIsEditingName(false);
    if (trimmed !== displayProject.project_name) {
      toast.success("Project name updated");
    }
  };

  const saveDescription = async () => {
    if (!accessToken || !projectId) {
      toast.error("No project selected.");
      return;
    }
    const trimmed = descriptionDraft.trim();
    if (!trimmed) {
      toast.error("Description can't be empty.");
      return;
    }
    if (trimmed.length > MAX_DESCRIPTION_CHARS) {
      toast.error(`Description must be ${MAX_DESCRIPTION_CHARS} characters or fewer.`);
      return;
    }
    setIsSavingDescription(true);
    let ok = false;
    let errorMsg = "";
    try {
      await streamProjectContent(
        accessToken,
        { action: "add_description", project_id: projectId, description: trimmed },
        (event) => {
          setDescriptionLine((prev) => eventToLine(event) ?? prev);
          if (event.type !== "result") return;
          ok = event.statusCode === 200;
          errorMsg = event.details?.join(" ") || event.error || "";
          if (ok) {
            setDescription(event.description || trimmed);
            setDescriptionDraft(event.description || trimmed);
            if (event.kbSyncWarning) toast.error(event.kbSyncWarning);
          }
        }
      );
      toast[ok ? "success" : "error"](ok ? "Description saved." : errorMsg || "Couldn't save description.");
    } catch (err: any) {
      console.error("Failed to save description:", err);
      toast.error(err?.message || "Couldn't save description.");
    } finally {
      setIsSavingDescription(false);
    }
  };

  const uploadOneFile = async (file: File) => {
    if (!accessToken || !projectId) return;
    setUploadingCount((c) => c + 1);
    let ok = false;
    let errorMsg = "";
    let newDoc: ProjectDocument | undefined;
    try {
      await streamAddFile(accessToken, projectId, file, (event) => {
        setFilesLine((prev) => eventToLine(event) ?? prev);
        if (event.type !== "result") return;
        ok = event.statusCode === 200;
        errorMsg = event.details?.join(" ") || event.error || "";
        newDoc = event.document;
        if (ok && event.kbSyncWarning) toast.error(event.kbSyncWarning);
      });
      if (ok && newDoc) {
        setFiles((prev) => [...prev, newDoc as ProjectDocument]);
        toast.success(`${file.name} added.`);
      } else {
        toast.error(errorMsg || `Couldn't add ${file.name}.`);
      }
    } catch (err: any) {
      console.error("Failed to upload file:", err);
      toast.error(err?.message || `Couldn't add ${file.name}.`);
    } finally {
      setUploadingCount((c) => c - 1);
    }
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (!accessToken || !projectId) {
      toast.error("No project selected.");
      return;
    }
    const incoming = Array.from(fileList);
    const room = MAX_FILES - files.length - uploadingCount;
    if (room <= 0) {
      toast.error(`You can only attach up to ${MAX_FILES} files. Remove one first.`);
      return;
    }

    const accepted: File[] = [];
    for (const f of incoming) {
      if (!ACCEPTED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))) {
        toast.error(`${f.name}: only PDF, TXT, DOCX, and PPT files are supported.`);
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        toast.error(`${f.name} is too large. Please use a file under ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB.`);
        continue;
      }
      accepted.push(f);
    }

    const toUpload = accepted.slice(0, room);
    if (accepted.length > room) {
      toast.error(`Only ${room} more file${room === 1 ? "" : "s"} could be added (${MAX_FILES}-file limit).`);
    }

    // Sequential, not parallel — keeps the MAX_FILES check simple and avoids
    // colliding concurrent KB ingestion jobs against the same data source.
    for (const file of toUpload) {
      await uploadOneFile(file);
    }
  };

  const removeFile = async (documentId: string, name: string) => {
    if (!accessToken || !projectId) {
      toast.error("No project selected.");
      return;
    }
    setDeletingDocId(documentId);
    let ok = false;
    let errorMsg = "";
    try {
      await streamProjectContent(
        accessToken,
        { action: "delete_document", project_id: projectId, document_id: documentId },
        (event) => {
          setFilesLine((prev) => eventToLine(event) ?? prev);
          if (event.type !== "result") return;
          ok = event.statusCode === 200;
          errorMsg = event.details?.join(" ") || event.error || "";
          if (ok && event.kbSyncWarning) toast.error(event.kbSyncWarning);
        }
      );
      if (ok) {
        setFiles((prev) => prev.filter((f) => f.document_id !== documentId));
        toast.success(`${name} removed.`);
      } else {
        toast.error(errorMsg || `Couldn't remove ${name}.`);
      }
    } catch (err: any) {
      console.error("Failed to remove file:", err);
      toast.error(err?.message || `Couldn't remove ${name}.`);
    } finally {
      setDeletingDocId(null);
    }
  };

  const confirmDeleteProject = async () => {
    if (!accessToken || !projectId) {
      toast.error("No project selected.");
      return;
    }
    setIsDeleteModalOpen(false);
    setIsDeletingProject(true);
    let ok = false;
    let errorMsg = "";
    try {
      await streamProjectContent(accessToken, { action: "delete_project", project_id: projectId }, (event) => {
        setDeleteLine((prev) => eventToLine(event) ?? prev);
        if (event.type !== "result") return;
        ok = event.statusCode === 200;
        errorMsg = event.details?.join(" ") || event.error || "";
      });
      if (ok) {
        dispatch(setProject(null));
        toast.success("Project deleted.");
        router.push("/dashboard");
      } else {
        toast.error(errorMsg || "Couldn't delete project.");
      }
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      toast.error(err?.message || "Couldn't delete project.");
    } finally {
      setIsDeletingProject(false);
      setDeleteConfirmName("");
    }
  };

  const businessTypeLabel = BUSINESS_TYPE_OPTIONS.find((o) => o.value === settings?.businessType)?.label;
  const challengeLabel = CHALLENGE_OPTIONS.find((o) => o.value === settings?.challenge)?.label;
  const teamSizeLabel = TEAM_SIZE_OPTIONS.find((o) => o.value === settings?.teamSize)?.label;
  const hasBusinessProfile = businessTypeLabel || challengeLabel || teamSizeLabel;

  const createdLabel = displayProject.created_at
    ? new Date(displayProject.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  const initial = (nameDraft || displayProject.project_name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className={`${archivo.className} min-h-screen flex justify-center p-6 md:p-10 pt-28 md:pt-40 lg:pt-48 text-[#f4f0e8]`}>
      <div className="w-full max-w-[1440px] min-w-0">
        {/* Header — editable project name, locked URL, business profile */}
        <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-6 md:p-7 mb-6">
          <div className="flex items-start gap-4 flex-wrap">
            <div
              className="w-14 h-14 flex-none rounded-2xl flex items-center justify-center text-xl font-bold text-[#0a0a0a]"
              style={{ background: "linear-gradient(135deg, var(--gold-light), var(--gold-primary))" }}
            >
              {initial}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitName();
                        if (e.key === "Escape") {
                          setNameDraft(displayProject.project_name);
                          setIsEditingName(false);
                        }
                      }}
                      className={`text-2xl font-bold bg-[#161616] border border-[var(--gold-primary)]/50 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[var(--gold-primary)] transition-colors min-w-[240px] ${FOCUS_RING}`}
                    />
                    <button
                      type="button"
                      onClick={commitName}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-black transition-transform duration-150 hover:scale-105 active:scale-95 ${FOCUS_RING}`}
                      style={{ background: "var(--gold-primary)" }}
                      aria-label="Save name"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNameDraft(displayProject.project_name);
                        setIsEditingName(false);
                      }}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg border border-[#232323] text-gray-500 hover:text-white hover:border-[#333] transition-colors duration-150 ${FOCUS_RING}`}
                      aria-label="Cancel"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    aria-label="Edit project name"
                    className={`group flex items-center gap-2.5 text-left rounded-lg -mx-1 px-1 transition-colors duration-150 ${FOCUS_RING}`}
                  >
                    <h1 className="text-2xl font-bold text-white">{nameDraft || displayProject.project_name}</h1>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-600 group-hover:text-[var(--gold-primary)] transition-colors duration-150 flex-none"
                    >
                      <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z" />
                    </svg>
                  </button>
                )}
                {displayProject.isDefault && (
                  <span
                    className="text-[10px] font-semibold tracking-[0.06em] uppercase px-2 py-1 rounded-md flex-none"
                    style={{ color: "var(--gold-primary)", background: "rgba(204,172,93,0.12)" }}
                  >
                    Default project
                  </span>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1.5 mt-2.5 text-[12.5px] text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <svg width="12.5" height="12.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-none text-gray-600">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  {displayProject.website_url || "No website added"}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[9.5px] font-semibold tracking-[0.05em] uppercase text-gray-600 border border-[#232323] rounded px-1.5 py-0.5"
                  title="The project URL can't be changed after creation"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="5" y="11" width="14" height="9" rx="1.5" />
                    <path d="M8 11V8a4 4 0 018 0v3" />
                  </svg>
                  Locked
                </span>
                {createdLabel && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span>Created {createdLabel}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {hasBusinessProfile && (
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-[#1c1c1c]">
              <span className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.06em] uppercase text-gray-600 mr-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                </svg>
                Business profile
              </span>
              {businessTypeLabel && (
                <span className="border border-[#232323] rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#9a9a9a]">
                  {businessTypeLabel}
                </span>
              )}
              {challengeLabel && (
                <span className="border border-[#232323] rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#9a9a9a]">
                  {challengeLabel}
                </span>
              )}
              {teamSizeLabel && (
                <span className="border border-[#232323] rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#9a9a9a]">
                  {teamSizeLabel}
                </span>
              )}
            </div>
          )}

          {/* Guidance — the three rules for this page, merged into the header
              card (was previously its own standalone panel) so the page
              reads as one consolidated project-info card, not several
              disconnected boxes stacked on top of each other. */}
          <div className="flex gap-3 mt-5 pt-5 border-t border-[#1c1c1c]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--gold-primary)"
              strokeWidth="2"
              className="flex-none mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="text-[12px] text-[#c9c2ae] leading-relaxed">
              <p className="font-semibold text-[#f4f0e8] mb-1.5">Before you edit this project&apos;s knowledge</p>
              <ul className="space-y-1 list-disc list-inside marker:text-[var(--gold-primary)]">
                <li>Only add information that&apos;s relevant to this project — irrelevant content dilutes results.</li>
                <li>Deleting a description, instruction, or file removes it from this project&apos;s RAG immediately.</li>
                <li>Deleting the project deletes everything associated with it — all files, description, and instructions.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Description + Knowledge base — equal-height cards (items-stretch,
            both flex-col) so one column's content length can't leave a
            visually empty gap under the shorter card. */}
        <div className="grid gap-4 mb-4 lg:grid-cols-2 items-stretch">
          <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 flex-none rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(204,172,93,0.12)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="13" y2="17" />
                  </svg>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#f4f0e8]">Description</div>
                  <div className="text-[10.5px] text-gray-600">What Xlya knows about this project</div>
                </div>
              </div>
              <span className="text-[10.5px] text-gray-600 flex-none">
                {descriptionDraft.length}/{MAX_DESCRIPTION_CHARS}
              </span>
            </div>

            <textarea
              value={descriptionDraft}
              maxLength={MAX_DESCRIPTION_CHARS}
              disabled={isLoadingProject}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              placeholder={
                isLoadingProject
                  ? "Loading…"
                  : "What is this project about? Keep it specific to help Xlya generate relevant content."
              }
              className={`w-full flex-1 min-h-[160px] resize-none bg-[#161616] border border-[#232323] rounded-lg px-3.5 py-3 text-[13px] text-[#f4f0e8] placeholder:text-gray-600 focus:outline-none focus:border-[var(--gold-primary)] transition-colors duration-150 leading-relaxed disabled:opacity-50 ${FOCUS_RING}`}
            />

            <div className="mt-3 h-1 rounded-full bg-[#1c1c1c] overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${Math.min((descriptionDraft.length / MAX_DESCRIPTION_CHARS) * 100, 100)}%`,
                  background: "linear-gradient(90deg, var(--gold-light), var(--gold-primary))",
                }}
              />
            </div>

            <div className="flex items-center justify-end mt-3">
              <button
                type="button"
                onClick={saveDescription}
                disabled={!isDescriptionDirty || isSavingDescription || !projectId}
                className={`px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--gold-primary)] text-black hover:brightness-110 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS_RING}`}
              >
                {isSavingDescription ? "Saving…" : "Save description"}
              </button>
            </div>

            <div className="mt-3">
              <MiniTerminal line={descriptionLine} />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-[#1c1c1c]">
              <span className="w-full text-[10px] font-semibold tracking-[0.06em] uppercase text-gray-600 mb-0.5">
                Good descriptions mention
              </span>
              {["Target audience", "Tone of voice", "Core offer", "What to avoid"].map((tip) => (
                <span
                  key={tip}
                  className="text-[11px] font-medium text-[#9a9a9a] border border-[#232323] rounded-lg px-2.5 py-1"
                >
                  {tip}
                </span>
              ))}
            </div>
          </div>

          {/* Knowledge base files */}
          <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 flex-none rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(204,172,93,0.12)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#f4f0e8]">Knowledge base files</div>
                  <div className="text-[10.5px] text-gray-600">PDF, TXT, DOCX, or PPT</div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-gray-500 flex-none">
                {files.length}/{MAX_FILES} used
              </span>
            </div>
            <p className="text-[11.5px] text-gray-600 mb-4 mt-2.5">Up to {MAX_FILES} files, used to ground Xlya's answers in this project's own material.</p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXTENSIONS.join(",")}
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />

            <button
              type="button"
              onClick={() => files.length + uploadingCount < MAX_FILES && fileInputRef.current?.click()}
              disabled={files.length + uploadingCount >= MAX_FILES || isLoadingProject}
              onDragOver={(e) => {
                e.preventDefault();
                if (files.length + uploadingCount < MAX_FILES) setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFile(false);
                if (files.length + uploadingCount < MAX_FILES) handleFilesSelected(e.dataTransfer.files);
              }}
              className={`w-full flex flex-col items-center justify-center gap-2 border border-dashed rounded-xl py-7 mb-4 text-center transition-colors duration-150 disabled:opacity-40 disabled:hover:border-[#2a2a2a] disabled:cursor-not-allowed ${FOCUS_RING} ${
                isDraggingFile
                  ? "border-[var(--gold-primary)] bg-[var(--gold-primary)]/[0.06]"
                  : "border-[#2a2a2a] hover:border-[var(--gold-primary)]/50"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-[12.5px] font-medium text-[#f4f0e8]">
                {files.length + uploadingCount >= MAX_FILES
                  ? "File limit reached"
                  : isDraggingFile
                  ? "Drop to add"
                  : "Drop files here or click to browse"}
              </span>
              <span className="text-[11px] text-gray-600">.pdf · .txt · .docx · .ppt</span>
            </button>

            {files.length > 0 || uploadingCount > 0 ? (
              <div className="space-y-2 flex-1">
                {files.map((f) => {
                  const style = FILE_ICON_STYLE[f.ext] || FALLBACK_FILE_ICON;
                  const isDeleting = deletingDocId === f.document_id;
                  return (
                    <div
                      key={f.document_id}
                      className="flex items-center gap-3 border border-[#1c1c1c] rounded-xl px-3.5 py-2.5 transition-colors duration-150 hover:border-[#2a2a2a]"
                    >
                      <div
                        className="w-8 h-8 flex-none rounded-lg flex items-center justify-center text-[9.5px] font-bold text-[#0a0a0a]"
                        style={{ background: style.bg }}
                      >
                        {style.label}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-medium text-[#f4f0e8] truncate">{f.name}</div>
                        <div className="text-[10.5px] text-gray-600">
                          {f.sizeLabel}
                          {f.addedLabel ? ` · Added ${new Date(f.addedLabel).toLocaleDateString()}` : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(f.document_id, f.name)}
                        disabled={isDeleting}
                        className={`w-9 h-9 flex-none flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS_RING}`}
                        aria-label={`Remove ${f.name}`}
                      >
                        {isDeleting ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-600 border-t-transparent animate-spin" />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })}
                {Array.from({ length: uploadingCount }).map((_, i) => (
                  <div
                    key={`uploading-${i}`}
                    className="flex items-center gap-3 border border-[#1c1c1c] rounded-xl px-3.5 py-2.5 opacity-60"
                  >
                    <span className="w-8 h-8 flex-none rounded-lg border-2 border-gray-600 border-t-transparent animate-spin" />
                    <div className="text-[12.5px] font-medium text-gray-500">Uploading…</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[11.5px] text-gray-600 text-center py-2">
                  {isLoadingProject ? "Loading…" : "No files added yet."}
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-[#1c1c1c]">
              <div className="h-1 rounded-full bg-[#1c1c1c] overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${Math.min((files.length / MAX_FILES) * 100, 100)}%`,
                    background: "linear-gradient(90deg, var(--gold-light), var(--gold-primary))",
                  }}
                />
              </div>
              <p className="text-[10.5px] text-gray-600 flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-none text-gray-600">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l2.5 2.5" />
                </svg>
                Files are chunked and embedded automatically — no manual step needed.
              </p>
              <div className="mt-3">
                <MiniTerminal line={filesLine} />
              </div>
            </div>
          </div>
        </div>

        <MarketAnalysis />

        {/* Danger zone — mirrors AppNavbar's real delete-project modal. */}
        <div className="border border-red-900/40 bg-[#0f0f0f] rounded-2xl p-6 mt-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-white mb-1">Danger zone</h2>
              <p className="text-[12px] text-gray-500">
                Deleting this project removes its description, instructions, and all {files.length} attached
                file{files.length === 1 ? "" : "s"} — permanently.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isDeletingProject || !projectId}
              className={`px-4 py-2.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors duration-150 flex-none disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS_RING}`}
            >
              {isDeletingProject ? "Deleting…" : "Delete project"}
            </button>
          </div>
          <div className="mt-4">
            <MiniTerminal line={deleteLine} />
          </div>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#0f0f0f] border border-red-900/40 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-2">
              Delete {displayProject.project_name}?
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              This permanently deletes the description, instructions, and all attached files for this project.
              This cannot be undone. Type the project name to confirm.
            </p>
            <input
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={displayProject.project_name}
              className={`w-full px-3.5 py-2.5 text-[0.8rem] bg-[#161616] border border-[#2a2a2a] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 transition-colors duration-150 ${FOCUS_RING}`}
            />
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmName("");
                }}
                className={`px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors duration-150 rounded-lg ${FOCUS_RING}`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmName.trim() !== displayProject.project_name}
                onClick={confirmDeleteProject}
                className={`px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-red-600 ${FOCUS_RING}`}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
