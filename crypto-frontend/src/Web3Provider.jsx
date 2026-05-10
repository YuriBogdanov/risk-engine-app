import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, bsc, base } from "wagmi/chains"; 
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const config = createConfig(
  getDefaultConfig({
    chains: [bsc, mainnet, base], // Ставим bsc на первое место
    transports: {
        [mainnet.id]: http('https://eth.llamarpc.com'),
        [bsc.id]: http('https://bsc-dataseed1.binance.org'),
        [base.id]: http('https://mainnet.base.org'),
    },
    walletConnectProjectId: "test-project-id",
    appName: "RiskEngine",
  }),
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children, mode = 'dark' }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider mode={mode}>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};