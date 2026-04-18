# HarborNAS Design System

## Core Identity
**Primary Concept:** A premium, reliable, and modern NAS interface.
**Key Aesthetic:** Minimalist dashboards, data-forward presentation, glassmorphic accents, and functional elegance.

## Colors
- **App Background (Base):** `var(--bg1)` / `var(--bg-1)`
- **Card/Panel Background:** `var(--bg2)` / `var(--bg-2)`
- **Overlay/Modal Background:** `rgba(0, 0, 0, 0.45)` with blur
- **Primary Text:** `var(--fg1)` / `var(--fg-1)` — High-contrast for readability
- **Secondary Text:** `var(--fg2)` / `var(--fg-2)` — Muted, structural text
- **Accents/Interaction:** `var(--primary)` — Action buttons, active states
- **Borders:** `rgba(255, 255, 255, 0.1)` (or `var(--border-color)`)

## Typography
- **Font Family:** `system-ui, -apple-system, 'Inter', sans-serif`
- **Headers (H1):** Lightweight (300), precise tracking (`0.04em`)
- **Body:** Standard readability (14px - 18px), relaxed line-height (1.6)
- **Badges/Metadata:** Lightweight (300), tighter tracking (`0.08em`)

## Component Library

### Glassmorphic Cards (e.g., Empty States)
- **Background:** Semi-transparent base layer (alpha `0.05`).
- **Border:** 1px solid low-alpha white (`0.1`).
- **Effects:** Deep shadow (`0 4px 20px rgba(0,0,0,0.2)`), medium backdrop blur (`10px`).
- **Corners:** Rounded (`12px`).

### Metadata Overlays & Badges
- **Shape:** Pill-shaped (`border-radius: 100px`).
- **Background:** Dark semi-transparent (`alpha 0.45`).
- **Effects:** Strong background blur (`16px`).
- **Padding:** Compact spacing (e.g., `7px 18px`).

### Imagery & Media
- **Animations:** Subtle Kenneth Burns ("Ken Burns") panning for slideshow media, utilizing smooth 8s keyframe scaling (`1.0` -> `1.06`).
- **Transitions:** Smooth UI opacity/color cross-fading, typically 1s for content swaps.

## Layout & Principles
1. **Dynamic Design:** Components should feel alive. Make use of hover/active state feedback.
2. **Context-Aware Consistency:** Fallbacks are standard. Do not hardcode `#000` or `#fff` completely; build around the `var(--bg1)` token layer so themes effortlessly switch between light and dark modes.
3. **Immersive Depth:** Rather than flat, separated boxes, use transparency and layered shading to define depth.
