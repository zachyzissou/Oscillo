# Oscillo Stitch Workflow

Use Google Stitch as a visual exploration surface for the native Swift/macOS lane. The source of truth for product direction is [`native/DESIGN_DIRECTION.md`](../native/DESIGN_DIRECTION.md); Stitch output is reference material, not production code.

Important distinction:

- [`native/DESIGN_DIRECTION.md`](../native/DESIGN_DIRECTION.md) describes the native product direction.
- [`native/APPLE_TECH_MAP.md`](../native/APPLE_TECH_MAP.md) describes Apple framework adoption opportunities.
- [`native/README.md`](../native/README.md) describes the current implementation and release lane.
- Stitch should explore the destination UI, not recreate the old Three.js layout or the current Swift prototype one-for-one.

## Stitch Project

- Project title: `Oscillo Native macOS Design Lab`
- Project ID: `2328505340539181137`
- Project resource: `projects/2328505340539181137`
- Design system asset: `assets/2124855500104295941`
- Design system name: `Oscillo Native - Signal Foundry`

Verification note: `list_design_systems` returns the asset above. `get_project` may show an empty `designTheme` even after the design-system asset is created.

Generated concept screens:

- `Oscillo Native - Instrument View`
  - Screen ID: `0f6bee9346494223b495eeb07869b229`
  - Screen resource: `projects/2328505340539181137/screens/0f6bee9346494223b495eeb07869b229`
- `Performance Cockpit - Variation 1`
  - Screen ID: `01f93dcb49f94f819b9dabac88c968d4`
  - Screen resource: `projects/2328505340539181137/screens/01f93dcb49f94f819b9dabac88c968d4`
- Reimagined variants from `Oscillo Native - Instrument View`
  - `41b5cd25345747a88a5b8261ce36473b`: left instrument spine / performance cockpit
  - `f55f61e2a73945a5bbb864217e54ea02`: bottom-console live visual rig
  - `85576dc0e45441dcbf0e1ff7502fcf5e`: floating HUD over full-bleed spectral terrain
  - `95bcdf361bd44308b06f97131b8c8188`: compact spectral workbench

## Current Local MCP Status

Oscillo does not have a repo-local Stitch MCP JSON file to copy. It uses a repo-safe workflow document and a global Codex MCP config.

Codex is configured globally with the Stitch remote MCP endpoint:

```toml
[mcp_servers.stitch]
url = "https://stitch.googleapis.com/mcp"
env_http_headers = { "X-Goog-Api-Key" = "STITCH_API_KEY" }
```

The key itself must stay outside this repository and outside checked-in config. Set it locally as `STITCH_API_KEY`.

For terminal-launched Codex sessions:

```sh
export STITCH_API_KEY="..."
```

For the macOS desktop app, set it via `launchctl` for apps started by `launchd`, then fully restart Codex so it picks up the new environment:

```sh
launchctl setenv STITCH_API_KEY "..."
```

Do not commit local OAuth files, API keys, tokens, account files, downloaded credentials, or generated private config to this repository.

## Stitch MCP Payload Note

The Stitch design-system tools require a structured object even though some tool descriptions make `designSystem` look like a plain string.

Working shape:

```json
{
  "projectId": "2328505340539181137",
  "designSystem": {
    "displayName": "Oscillo Native - Signal Foundry",
    "theme": {
      "colorMode": "DARK",
      "headlineFont": "SPACE_GROTESK",
      "bodyFont": "INTER",
      "labelFont": "SPACE_GROTESK",
      "roundness": "ROUND_FOUR",
      "customColor": "#21E6C1",
      "colorVariant": "VIBRANT",
      "overridePrimaryColor": "#21E6C1",
      "overrideSecondaryColor": "#FF4D6D",
      "overrideTertiaryColor": "#F8D66D",
      "overrideNeutralColor": "#0B0D10",
      "designMd": "..."
    }
  }
}
```

After `create_design_system`, immediately call `update_design_system` with the returned asset name so the design system is displayed in the Stitch project.

Variant generation uses an object-shaped `variantOptions` payload, despite some client schemas making this look string-like:

```json
{
  "projectId": "2328505340539181137",
  "selectedScreenIds": ["0f6bee9346494223b495eeb07869b229"],
  "deviceType": "DESKTOP",
  "modelId": "GEMINI_3_PRO",
  "variantOptions": {
    "variantCount": 4,
    "creativeRange": "REIMAGINE",
    "aspects": ["LAYOUT", "COLOR_SCHEME", "TEXT_FONT", "TEXT_CONTENT"]
  },
  "prompt": "Generate four divergent variants..."
}
```

Documented `creativeRange` values are `REFINE`, `EXPLORE`, and `REIMAGINE`. Documented `aspects` values are `LAYOUT`, `COLOR_SCHEME`, `IMAGES`, `TEXT_FONT`, and `TEXT_CONTENT`.

## Stitch Prompt Contract

When creating or refining Oscillo screens in Stitch, attach or paste [`native/DESIGN_DIRECTION.md`](../native/DESIGN_DIRECTION.md) and use this framing:

```text
Use the attached Oscillo native design direction as the source of truth. Design a macOS audio-visual instrument called Oscillo, built in SwiftUI and Metal. The first screen is the instrument: a dominant live visual stage with compact native controls for audio source, sensitivity, scene mode, palette, quality, capture, presets, and update status. The style is Signal Foundry: dark performance surface, precise studio controls, luminous audio-reactive signal color, spectral grids, oscilloscope traces, and a tool-like macOS workflow. Do not copy the old Three.js composition literally. Avoid landing-page structure, generic SaaS dashboards, purple-blue gradient blobs, decorative bokeh, heavy glass everywhere, equal-weight cards, fake analytics widgets, and explanatory onboarding text inside the main instrument.
```

## What To Generate First

Prioritize screens where visual hierarchy and interaction density matter most:

1. Live instrument with dominant Metal visual stage, compact control rail, and visible update status.
2. Audio input calibration with microphone, preview signal, levels, sensitivity, and noise floor controls.
3. Scene and preset browser for tunnel, constellation, liquid surface, spectrogram stage, and spectral terrain modes.
4. Capture/export queue for saved frames, short clips, and share-ready renders.
5. Performance diagnostics with frame pacing, render quality, audio latency, and battery-aware behavior.
6. Later iOS adaptation once the macOS instrument direction is stable.

## Implementation Rules For Stitch Output

- Treat Stitch output as direction, not production code.
- Translate visual ideas into SwiftUI controls and Metal render states.
- Keep the visual stage dominant; controls should frame the signal, not become the app.
- Use native macOS behavior: menu commands, keyboard shortcuts, hover states, focus rings, window resizing, high contrast, and reduced motion.
- Keep control dimensions stable so live meters, long input names, update copy, and hover states cannot resize the layout.
- Prefer SF Pro and SF Mono in SwiftUI even if Stitch approximates with Space Grotesk and Inter.
- Move repeated colors, spacing, and type roles into native design tokens before spreading them across views.
- Do not add a marketing landing page or in-app explanatory text that describes the app's features.

## Visual QA Checklist

Before implementing a Stitch-inspired screen, verify:

- The live visualizer remains the first-viewport focus.
- Controls are compact, legible, and keyboard reachable.
- Update status is visible without competing with performance controls.
- Audio meters and labels do not overlap at small window sizes.
- Text never depends on visualizer contrast.
- Color is paired with labels, icons, meter position, or shape.
- Reduce Motion keeps the signal readable with lower amplitude effects.
- The design does not drift back into the pre-native Three.js layout unless the native app benefits from it.
