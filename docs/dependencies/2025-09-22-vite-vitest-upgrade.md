# Vite/Vitest Upgrade Notes — 2025-09-22

## Summary
- Upgraded `vite` to 7.1.7 and `vitest` / `@vitest/ui` to 3.2.4 to remediate the esbuild advisory flagged during Phase 2.
- Bumped `@vitejs/plugin-react` to 5.0.3 to stay compatible with the new toolchain.
- CI invocation now relies on `--maxWorkers=1 --no-file-parallelism` in place of the deprecated `--runInBand` flag.

## Compatibility Adjustments
- Updated `.gitlab-ci.yml` and `docs/integrations/gitlab.md` to reflect the new Vitest CLI options.
- No changes required to `vitest.config.ts`; defaults continue to operate with the new major version.

## Validation
- `npm run test:unit -- --maxWorkers=1 --no-file-parallelism`
- `npm run type-check`
- `npm run lint:check`
- `npm run build`

## Follow-ups
- Monitor Vitest 3 changelog for any breaking changes around pool defaults (`forks`) and consider enabling isolation tuning once the test estate grows.
- Revisit coverage reporter integration to ensure GitLab artifacts remain compatible with Vitest 3 output.
