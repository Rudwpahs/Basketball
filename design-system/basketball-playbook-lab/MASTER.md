# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Basketball Playbook Lab
**Design snapshot:** 2026-07-26 08:55:51
**Category:** Professional sports learning tool
**Design Dials:** Variance 5/10 (Balanced / Modern) | Motion 5/10 (Standard) | Density 8/10 (Dense / Dashboard)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#0B1320` | `--color-primary` |
| On Primary | `#F7F1E7` | `--color-on-primary` |
| Secondary | `#26374A` | `--color-secondary` |
| Accent/CTA | `#E34B32` | `--color-accent` |
| Background | `#F2EBDD` | `--color-background` |
| Foreground | `#101820` | `--color-foreground` |
| Muted | `#D8CEBD` | `--color-muted` |
| Border | `#B8AA96` | `--color-border` |
| Court | `#C88A55` | `--color-court` |
| Success | `#3A7D5D` | `--color-success` |
| Ring | `#F25C2A` | `--color-ring` |

**Color Notes:** Ink navy, vintage playbook cream, hardwood tan, and signal red. Red communicates the active play and must never be the only state cue.

### Typography

- **Heading Font:** Barlow Condensed
- **Body Font:** Barlow
- **Mono/labels:** IBM Plex Mono
- **Mood:** professional coaching board, editorial sports analysis, precise, energetic
- **Google Fonts:** [Barlow Condensed + Barlow + IBM Plex Mono](https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
```

### Spacing Variables

*Density: 8/10 — Dense / Dashboard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `2px` / `0.125rem` | Tight gaps |
| `--space-sm` | `4px` / `0.25rem` | Icon gaps, inline spacing |
| `--space-md` | `8px` / `0.5rem` | Standard padding |
| `--space-lg` | `12px` / `0.75rem` | Section padding |
| `--space-xl` | `16px` / `1rem` | Large gaps |
| `--space-2xl` | `24px` / `1.5rem` | Section margins |
| `--space-3xl` | `32px` / `2rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #E34B32;
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 2px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #0B1320;
  border: 1px solid #0B1320;
  padding: 12px 24px;
  border-radius: 2px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #F7F1E7;
  border: 1px solid #B8AA96;
  border-radius: 2px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #B8AA96;
  border-radius: 2px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #E34B32;
  outline: none;
  box-shadow: 0 0 0 3px #E34B3233;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Swiss Modernism 2.0

**Keywords:** Grid system, Helvetica, modular, asymmetric, international style, rational, clean, mathematical spacing

**Best For:** Corporate sites, architecture, editorial, SaaS, museums, professional services, documentation

**Key Effects:** 12-column grid, hard editorial dividers, stamped labels, restrained paper grain, mathematical spacing, and a 3D court as the dominant canvas

### Page Pattern

**Pattern Name:** Coaching workstation

- **Learning Strategy:** Term index → live court explanation → phase controls → coaching cue → recall quiz.
- **Primary Action:** Play/pause is attached to the court stage; term search stays reachable at all widths.
- **Desktop Order:** term rail, 3D court stage, explanation rail.
- **Mobile Order:** title and search, 3D court, transport controls, explanation, term drawer.

---

## Motion

**Spatial continuity** — court actors move with eased position interpolation while the basketball follows physically derived paths. UI transitions use 180–240 ms ease-out; no decorative bounce.

- ✅ Pause the render loop when the document is hidden.
- ✅ Respect `prefers-reduced-motion` by replacing autoplay with stepped states.
- ✅ Reuse geometry and materials; never allocate Three.js geometry in the frame loop.
- ❌ Do not animate unrelated panels while a play is running.

---

## Anti-Patterns (Do NOT Use)

- ❌ Generic dashboard cards competing with the court
- ❌ Fake motion paths unrelated to the selected term
- ❌ Flat ball translation with no height or shadow response

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile