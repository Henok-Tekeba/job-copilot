# Rules
- Stack: Next.js (App Router), TypeScript, Tailwind, shadcn/ui. Nothing else for UI.
- Never write your own buttons, inputs, tables, dialogs, etc. Import from `@/components/ui/*`.
- If a shadcn component is missing, install it with `npx shadcn@latest add <name>`. Do not hand-write it.
- Dark theme only. Use theme tokens (bg-background, text-muted-foreground, border), not hardcoded hex colors.
- Fonts: Geist Sans for text, Geist Mono for numbers, dates and scores.
- Data comes from `data/seed.json` for now. No backend yet.
- Do not add new dependencies without asking.
- Keep files small. One component per file.
