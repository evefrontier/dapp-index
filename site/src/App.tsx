import { useConnection } from '@evefrontier/dapp-kit';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { ChainIdentifierReadout } from '@/components/ChainIdentifierReadout';

export function App() {
  const {
    isConnected,
    walletAddress,
    hasEveVault,
    handleConnect,
    handleDisconnect,
  } = useConnection();

  return (
    <main>
      <h1>Dapp Index</h1>
      <p>
        Infrastructure: <strong>@evefrontier/dapp-kit</strong> (Eve Vault
        preferred for connect) + TanStack Query.
      </p>
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        {isConnected ? (
          <>
            <span>
              Connected: <code>{walletAddress}</code>
            </span>
            <button type="button" onClick={handleDisconnect}>
              Disconnect
            </button>
          </>
        ) : (
          <button type="button" onClick={handleConnect}>
            {hasEveVault ? 'Connect (Eve Vault)' : 'Connect wallet'}
          </button>
        )}
        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
          {hasEveVault
            ? 'Slush and other wallets stay available via the wallet menu.'
            : 'Install Eve Vault for the default connect experience; other wallets below.'}
        </span>
      </section>
      <p style={{ marginTop: '1rem' }}>
        <ConnectButton />
      </p>
      <ChainIdentifierReadout />
    </main>
  );
}
