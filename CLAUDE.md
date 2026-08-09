# Xlya Frontend — Instructions

**Before making changes in this repo, read `.claude/folder-structure.md` in full.** It's the living architecture doc — current product flow, the combined signup+onboarding API contract (confirmed enum values, wire format), token storage rules, and the site-wide animated background's constraints. It's kept up to date as the codebase changes; treat it as more current than your own assumptions about this project.

**Also read the auto-memory files for this project before starting work**, not just the one-line summaries in `MEMORY.md`. They record specific things that were tried, got wrong, and had to be corrected — an API enum value that looked plausible but wasn't, a CSS stacking bug that looked like a totally different problem, a wire-format assumption that silently dropped every event. Skipping them means re-deriving the same conclusions the hard way, which costs real turns and can reintroduce bugs that were already fixed once.

When something you're told or something you discover contradicts a memory file or `.claude/folder-structure.md`, the codebase's current actual behavior wins — but update the stale doc/memory to match rather than leaving it wrong for next time.
