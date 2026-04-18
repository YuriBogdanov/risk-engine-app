import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, bsc, base } from "wagmi/chains"; 
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const config = createConfig(
  getDefaultConfig({
    chains: [bsc, mainnet, base], // Ставим bsc на первое место
    transports: {
        [mainnet.id]: http('https://eth.llamarpc.com'), 
        // ВОТ ОНА МАГИЯ: Мы перенаправляем BSC в твою песочницу!
        [bsc.id]: http('http://127.0.0.1:8545'),
        [base.id]: http('https://mainnet.base.org'),
    },
    walletConnectProjectId: "test-project-id",
    appName: "RiskEngine",
  }),
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider mode="dark">
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};