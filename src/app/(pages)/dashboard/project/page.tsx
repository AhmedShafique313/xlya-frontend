"use client";

import { useEffect, useRef, useState } from "react";
import { Archivo } from "next/font/google";
import { useAppSelector } from "@/redux/hooks";
import { streamSettings, SettingsUser } from "@/lib/api/settingsStream";
import MarketAnalysis from "@/components/dashboard/MarketAnalysis";
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
const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".docx", ".ppt", ".pptx"];

interface KnowledgeFile {
  id: string;
  name: string;
  sizeLabel: string;
  addedLabel: string;
  ext: "pdf" | "txt" | "docx" | "ppt";
}

// Design-only placeholder rows — this page has no backend wiring yet, see
// the delete-project note further down for why deletion itself stays a
// no-op here rather than duplicating AppNavbar's real delete flow.
const DUMMY_FILES: KnowledgeFile[] = [
  { id: "f1", name: "brand-guidelines.pdf", sizeLabel: "1.2 MB", addedLabel: "Added Aug 12", ext: "pdf" },
  { id: "f2", name: "product-faq.docx", sizeLabel: "84 KB", addedLabel: "Added Aug 15", ext: "docx" },
  { id: "f3", name: "pricing-notes.txt", sizeLabel: "6 KB", addedLabel: "Added Aug 20", ext: "txt" },
];

const FILE_ICON_STYLE: Record<KnowledgeFile["ext"], { bg: string; label: string }> = {
  pdf: { bg: "#e0806b", label: "PDF" },
  txt: { bg: "#9a9a9a", label: "TXT" },
  docx: { bg: "#6b9ae0", label: "DOC" },
  ppt: { bg: "var(--gold-primary)", label: "PPT" },
};

function extOf(filename: string): KnowledgeFile["ext"] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".txt")) return "txt";
  if (lower.endsWith(".docx")) return "docx";
  return "ppt";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectDetailsPage() {
  const project = useAppSelector((state) => state.auth.project);
  const accessToken = useAppSelector((state) => state.auth.tokens.accessToken);
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
  const [description, setDescription] = useState(
    "Acme Marketing Co. helps small e-commerce brands run performance marketing campaigns across paid social and search."
  );
  const [files, setFiles] = useState<KnowledgeFile[]>(DUMMY_FILES);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList);
    const room = MAX_FILES - files.length;
    if (room <= 0) {
      toast.error(`You can only attach up to ${MAX_FILES} files. Remove one first.`);
      return;
    }
    const accepted = incoming.filter((f) =>
      ACCEPTED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    if (accepted.length < incoming.length) {
      toast.error("Only PDF, TXT, DOCX, and PPT files are supported.");
    }
    const toAdd = accepted.slice(0, room).map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      sizeLabel: formatBytes(f.size),
      addedLabel: "Added just now",
      ext: extOf(f.name),
    }));
    if (toAdd.length > 0) {
      setFiles((prev) => [...prev, ...toAdd]);
      toast.success(toAdd.length === 1 ? "File added" : `${toAdd.length} files added`);
    }
    if (accepted.length > room) {
      toast.error(`Only ${room} more file${room === 1 ? "" : "s"} could be added (${MAX_FILES}-file limit).`);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast.success("File removed from this project's RAG");
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
        </div>

        {/* Guidance panel — the three rules for this page */}
        <div
          className="rounded-2xl p-5 mb-6 flex gap-3.5"
          style={{ background: "rgba(204,172,93,0.06)", border: "1px solid rgba(204,172,93,0.18)" }}
        >
          <svg
            width="17"
            height="17"
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
          <div className="text-[12.5px] text-[#c9c2ae] leading-relaxed">
            <p className="font-semibold text-[#f4f0e8] mb-1.5">Before you edit this project&apos;s knowledge</p>
            <ul className="space-y-1 list-disc list-inside marker:text-[var(--gold-primary)]">
              <li>Only add information that&apos;s relevant to this project — irrelevant content dilutes results.</li>
              <li>Deleting a description, instruction, or file removes it from this project&apos;s RAG immediately.</li>
              <li>Deleting the project deletes everything associated with it — all files, description, and instructions.</li>
            </ul>
          </div>
        </div>

        {/* Description + Knowledge base */}
        <div className="grid gap-4 mb-4 items-start" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#9a9a9a]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="13" y2="17" />
                </svg>
                Description
              </div>
              <span className="text-[10.5px] text-gray-600">{description.length}/500</span>
            </div>
            <textarea
              value={description}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about? Keep it specific to help Xlya generate relevant content."
              rows={8}
              className={`w-full resize-none bg-[#161616] border border-[#232323] rounded-lg px-3.5 py-3 text-[13px] text-[#f4f0e8] placeholder:text-gray-600 focus:outline-none focus:border-[var(--gold-primary)] transition-colors duration-150 leading-relaxed ${FOCUS_RING}`}
            />
          </div>

          {/* Knowledge base files */}
          <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#9a9a9a]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
                Knowledge base files
              </div>
              <span className="text-[11px] font-medium text-gray-500">
                {files.length}/{MAX_FILES} used
              </span>
            </div>
            <p className="text-[11.5px] text-gray-600 mb-4">PDF, TXT, DOCX, or PPT — up to {MAX_FILES} files.</p>

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
              onClick={() => files.length < MAX_FILES && fileInputRef.current?.click()}
              disabled={files.length >= MAX_FILES}
              onDragOver={(e) => {
                e.preventDefault();
                if (files.length < MAX_FILES) setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFile(false);
                if (files.length < MAX_FILES) handleFilesSelected(e.dataTransfer.files);
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
                {files.length >= MAX_FILES
                  ? "File limit reached"
                  : isDraggingFile
                  ? "Drop to add"
                  : "Drop files here or click to browse"}
              </span>
              <span className="text-[11px] text-gray-600">.pdf · .txt · .docx · .ppt</span>
            </button>

            {files.length > 0 ? (
              <div className="space-y-2">
                {files.map((f) => {
                  const style = FILE_ICON_STYLE[f.ext];
                  return (
                    <div
                      key={f.id}
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
                          {f.sizeLabel} · {f.addedLabel}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(f.id)}
                        className={`w-9 h-9 flex-none flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150 ${FOCUS_RING}`}
                        aria-label={`Remove ${f.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11.5px] text-gray-600 text-center py-2">No files added yet.</p>
            )}
          </div>
        </div>

        <MarketAnalysis />

        {/* Danger zone — mirrors AppNavbar's real delete-project modal
            visually; kept a no-op here since this page is design-only for
            now. Wire this to the same handler AppNavbar uses when this
            page gets real save/delete plumbing. */}
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
              className={`px-4 py-2.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors duration-150 flex-none ${FOCUS_RING}`}
            >
              Delete project
            </button>
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
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmName("");
                  toast.error("This is a design preview — deletion isn't wired up yet.");
                }}
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
