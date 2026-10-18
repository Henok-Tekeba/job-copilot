---
name: Job Copilot
description: A board of tech internships, contracts and junior roles, read for international-applicant eligibility and skill gaps.
colors:
  background: "oklch(0 0 0)"
  foreground: "oklch(0.985 0 0)"
  card: "oklch(0.145 0 0)"
  muted: "oklch(0.269 0 0)"
  muted-foreground: "oklch(0.708 0 0)"
  border: "oklch(1 0 0 / 10%)"
  primary: "oklch(0.922 0 0)"
  primary-foreground: "oklch(0.205 0 0)"
  destructive: "oklch(0.704 0.191 22.216)"
  signal-green: "oklch(0.76 0.17 155)"
  sky: "oklch(0.75 0.14 230)"
  amber: "oklch(0.8 0.16 85)"
  red: "oklch(0.7 0.2 25)"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.05
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
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "0.2625rem"
  md: "0.35rem"
  lg: "0.4375rem"
  xl: "0.6125rem"
  2xl: "0.7875rem"
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
  button-secondary:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "1rem"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.75rem"
  badge-status:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.2xl}"
    padding: "0.125rem 0.5rem"
---

# Design System: Job Copilot

## Overview

**Creative North Star: "The Console"**

A dark, dense, instrument-like surface — neutral greys, monospace numerals, tight radii. It reads like a Bloomberg terminal for job hunting: every pixel earns its place, and decoration is absent. The aesthetic is precise, quiet, and utilitarian; the ground is pure black and the only colour is the status palette signalling eligibility.

**Key Characteristics:**
- Pure black ground (`oklch(0 0 0)`) with stepped neutral surfaces for depth.
- Geist Sans for text, Geist Mono for numbers, dates, deadlines and scores.
- Tight radii (base 0.4375rem) and neutral greys; no accent colour.
- Status colours (emerald/sky/amber/red) are the only colour and only signal state.
- No shadows in dark mode; depth via tonal layering.

## Colors

A neutral, achromatic palette with a single family of status colours. Colour is never decorative.

### Primary
- **Ink** (`oklch(0.922 0 0)`): primary actions and key foreground emphasis on the dark ground.

### Neutral
- **Void** (`oklch(0 0 0)`): page background.
- **Surface** (`oklch(0.145 0 0)`): cards, popovers, inputs.
- **Muted Surface** (`oklch(0.269 0 0)`): secondary surfaces, hover states, badges.
- **Muted Ink** (`oklch(0.708 0 0)`): secondary text, captions.
- **Hairline** (`oklch(1 0 0 / 10%)`): borders and dividers at 10% white.

### Status
- **Signal Green** (`oklch(0.76 0.17 155)`): eligible / open / reachable.
- **Sky** (`oklch(0.75 0.14 230)`): informational / remote / neutral reach.
- **Amber** (`oklch(0.8 0.16 85)`): caution / missing skills / closing soon.
- **Red** (`oklch(0.7 0.2 25)`): ineligible / blocked / overdue.

### Named Rules
**The One Voice Rule.** Status colours are the only colour in the UI; they appear only to signal state, never as decoration or brand.

## Typography

**Display Font:** Geist (with system-ui, sans-serif fallback)
**Body Font:** Geist (with system-ui, sans-serif fallback)
**Label/Mono Font:** Geist Mono (with ui-monospace, monospace fallback)

**Character:** A single sans family with a mono companion. Geist's tight tracking and neutral geometry keep the interface instrument-like; mono numerals give scores, dates and deadlines a tabular, scannable rhythm.

### Hierarchy
- **Display** (600, clamp(2.25rem,5vw,3rem), 1.05): hero headline.
- **Headline** (600, 1.125rem, 1.2): section headings.
- **Title** (500, 0.875rem, 1.3): card titles, row labels.
- **Body** (400, 0.875rem, 1.5): prose, descriptions; max ~65ch.
- **Label** (400, 0.75rem, 1.4): captions, metadata.
- **Mono** (400, 0.75rem, 1.4): numbers, dates, deadlines, scores (tabular-nums).

### Named Rules
**The Numerals Rule.** All counts, scores, dates and deadlines use Geist Mono with tabular-nums; never proportionally spaced numerals.

## Layout

Grid-based, containerised at max-w-6xl with px-4/sm:px-6 gutters. Spacing rhythm is a 4px base (0.25rem steps). Dense but legible: cards and rows use tight vertical rhythm (gap-2 to gap-4) and sections use py-14 to py-24. Responsive collapse below 768px; mobile touch targets are 44px minimum.

## Elevation & Depth

Mixed: flat by default with tonal layering in dark mode (background → card → muted), and subtle shadows only on overlays (popovers, dialogs, sheets) and in light mode. No shadows on resting cards.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest; shadows appear only as a response to state (hover, elevation, focus) or on floating overlays.

## Shapes

Tight radii derived from a 0.4375rem base (sm 0.2625, md 0.35, lg 0.4375, xl 0.6125, 2xl 0.7875). Borders are 1px hairlines at 10% white; no heavy outlines. Form language is compact and squared-off, not pill-heavy.

## Components

### Buttons
- **Shape:** lg radius (0.4375rem), compact padding.
- **Primary:** ink background, primary-foreground text.
- **Hover / Focus:** background shift on hover; focus-visible ring (ring/ring color, 3px) replaces outline.
- **Secondary / Ghost:** muted or transparent background, foreground text.

### Cards / Containers
- **Corner Style:** lg radius (0.4375rem).
- **Background:** surface (card) on void ground.
- **Shadow Strategy:** none at rest; reference Elevation section.
- **Border:** 1px hairline.
- **Internal Padding:** 1rem (md).

### Inputs / Fields
- **Style:** surface background, hairline border, lg radius.
- **Focus:** border/ring shift (focus-visible ring).
- **Error:** destructive border and ring.

### Badges
- **Style:** muted background, foreground text, 2xl radius (pill), compact padding. Status variants use status colours as text on muted ground.

### Navigation
- Sidebar (inset, collapsible to icons) with active state; top bar on landing. Mono numerals in stat readouts.

## Do's and Don'ts

### Do:
- **Do** use Geist Sans for text and Geist Mono for numbers, dates, deadlines and scores.
- **Do** keep the ground pure black and surfaces stepped in neutral OKLCH.
- **Do** use status colours only to signal eligibility/state.
- **Do** use focus-visible rings instead of outlines.
- **Do** use tabular-nums on every numeric readout.

### Don't:
- **Don't** introduce an accent colour, tinted ground, or custom palette.
- **Don't** change typefaces, colour token values, or radii.
- **Don't** use glassmorphism/backdrop-blur as a default surface treatment.
- **Don't** use transition: all; list properties explicitly.
- **Don't** treat a region restriction as a hard no.