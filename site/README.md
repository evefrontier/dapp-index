# Dapp Index — site

Vite + React + TypeScript shell for the Dapp Index frontend.

**Stack:**
- **`@evefrontier/dapp-kit`** — providers, wallet connection, Sui chain client
- **`@mysten/dapp-kit-react/ui`** — `<ConnectButton />` wallet UI
- **`@evefrontier/ui`** — EVE Frontier UI component library (vendored at `vendor/@evefrontier/ui`)
- **TanStack Query** — async state and chain reads
- **Tailwind v4** — utility CSS with DS token variables

## Prerequisites

- [Bun](https://bun.sh/)

## Setup

```bash
cd site
bun install
cp .env.example .env   # optional
bun dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## UI / styling

Styles are loaded via `@evefrontier/ui` (vendored), which provides:

- **CSS custom properties** — `--color-foreground`, `--color-background`, `--color-muted`, `--font-family-mono`, etc.
- **Typography roles** — `.ds-type-label`, `.ds-type-caption`, `.ds-type-caption-error`, etc.
- **Tailwind v4** — utility classes available app-wide via `postcss.config.mjs`

`src/index.css` sets `body` using DS token variables. Use `var(--color-*)` and `.ds-type-*` classes for consistent theming.

The `vendor/@evefrontier/ui` folder is a pre-built snapshot committed to this repo — no external repo access needed. See `vendor/@evefrontier/ui/README.md` for how to update it or switch to the published package.

## Wallet

A single `<ConnectButton />` from `@mysten/dapp-kit-react/ui` handles wallet connection. The `EveFrontierProvider` from `@evefrontier/dapp-kit` wires Sui over gRPC for `testnet` and `devnet`.

## Environment (optional)

| Variable         | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `VITE_OBJECT_ID` | If set, `@evefrontier/dapp-kit` SmartObject flows load that object on connect. Leave unset for a directory-only shell. |

Only `VITE_*` keys are public to the browser.

## URL query parameters (from `@evefrontier/dapp-kit`)

`EveFrontierProvider` includes **SmartObjectProvider**, which reads the URL on load:

| Query      | Role |
| ---------- | ---- |
| `?tenant=` | Tenant id (e.g. `stillness`). Defaults to `stillness` if omitted. |
| `?itemId=` | In-game item id used with tenant to resolve a Sui object when `VITE_OBJECT_ID` is not set. |

## TanStack Query defaults

- **`staleTime`: 60s** — data treated as fresh for one minute before background refetch.
- **`retry`: 1** — one automatic retry on failure.

## Toolchain

- **TypeScript 6** — strict; path alias `@/*` → `./src/*`
- **Vite 8** + **`@vitejs/plugin-react` 6** — production sourcemaps enabled
- **Tailwind v4** via `@tailwindcss/postcss`

## Scripts

| Script              | Description        |
| ------------------- | ------------------ |
| `bun dev`           | Vite dev server    |
| `bun run build`     | Production build   |
| `bun run preview`   | Serve `dist`       |
| `bun run typecheck` | `tsc -b`           |
