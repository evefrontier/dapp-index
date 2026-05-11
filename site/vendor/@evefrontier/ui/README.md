# @evefrontier/ui (vendored)

Pre-built snapshot of the EVE Frontier UI component library, vendored here until `@evefrontier/ui` is published to a registry.

Builders who clone `dapp-index` do not need any other repository — these files are committed and ready to use.

## Updating (maintainers only)

Requires access to the internal `web-design-system` repo.

```bash
# 1. In the web-design-system repo, rebuild the lib
npm run build:lib

# 2. Copy the output into this folder
cp web-design-system/dist/lib/index.{js,css,d.ts} \
   dapp-index/site/vendor/@evefrontier/ui/dist/lib/

# 3. Commit the updated dist files
git add site/vendor/@evefrontier/ui/dist/lib/
git commit -m "chore(vendor): update @evefrontier/ui snapshot"
```

## Switching to the published package

Once `@evefrontier/ui` is on npm or GitHub Packages:

1. Delete this `vendor/` folder.
2. In `site/package.json` change: `"@evefrontier/ui": "file:./vendor/@evefrontier/ui"` → `"@evefrontier/ui": "^0.1.0"`.
3. Add `.npmrc` with the registry if using GitHub Packages.
4. Run `bun install`.

No app code changes required.
