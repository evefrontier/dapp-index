## Summary

- 

## Affected surfaces

- [ ] Site / frontend
- [ ] Builder metadata schema
- [ ] Walrus metadata flow
- [ ] Move Registry / MVR verification
- [ ] Sui Move registry package
- [ ] Docs only
- [ ] GitHub / Codex automation

## Verification

- [ ] `bun run site:test`
- [ ] `bun run site:typecheck`
- [ ] `bun run site:build`
- [ ] `bun run move:build`
- [ ] `bun run move:test`
- [ ] `bun run ci`
- [ ] Not run; explain why:

## Trust, governance, and release notes

- Does this change affect listing verification, wallet signing, Walrus uploads, MVR package identity, or release/governance behavior?
- Are any manual release steps required?

## Screenshots or media

For `site/` UI changes, the **Site visual regression** check posts screenshots automatically as a PR comment. Update baselines locally with `bun run --cwd site e2e:update` (regenerate via the `mcr.microsoft.com/playwright` Docker image so results match CI's Linux rendering) when changes are intentional, and commit the updated PNGs.
