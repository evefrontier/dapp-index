import { defaultTheme, ThemeProvider } from '@evefrontier/component-library';
import { EveFrontierProvider } from '@evefrontier/dapp-kit';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { useState } from 'react';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
      },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <ThemeProvider theme={defaultTheme}>
      <EveFrontierProvider queryClient={queryClient}>
        {children}
        {import.meta.env.DEV ? (
          <ReactQueryDevtools buttonPosition="bottom-left" />
        ) : null}
      </EveFrontierProvider>
    </ThemeProvider>
  );
}
