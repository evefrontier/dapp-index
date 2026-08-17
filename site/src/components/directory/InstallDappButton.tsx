import { Button } from '@evefrontier/ui';
import { useCurrentWallet } from '@mysten/dapp-kit-react';
import {
  EVEFRONTIER_SPONSORED_TRANSACTION,
  useConnection,
  useSmartObject,
  useSponsoredTransaction,
} from '@evefrontier/dapp-kit';
import { SponsoredTransactionActions } from '@evefrontier/dapp-kit';
import {
  getInstallDappStatus,
  type InstallDappStatus,
} from '@/directory/installDappStatus';
import type { DappIndexEntry } from '@/types/dapp-index';

const INSTALL_LABEL = 'Install';

const STATUS_COPY: Partial<
  Record<InstallDappStatus, { label: string; tooltip?: string }>
> = {
  'wallet-not-connected': {
    label: INSTALL_LABEL,
    tooltip: 'Connect your wallet to install this dapp',
  },
  'wallet-unsupported': {
    label: INSTALL_LABEL,
    tooltip: 'Connect the EVE Vault wallet to install this dapp',
  },
  'owner-unknown': {
    label: INSTALL_LABEL,
    tooltip: "Can't verify who owns this assembly right now",
  },
  'not-owner': {
    label: INSTALL_LABEL,
    tooltip: 'Only the assembly owner can install this dapp',
  },
  installed: {
    label: 'Installed',
  },
};

export function InstallDappButton({ entry }: { entry: DappIndexEntry }) {
  const { assembly, assemblyOwner, refetch } = useSmartObject();
  const { walletAddress } = useConnection();
  const currentWallet = useCurrentWallet();
  const { mutateAsync, isPending, error } = useSponsoredTransaction();

  // `useCurrentWallet()` (from `@mysten/dapp-kit-react`) returns a `UiWallet`
  // whose `.features` is a plain array of feature-id strings — not the
  // object-shaped `wallet-standard` features that `@evefrontier/dapp-kit`'s
  // public `walletSupportsSponsoredTransaction(wallet: Wallet)` is typed for
  // (its own internal, unexported helper handles both shapes; the public one
  // doesn't). Check the array directly against the SDK's own feature id
  // instead of casting through a type that doesn't match what we actually have.
  const walletSupportsSponsoredTx =
    currentWallet?.features.includes(EVEFRONTIER_SPONSORED_TRANSACTION) ?? false;

  const assemblyOwnerAddress = assemblyOwner?.address ?? null;

  const status = getInstallDappStatus({
    assembly,
    walletSupportsSponsoredTx,
    walletAddress: walletAddress ?? null,
    assemblyOwnerAddress,
    liveUrl: entry.liveUrl,
  });

  if (status === 'no-assembly') return null;

  const disabled = status !== 'installable' || isPending;
  const copy = STATUS_COPY[status];
  const label = isPending ? 'Installing…' : copy?.label ?? INSTALL_LABEL;

  async function handleClick() {
    if (!assembly) return;
    try {
      await mutateAsync({
        txAction: SponsoredTransactionActions.UPDATE_METADATA,
        assembly,
        metadata: { url: entry.liveUrl },
      });
      await refetch();
    } catch {
      // already surfaced via `error` from useSponsoredTransaction below
    }
  }

  return (
    <div className="directory-detail-install mt-4 space-y-2">
      <Button
        disabled={disabled}
        onClick={handleClick}
        tooltip={copy?.tooltip}
        variant="primary"
      >
        {label}
      </Button>
      {error ? (
        <p className="text-xs text-(--color-martian-red)">{error.message}</p>
      ) : null}
    </div>
  );
}
