# Dependency Stack Cleanup — 2025-09-24

## Summary
Removed unused UI/utility packages to slim the bundle and reduce license footprint.

### Removed packages
- `@radix-ui/react-dialog`
- `@radix-ui/react-select`
- `@radix-ui/react-slider`
- `@radix-ui/react-slot`
- `@radix-ui/react-switch`
- `@radix-ui/react-tooltip`
- `ccapture.js`
- `lottie-web`
- `maath`
- `react-use`
- `use-sound`
- `@tonejs/midi`

All were legacy dependencies referenced by archived components and unused in the active Oscillo codebase.

## License notes
- Radix UI packages (MIT) and ccapture/lottie/maath (MIT) are no longer bundled; no redistribution obligations remain.
- Remaining runtime dependencies unchanged; see `docs/dependencies/2025-09-24-outdated.md` for upgrade plan.

## Verification
- `npm run type-check`
- `npm run lint:check`
- `npm run test -- --run`

No production code changes beyond dependency removal.
