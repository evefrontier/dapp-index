import { useCurrentClient, useCurrentNetwork } from '@mysten/dapp-kit-react';
import { useQuery } from '@tanstack/react-query';

/**
 * Minimal TanStack Query usage: one cached read via `client.core` (Core API).
 */
export function ChainIdentifierReadout() {
  const client = useCurrentClient();
  const network = useCurrentNetwork();

  const q = useQuery({
    queryKey: ['chainIdentifier', network],
    queryFn: async ({ signal }) => {
      const { chainIdentifier } = await client.core.getChainIdentifier({
        signal,
      });
      return chainIdentifier;
    },
    staleTime: 60_000,
    retry: 1,
  });

  if (q.isPending) {
    return <p className="ds-type-caption">Chain: loading…</p>;
  }
  if (q.isError) {
    return <p className="ds-type-caption-error">Chain error: {String(q.error)}</p>;
  }
  return (
    <p className="ds-type-caption">
      Network:{' '}
      <code className="text-[var(--color-foreground)]">{network}</code> · chain id:{' '}
      <code className="text-[var(--color-foreground)]">{q.data}</code>
    </p>
  );
}
