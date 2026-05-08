# Dapp Index — site

Vite + React + TypeScript shell for the Dapp Index frontend using **`@evefrontier/dapp-kit`** (Eve Vault–first connect, Slush and other wallets still available) and **TanStack Query** for app-level caching (e.g. chain reads with `useQuery`). The kit wires **Sui over gRPC** (`SuiGrpcClient`) for `testnet` and `devnet` as published by the package.

No router, Tailwind, or design system in this package yet.

## Prerequisites

- [Bun](https://bun.sh/), or npm with the same scripts.

## Setup

```bash
cd site
bun install
cp .env.example .env   # optional
bun dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Wallets

- **Primary button** uses `useConnection().handleConnect`, which **prefers Eve Vault** when that wallet is registered, then falls back to the first available wallet (e.g. Slush).
- **`<ConnectButton />`** from Mysten is still rendered so builders can pick **Slush** or any other installed wallet from the standard wallet UI.

## Environment (optional)

| Variable           | Description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `VITE_OBJECT_ID`   | If set, `@evefrontier/dapp-kit` **SmartObject** flows can load that object when connected. Leave unset for a directory-only shell. |

Only `VITE_*` keys are public to the browser.

## URL query parameters (from `@evefrontier/dapp-kit`)

`EveFrontierProvider` includes **SmartObjectProvider**, which reads the URL on load:

| Query        | Role |
| ------------ | ---- |
| `?tenant=`   | Tenant id (e.g. `stillness`, `utopia`, …). If omitted, the kit uses its built-in default (**`stillness`** — see `DEFAULT_TENANT` in the package). |
| `?itemId=`   | In-game item id used with tenant to resolve a Sui object when **`VITE_OBJECT_ID`** is not set. |

For a **directory-only shell** with no `VITE_OBJECT_ID` and no `itemId`, the provider logs that no object id was provided and stays idle until you add env/URL or connect flows that need SmartObject. That is expected for now.

## TanStack Query defaults (`AppProviders`)

These are **app-level defaults** for any `useQuery` / `useMutation` under the tree (not URL-related):

- **`staleTime`: 60s** — data are treated fresh for one minute before background refetch.
- **`retry`: 1** — one automatic retry on failure.

Adjust per feature (e.g. longer `staleTime` for stable chain metadata) as the app grows.

## Toolchain (2026 baseline)

- **TypeScript 6** with **`target` / `lib`: ES2024** (modern runtimes; Vite `build.target` matches).
- **Vite 8** + **`@vitejs/plugin-react` 6**; production **sourcemaps** enabled.
- **`baseUrl` removed** from `tsconfig` (deprecated in TS 6); path alias `@/*` → `./src/*` remains.
- **`@evefrontier/dapp-kit`** ships **`.ts` sources** on npm, so `tsconfig.app.json` omits `verbatimModuleSyntax` / `erasableSyntaxOnly` so `tsc` can typecheck it; app code under `src/` still uses **`strict`**.

## Scripts

| Script              | Description        |
| ------------------- | ------------------ |
| `bun dev`           | Vite dev server    |
| `bun run build`     | Production build   |
| `bun run preview`   | Serve `dist`       |
| `bun run typecheck` | `tsc -b`           |
