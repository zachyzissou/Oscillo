# Design System & Theme Tokens

This document records the canonical design tokens, Tailwind primitives, and runtime theme behavior for Oscillo.

## 1. CSS Variable Tokens

The primary tokens are exposed as CSS variables (see `src/styles/globals.css`), intentionally aligned with Tailwind’s HSL-based color config.

| Token | Purpose |
|-------|---------|
| `--background`, `--foreground` | Base surface + text colors. Updated dynamically when the visual theme changes. |
| `--card`, `--card-foreground`, `--popover`, `--popover-foreground` | Elevated surfaces with shared typography. |
| `--primary`, `--secondary`, `--accent` | Key action hues linked to Tailwind’s semantic palette (`theme.extend.colors`). |
| `--muted`, `--destructive`, `--ring`, `--border`, `--input` | Supporting roles for inputs, alerts, and focus rings. |
| `--neon-*` | Accent neon hues used in glassmorphism/neon utilities. |
| `--glass-*` | RGBA values powering frosted-glass backgrounds. |
| `--radius` | Global corner radius, mirrored in Tailwind’s borderRadius extension. |

Theme overrides write HSL strings (e.g. `171 73% 57%`). Tailwind consumes these via `hsl(var(--token))`, ensuring design system alignment between utility classes and runtime effects. Surface/surface-contrast tokens describe elevated panels, replacing several ad-hoc shades.

## 2. Theme Application Flow

1. Theme definitions live in `src/lib/theme-tokens.ts` (colors, FX, materials).
2. `useThemeSettings` (Zustand) manages the active theme, persistence, and custom overrides.
3. `applyThemeTokens(themeConfig)` writes CSS variables and sets `document.documentElement.dataset.theme` for analytics/testing.
4. `EnhancedCanvas` subscribes to the current theme and triggers `applyThemeTokens` on changes. Updates also run on store rehydration, keeping CSS variables in sync after reloads.

## 3. Tailwind Integration

- `tailwind.config.ts` imports utilities (`neonUtilities`) and references the CSS variables through `hsl(var(--token))`.
- Custom utilities include `.text-shadow-neon`, `.glass-morphism`, and animated gradients built on top of the neon/glass tokens.
- When introducing new palette entries, add the color to `NEON_PALETTE`/`GLASS_PALETTE` in `theme-tokens.ts`, update Tailwind’s `extend.colors`, and document usage here.
- Surface shades (`--surface`, `--surface-contrast`) now control panels, cards, and popovers; avoid hardcoding component backgrounds.
- Motion tokens and reduced-motion rules are documented in `docs/motion-system.md`.

## 4. Component Guidelines

- Use semantic Tailwind classes: `bg-background`, `text-foreground`, `border-border`, `bg-primary/fg-primary` rather than hard-coded hex values.
- For bespoke CSS, prefer `var(--token)` so themes stay swappable.
- UI primitives (e.g. `GlassPanel`, `NeonButton`) should ingest tokens via Tailwind classes or inline CSS variables—avoid duplicating color constants.
- When adding new 3D or HUD elements, derive gradients and post-processing parameters from the active `ThemeConfig` to keep visuals cohesive.

## 5. Storybook (Future Work)

A Storybook integration is planned to showcase tokens and component states. Once added:

```bash
npm run storybook         # start local Storybook (TBD)
```

Until then, document component examples in the repo or wiki and include screenshots/video in PRs.

## 6. QA Checklist

- [ ] Added/updated tokens in `globals.css` and `theme-tokens.ts` (surface shades, neon/glass palettes).
- [ ] Tailwind config reflects the same semantic colors.
- [ ] `applyThemeTokens` updates any new variables.
- [ ] Docs (`README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `AGENTS.md`) reference new tokens/practices if relevant.
- [ ] GitLab issue updated with screenshots or notes when themes change.

Keep this document in sync whenever tokens change so designers, developers, and QA share a single source of truth.
