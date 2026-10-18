---
name: Job Copilot
description: A board of tech internships, contracts and junior roles, read for international-applicant eligibility and skill gaps.
colors:
  background: "oklch(0.13 0.02 260)"
  foreground: "oklch(0.96 0.01 260)"
  card: "oklch(0.17 0.02 260)"
  muted: "oklch(0.22 0.02 260)"
  muted-foreground: "oklch(0.68 0.02 260)"
  border: "oklch(1 0 0 / 12%)"
  primary: "oklch(0.78 0.16 70)"
  primary-foreground: "oklch(0.18 0.04 70)"
  destructive: "oklch(0.7 0.2 25)"
  signal-amber: "oklch(0.78 0.16 70)"
  sky: "oklch(0.75 0.14 230)"
  red: "oklch(0.7 0.2 25)"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.25rem, 5vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.3
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  2xl: "1.25rem"
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
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "1rem"
---

# Design System: Job Copilot

## Overview

**Creative North Star: "The Observatory"**

A deep midnight ground with a warm amber signal light. Display headlines in Fraunces (a high-contrast serif) over a Geist UI — editorial authority meets instrument precision. Larger, softer radii. The accent is warm amber, used for primary actions and key signals.

**Key Characteristics:**
- Deep slate/midnight ground (`oklch(0.13 0.02 260)`), not pure black.
- Fraunces for display headlines; Geist for UI; Geist Mono for data.
- Warm amber accent (`oklch(0.78 0.16 70)`) for primary actions.
- Softer radii (base 0.625rem).
- Status colours (amber/sky/red) signal state.

## Colors

### Primary
- **Amber Signal** (`oklch(0.78 0.16 70)`): primary actions and key emphasis.

### Neutral
- **Midnight** (`oklch(0.13 0.02 260)`): page background.
- **Surface** (`oklch(0.17 0.02 260)`): cards, popovers, inputs.
- **Muted Surface** (`oklch(0.22 0.02 260)`): secondary surfaces, hover.
- **Muted Ink** (`oklch(0.68 0.02 260)`): secondary text.
- **Hairline** (`oklch(1 0 0 / 12%)`): borders.

### Status
- **Amber** (`oklch(0.78 0.16 70)`): primary / eligible.
- **Sky** (`oklch(0.75 0.14 230)`): informational.
- **Red** (`oklch(0.7 0.2 25)`): blocked / overdue.

## Typography

**Display Font:** Fraunces (with Georgia, serif fallback)
**Body Font:** Geist (with system-ui, sans-serif fallback)
**Label/Mono Font:** Geist Mono

**Character:** Fraunces brings editorial weight and warmth to headlines; Geist keeps the UI precise and utilitarian; mono numerals give data a tabular rhythm.

### Hierarchy
- **Display** (600, clamp(2.25rem,5vw,3rem), 1.02): hero headline.
- **Headline** (600, 1.125rem, 1.2): section headings.
- **Title** (500, 0.875rem, 1.3): card titles.
- **Body** (400, 0.875rem, 1.5): prose.
- **Mono** (400, 0.75rem, 1.4): numbers, dates, deadlines, scores.

## Layout

Same grid/container as before (max-w-6xl, px-4/sm:px-6). 4px base spacing. Responsive collapse below 768px; 44px touch targets.

## Elevation & Depth

Flat by default with tonal layering; shadows only on overlays.

## Shapes

Softer radii (base 0.625rem). 1px hairline borders.

## Components

### Buttons
- **Shape:** lg radius (0.625rem).
- **Primary:** amber background, dark text.
- **Hover / Focus:** background shift; focus-visible ring.

### Cards
- **Corner Style:** lg radius.
- **Background:** surface on midnight ground.
- **Border:** 1px hairline.

## Do's and Don'ts

### Do:
- **Do** use Fraunces for display headlines, Geist for UI, Geist Mono for data.
- **Do** keep the midnight ground and stepped slate surfaces.
- **Do** use amber as the primary accent.

### Don't:
- **Don't** revert to pure black + emerald without reason.
- **Don't** use glassmorphism as default.
- **Don't** use transition: all.