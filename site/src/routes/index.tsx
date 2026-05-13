import { createFileRoute } from '@tanstack/react-router';
import { ChainIdentifierReadout } from '@/components/ChainIdentifierReadout';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold uppercase tracking-wider text-[var(--color-foreground)]">
        Discover EVE Frontier dapps
      </h1>
      <ChainIdentifierReadout />
    </div>
  );
}
