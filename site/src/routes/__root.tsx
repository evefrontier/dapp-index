import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex min-h-dvh min-w-0 flex-col">
      <header className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--color-neutral-20)] px-3 py-3 sm:px-4 lg:px-6">
        <Link
          to="/"
          className="text-lg font-bold uppercase tracking-wider text-[var(--color-foreground)]"
        >
          EVE Frontier Dapps Index
        </Link>
        <nav className="flex flex-wrap items-center gap-3" aria-label="Main">
          <Link
            to="/builder"
            className="text-sm font-bold uppercase text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
          >
            Builder
          </Link>
          <ConnectButton />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-6 sm:px-4 lg:px-6">
        <Outlet />
      </main>
    </div>
  );
}
