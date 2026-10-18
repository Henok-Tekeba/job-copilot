---
name: Job Copilot
description: A board of tech internships, contracts and junior roles, read for international-applicant eligibility and skill gaps.
colors:
  background: "oklch(0.15 0.015 250)"
  foreground: "oklch(0.94 0.01 250)"
  card: "oklch(0.19 0.015 250)"
  muted: "oklch(0.24 0.015 250)"
  muted-foreground: "oklch(0.62 0.015 250)"
  border: "oklch(1 0 0 / 10%)"
  primary: "oklch(0.78 0.15 195)"
  primary-foreground: "oklch(0.16 0.03 195)"
  destructive: "oklch(0.68 0.2 25)"
  signal-teal: "oklch(0.78 0.15 195)"
  sky: "oklch(0.75 0.14 230)"
  red: "oklch(0.68 0.2 25)"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.5vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.3
  body:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "1rem"
---

# Design System: Job Copilot

## Overview

**Creative North Star: "The Radar"**

A deep cool-charcoal ground with an electric teal signal light. Space Grotesk throughout — geometric, technical, distinctive — with JetBrains Mono for data. Tighter radii (0.375rem base) give an instrument-panel feel. The accent is electric teal, used for primary actions and key signals; it evokes scanning and finding across a global field.

**Key Characteristics:**
- Deep cool charcoal ground (`oklch(0.15 0.015 250)`), not pure black.
- Space Grotesk for all UI text; JetBrains Mono for data.
- Electric teal accent (`oklch(0.78 0.15 195)`) for primary actions.
- Tighter radii (base 0.375rem) for an instrument feel.
- Status colours (teal/sky/red) signal state.
- Left-aligned, asymmetric layouts; no centered hero default.

## Colors

### Primary
- **Signal Teal** (`oklch(0.78 0.15 195)`): primary actions and key emphasis.

### Neutral
- **Charcoal** (`oklch(0.15 0.015 250)`): page background.
- **Surface** (`oklch(0.19 0.015 250)`): cards, popovers, inputs.
- **Muted Surface** (`oklch(0.24 0.015 250)`): secondary surfaces, hover.
- **Muted Ink** (`oklch(0.62 0.015 250)`): secondary text.
- **Hairline** (`oklch(1 0 0 / 10%)`): borders.

### Status
- **Teal** (`oklch(0.78 0.15 195)`): primary / eligible.
- **Sky** (`oklch(0.75 0.14 230)`): informational.
- **Red** (`oklch(0.68 0.2 25)`): blocked / overdue.

## Typography

**Display Font:** Space Grotesk (with system-ui, sans-serif fallback)
**Body Font:** Space Grotesk (with system-ui, sans-serif fallback)
**Mono Font:** JetBrains Mono (with ui-monospace, monospace fallback)

**Character:** One geometric family for everything UI; mono for data. Space Grotesk's squared terminals and tight tracking read technical and distinctive without being a costume.

### Hierarchy
- **Display** (700, clamp(2rem,4.5vw,2.75rem), 1.0): hero headline.
- **Headline** (600, 1.125rem, 1.15): section headings.
- **Title** (500, 0.875rem, 1.3): card titles.
- **Body** (400, 0.875rem, 1.55): prose.
- **Mono** (400, 0.75rem, 1.4): numbers, dates, deadlines, scores.

## Layout

Asymmetric, left-aligned. Grid/container max-w-6xl with px-4/sm:px-6. 4px base spacing. Responsive collapse below 768px; 44px touch targets. Content left-aligned by default; center only for isolated hero moments.

## Elevation & Depth

Flat by default with tonal layering; shadows only on overlays.

## Shapes

Tighter radii (base 0.375rem). 1px hairline borders. No pills except small controls.

## Components

### Buttons
- **Shape:** md radius (0.375rem).
- **Primary:** teal background, dark text.
- **Hover / Focus:** background shift; focus-visible ring.

### Cards
- **Corner Style:** md radius.
- **Background:** surface on charcoal ground.
- **Border:** 1px hairline.

## Do's and Don'ts

### Do:
- **Do** use Space Grotesk for all UI text and JetBrains Mono for data.
- **Do** keep the charcoal ground and stepped slate surfaces.
- **Do** use teal as the primary accent.
- **Do** left-align content; avoid centered hero defaults.
- **Do** use tabular-nums on every numeric readout.

### Don't:
- **Don't** use ALL-CAPS eyebrows or numbered markers unless content is a sequence.
- **Don't** append "→" to links/buttons.
- **Don't** use middle-dot meta strings ("A · B · C").
- **Don't** use monospace for small labels (reserve for data).
- **Don't** use glassmorphism as default.
- **Don't** use transition: all.