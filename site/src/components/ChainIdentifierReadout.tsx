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
    return <p className="text-sm text-slate-600">Chain: loading…</p>;
  }
  if (q.isError) {
    return <p className="text-sm text-red-700">Chain error: {String(q.error)}</p>;
  }
  return (
    <p className="text-sm text-slate-600">
      Network: <code className="rounded bg-slate-200/80 px-1.5 py-0.5 text-slate-800">{network}</code> ·
      chain id:{' '}
      <code className="rounded bg-slate-200/80 px-1.5 py-0.5 text-slate-800">{q.data}</code>
    </p>
  );
}
