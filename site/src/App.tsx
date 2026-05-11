import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { ChainIdentifierReadout } from '@/components/ChainIdentifierReadout';

export function App() {
  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-2xl font-bold uppercase tracking-wider text-[var(--color-foreground)]">
        Dapp Index
      </h1>
      <p className="text-[var(--color-muted)]">
        Shell using{' '}
        <strong className="font-bold text-[var(--color-foreground)]">@evefrontier/dapp-kit</strong>{' '}
        with TanStack Query for chain reads.
      </p>
      <section className="flex flex-wrap items-center gap-3">
        <ConnectButton />
      </section>
      <ChainIdentifierReadout />
    </main>
  );
}
