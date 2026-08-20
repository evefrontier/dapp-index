# Environment Branches (Temporary State)

`dev`, `test` and `live` are currently seeded from the integration branch
`integration/all-open-prs`, **not** from `main`.

That branch is `main` plus the content of every open pull request, merged
locally with conflicts resolved, so the three environments can run the full
system while the code is still under review. Nothing here changes `main`, and
no pull request was merged on GitHub to produce it.

## Why this exists

The features that make the system complete — the catalog data layer, the store
UI, the builder wizard steps, the gRPC registry reads and the S3 storage flow —
are spread across ~29 open PRs stacked on each other. Waiting for all of them
to land before standing up `test` and `live` would leave both environments
empty.

## Reset trigger

Once every open PR has landed on `main` in dependency order, reset all three
branches back to `main` and delete this file:

```bash
git fetch origin
git checkout dev   && git reset --hard origin/main && git push --force-with-lease origin dev
git checkout test  && git reset --hard origin/main && git push --force-with-lease origin test
git checkout live  && git reset --hard origin/main && git push --force-with-lease origin live
git push origin --delete integration/all-open-prs
```

Until then, treat `main` as the review target and the integration branch as the
deployable snapshot. Rebuild the integration branch (rather than patching the
environment branches directly) whenever an open PR changes.

## What differs between the three

All three run identical code. Only environment variables differ.

| Variable | dev | test | live |
| --- | --- | --- | --- |
| `VITE_ENABLE_FIXTURE_DATA` | `true` | unset | unset |
| `VITE_ENABLE_WALRUS` | unset | unset | unset |
| `VITE_SUI_NETWORK` | `testnet` | `testnet` | `mainnet` |
| `VITE_PACKAGE_ID` / `VITE_REGISTRY_ID` | dev registry | test registry | mainnet registry |
| `VITE_UPLOAD_API_BASE` | dev upload Lambda | test upload Lambda | prod upload Lambda |
| `VITE_MEDIA_CDN_BASE` | dev CDN origin | test CDN origin | default (`dapp-media.evefrontier.com`) |

`dev` is the only environment with fixture data. `test` and `live` read
listings from the Sui registry and media from S3/CDN only; a failed chain read
renders an empty catalog rather than fixture listings.

Walrus is disabled everywhere. Its modules are intentionally kept in the tree
for the later mainnet flow — `VITE_ENABLE_WALRUS=true` re-enables the read and
upload paths without a code change.

Hosting/env wiring (Amplify or otherwise) and the per-environment S3 bucket,
upload Lambda and CDN are provisioned outside this repo and are not configured
by this branch. `test` and `live` have nothing to read until their registry ids
and upload/CDN endpoints are set.
