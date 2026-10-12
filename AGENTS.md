# Rules
- Stack: Next.js (App Router), TypeScript, Tailwind, shadcn/ui. Nothing else for UI.
- Never write your own buttons, inputs, tables, dialogs, etc. Import from `@/components/ui/*`.
- If a shadcn component is missing, install it with `npx shadcn@latest add <name>`. Do not hand-write it.
- Dark theme only. Use theme tokens (bg-background, text-muted-foreground, border), not hardcoded hex colors.
- Fonts: Geist Sans for text, Geist Mono for numbers, dates and scores.
- Data comes from `data/seed.json` for now. No backend yet.
- Do not add new dependencies without asking.
- Keep files small. One component per file.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
