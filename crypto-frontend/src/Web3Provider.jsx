import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, bsc, base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const config = createConfig(
  getDefaultConfig({
    // Подключаем нужные нам сети
    chains: [mainnet, bsc, base],
    transports: {
        [mainnet.id]: http('https://eth.llamarpc.com'), 
        [bsc.id]: http('https://bsc-dataseed.binance.org'),
        [base.id]: http('https://mainnet.base.org'),
    },
    walletConnectProjectId: "test-project-id", // Для тестов можно оставить так
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